# ------------------------------------------------------------------------------
# YADAGE Server Engine
#
# Contains classes and methods for the main YADAGE workflow instance manager
# that stores workflows and orchestrates their execution.
# ------------------------------------------------------------------------------

import adage
import adage.dagstate as dagstate
import adage.nodestate as nodestate
import os
import shutil
import uuid
import yadage.backends.packtivity_celery
import yadage.backends.celeryapp
from yadage.yadagemodels import YadageWorkflow

from workflow import WorkflowInstance
from workflow import WORKFLOW_RUNNING, WORKFLOW_WAITING, WORKFLOW_FAILED, WORKFLOW_SUCCESS


# YADAGE Engine
#
# YADAGE workflow server used to manage and manipulate workflows.
# ------------------------------------------------------------------------------
class YADAGEEngine:
    # --------------------------------------------------------------------------
    # Initialize workflow engine. Provide a workflow storage manager and the
    # path to the global work directory shared by all workflows.
    #
    # workflow_db: WorkflowInstanceManager
    # wirk_dir::string
    # --------------------------------------------------------------------------
    def __init__(self, workflow_db, work_dir, backend_manager):
        self.db = workflow_db
        self.work_dir = os.path.abspath(work_dir)
        # Initialize the default backen
        yadage.backends.celeryapp.app.set_current()
        self.backend = yadage.backends.packtivity_celery.PacktivityCeleryBackend(
            yadage.backends.celeryapp.app
        )
        self.backend_manager = backend_manager
        #self.backend.adagebackend.app.set_current()

    # --------------------------------------------------------------------------
    # Apply a given rule (represented by a RuleInstance object) to the given
    # YADAGE workflow. Returns False, if the referenced rule does not exist.
    #
    # workflow::YadageWorkflow
    # rule_id::string
    #
    # returns True|False
    # --------------------------------------------------------------------------
    @staticmethod
    def apply_rule(workflow, rule_id):
        # Find the rule that is referenced by the rule instance. Keep track of
        # the rule index so we can remove it from the rule list. Return False
        # if not found.
        ref_rule = None
        rule_index = 0
        for rule in workflow.rules:
            if rule.identifier == rule_id:
                ref_rule = rule
                break
            rule_index += 1
        if ref_rule is None:
            return False
        # Remove the rule from the list of rules in the workflow and apply the
        # rule
        del workflow.rules[rule_index]
        rule.apply(workflow)
        return True

    # --------------------------------------------------------------------------
    # Apply a given set of rule instances to the specified workflow instance
    # using the default backend.
    #
    # workflow_id: string
    # rule_instances: [string]
    #
    # returns: boolean
    # --------------------------------------------------------------------------
    def apply_rules(self, workflow_id, rule_instances):
        # Get the workflow instance from the database. Return None if it does
        # not exist.
        workflow_inst = self.db.get_workflow(workflow_id)
        if workflow_inst is None:
            return False
        # Get the list of identifier for rules that are applicable.
        workflow = YadageWorkflow.fromJSON(
            workflow_inst.workflow_json,
            yadage.backends.packtivity_celery.PacktivityCeleryProxy,
            backend=self.backend
        )
        # Apply each rule in the given rule instance set. Return False if one of
        # the referenced rules could not be applied (i.e., does not exist).
        for rule_id in rule_instances:
            if not self.apply_rule(workflow, rule_id):
                return False
        # Submit all submittable nodes
        #for node in self.get_submittable_nodes(workflow):
        #    adage.submit_node(node, self.backends[backend_name][0])
        #    node.update_state()
        # Get the state of the workflow and update the workflow in the database.
        #state = self.get_workflow_state(workflow, self.get_applicable_rules(workflow))
        workflow_json = workflow.json()
        self.db.update_workflow(workflow_id, workflow_inst.name, workflow_inst.state, workflow_json)
        return True

    # --------------------------------------------------------------------------
    # Create a new workflow instance.
    #
    # workflow_def::JsonObject (for workflow template)
    # name::string
    # init_data::{}
    #
    # returns: WorkflowDescriptor
    # --------------------------------------------------------------------------
    def create_workflow(self, workflow_def, name, init_data={}):
        # Generate a unique identifier for the new workflow instance
        identifier = str(uuid.uuid4())
        # Create root context for new workflow instance. Will create a new
        # directory in the work base directory with the workflow identifier as
        # directory name
        workdir = os.path.join(self.work_dir, identifier)
        os.makedirs(workdir)
        root_context = {
            'readwrite': [workdir],
            'readonly': []
        }
        # Create YADAGE Workflow from the given workflow template. Initialize
        # workflow with optional inittialization parameters.
        workflow = YadageWorkflow.createFromJSON(workflow_def, root_context)
        workflow.view().init(init_data)
        workflow_json = workflow.json()
        # Derive the workflow state. For now this has to be WAITING after our
        # previous manipualtions. Otherwise uncomment the following line.
        #state = self.get_workflow_state(workflow, self.get_applicable_rules(workflow))
        state = WORKFLOW_WAITING
        # Store workflow in the associated instance database and return the
        # workflow descriptor
        return self.db.create_workflow(identifier, name, state.name, workflow_json)

    # --------------------------------------------------------------------------
    # Delete workflow with the given identifier
    #
    # workflow_id: string
    #
    # returns: True, if worlflow deleted, False if not found
    # --------------------------------------------------------------------------
    def delete_workflow(self, workflow_id):
        if self.db.delete_workflow(workflow_id):
            workdir = os.path.join(self.work_dir, workflow_id)
            shutil.rmtree(workdir)
            return True
        else:
            False

    # --------------------------------------------------------------------------
    # Get a list of identifier for all rules in the given YADAGE workflow that
    # are applicable.
    #
    # workflow::YadageWorkflow
    #
    # returns [string]
    # --------------------------------------------------------------------------
    @staticmethod
    def get_applicable_rules(workflow):
        applicable = []
        for rule in reversed([x for x in workflow.rules]):
            if rule.applicable(workflow):
                applicable += [rule.identifier]
        return applicable

    # --------------------------------------------------------------------------
    # Get a list of all node objects that are submittable in the given workflow.
    #
    # workflow::YadageWorkflow
    # pending_tasks::[string]
    #
    # returns [Node]
    # --------------------------------------------------------------------------
    @staticmethod
    def get_submittable_nodes(workflow, pending_tasks):
        pending_nodes = [node_id for workflow_id, node_id in pending_tasks]
        nodes = []
        for node_id in workflow.dag.nodes():
            if node_id in pending_nodes:
                continue
            node = workflow.dag.getNode(node_id)
            if node.submit_time:
                continue;
            if dagstate.upstream_ok(workflow.dag, node):
                nodes.append(node)
        return nodes

    # --------------------------------------------------------------------------
    # Get workflow with given identifier
    #
    # workflow_id: string
    #
    # returns: WorkflowInstance or None
    # --------------------------------------------------------------------------
    def get_workflow(self, workflow_id):
        # Get the workflow instance from the database. Return None if it does
        # not exist.
        workflow_inst = self.db.get_workflow(workflow_id)
        if workflow_inst is None:
            return None
        # Get the list of identifier for rules that are applicable. Uses a dummy
        # backend at this point.
        yadage_workflow = YadageWorkflow.fromJSON(
            workflow_inst.workflow_json,
            yadage.backends.packtivity_celery.PacktivityCeleryProxy,
            backend=self.backend
        )
        applicable_rules = self.get_applicable_rules(yadage_workflow)
        submittable_nodes = [node.identifier for node in self.get_submittable_nodes(yadage_workflow, self.backend_manager.list_tasks())]
        # Return a full workflow instance
        return WorkflowInstance(
            workflow_inst.identifier,
            workflow_inst.name,
            workflow_inst.state,
            workflow_inst.workflow_json['dag'],
            workflow_inst.workflow_json['rules'],
            workflow_inst.workflow_json['applied'],
            applicable_rules,
            submittable_nodes
        )

    # --------------------------------------------------------------------------
    # Derive the state of the workkflow from the state of the nodes in the
    # workflow DAG and the set of applicable rules.
    #
    # workflow::YadageWorkflow
    #
    # returns WorkflowState
    # --------------------------------------------------------------------------
    @staticmethod
    def get_workflow_state(workflow):
        dag = workflow.dag
        rules = workflow.rules
        # If there are failed nodes the workflow satet is failed. If there are
        # running nodes then the state is running. Otherwiese, the workflow
        # is idele if there are applicab;e nodes or submittable tasks.
        state = WORKFLOW_WAITING if len(workflow.rules) > 0 else WORKFLOW_SUCCESS
        for node_id in dag.nodes():
            node = dag.getNode(node_id)
            if node.state == nodestate.FAILED:
                state = WORKFLOW_FAILED
                break
            if node.state == nodestate.RUNNING:
                state = WORKFLOW_RUNNING
            if node.state == nodestate.DEFINED:
                if state != WORKFLOW_FAILED and state != WORKFLOW_RUNNING:
                    state = WORKFLOW_WAITING
        return state

    # --------------------------------------------------------------------------
    # Get a list of all workflows currently managed by the server
    #
    # returns: [WorkflowDescriptor]
    # --------------------------------------------------------------------------
    def list_workflows(self):
        return self.db.list_workflows()

    # --------------------------------------------------------------------------
    # Submit a set of tasks (referenced by their node identifier) for the
    # specified workflow instance using the default backend.
    #
    # workflow_id: string
    # node_ids: [string]
    #
    # returns: boolean
    # --------------------------------------------------------------------------
    def submit_nodes(self, workflow_id, node_ids):
        # Get the workflow instance from the database. Return None if it does
        # not exist.
        workflow_inst = self.db.get_workflow(workflow_id)
        if workflow_inst is None:
            return False
        # Get the list of identifier for rules that are applicable.
        workflow = YadageWorkflow.fromJSON(
            workflow_inst.workflow_json,
            yadage.backends.packtivity_celery.PacktivityCeleryProxy,
            backend=self.backend
        )
        # Iterate over the submittable nodes. Keep track of submittable nodes that
        # if unknown nodes are encountered?
        nodes = []
        for node in self.get_submittable_nodes(workflow, self.backend_manager.list_tasks()):
            if node.identifier in node_ids:
                nodes.append(node)
        # TODO: What should happen if unknown nodes are encountered?
        if len(nodes) != len(node_ids):
            return False
        for node in nodes:
            self.backend_manager.create_task(workflow_id, node.identifier)
        # Get the state of the workflow and update the workflow in the database.
        state = self.get_workflow_state(workflow)
        #print 'NEW STATE'
        #print state
        workflow_json = workflow.json()
        #print workflow_json
        self.db.update_workflow(workflow_id, workflow_inst.name, state.name, workflow_json)
        return True

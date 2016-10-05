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
    def __init__(self, workflow_db, work_dir):
        self.db = workflow_db
        self.work_dir = os.path.abspath(work_dir)
        # Initialize the default backen
        self.backend = yadage.backends.packtivity_celery.PacktivityCeleryBackend(
            yadage.backends.celeryapp.app
        )

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
            print 'Workflow not found'
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
                print 'Error applying rule ' + rule_id
                return False
        # Submit all submittable nodes
        #for node in self.get_submittable_nodes(workflow):
        #    adage.submit_node(node, self.backends[backend_name][0])
        #    node.update_state()
        # Get the state of the workflow and update the workflow in the database.
        #state = self.get_workflow_state(workflow, self.get_applicable_rules(workflow))
        workflow_json = workflow.json()
        self.db.update_workflow(workflow_id, workflow_inst.name, workflow.state.name, workflow_json)
        return True

    # --------------------------------------------------------------------------
    # Create a new workflow instance.
    #
    # workflow_def::JsonObject (for workflow template)
    # name::string
    # init_param::{}
    #
    # returns: WorkflowDescriptor
    # --------------------------------------------------------------------------
    def create_workflow(self, workflow_def, name, init_param={'nevents':100}):
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
        workflow.view().init(init_param)
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
        return self.db.delete_workflow(workflow_id)

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
    #
    # returns [Node]
    # --------------------------------------------------------------------------
    @staticmethod
    def get_submittable_nodes(workflow):
        nodes = []
        for node_id in workflow.dag.nodes():
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
        # Return a full workflow instance
        return WorkflowInstance(
            workflow_inst.identifier,
            workflow_inst.name,
            workflow_inst.state,
            workflow_inst.workflow_json['dag'],
            workflow_inst.workflow_json['rules'],
            workflow_inst.workflow_json['applied'],
            applicable_rules
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
    def get_workflow_state(workflow, applicable_rules):
        dag = workflow.dag
        rules = workflow.rules
        # If there are any nodes waiting for user interaction then the state of
        # the workflow is defined as WAITING. Otherwise, if on of the nodes in
        # the workflow DAG is in failed state the workflow state is 'FAILED',
        # if there are running the state is 'RUNNING'. Only if there are no
        # waiting, failed or running nodes the state is 'SUCCESS'
        if len(applicable_rules) > 0:
            return WORKFLOW_WAITING
        else:
            for node in dag.nodes():
                if dagstate.upstream_failure(dag, dag.getNode(node)):
                    return WORKFLOW_FAILED
                elif dagstate.node_defined_or_waiting(dag.getNode(node)):
                    return WORKFLOW_RUNNING
            # No running or failed nodes and no applicable rules
            return WORKFLOW_SUCCESS

    # --------------------------------------------------------------------------
    # Get a list of all workflows currently managed by the server
    #
    # returns: [WorkflowDescriptor]
    # --------------------------------------------------------------------------
    def list_workflows(self):
        return self.db.list_workflows()

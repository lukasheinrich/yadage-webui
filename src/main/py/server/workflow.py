# ------------------------------------------------------------------------------
# Workflow objects managed by the YADAGE Server
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# Workflow descriptor
#
# Workflow descriptors maintain basic information about workflow instances
# managed by the YADAGE server. This information includes the unique workflow
# identifier, the descritpive (user-provided) workflow name, and the current
# state of the workflow. More comprehensive workflow classes will inherit from
# this base class.
#
# While the state of a workflow can be derived from the workflow Json object,
# storing it separately is intended to speed up the generation of workflow
# listing containing each workflow's state in the Web API. It is expected that
# the engine using the instance manager ensures that the state that is stored
# with the instance is identical to the state that would be derived from the
# Json object.
# ------------------------------------------------------------------------------
class WorkflowDescriptor(object):
    # --------------------------------------------------------------------------
    # Initialize the identfifier, name, and state.
    #
    # identifier::string
    # name::string
    # state::string
    # --------------------------------------------------------------------------
    def __init__(self, identifier, name, state):
        self.identifier = identifier
        self.name = name
        self.state = state


# ------------------------------------------------------------------------------
# Workflow Database Instance
#
# Workflow instances that as managed by a workflow instance manager. Extends
# the workflow descriptor with the YADAGE Json representation of the workflow.
# ------------------------------------------------------------------------------
class WorkflowDBInstance(WorkflowDescriptor):
    # --------------------------------------------------------------------------
    # Initialize the identfifier, name, state, and Json object containing the
    # YADAGE workflow representation.
    #
    # identifier::string
    # name::string
    # state::string
    # workflow_json::JsonObject (for YADAGE workflow)
    # --------------------------------------------------------------------------
    def __init__(self, identifier, name, state, workflow_json):
        super(WorkflowDBInstance, self).__init__(identifier, name, state)
        self.workflow_json = workflow_json


# ------------------------------------------------------------------------------
# Full workflow instance object. Extends the workflow descriptor with the
# workflow graph, list of rules, list of applied rules, and list of applicable
# rule identifier.#
# ------------------------------------------------------------------------------
class WorkflowInstance(WorkflowDescriptor):
    # --------------------------------------------------------------------------
    # Initialize the identfifier, name, state, dag, rules, applied rules and
    # applicable rule identifier. At this stage all ADAGE objects are simply
    # Json objects.
    #
    # identifier::string
    # name::string
    # state::string
    # dag::JsonObject
    # rules::JsonObject
    # applied_rules::JsonObject
    # applicable_rules::[string]
    # submittable_nodes::[strig]
    # --------------------------------------------------------------------------
    def __init__(self, identifier, name, state, dag, rules, applied_rules, applicable_rules, submittable_nodes):
        super(WorkflowInstance, self).__init__(identifier, name, state)
        self.dag = dag
        self.rules = rules
        self.applied_rules = applied_rules
        self.applicable_rules = applicable_rules
        self.submittable_nodes = submittable_nodes


# ------------------------------------------------------------------------------
# CLASS: WorkflowState
#
# Representation of a workflow state. At this point the state is simple
# represented by a unique descriptive name.
# ------------------------------------------------------------------------------
class WorkflowState(object):
    # --------------------------------------------------------------------------
    # Initialize the name of a workflow state.
    #
    # name: string
    # --------------------------------------------------------------------------
    def __init__(self, name):
        self.name = name

    # --------------------------------------------------------------------------
    # Unambiguous printable representation of the workflow state
    # --------------------------------------------------------------------------
    def __repr__(self):
        return '<WorkflowState: {}>'.format(self.name)

    # --------------------------------------------------------------------------
    # Readable printable representation of the workflow state
    # --------------------------------------------------------------------------
    def __str__(self):
        return self.name


# ------------------------------------------------------------------------------
# Define possible workflow states. A workflow can be in either of four
# different states: RUNNING (i.e., submitted task that is running), WAITING
# (i.e., waiting for user interaction), FAILED (i.e., execution of at least on
# task falied), and SUCCESS (i.e., workflow successfully completed).
# ------------------------------------------------------------------------------
WORKFLOW_RUNNING = WorkflowState('RUNNING')
WORKFLOW_WAITING = WorkflowState('WAITING')
WORKFLOW_FAILED  = WorkflowState('FAILED')
WORKFLOW_SUCCESS = WorkflowState('SUCCESS')


# ------------------------------------------------------------------------------
# Dictionary of workflow states
# ------------------------------------------------------------------------------
WORKFLOW_STATES = {
    'WAITING': WORKFLOW_WAITING,
    'RUNNING': WORKFLOW_RUNNING,
    'FAILED':  WORKFLOW_FAILED,
    'SUCCESS': WORKFLOW_SUCCESS,
}

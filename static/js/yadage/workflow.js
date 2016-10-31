/**
 * Workkflow state codes
 */
var STATE_RUNNING = 'RUNNING';
var STATE_WAITING = 'WAITING';
var STATE_FAILED = 'FAILED';
var STATE_FINISHED = 'SUCCESS';


/**
 * ADAGE Workflow descriptor. Wraps a descriptor object returned by the ADAGE
 * Server API.
 */
var WorkflowDescriptor = function(descriptor_obj) {
    /**
     * Unique workflow identifier.
     *
     * @type: string
     */
    this.id = descriptor_obj.id;
    /**
     * User-provided workflow name.
     *
     * @type: string
     */
    this.name = descriptor_obj.name;
    /**
     * Current state of the workflow. Possible values are given by the workflow
     * state codes.
     *
     * @type: string
     */
    this.state = descriptor_obj.state;
    /**
     * Workflow URL. Extracted from the list of references.
     *
     * @type: string
     */
    this.url = getSelfReference(descriptor_obj.links);
};


/**
 * ADAGE Workflow - Contains methods and properties for an ADAGE workflow
 * object returned by the ADAGE Server API.
 */
var Workflow = function(workflow_obj) {
    /**
     * Directed acyclic graph of defined, running, completed, and failed
     * workflow tasks.
     *
     * @type: ADAGEDAG
     */
    this.dag = new ADAGEDAG(workflow_obj.dag);
    /**
     * Unique workflow identifier.
     *
     * @type: string
     */
    this.id = workflow_obj.id;
    /**
     * User-provided workflow name.
     *
     * @type: string
     */
    this.name = workflow_obj.name;
    /**
     * Current state of the workflow. Possible values are given by the workflow
     * state codes.
     *
     * @type: string
     */
    this.state = workflow_obj.state;
    /**
     * Workflow URL. Extracted from the list of references.
     *
     * @type: string
     */
    this.url = getSelfReference(workflow_obj.links);
    /**
     * Dictionary of rule objects
     */
    this.rules = {};
    for (var i_rule = 0; i_rule < workflow_obj.rules.length; i_rule++) {
        var rule = workflow_obj.rules[i_rule];
        this.rules[rule.id] = rule.rule;
    }
    /**
     * List of applicable rules
     *
     * @type: [string]
     */
    this.applicable_rules = workflow_obj.applicableRules;
    /**
     * List of applicable nodes
     *
     * @type: [string]
     */
    this.submittable_nodes = [];
    for (var i_node = 0; i_node < workflow_obj.submittableNodes.length; i_node++) {
        var node = this.dag.getNode(workflow_obj.submittableNodes[i_node]);
        this.submittable_nodes.push(node);
    }
};


/**
 * Listing of workflow descriptors. Splits a list of descriptors returned by the
 * ADAGE Server API based on workflow state.
 */
var WorkflowListing = function(wf_list_obj) {
    /**
     * Dictionary containing workflows grouped by state.
     *
     * @type: {[WorkflowDescriptor]}
     */
    var states = [STATE_RUNNING, STATE_WAITING, STATE_FAILED, STATE_FINISHED];
    this.categories = {};
    for (var i_state = 0; i_state < states.length; i_state++) {
        this.categories[states[i_state]] = [];
    }
    /**
     * Dictionary containing workflow descriptors indexed by their identifier.
     *
     * @type: {WorkflowDescriptor}
     */
    this.lookup = {};
    /**
     * List of workflow descriptors
     *
     * @type: [WorkflowDescriptor]
     */
    for (var i_wf = 0; i_wf < wf_list_obj.length; i_wf++) {
        var wf = new WorkflowDescriptor(wf_list_obj[i_wf]);
        this.categories[wf.state].push(wf);
        this.lookup[wf.id] = wf;
    }
    // Sort elements in category lists by id
    for (var i_state = 0; i_state < states.length; i_state++) {
        this.categories[states[i_state]].sort(function(wf1, wf2) {
            return wf1.id.localeCompare(wf2.id);
        });
    }
};

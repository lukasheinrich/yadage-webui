/**
 * ADAGE UI - Workflow Panel
 */

/**
 * Workflow panel to display information about a workflow. Shows the current
 * workflow graph and all applicable rules.
 */
var WorkflowPanel = function(ui) {
    /**
     * Reference to the ADAGE UI object
     *
     * @type: ADAGEUI
     */
     this.ui = ui;
     /**
      * The workflow that is currently being displayed. Will be set when
      * createDOM() is called.
      *
      * @type: Workflow
      */
     this.workflow = null;
};

WorkflowPanel.prototype = {
    constructor: WorkflowPanel,
    /**
     * Generate the DOM componets that will contain the workflow panel body.
     *
     * element_id: string
     */
    createDOM : function(element_id) {
        var html = '<div class="col-lg-12">';
     	html += '	<div class="row">';
     	html += '		<div class="col-lg-12">';
     	html += '			<div class="panel" id="pnl-wf-body">';
     	html += '			</div>';
     	html += '		</div>';
     	html += '	</div>';
     	html += '</div>';
        $('#' + element_id).html(html);
    },
    /**
     * Show the given workflow in the panel.
     *
     * workflow: Workflow
     */
    showWorkflow : function(workflow) {
         this.workflow = workflow;
         // Generate workflow panel
         var css_color = this.ui.state_2_css[workflow.state].color;
         var heading = workflow.name + ' <small>' + workflow.id + '</small><a href="#" type="button" class="btn btn-' + css_color + ' pull-right" onclick="adage_ui.setWorkflow(null);"><span class="glyphicon glyphicon-remove"></snap></a>'
         var html = '<div class="panel-heading panel-'  + css_color + '">' + heading + '</div>';
         html += '<div class="panel-body panel-main">';
         // Display Workflow Graph
         var wf_graph_html = '<h3 class="panel-section">Workflow&nbsp;&nbsp;';
         wf_graph_html += '<button class="btn btn-white" onclick="adage_ui.deleteCurrentWorkflow();" title="Delete Workflow"><i class="fa fa-trash fa-1" aria-hidden="true"></i></button>';
         wf_graph_html += '</h3>';
         wf_graph_html += '<div class="row">';
         wf_graph_html += '<div class="col-md-8">';
         if ((workflow.dag.nodes.length > 0) || (workflow.applicable_rules.length > 0)) {
             //wf_graph_html += '<div class="container-fluid workflow"><svg width=960 height=600><g/></svg></div>';
             wf_graph_html += '<div class="container-fluid workflow"><div id="workflow-graph-container"></div></div>';
         } else {
             wf_graph_html += '<div class="alert alert-info" role="alert">The workflow graph is currently empty</div>';
         }
         wf_graph_html += '</div>';
         wf_graph_html += '<div class="col-md-4">';
         wf_graph_html += '<div id="file-tree-container"></div>';
         wf_graph_html += '</div></div>';
         html += '<div>' + wf_graph_html + '</div>';
         // List applicable rules
         if (workflow.applicable_rules.length > 0) {
             var wf_rules_html = '';
             wf_rules_html = '<h3 class="panel-section">Applicable Rules</h3>';
             workflow.applicable_rules.forEach(function(rule_id) {
                 var rule = workflow.rules[rule_id];
                 wf_rules_html += '<div class="rule-checkbox"><input type="checkbox" class="chkApplicableRule" id="chk_rule_' + rule_id + '" value="' + rule_id + '"><label for="chk_rule_' + rule_id + '"><span></span>' + rule.name + '</label></div>';
             });
             wf_rules_html += '<div id="submitRulesMessage"></div>';
             wf_rules_html += '<button type="button" class="btn btn-default" id="btn-submit-rules-form">Apply</button>';
             html += '<div>' + wf_rules_html + '</div>';
         }
         // List submittable nodes
         if (workflow.submittable_nodes.length > 0) {
             var wf_nodes_html =  '<h3 class="panel-section">Submittable Tasks</h3>';
             workflow.submittable_nodes.forEach(function(node) {
                 wf_nodes_html += '<div class="rule-checkbox"><input type="checkbox" class="chkSubmittableNode" id="chk_node_' + node.id + '" value="' + node.id + '"><label for="chk_node_' + node.id + '"><span></span>' + node.name + '</label></div>';
             });
             wf_nodes_html += '<div id="submitNodesMessage"></div>';
             wf_nodes_html += '<button type="button" class="btn btn-default" id="btn-submit-nodes-form">Run</button>';
             html += '<div>' + wf_nodes_html + '</div>';
         }
         html += '</div>';
         $('#pnl-wf-body').html(html);
         // Display file browser
         $.ajax({
             url: API_BASE_URL + '/workflows/' + workflow.id + '/files',
             contentType: 'application/json',
             success: function(data) {
                 buildFileTree(data.files);
                 showDirectory('/');
             },
             error: function() {
                 console.log('Error retrieving file listing.');
             }

         });
         // Assign onClick handler to apply and submit buttons
         var obj = this;
         $('button#btn-submit-rules-form').click(function() {
             obj.submitRulesForm();
         });
         $('button#btn-submit-nodes-form').click(function() {
             obj.submitNodesForm();
         });
         // Display the workflow graph if not empty
         if ((workflow.dag.nodes.length > 0) || (workflow.applicable_rules.length > 0)) {
             new WorkflowGraph(workflow).show('workflow-graph-container');
         }
     },
     /**
      * Submit selected nodes for execution.
      */
     submitNodesForm : function() {
         // Create list of selected nodes to be submitted for execution
         var nodes = []
         var workflow = this.workflow;
         $('.chkSubmittableNode').each(function() {
             if ($(this).is(':checked')) {
                 var node_id = $(this).val();
                 nodes.push(node_id);
             }
         })
         // Return with message if no rules were selected
         if (nodes.length === 0) {
             $('#submitNodesMessage').html('<div class="alert alert-danger" role="alert">No tasks selected for execution.</div>');
         } else {
             $('#submitNodesMessage').html('');
             this.ui.submitNodesForWorkflow(this.workflow.id, nodes);
         }
     },
     /**
      * Submit selected rules for execution.
      */
     submitRulesForm : function() {
         // Create list of selected rules to be run
         var rules = []
         var workflow = this.workflow;
         $('.chkApplicableRule').each(function() {
             if ($(this).is(':checked')) {
                 var rule_id = $(this).val();
                 rules.push(rule_id);
             }
         })
         // Return with message if no rules were selected
         if (rules.length === 0) {
             $('#submitRulesMessage').html('<div class="alert alert-danger" role="alert">No rules selected to extend the workflow.</div>');
         } else {
             $('#submitRulesMessage').html('');
             this.ui.applyRulesForWorkflow(this.workflow.id, rules);
         }
     }
};

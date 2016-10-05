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
         if ((workflow.dag.nodes.length > 0) || (workflow.applicable_rules.length > 0)) {
             //wf_graph_html += '<div class="container-fluid workflow"><svg width=960 height=600><g/></svg></div>';
             wf_graph_html += '<div class="container-fluid workflow"><div id="workflow-graph-container"></div></div>';
         } else {
             wf_graph_html += '<div class="alert alert-info" role="alert">The workflow graph is currently empty</div>';
         }
         html += '<div>' + wf_graph_html + '</div>';
         // List applicable rules
         var wf_rules_html = '';
         if (workflow.applicable_rules.length > 0) {
             wf_rules_html = '<h3 class="panel-section">Pending Tasks</h3>';
             workflow.applicable_rules.forEach(function(rule_id) {
                 var rule = workflow.rules[rule_id];
                 wf_rules_html += '<div class="rule-checkbox"><input type="checkbox" class="chkApplicableRule" id="chk_' + rule_id + '" value="' + rule_id + '"><label for="chk_' + rule_id + '"><span></span>' + rule.name + '</label></div>';
                 if (rule.info.parameters) {
                     rule_params = rule.info.parameters;
                     var rule_form_html = '';
                     for (var i_para = 0; i_para < rule_params.length; i_para++) {
                         var para = rule_params[i_para];
                         if (para.value.source === 'user') {
                             var cntrl_id = rule_id + '_' + para.key;
                             rule_form_html += '<div class="container-fluid"><label for="' + cntrl_id + '">' + para.value.label + '</label><input type="text" class="form-control" id="' + cntrl_id + '"></div>'
                         }
                     }
                     if (rule_form_html !== '') {
                         wf_rules_html += '<div class="rule-form">' + rule_form_html + '</div>';
                     }
                 }
             });
             wf_rules_html += '<div id="submitRulesMessage"></div>';
             wf_rules_html += '<button type="button" class="btn btn-default" id="btn-submit-rules-form">Run</button>';
         }
         html += '<div>' + wf_rules_html + '</div>';
         html += '</div>';
         $('#pnl-wf-body').html(html);
         // Assign onClick handler to submit button
         var obj = this;
         $('button#btn-submit-rules-form').click(function() {
             obj.submitRulesForm();
         });
         // Display the workflow graph if not empty
         if ((workflow.dag.nodes.length > 0) || (workflow.applicable_rules.length > 0)) {
             new WorkflowGraph(workflow).show('workflow-graph-container');
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
                 /*var rule = workflow.rules[rule_id];
                 // Collect potential user input values for rule parameters
                 var submit_params = [];
                 if (rule.info.parameters) {
                     rule_params = rule.info.parameters;
                     var rule_form_html = '';
                     for (var i_para = 0; i_para < rule_params.length; i_para++) {
                         var para = rule_params[i_para];
                         if (para.value.source === 'user') {
                             var cntrl_id = rule_id + '_' + para.key;
                             submit_params.push({'key' : para.key, 'value' : $('#' + rule_id + '_' + para.key).val()});
                         }
                     }
                 }
                 rules.push({'id' : rule_id, 'parameters' : submit_params});*/
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

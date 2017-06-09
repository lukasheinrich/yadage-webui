/**
 * ADAGE UI - Workflow Panel
 */

var $EL_WF_BTN_DELETE = 'wfpnl-btn-delete';
var $EL_WFGRAPH_CONTAINER = 'workflow-graph-container';
var $EF_WFFILEBROWSER = 'file-browser-container';

/**
 * Workflow panel to display information about a workflow. Shows the current
 * workflow graph and all applicable rules.
 */
var WorkflowPanel = function(elementId, deleteWorkflowCallback, onCloseCallback) {
     /**
      * Identifier of the element containing the overview panel.
      */
     this.elementId = elementId;
     /**
      * Callback handler for various events.
      */
     this.deleteWorkflowCallback = deleteWorkflowCallback;
     this.onCloseCallback = onCloseCallback;
};

WorkflowPanel.prototype = {
    constructor : WorkflowPanel,
    showWorkflow : function(workflowUrl) {
        $('#' + this.elementId).html(SPINNER());
        const elId = this.elementId;
        const onCloseCallback = this.onCloseCallback;
        const deleteWorkflowCallback = this.deleteWorkflowCallback;
        $.ajax({
            url: workflowUrl,
            type: 'GET',
            contentType: 'application/json',
            success: function(data) {
                const workflow = new Workflow(data);
                let html = '';
                // Display Workflow Graph
                let wf_graph_html = '<h3 class="panel-section">Workflow&nbsp;&nbsp;';
                wf_graph_html += '<button class="btn btn-white" id="' + $EL_WF_BTN_DELETE + '" title="Delete Workflow"><i class="fa fa-trash fa-1" aria-hidden="true"></i></button>';
                wf_graph_html += '</h3>';
                wf_graph_html += '<div class="row">';
                wf_graph_html += '<div class="col-md-8">';
                if ((workflow.dag.nodes.length > 0) || (workflow.applicable_rules.length > 0)) {
                    //wf_graph_html += '<div class="container-fluid workflow"><svg width=960 height=600><g/></svg></div>';
                    wf_graph_html += '<div class="container-fluid workflow"><div id="' + $EL_WFGRAPH_CONTAINER + '"></div></div>';
                } else {
                    wf_graph_html += '<div class="alert alert-info" role="alert">The workflow graph is currently empty</div>';
                }
                wf_graph_html += '</div>';
                wf_graph_html += '<div class="col-md-4">';
                wf_graph_html += '<div id="' + $EF_WFFILEBROWSER + '">' + SPINNER() + '</div>';
                wf_graph_html += '</div></div>';
                html += '<div>' + wf_graph_html + '</div>';
                // List applicable rules
                if (workflow.applicable_rules.length > 0) {
                    let wf_rules_html = '';
                    wf_rules_html = '<h3 class="panel-section">Applicable Rules</h3>';
                    workflow.applicable_rules.forEach(function(rule_id) {
                        const rule = workflow.rules[rule_id];
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
                const onCloseId = 'pnl-workflow-btn-close';
                $('#' + elId).hide();
                $('#' + elId).html(
                    PANEL(
                        workflow.name + ' <small>' + workflow.id + '</small>',
                        html,
                        STATUS_2_CSS(workflow.status),
                        onCloseId
                    )
                );
                // Delete button - On click handler.
                (function(name, url) {
                    $('#' + $EL_WF_BTN_DELETE).click(function(event) {
                        event.preventDefault();
                        if (confirm('Do you really want to delete the workflow ' + name)) {
                            deleteWorkflowCallback(url);
                        }
                    }) ;
                })(workflow.name, getSelfReference(workflow.links));
                FILE_BROWSER($EF_WFFILEBROWSER, getReference('files', workflow.links));
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
                    new WorkflowGraph(workflow).show($EL_WFGRAPH_CONTAINER);
                }
                (function(elementId) {
                    $('#' + elementId).click(function(event) {
                        event.preventDefault();
                        onCloseCallback(event);
                    });
                })(onCloseId);
                $('#' + elId).fadeIn(300);
            },
            error: ERROR
        });
    }
};

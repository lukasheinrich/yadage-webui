/**
 * ADAGE UI - Workflow Panel
 */

var $EL_WF_BTN_APPLYRULES = 'wfpnl-btn-applyrukes';
var $EL_WF_BTN_DELETE = 'wfpnl-btn-delete';
var $EL_WF_BTN_REFRESH = 'wfpnl-btn-refresh';
var $EL_WF_BTN_SUBMITTASKS = 'wfpnl-btn-submittasks';
var $EL_WFGRAPH_CONTAINER = 'workflow-graph-container';
var $EF_WFFILEBROWSER = 'file-browser-container';

/**
 * Workflow panel to display information about a workflow. Shows the current
 * workflow graph and all applicable rules.
 */
var WorkflowPanel = function(
    elementId,
    deleteWorkflowCallback,
    applyRulesCallback,
    submitTasksCallback,
    refreshCallback,
    onCloseCallback
) {
     /**
      * Identifier of the element containing the overview panel.
      */
     this.elementId = elementId;
     /**
      * Callback handler for various events.
      */
     this.deleteWorkflowCallback = deleteWorkflowCallback;
     this.applyRulesCallback = applyRulesCallback;
     this.submitTasksCallback = submitTasksCallback;
     this.refreshCallback = refreshCallback;
     this.onCloseCallback = onCloseCallback;
};

WorkflowPanel.prototype = {
    constructor : WorkflowPanel,
    showWorkflow : function(workflowUrl) {
        $('#' + this.elementId).html(SPINNER());
        const elId = this.elementId;
        const onCloseCallback = this.onCloseCallback;
        const applyRulesCallback = this.applyRulesCallback;
        const submitTasksCallback = this.submitTasksCallback;
        const refreshCallback = this.refreshCallback;
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
                wf_graph_html += '<button class="btn btn-white" id="' + $EL_WF_BTN_REFRESH + '" title="Refresh"><i class="fa fa-refresh fa-1" aria-hidden="true"></i></button>';
                wf_graph_html += '</h3>';
                wf_graph_html += '<p class="attribute">Created at <span class="datetime">' + UTC_2_LOCAL(data.createdAt) + '</span></p>';
                wf_graph_html += '<div class="row workflow-state-area">';
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
                    wf_rules_html += '<button type="button" class="btn btn-default" id="' + $EL_WF_BTN_APPLYRULES + '">Apply</button>';
                    html += '<div>' + wf_rules_html + '</div>';
                }
                // List submittable nodes
                if (workflow.submittable_nodes.length > 0) {
                    var wf_nodes_html =  '<h3 class="panel-section">Submittable Tasks</h3>';
                    workflow.submittable_nodes.forEach(function(node) {
                        wf_nodes_html += '<div class="rule-checkbox"><input type="checkbox" class="chkSubmittableNode" id="chk_node_' + node.id + '" value="' + node.id + '"><label for="chk_node_' + node.id + '"><span></span>' + node.name + '</label></div>';
                    });
                    wf_nodes_html += '<div id="submitNodesMessage"></div>';
                    wf_nodes_html += '<button type="button" class="btn btn-default" id="' + $EL_WF_BTN_SUBMITTASKS + '">Run</button>';
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
                })(workflow.name, getReference('delete', workflow.links));
                // Refresh button - On click handler.
                (function(name, url) {
                    $('#' + $EL_WF_BTN_REFRESH).click(function(event) {
                        event.preventDefault();
                        refreshCallback(url, name);
                    }) ;
                })(workflow.name, getSelfReference(workflow.links));
                FILE_BROWSER($EF_WFFILEBROWSER, getReference('files', workflow.links));
                // Assign onClick handler to apply and submit buttons
                var obj = this;
                (function(workflow, name, links) {
                    $('#' + $EL_WF_BTN_APPLYRULES).click(function(event) {
                        event.preventDefault();
                        // Create list of selected rules to be run
                        const rules = []
                        $('.chkApplicableRule').each(function() {
                            if ($(this).is(':checked')) {
                                rules.push($(this).val());
                            }
                        })
                        // Return with message if no rules were selected
                        if (rules.length === 0) {
                            $('#submitRulesMessage').html('<div class="alert alert-danger" role="alert">No rules selected to extend the workflow.</div>');
                        } else {
                            $('#submitRulesMessage').html('');
                            applyRulesCallback(links, name, rules);
                        }
                    });
                })(workflow, workflow.name, workflow.links);
                (function(workflow, name, links) {
                    $('#' + $EL_WF_BTN_SUBMITTASKS).click(function(event) {
                        event.preventDefault();
                        // Create list of selected nodes to be submitted for execution
                        const nodes = []
                        $('.chkSubmittableNode').each(function() {
                            if ($(this).is(':checked')) {
                                nodes.push($(this).val());
                            }
                        })
                        // Return with message if no rules were selected
                        if (nodes.length === 0) {
                            $('#submitNodesMessage').html('<div class="alert alert-danger" role="alert">No tasks selected for execution.</div>');
                        } else {
                            $('#submitNodesMessage').html('');
                            submitTasksCallback(links, name, nodes);
                        }
                    });
                })(workflow, workflow.name, workflow.links);
                // Display the workflow graph if not empty
                if ((workflow.dag.nodes.length > 0) || (workflow.applicable_rules.length > 0)) {
                    new WorkflowGraph(workflow).show($EL_WFGRAPH_CONTAINER);
                }
                // Set onclick handler to close the panel
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

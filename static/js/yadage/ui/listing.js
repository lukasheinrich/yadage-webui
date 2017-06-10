/**
 * ADAGE UI - Workflow Listing
 */

/**
 * Display list of workflows in tabular form
 */
var ListingPanel = function(elementId, showWorkflowCallback, onCloseCallback) {
     /**
      * Identifier of the element containing the overview panel.
      */
     this.elementId = elementId;
     /**
      * Dictionary of listing links. Initially empty.
      */
     this.links = {};
     /**
      * Callback handler to show workflows and when panel is closed.
      */
     this.showWorkflowCallback = showWorkflowCallback;
     this.onCloseCallback = onCloseCallback;
};

ListingPanel.prototype = {
    constructor : ListingPanel,
    setLinks : function(links) {
        for (let i_state = 0; i_state < WORKFLOW_STATES.length; i_state++) {
            const state = WORKFLOW_STATES[i_state];
            this.links[state] = getReference('workflows.list.' + state, links);
        }
    },
    showListing : function(status) {
        $('#' + this.elementId).html(SPINNER());
        const url = this.links[status];
        const css = STATUS_2_CSS(status);
        const elId = this.elementId;
        const showWorkflowCallback = this.showWorkflowCallback;
        const onCloseCallback = this.onCloseCallback;
        $.ajax({
            url: url,
            type: 'GET',
            contentType: 'application/json',
            success: function(data) {
                let html = '';
                const workflows = data.workflows;
                if (workflows.length > 0) {
                    html += '<table class="table table-hover">';
                    html += '<thead><tr><th>Name</th><th>Created At</th><th>Status</th></tr></thead>';
                    html += '<tbody>';
                    for (let i = 0; i < workflows.length; i++) {
                        const workflow = workflows[i];
                        let rowStyle = '';
                        if (i % 2 === 0) {
                            rowStyle = ' even-row';
                        }
                        let row = '<td><a href="#" id="wf-row-' + workflow.id + '">' + workflow.name + '</a></td>';
                        row += '<td>' + UTC_2_LOCAL(workflow.createdAt) + '</td>';
                        row += '<td>' + css.name + '</td>';
                        html += '<tr>' + row + '</tr>';
                    }
                    html    += '</tbody></table>';
                }
                $('#' + elId).hide();
                const onCloseId = 'pnl-workflowlist-btn-close';
                $('#' + elId).html(PANEL(css.name, html, css, onCloseId));
                for (let i = 0; i < workflows.length; i++) {
                    // Assign event handler when clicking on a workflow
                    (function(workflow) {
                        $('#wf-row-' + workflow.id).click(function(event) {
                            event.preventDefault();
                            showWorkflowCallback(
                                getSelfReference(workflow.links),
                                workflow.name);
                        });
                    })(workflows[i]);
                }
                (function(elementId) {
                    $('#' + elementId).click(function(event) {
                        event.preventDefault();
                        onCloseCallback();
                    });
                })(onCloseId);
                $('#' + elId).fadeIn(300);
            },
            error: ERROR
        });
    }
};

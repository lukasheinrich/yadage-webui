/**
 * ADAGE UI - Contains several UI components.
 */
var ADAGEUI = function() {
    /**
     * The currently displayed workflow. Initially set to null.
     *
     * @type: Workflow
     */
    this.current_workflow = null;
    /**
     * List of workflows managed by the ADAGE Server API. Initially this list
     * is empty. It will be populated during reload().
     *
     * @type: WorkflowListing
     */
    this.workflows = new WorkflowListing([]);
    /**
     * User Interface components.
     */
    this.recast_form = new RECASTForm(this);
    this.headline = new HeadlinePanel(this);
    this.sidebar = new WorkflowSidebarListing(this);
    this.overview = new OverviewPanel(this);
    this.workflow_panel = new WorkflowPanel(this);
    /**
     * Mapping of workflow state codes to CSS elements, suffixs, icins, and
     * printable names.
     */
    this.state_2_css = {};
    this.state_2_css[STATE_RUNNING] = {'color' : 'blue', 'icon_small' : 'fa fa-circle-o-notch fa-spin', 'icon_large' : 'fa fa-circle-o-notch fa-3x', 'name' : 'Running', 'suffix' : 'running'};
    this.state_2_css[STATE_WAITING] = {'color' : 'orange', 'icon_small' : 'fa fa-hourglass-half', 'icon_large' : 'fa fa-hourglass-half fa-3x', 'name' : 'Idle', 'suffix' : 'waiting'};
    this.state_2_css[STATE_FAILED] = {'color' : 'red', 'icon_small' : 'fa fa-bolt', 'icon_large' : 'fa fa-bolt fa-3x', 'name' : 'Failed', 'suffix' : 'failed'};
    this.state_2_css[STATE_FINISHED] = {'color' : 'teal', 'icon_small' : 'fa fa-power-off', 'icon_large' : 'fa fa-power-off fa-3x', 'name' : 'Finished', 'suffix' : 'finished'};


};

ADAGEUI.prototype = {
    constructor: ADAGEUI,
    /**
     * Apply a set of rules for the workflow with the given identifier.
     *
     * workflow_id: string
     * rules: [{id:..., parameter: {key:...,value:...}}]
     */
    applyRulesForWorkflow : function(workflow_id, rules) {
        var ui = this;
        $.ajax({
            url: API_BASE_URL + '/workflows/' + workflow_id + '/apply',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({'rules' : rules}),
            success: function(data) {
                ui.reload();
            },
            error: function() {
                alert('There was an error while submitting your request.');
            }
        });
    },
    /**
     * Delete the current workflow.
     */
    deleteCurrentWorkflow : function() {
        // Return if current workflow is not Set
        if (!this.current_workflow) {
            return;
        }
        // Make sure user really wants to delete the workflow
        if (confirm("Do you really want to permanently delete the current workflow ?")) {
            var ui = this;
            $.ajax({
                url: this.current_workflow.url,
                type: 'DELETE',
                contentType: 'application/json',
                success: function(data) {
                    ui.reload();
                },
                error: function() {
                    alert('There was an error while trying to delete the current workflow.');
                }
            });
        }
    },
    /**
      * Reload list of workflows managed through UI and refresh UI components.
      */
    reload : function() {
        var ui = this;
        // Load workflow listing
        $.get(API_BASE_URL + '/workflows', function(data, status) {
            if (status === 'success') {
                ui.workflows = new WorkflowListing(data.workflows);
                // Refresh summaries
                ui.sidebar.refresh();
                ui.overview.refresh();
                // If current workflow was set and the workflow still exists
                // redisplay it in the workflow overview panel. Otherwise,
                // set the workflow to null.
                if (ui.current_workflow) {
                    var workflow = ui.workflows.lookup[ui.current_workflow.id];
                    if (workflow) {
                        // Need to load the workflow (to get updates) and
                        // re-display it.
                        ui.showWorkflow(workflow.id);
                    } else {
                        // Current workflow no longer exists.
                        ui.setWorkflow(null);
                    }
                }
            }
        });
    },
    /**
     * Display the workflow panel for a given workflow. If the workflow is
     * null the workflow panel will be hidden and the summary panel and RECAST
     * form will be shown.
     *
     * workflow: Workflow
     */
    setWorkflow : function(workflow) {
        if (workflow) {
            // Highlight the workflow in the sidebar listing
            this.sidebar.setCurrent(workflow);
            // Set current workflow
            this.current_workflow = workflow;
            // Create the workflow panel
            this.workflow_panel.showWorkflow(workflow);
            // Show the workflow panel and hide the summary panel and RECAST
            // form
            // Show workflow panel
            $('#panel-overview').hide();
            $('#panel-recast-form').hide();
            $('#panel-workflow').fadeIn(300);
        } else {
            // Clear highlighted workflow in sidebar listing.
            this.sidebar.setCurrent(null);
            // Clear current workflow
            this.current_workflow = null;
            // Hide workflow panel and show summary panel and RECAST form.
            $('#panel-workflow').hide();
            $('#panel-overview').fadeIn(300);
            $('#panel-recast-form').fadeIn(300);
        }
        this.headline.refresh();
    },
    /**
     * Load and display workflow with given identifier.
     *
     * workflow_id: string
     */
    showWorkflow : function(workflow_id) {
        var ui = this;
        var workflow = this.workflows.lookup[workflow_id];
        $.ajax({
            url: workflow.url,
            contentType: 'application/json',
            success: function(data) {
                ui.setWorkflow(new Workflow(data));
            },
            error: function() {
                alert('There has been an error while retieving workflow information.')
                ui.setWorkflow(null);
            }
        });
    },
    /**
     * Apply a set of rules for the workflow with the given identifier.
     *
     * workflow_id: string
     * rules: [{id:..., parameter: {key:...,value:...}}]
     */
    submitNodesForWorkflow : function(workflow_id, nodes) {
        var ui = this;
        $.ajax({
            url: API_BASE_URL + '/workflows/' + workflow_id + '/submit',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({'nodes' : nodes}),
            success: function(data) {
                ui.reload();
            },
            error: function() {
                alert('There was an error while submitting your request.');
            }
        });
    },
};

// Create global ADAGE UI instance. NOTE: Renaming the variable will currently
// break the hard-coded onClick handlers.
var adage_ui = new ADAGEUI();

// Call ui reload() when document is ready.
$(document).ready(function(){
    // Create RECAST form and load workflow templates
    adage_ui.recast_form.createDOM('panel-recast-form');
    adage_ui.recast_form.reload();
    // Create UI headline
    adage_ui.headline.createDOM('panel-headline');
    // Create the overview panel
    adage_ui.overview.createDOM('panel-overview');
    // Create workflow panel and make sure it is hidden.
    adage_ui.workflow_panel.createDOM('panel-workflow');
    $('#panel-workflow').hide();
    // Create sidebar listing
    adage_ui.sidebar.createDOM('sidebar-collapse');
    // Load workflows
    adage_ui.reload();
});

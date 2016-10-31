/**
 * ADAGE UI - Sidebar
 *
 * Sidebar listing of workflows
 */

/**
 * Sidebar listing of workflows. Lists workflows grouped by their state and
 * shows the workflow count for each category. Keeps track of the workflow (if
 * any) that is currently being displayed (highlighted).
 */
var WorkflowSidebarListing = function(ui) {
    /**
     * Reference to the ADAGE UI object
     *
     * @type: ADAGEUI
     */
     this.ui = ui;
    /**
     * The currently displayed workflow. Null value indicates that no workflow
     * is currently being displayed.
     *
     * @type: Wirkflow
     */
    this.current_workflow = null;
};

WorkflowSidebarListing.prototype = {
    constructor: WorkflowSidebarListing,
    /**
     * Create sections for the four different catagories of workflow state. The
     * listing is initially empty and will be populated when refresh() is
     * called. THe sidebar will be displayed within the element with the given
     * identifier.
     *
     * element_id: string
     */
    createDOM : function(element_id) {
        var html = '<ul class="nav menu">';
		html += '	<li><span class="sidebar-headline">Workflows</span></li>';
        var states = [STATE_RUNNING, STATE_WAITING, STATE_FAILED, STATE_FINISHED];
        for (var i_state = 0; i_state < states.length; i_state++) {
            var state = this.ui.state_2_css[states[i_state]];
            var id = state.suffix;
			html += '<li>';
			html += '	<a href="#" data-toggle="collapse" data-target="#wf-list-' + id + '" data-parent="#' + element_id + '" class="collapsed sidebar-toggle"><i class="' + state.icon_small + '" aria-hidden="true"></i> ' + state.name + ' <span class="badge badge-' + state.color + ' pull-right" id="wf-summary-sidebar-' + id + '"></span></span></a>';
			html += '	<div class="collapse" id="wf-list-' + id + '" style="height: 0px;">';
			html += '	</div>';
			html += '</li>';
        }
		html += '	<li role="presentation" class="divider"></li>';
		html += '	<li><a href="#" class="highlight-link" id="btn-sidebar-reload"><i class="fa fa-refresh" aria-hidden="true"></i> Refresh</span></a></li>';
		html += '</ul>';
        $('#' + element_id).html(html);
        // Assign onClick handler to reload button
        var ui = this.ui;
        $('a#btn-sidebar-reload').click(function() {
            ui.reload();
        });
    },
     /**
      * Refresh workflow listing and summary counters. Ensure that the current
      * workflow is highlighted.
      *
      * workflows: WorkflowListing
      */
     refresh : function() {
         // IMPORTANT: Need to keep reference to UI for click() event handlers
         // to work properly.
         let ui = this.ui;
         var categories = ui.workflows.categories;
         // Update sidebar summaries
         $('#wf-summary-sidebar-running').html(categories[STATE_RUNNING].length);
         $('#wf-summary-sidebar-waiting').html(categories[STATE_WAITING].length);
         $('#wf-summary-sidebar-failed').html(categories[STATE_FAILED].length);
         $('#wf-summary-sidebar-finished').html(categories[STATE_FINISHED].length);
         // Show list items for all workflows
         for (var category_key in categories) {
             var category = categories[category_key];
             var css_suffix = ui.state_2_css[category_key].suffix;
             if (category.length > 0) {
                 var inner_html = '<ul class="nav nav-list">';
                 for (var i_workflow = 0; i_workflow < category.length; i_workflow++) {
                     wf = category[i_workflow];
                     item_id = 'wf-listitem-' + wf.id;
                     item_content = '<span class="wf-id">' + wf.id + '</span><br>' + wf.name
                     // Check if this workflow is currently being displayed. If so,
                     // highlight sidebar entry
                     var css_class = 'wf-' + css_suffix;
                     if (ui.current_workflow) {
                         if (ui.current_workflow.id === wf.id) {
                             css_class = 'wf-highlight-' + css_suffix;
                             this.current_workflow = wf;
                         }
                     }
                     inner_html += '<li id=""><a href="#" class="' + css_class + '" id="' + item_id + '">' + item_content + '</a></li>';
                 }
                 inner_html += '</ul>';
                 $('#wf-list-' + css_suffix).html(inner_html);
             } else {
                 $('#wf-list-' + css_suffix).empty();
             }
         }
         // Assign onclick event handler to all sidebar list items
         for (let wf_id in ui.workflows.lookup) {
             $('#wf-listitem-' + wf_id).click(function() {
                 ui.showWorkflow(this.id.substring(12));
             });
         }
     },
     /**
      * Highlight the listing entry at the given index position. Ensure that any
      * currently highlighted entry is cleared. A negative index value indicates
      * that no entry is to be highlighted.
      *
      * workflow: Workflow
      */
     setCurrent : function(workflow) {
         if (this.current_workflow != null) {
             var wf_id = this.current_workflow.id;
             if (wf_id in this.ui.workflows.lookup) {
                 // Reset styles for the currently highlighted workflow
                 var css_suffix = this.ui.state_2_css[this.ui.workflows.lookup[wf_id].state].suffix;
                 $('#wf-listitem-' + wf_id).removeClass('wf-highlight-' + css_suffix);
                 $('#wf-listitem-' + wf_id).addClass('wf-' + css_suffix);
            }
         }
         // Highlight new current
         if (workflow) {
             var css_suffix = this.ui.state_2_css[this.ui.workflows.lookup[workflow.id].state].suffix;
             $('#wf-listitem-' + workflow.id).removeClass('wf-' + css_suffix);
             $('#wf-listitem-' + workflow.id).addClass('wf-highlight-' + css_suffix);
         }
         this.current_workflow = workflow;
     }
};

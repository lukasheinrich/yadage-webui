/**
 * Panel showing counts of the four workflow categories. Only method is refresh
 * to update the counters based on a given workflow listing.
 */
var OverviewPanel = function(ui) {
    /**
     * Reference to the ADAGE UI object
     *
     * @type: ADAGEUI
     */
     this.ui = ui;
};

OverviewPanel.prototype = {
    constructor : OverviewPanel,
    /**
     * Generate the DOM componets that will contain the workflow listing
     * overview. The overview will be contained in the element with the given
     * identifier.
     *
     * element_id: string
     */
    createDOM : function(element_id) {
        var html = '<div class="col-lg-12">';
        html += '   <div class="row">';

        var states = [STATE_RUNNING, STATE_WAITING, STATE_FAILED, STATE_FINISHED];
        for (var i_state = 0; i_state < states.length; i_state++) {
            var state = this.ui.state_2_css[states[i_state]];
            html += '<div class="col-xs-12 col-md-6 col-lg-3">';
            html += '    <div class="panel panel-' + state.color + ' panel-widget ">';
            html += '        <div class="row no-padding">';
            html += '            <div class="col-sm-3 col-lg-5 widget-left">';
            html += '                <i class="' + state.icon_large + '" aria-hidden="true"></i>';
            html += '            </div>';
            html += '            <div class="col-sm-9 col-lg-7 widget-right">';
            html += '                <div class="large" id="wf-summary-dash-' + state.suffix + '"></div>';
            html += '                <div class="text-muted">' + state.name + '</div>';
            html += '            </div>';
            html += '        </div>';
            html += '    </div>';
            html += '</div>';
        }
        html += '   </div>';
        html += '  </div>';
        $('#' + element_id).html(html);
    },
    /**
     * Refresh counters based on given workflow listing.
     *
     * workflows: WorkflowListing
     */
    refresh : function() {
        var categories = this.ui.workflows.categories;
        $('#wf-summary-dash-running').html(categories[STATE_RUNNING].length);
        $('#wf-summary-dash-waiting').html(categories[STATE_WAITING].length);
        $('#wf-summary-dash-failed').html(categories[STATE_FAILED].length);
        $('#wf-summary-dash-finished').html(categories[STATE_FINISHED].length);
    }
};

/**
 * ADAGE UI - Workflow PanelHeadline
 */

/**
 * Display a breadcump.
 */
var HeadlinePanel = function(ui) {
    /**
     * Reference to the ADAGE UI object
     *
     * @type: ADAGEUI
     */
     this.ui = ui;
}

HeadlinePanel.prototype = {
    constructor: HeadlinePanel,
    /**
     * Generate the DOM componets that will contain the UI headline. The
     * headline will be contained in the element with the given identifier.
     *
     * element_id: string
     */
    createDOM : function(element_id) {
        var html = '<ol class="breadcrumb">';
        html += '    <li><a href="./"><span class="glyphicon glyphicon-home"></span></a></li>';
        html += '    <li>Workflows</li>';
        html += '    <li class="active" id="breadcrumb-name">Overview</li>';
        html += '</ol>';
        $('#' + element_id).html(html);
    },
    /**
     * Adjust the last element of the headline breadcrump depending on whether
     * a workflow is currently being displayed or not.
     */
    refresh : function() {
        if (this.ui.current_workflow) {
            $('#breadcrumb-name').html(this.ui.current_workflow.name);
        } else {
            $('#breadcrumb-name').html('Overview');
        }
    }
}

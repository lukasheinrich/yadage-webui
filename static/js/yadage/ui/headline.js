/**
 * ADAGE UI - Workflow PanelHeadline
 */

var $BREADCRUMB = '<a href="./index.html"><i class="fa fa-home"/></a>&nbsp;/&nbsp;<span class="path-text">Workflows</span>';

/**
 * Display a breadcump.
 */
var HeadlinePanel = function(elementId) {
     /**
      * Identifier of element containing the headline
      */
     this.elementId = elementId;
     /**
      * Generate the DOM componets that will contain the UI headline. The
      * headline will be contained in the element with the given identifier.
      */
    let htmlBreadcrumb = '<p class="app-path" id="' + this.elementId + '-path">';
    htmlBreadcrumb += $BREADCRUMB;
    htmlBreadcrumb += '</p>';
    htmlBreadcrumb = '<div class="col-sm-6 col-lg-6">' + htmlBreadcrumb + '</div>';
    let htmlSource = '<p class="source-name" id="' + this.elementId + '-source"></p>';
    htmlSource = '<div class="col-sm-6 col-lg-6">' + htmlSource + '</div>';
    let html = '<div class="row">' + htmlBreadcrumb + htmlSource + '</div>';
    $('#' + this.elementId).html(html);
}

HeadlinePanel.prototype = {
    constructor: HeadlinePanel,
    /**
     * Adjust the last element of the headline breadcrump depending on whether
     * a workflow is currently being displayed or not.
     */
    setPath : function(component) {
        let html = $BREADCRUMB;
        if (component) {
            html += '&nbsp;/&nbsp;<span class="path-text">' + component + '</span>'
        }
        $('#' + this.elementId + '-path').html(html);
    },
    /**
     * Show the name of the engine that the UI is connected to.
     */
    setSource : function(sourceName) {
        $('#' + this.elementId + '-source').html(
            '<span class="source-name">Connected to ' + sourceName + '</span>'
        );
    }
}

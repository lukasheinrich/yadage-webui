/**
 * Element identifier for main components of the UI
 */
var $EL_HEADLINE = 'panel-headline';
var $EL_OVERVIEW = 'panel-overview';
var $EL_CONTENT = 'panel-content';

/**
 * Content types
 */
var CONTENT_LISTING = 'LISTING';
var CONTENT_WORKFLOW = 'WORKFLOW';

var CORSify = (url) => {
    if (!url.endsWith('/')) {
        return url + '/';
    } else {
        return url;
    }
}
/**
 * Error hander for AJAX calls
 */
var ERROR = (xhr, status, error) => {
    let message;
    if (xhr.responseText) {
        message = xhr.responseText;
    } else {
        message = 'There was an error while loading content from the server.';
    }
    $('#' + $EL_CONTENT).html(
        '<div class="container-fluid">' +
            '<p class="error-message">' +
                '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>&nbsp;&nbsp;' +
                message +
            '</p>' +
        '</div>'
    );
};

/**
 * Show content spinner
 */
var SPINNER = () => {
    return '<div style="text-align: center;padding: 50px;">' +
        '<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>' +
        '</div>';
};
/**
 * Convert UTC timestamp provided by API into local time.
 */
var UTC_2_LOCAL = (timestamp) => {
     //var offset = new Date().getTimezoneOffset();
     const utc_date = new Date(timestamp).toLocaleString();
     //utc_date.setMinutes(utc_date.getMinutes() - offset);
     return new Date(utc_date + ' UTC').toLocaleString();
};

/**
 * Global mapping of workflow status values to CSS elements, suffixs, icons, and
 * printable names.
 */
var STATUS_2_CSS = (status) => {
    switch (status) {
        case STATE_RUNNING:
            return {
                'color' : 'blue',
                'icon_small' : 'fa fa-circle-o-notch fa-spin',
                'icon_large' : 'fa fa-circle-o-notch fa-3x',
                'name' : 'Running',
                'suffix' : 'running'
            };
        case STATE_IDLE:
            return {
                'color' : 'orange',
                'icon_small' : 'fa fa-hourglass-half',
                'icon_large' : 'fa fa-hourglass-half fa-3x',
                'name' : 'Idle',
                'suffix' : 'waiting'
            }
        case STATE_ERROR:
            return {
                'color' : 'red',
                'icon_small' : 'fa fa-bolt',
                'icon_large' : 'fa fa-bolt fa-3x',
                'name' : 'Failed',
                'suffix' : 'failed'
            };
        case STATE_FINISHED:
            return {
                'color' : 'teal',
                'icon_small' : 'fa fa-power-off',
                'icon_large' : 'fa fa-power-off fa-3x',
                'name' : 'Finished',
                'suffix' : 'finished'
            };
    }
}


/**
 * ADAGE UI - Contains several UI components.
 */
var ADAGEUI = function(urlWorkflowAPI, urlTemplateAPI, elementId) {
    /**
     * Create the relevant DOM elements for the GUI components
     */
    $('#' + elementId).html(
       '<div class="row" id="' + $EL_HEADLINE + '"></div>' +
       '<div class="row" id="' + $EL_OVERVIEW + '"></div>' +
       '<div class="row" id="' + $EL_CONTENT + '"></div>'
    );
    /**
     * Base Urls for workflow and template API's
     */
    const self = this;
    this.links = {};
    this.urlWorkflowAPI = CORSify(urlWorkflowAPI);
    this.urlTemplateAPI = CORSify(urlTemplateAPI);
    this.headline = new HeadlinePanel($EL_HEADLINE);
    this.overview = new OverviewPanel($EL_OVERVIEW, this);
    this.listings = new ListingPanel(
        $EL_CONTENT,
        function(workflowId, workflowName) {
            self.showWorkflow(workflowId, workflowName);
        },
        function() {self.showRECAST();}
    );
    this.workflow = new WorkflowPanel(
        $EL_CONTENT,
        function(url) {self.deleteWorkflow(url)},
        function(url, name, rules) {self.applyRules(url, name, rules)},
        function(url, name, nodes) {self.submitNodes(url, name, nodes)},
        function(url, name) {self.showWorkflow(url, name)},
        function() {self.showRECAST();}
    );
    /**
     * Load the service description
     */
     $('#' + $EL_CONTENT).html(SPINNER());
     $.ajax({
         url: self.urlWorkflowAPI,
         type: 'GET',
         contentType: 'application/json',
         success: function(data) {
             self.headline.setSource(data.name);
             self.overview.init(getReference('workflows.stats', data.links));
             self.listings.setLinks(data.links);
             self.showRECAST();
             self.links['submit'] = getReference('workflows.submit', data.links);
         },
         error: ERROR
     });
};

ADAGEUI.prototype = {
    constructor: ADAGEUI,
    /**
     * Apply a given list of rules (identifier) to the workflow with the given
     * Url.
     */
    applyRules : function(url, name, rules) {
        const self = this;
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({'rules' : rules}),
            success: function(data) {
                self.showWorkflow(url, name);
            },
            error: ERROR
        });
    },
    /**
     * Create an new workflow. If the request is successful the created workflow
     * will be displayed.
     */
    createWorkflow : function(templateUrl, name, parameter) {
        $('#' + $EL_CONTENT).html(SPINNER());
        const self = this;
        console.log(self.links['submit']);
        $.ajax({
            url: self.links['submit'],
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'template' : templateUrl,
                'name' : name,
                'parameters' : parameter
            }),
            success: function(data) {
                self.overview.reload();
                self.showWorkflow(getSelfReference(data.links), data.name);
            },
            error: ERROR
        });
    },
    /**
     * Delete workflow with given Url
     */
    deleteWorkflow : function(url) {
        const self = this;
        $.ajax({
            url: url,
            type: 'DELETE',
            contentType: 'application/json',
            success: function(data) {
                self.overview.reload();
                self.showRECAST();
            },
            error: function() {
                alert('There was an error while trying to delete the current workflow.');
            }
        });
    },
    /**
     * Show listing of all workflows that are in a given state.
     */
    listWorkflows : function(state) {
        $('#' + $EL_CONTENT).html(SPINNER());
        const css = STATUS_2_CSS(state);
        this.headline.setPath(css.name);
        this.listings.showListing(state);
    },
    showRECAST : function() {
        $('#' + $EL_CONTENT).html(SPINNER());
        this.headline.setPath();
        const self = this;
        RECASTForm(
            $EL_CONTENT,
            this.urlTemplateAPI,
            (templateUrl, name, parameter) => {
                self.createWorkflow(templateUrl, name, parameter)
            }
        );
    },
    showWorkflow : function(workflowUrl, workflowName) {
        $('#' + $EL_CONTENT).html(SPINNER());
        this.headline.setPath(workflowName);
        this.workflow.showWorkflow(workflowUrl);
    },
    /**
     * Apply a given list of rules (identifier) to the workflow with the given
     * Url.
     */
    submitNodes : function(url, name, nodes) {
        const self = this;
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({'nodes' : nodes}),
            success: function(data) {
                self.overview.reload();
                self.showWorkflow(url, name);
            },
            error: ERROR
        });
    }
};

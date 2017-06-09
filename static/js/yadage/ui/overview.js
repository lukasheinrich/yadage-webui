/**
 * Panel showing counts of the four workflow categories. Only method is refresh
 * to update the counters based on a given workflow listing.
 */
var OverviewPanel = function(elementId, ui) {
     /**
      * Identifier of the element containing the overview panel.
      */
     this.elementId = elementId;
     /**
      * Generate the DOM componets that will contain the workflow listing
      * overview. The overview will be contained in the element with the given
      * identifier.
      */
     let html = '<div class="col-lg-12">';
     html += '   <div class="row">';
     for (let i_state = 0; i_state < WORKFLOW_STATES.length; i_state++) {
         const state = STATUS_2_CSS(WORKFLOW_STATES[i_state]);
         html += '<div class="col-xs-12 col-md-6 col-lg-3">';
         html += '    <div class="panel panel-' + state.color + ' panel-widget ">';
         html += '        <div class="row no-padding">';
         html += '            <div class="col-sm-3 col-lg-5 widget-left">';
         html += '                <i class="' + state.icon_large + '" aria-hidden="true"></i>';
         html += '            </div>';
         html += '            <a href="#" id="ovw-click-' + state.suffix + '">';
         html += '              <div class="col-sm-9 col-lg-7 widget-right" id="wf-summary-dash-' + state.suffix + '">';
         html += '                  <i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>'
         html += '              </div>';
         html += '            </a>';
         html += '        </div>';
         html += '    </div>';
         html += '</div>';
     }
     html += '   </div>';
     html += '  </div>';
     $('#' + this.elementId).html(html);
     for (let i_state = 0; i_state < WORKFLOW_STATES.length; i_state++) {
         let state = WORKFLOW_STATES[i_state];
         (function(id, css, ui){
             $('#ovw-click-' + css.suffix).click(function(event){
                 event.preventDefault();
                 ui.listWorkflows(id);
             });
         })(state, STATUS_2_CSS(state), ui)
     }
     /**
      * Interval identifier of the refresher
      */
     this.refreshIntervalId = -1;
     /**
      * Url to load statistics
      */
     this.statsUrl = null;
};

OverviewPanel.prototype = {
    constructor : OverviewPanel,
    createDOM : function() {
        let ui = this.ui;
    },
    /**
     * Initialize the target stats Url. Will call referch and then set an
     * interval timer to periodically refrech the overview.
     */
    init : function(ref) {
        this.statsUrl = ref;
        this.refresh(ref);
        const self = this;
        this.refreshIntervalId = window.setInterval(function(){ self.refresh(ref); }, 15000);
    },
    /**
     * Refresh counters based on given workflow listing.
     *
     * workflows: WorkflowListing
     */
    refresh : function(ref) {
        $.ajax({
            url: ref,
            type: 'GET',
            contentType: 'application/json',
            success: function(data) {
                for (let state in data.statistics) {
                    const css = STATUS_2_CSS(state);
                    const elId = 'wf-summary-dash-' + css.suffix;
                    const currHtml = $('#' + elId).html().trim();
                    const html = '<div class="large">' + data.statistics[state] + '</div>' +
                                 '<div class="text-muted">' + css.name + '</div>';
                    if (currHtml !== html) {
                        $('#' + elId).hide();
                        $('#' + elId).html(html);
                        $('#' + elId).fadeIn(150);
                    }
                }
            }
        });
    },
    /**
     * Reload function called by UI to enforce refresh. Cancel and reset the
     * periodic refresher.
     */
    reload : function() {
        window.clearInterval(this.refreshIntervalId);
        this.refresh(this.statsUrl);
        const self = this;
        this.refreshIntervalId = window.setInterval(
            function(){
                self.refresh(self.statsUrl);
            },
            15000
        );
    }
};

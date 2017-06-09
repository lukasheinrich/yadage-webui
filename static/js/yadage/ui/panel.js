/**
 * ADAGE UI - Content Panel
 */
var PANEL = (title, body, css, onCloseId) => {
    let cssColor = 'default';
    if (css) {
        cssColor = css.color;
    }
    var html = '<div class="col-lg-12"><div class="panel"><div class="panel-' + cssColor + '">';
    // Headline
    let headline = title;
    if (onCloseId != null) {
        headline += '<a href="#" type="button" class="btn btn-' + cssColor + ' pull-right" id="' + onCloseId + '"><i class="fa fa-close"/></a>';
    }
    html += '<div class="panel-heading">' + headline + '</div></div>';
    // Body
    html += '<div class="panel-body">'; // Body (BEGIN)
    html += body;
    html += '</div>'; // Body (END)
    html += '</div></div>';
    return html;
}

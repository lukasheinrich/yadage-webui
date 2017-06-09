/**
 * ADAGE UI - Workflow RECAST Form
 */

var $EL_TMPDESCRIPTION = 'worflow-template-desc';
var $EL_TMPLISTING     = 'workflow-template-list';
var $EL_TMPNAME        = 'worflow-template-name';
var $EL_TMPPARAMETERS  = 'workflow-template-para';
var $EL_TMPSUBMIT      = 'workflow-template-submit'
 /**
 * Select template function. Shows tmplate information and displays form for
 * template parameters.
 */
function showTemplate(template) {
    $('#' + $EL_TMPDESCRIPTION).html(template.description);
    $('#' + $EL_TMPNAME).val(template.name);
    let html = '';
    if (template.parameters) {
        html = '<label class="form-label">Input Data</label>'
        const rule_params = template.parameters;
        for (let i_para = 0; i_para < rule_params.length; i_para++) {
            const para = rule_params[i_para];
            const cntrl_id = template.id + '_' + para.name;
            let para_label = para.name;
            if (para.label) {
                para_label = para.label;
            }
            let para_default = '';
            if (para.default) {
                para_default = para.default;
            }
            html += '<div class="container-fluid">';
            html += '<label class="ctrl-label" for="' + cntrl_id + '">' + para_label + '</label>';
            html += '<input type="text" class="form-control" id="' + cntrl_id + '" value="' + para_default + '"/>';
            html += '</div>'
     }
   }
   $('#' + $EL_TMPPARAMETERS).html(html);
 };


/**
 * Display RECAST form
 */
var RECASTForm = (elementId, url, createWorkflowCallback) => {
    $('#' + elementId).html(SPINNER());
    $.ajax({
        url: url + '/templates',
        type: 'GET',
        contentType: 'application/json',
        success: function(data) {
            const templates = data.workflows;
            let html = '<form role="form">';
            html    += '  <div class="form-group">';
            html    += '    <label class="form-label">Workflow</label>';
            html    += '    <select class="form-control" id="' + $EL_TMPLISTING + '">';
            for (let i = 0; i < templates.length; i++) {
                const template = templates[i];
                html += '<option value="' + template.id + '">' + template.name + '</option>';
            }
            html    += '    </select>';
            html    += '    <label class="form-label">Name</label>';
            html    += '    <input class="form-control" type="text" id="' + $EL_TMPNAME + '"/>';
            html    += '    <label class="form-label">Description</label>';
            html    += '    <div class="text-panel" id="' + $EL_TMPDESCRIPTION + '"></div>';
            html    += '    <div class="form-panel" id="' + $EL_TMPPARAMETERS + '"></div>';
            html    += '  </div>';
            if (templates.length > 0) {
                html    += '  <button type="button" class="btn btn-default" id="' + $EL_TMPSUBMIT + '">Submit</button>';
            }
            html    += '</form>';
            $('#' + elementId).hide();
            $('#' + elementId).html(PANEL('RECAST', html));
            if (templates.length > 0) {
                // Assign event handler when clicking submit
                (function(templates) {
                    $('#' + $EL_TMPSUBMIT).click(function() {
                        const template = templates[$('#' + $EL_TMPLISTING)[0].selectedIndex];
                        if (template) {
                            // Collect potential user input values for rule parameters
                            var inputData = [];
                            if (template.parameters) {
                                for (let i_para = 0; i_para < template.parameters.length; i_para++) {
                                    const para = template.parameters[i_para];
                               	    const cntrl_id = template.id + '_' + para.name;
                                    inputData.push({
                                        'key' : para.name,
                                        'value' : $('#' + cntrl_id).val()
                                    });
                                }
                            }
                            createWorkflowCallback(
                                getSelfReference(template.links),
                                $('#' + $EL_TMPNAME).val(),
                                inputData
                            );
                        } else {
                            alert('Please selct a workflow template from the list.');
                        }
                    });
                })(templates);

                // Assign event handler when selecting a workflow template
                (function(templates) {
                    $('#' + $EL_TMPLISTING).click(function() {
                        const template = templates[$('#' + $EL_TMPLISTING)[0].selectedIndex];
                        if (template) {
                            showTemplate(template);
                        }
                    });
                })(templates);
                showTemplate(templates[0]);
            }
            $('#' + elementId).fadeIn(300);
        },
        ERROR
    });
};

/**
 * ADAGE UI - Workflow RECAST Form
 */

// Default URL of template server
var TEMPLATE_SERVER_URL = 'http://cds-swg1.cims.nyu.edu:5005/workflow-repository/api/v1';


/**
  * Capture functionality for recast form.
  */
 var RECASTForm = function(ui) {
     /**
      * Reference to the ADAGE UI object
      *
      * @type: ADAGEUI
      */
      this.ui = ui;
      /**
       * List of workflow templates. Initially empty until reload is called.
       *
       * @type: [{'id':..., 'name':..., 'description':..., 'links':...}]
       */
      this.templates = [];
 };

 RECASTForm.prototype = {
     constructor: RECASTForm,
     /**
      * Update DOM to show the RECAST form inside the given element.
      *
      * element_id: string
      */
    createDOM : function(element_id) {
        var html = '<div class="col-lg-12"><div class="panel panel-default">';
        // Headline
        html += '<div class="panel-heading">RECAST</div>';
        // Body
        html += '<div class="panel-body">'; // Body (BEGIN)
        html += '   <form role="form">'; // FORM (BEGIN)
        html += '       <div class="form-group">';
        html += '           <label class="form-label">Workflow</label>';
        html += '           <select class="form-control" id="sel-workflow-template">';
        html += '           </select>';
        html += '           <label class="form-label">Name</label>';
        html += '           <input class="form-control" type="text" id="worflow-name"></input>';
        html += '           <label class="form-label">Description</label>';
        html += '           <div class="text-panel" id="worflow-description"></div>';
        html += '       </div>';
        html += '       <button type="button" class="btn btn-default" id="btn-submit-recast">Submit</button>';
        html += '   </form>'; // FORM (END)
        html += '</div>'; // Body (END)
        html += '</div></div>';
        $('#' + element_id).html(html);
        // Set event handlers
        // Assign onClick handler to RECAST from submit button
        var obj = this;
        $('button#btn-submit-recast').click(function() {
            obj.submit();
        });
        // Assign event handler when selecting a workflow template
        var templates = this.templates;
        $('#sel-workflow-template').click(function() {
            var template = templates[$('#sel-workflow-template')[0].selectedIndex];
            $('#worflow-description').html(template.description);
            $('#worflow-name').val(template.name);
        });
     },
     /**
      * Load workflow templates and populate select list.
      */
     reload : function() {
         // GET Workflow Templates
         var templates = this.templates;
         $.get(TEMPLATE_SERVER_URL + '/templates', function(data, status) {
             if (status === 'success') {
                 //form.templates = [];
                 if (data.workflows.length > 0) {
                     var html = '';
                     for (var i_wf = 0; i_wf < data.workflows.length; i_wf++) {
                         wf = data.workflows[i_wf];
                         templates.push(wf);
                         html += '<option value="' + getSelfReference(wf.links) + '">' + wf.name + '</option>';
                     }
                     $('#sel-workflow-template').html(html);
                     $('#worflow-name').val(templates[0].name);
                     $('#worflow-description').html(templates[0].description);
                 }
             }
         });
     },
     /**
      * Submit the selected workflow template.
      */
     submit : function() {
         var sel_val = $('#sel-workflow-template').val();
         var ui = this.ui;
         if (sel_val) {
             var reqBody = {'template' : sel_val, 'name' : $('#worflow-name').val()};
             $.ajax({
                 url: API_BASE_URL + '/workflows',
                 type: 'POST',
                 contentType: 'application/json',
                 data: JSON.stringify(reqBody),
                 success: function(data) {
                     ui.reload();
                 },
                 error: function() {
                     alert('There was an error while submitting your request.');
                 }
             });
         } else {
           alert('Please selct a workflow template from the list.');
         }
     }
 };

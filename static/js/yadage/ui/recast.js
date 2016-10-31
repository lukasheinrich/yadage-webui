/**
 * ADAGE UI - Workflow RECAST Form
 */

// Default URL of template server
var TEMPLATE_SERVER_URL = 'http://cds-swg1.cims.nyu.edu/workflow-repository/api/v1';


/**
 * Select template function. Shows tmplate information and displays form for
 * template parameters.
 */
 function showTemplate(template) {
   $('#worflow-description').html(template.description);
   $('#worflow-name').val(template.name);
   form_html = '';
   if (template.parameters) {
     form_html = '<label class="form-label">Input Data</label>'
     var rule_params = template.parameters;
     for (var i_para = 0; i_para < rule_params.length; i_para++) {
       var para = rule_params[i_para];
       var cntrl_id = template.id + '_' + para.name;
       var para_label = para.name;
       if (para.label) {
         para_label = para.label;
       }
       var para_default = '';
       if (para.default) {
         para_default = para.default;
       }
       form_html += '<div class="container-fluid"><label class="ctrl-label" for="' + cntrl_id + '">' + para_label + '</label><input type="text" class="form-control" id="' + cntrl_id + '" value="' + para_default + '"></div>'
     }
   }
   $('#worflow-parameters').html(form_html);
 };

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
        html += '           <div class="form-panel" id="worflow-parameters"></div>';
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
            showTemplate(templates[$('#sel-workflow-template')[0].selectedIndex]);
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
                 templates.length = 0
                 if (data.workflows.length > 0) {
                     var html = '';
                     for (var i_wf = 0; i_wf < data.workflows.length; i_wf++) {
                         wf = data.workflows[i_wf];
                         templates.push(wf);
                         html += '<option value="' + wf.id + '">' + wf.name + '</option>';
                     }
                     $('#sel-workflow-template').html(html);
                     showTemplate(templates[0]);
                 }
             }
         });
     },
     /**
      * Submit the selected workflow template.
      */
     submit : function() {
         var ui = this.ui;
         var sel_val = $('#sel-workflow-template').val();
         if (sel_val) {
			 var template;
             for (var i = 0; i < this.templates.length; i++) {
				 if (this.templates[i].id === sel_val) {
					 template = this.templates[i];
					 break;
				 }
			 }
			 if (template) {
                 // Collect potential user input values for rule parameters
                 var inputData = [];
                 if (template.parameters) {
                     for (var i_para = 0; i_para < template.parameters.length; i_para++) {
                         var para = template.parameters[i_para];
                    	 var cntrl_id = template.id + '_' + para.name;
						 inputData.push({'key' : para.name, 'value' : $('#' + cntrl_id).val()});
                     }
                 }
	             var reqBody = {
					 'template' : getSelfReference(template.links),
					 'name' : $('#worflow-name').val(),
					 'parameters' : inputData
				 };
				 console.log(reqBody);
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
	           alert('Error: Selected workflow not found');
	         }
		 } else {
		   alert('Please selct a workflow template from the list.');
		 }
     }
 };

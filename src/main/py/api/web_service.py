import hateoas
import os
from urls import URLFactory

# ------------------------------------------------------------------------------
# YADAGE Web Service API
#
# Implements the primary methods to create and manipulate objects through the
# web API.
# ------------------------------------------------------------------------------
class WebServiceAPI(object):
    # --------------------------------------------------------------------------
    # Initialize the Web service with the base URL for all server resources.
    #
    # base_url::string
    # --------------------------------------------------------------------------
    def __init__(self, base_url):
        self. urls = URLFactory(base_url)

    # --------------------------------------------------------------------------
    # Get recursive directory listing for workflow.
    #
    # base_directory::string
    # workflow_id::string
    #
    # returns {'files':[{file}]}
    # --------------------------------------------------------------------------
    def get_directory_listing(self, base_directory, workflow_id):
        return {'files' : self.list_directory(base_directory, workflow_id)}

    # --------------------------------------------------------------------------
    # Get a workflow instance as Json object.
    #
    # workflow::WorkflowInstance
    #
    # returns JsonObject
    # --------------------------------------------------------------------------
    def get_workflow(self, workflow):
        wf_descriptor = {
            'id' : workflow.identifier,
            'name' : workflow.name,
            'state' : workflow.state,
            'dag' : workflow.dag,
            'rules' : workflow.rules,
            'applied' : workflow.applied_rules,
            'applicableRules' : workflow.applicable_rules,
            'submittableNodes' : workflow.submittable_nodes
        }
        return hateoas.add_self_reference(wf_descriptor, self.urls.get_workflow_url(workflow.identifier))

    # --------------------------------------------------------------------------
    # Get a workflow descriptor as Json object.
    #
    # workflow::WorkflowDescriptor
    #
    # returns JsonObject
    # --------------------------------------------------------------------------
    def get_workflow_descriptor(self, workflow):
        wf_descriptor = {
            'id' : workflow.identifier,
            'name' : workflow.name,
            'state' : workflow.state
        }
        return hateoas.add_self_reference(wf_descriptor, self.urls.get_workflow_url(workflow.identifier))

    # --------------------------------------------------------------------------
    # Convert a list of workflow descriptors into a Json array.
    #
    # workflows: [WorkflowDescriptor]
    #
    # returns: [{id:..., name:..., state:...}]
    # --------------------------------------------------------------------------
    def get_workflow_descriptors(self, workflows):
        descriptors = []
        for wf in workflows:
            descriptors.append(self.get_workflow_descriptor(wf))
        return {'workflows' : descriptors}

    # ------------------------------------------------------------------------------
    # Recursive listing of all files in the given directory
    #
    # directory_name::string
    # relative_path::string
    #
    # returns {'files':[{file}]}
    # ------------------------------------------------------------------------------
    def list_directory(self, directory_name, relative_path):
        files = []
        for filename in os.listdir(directory_name):
            abs_path = os.path.join(directory_name, filename)
            if os.path.isdir(abs_path):
                descriptor = {
                    'type' : 'DIRECTORY',
                    'name': filename,
                    'files' : self.list_directory(abs_path, relative_path + '/' + filename)
                }
            else:
                descriptor = {
                    'type': 'FILE',
                    'name': filename,
                    'size': os.stat(abs_path).st_size,
                    'href': self.urls.get_file_url(relative_path + '/' + filename)
                }
            files.append(descriptor)
        return files

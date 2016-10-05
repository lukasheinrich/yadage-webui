
import hateoas
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
            'applicableRules' : workflow.applicable_rules
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

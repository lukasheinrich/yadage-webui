# ------------------------------------------------------------------------------
# Collection of classes and methods for the YADAGE REST API that are related
# to the use and creation of resource URL's.
# ------------------------------------------------------------------------------


# ------------------------------------------------------------------------------
# CLASS: URLFactory
#
# Class that captures the definitions of URL's for objects accessible through
# the Web API.
# ------------------------------------------------------------------------------
class URLFactory:
    # --------------------------------------------------------------------------
    # Intialize the common URL prefix.
    #
    # base_url: string
    # --------------------------------------------------------------------------
    def __init__(self, base_url):
        self.base_url = base_url

    # --------------------------------------------------------------------------
    # Task URL
    #
    # task_id: string
    #
    # returns: string
    # --------------------------------------------------------------------------
    def get_activity_url(self, activity_id):
        return self.base_url + '/activities/' + str(activity_id)

    # --------------------------------------------------------------------------
    # URL to signal activity failure
    #
    # task_id: string
    #
    # returns: string
    # --------------------------------------------------------------------------
    def get_activity_fail_url(self, activity_id):
        return self.get_activity_url(activity_id) + '/fail'

    # --------------------------------------------------------------------------
    # URL to signal activity start
    #
    # task_id: string
    #
    # returns: string
    # --------------------------------------------------------------------------
    def get_activity_run_url(self, activity_id):
        return self.get_activity_url(activity_id) + '/run'

    # --------------------------------------------------------------------------
    # URL to signal successful activity completion
    #
    # task_id: string
    #
    # returns: string
    # --------------------------------------------------------------------------
    def get_activity_success_url(self, activity_id):
        return self.get_activity_url(activity_id) + '/success'

    # --------------------------------------------------------------------------
    # Workflow URL
    #
    # workflow_id: string
    #
    # returns: string
    # --------------------------------------------------------------------------
    def get_workflow_url(self, workflow_id):
        return self.base_url + '/workflows/' + str(workflow_id)

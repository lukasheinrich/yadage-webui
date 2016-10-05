# ------------------------------------------------------------------------------
# Collection of helper classes and methods for the REST API server
# ------------------------------------------------------------------------------

import json
import urllib


# ------------------------------------------------------------------------------
# CLASS: JsonResource
#
# Simple class to wrap a GET request that reads a Json object. Includes the
# request response (.response) and the retrieved Json object (.json) as
# properties.
# ------------------------------------------------------------------------------
class JsonResource:
    # --------------------------------------------------------------------------
    # Get the resource at the given URL.
    #
    # url: string
    # --------------------------------------------------------------------------
    def __init__(self, url):
        self.url = url
        self.response = urllib.urlopen(url)
        self.json = json.loads(self.response.read())

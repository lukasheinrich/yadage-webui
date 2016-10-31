# ------------------------------------------------------------------------------
# YADAGE Workflow Repository
#
# Manage and persist information about running and completed workflow instances.
# Classes implement the workflow instance store API.
#
# ------------------------------------------------------------------------------
import pymongo

from abc import abstractmethod

# ------------------------------------------------------------------------------
# Abstract instance manager class. Defines the interface methods that every
# workflow instance manager has to implement.
# ------------------------------------------------------------------------------
class BackendManager(object):
    # --------------------------------------------------------------------------
    # Create a new task to be submitted.
    #
    # workflow_id::string
    # node_id::string
    # --------------------------------------------------------------------------
    @abstractmethod
    def create_task(self, workflow_id, node_id):
        pass

    # --------------------------------------------------------------------------
    # Delete task from repository.
    #
    # workflow_id::string
    # node_id::string
    # --------------------------------------------------------------------------
    @abstractmethod
    def delete_task(self, workflow_id, node_id):
        pass

    # --------------------------------------------------------------------------
    # Get pending task for workflow.
    #
    # workflow_id: string
    #
    # returns: [(string, string)]
    # --------------------------------------------------------------------------
    @abstractmethod
    def list_tasks(self, workflow_id):
        pass


# ------------------------------------------------------------------------------
#
# CLASS: MongoDBInstanceManager
#
# Persistent implementation of a workflow instance manager using MongoDB
#
# ------------------------------------------------------------------------------
class MongoBackendManager(BackendManager):
    # --------------------------------------------------------------------------
    # Intialize the MongoDB collection that contains workflow instance objects.
    # --------------------------------------------------------------------------
    def __init__(self, mongo_collection):
        self.collection = mongo_collection

    # --------------------------------------------------------------------------
    # Override BackendManager.create_task
    # --------------------------------------------------------------------------
    def create_task(self, workflow_id, node_id):
        # Create a new entry in the workflow collection and return new instance
        self.collection.insert_one(
            {'workflow' : workflow_id, 'node' : node_id}
        )

    # --------------------------------------------------------------------------
    # Override BackendManager.delete_task
    # --------------------------------------------------------------------------
    def delete_task(self, workflow_id, node_id):
        # Delete object with given identifier. Result contains object count
        # to determine if the object existed or not
        self.collection.delete_one({'workflow' : workflow_id, 'node' : node_id})

    # --------------------------------------------------------------------------
    # Override BackendManager.list_tasks
    # --------------------------------------------------------------------------
    def list_tasks(self):
        result = []
        # Build the document query. Select all entries if no state filter is
        # given.
        cursor = self.collection.find()
        # Iterate over all objects in the query result. Add a workflow instance
        # object for each to the returned result
        for document in cursor:
            result.append((document['workflow'], document['node']))
        return result

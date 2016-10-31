# ------------------------------------------------------------------------------
# YADAGE Workflow Repository
#
# Manage and persist information about running and completed workflow instances.
# Classes implement the workflow instance store API.
#
# ------------------------------------------------------------------------------
from abc import abstractmethod
from pymongo import MongoClient

from workflow import WorkflowDBInstance

# ------------------------------------------------------------------------------
# Abstract instance manager class. Defines the interface methods that every
# workflow instance manager has to implement.
# ------------------------------------------------------------------------------
class WorkflowInstanceManager(object):
    # --------------------------------------------------------------------------
    # Create a new workflow instance for a given Json representation of the
    # workflow object. Assigns the given name with the new workflow instance.
    # The workflow instance manager is agnostic to the structure and content
    # of the workflow Json object at this point.
    #
    # workflow_id::string
    # name::string
    # state::string
    # workflow_json::JsonObject (for workflow instance)
    #
    # returns: WorkflowDBInstance
    # --------------------------------------------------------------------------
    @abstractmethod
    def create_workflow(self, workflow_id, name, state, workflow_json):
        pass

    # --------------------------------------------------------------------------
    # Delete workflow instance with the given identifier. The result indicates
    # whether the given workflow identifier was valid (i.e., identified an
    # existing workflow) or not.
    #
    # workflow_id::string
    #
    # returns: True, if worlflow deleted, False if not found
    # --------------------------------------------------------------------------
    @abstractmethod
    def delete_workflow(self, workflow_id):
        pass

    # --------------------------------------------------------------------------
    # Get workflow instance with given identifier.
    #
    # workflow_id: string
    #
    # returns: Workflow instance or None
    # --------------------------------------------------------------------------
    @abstractmethod
    def get_workflow(self, workflow_id):
        pass

    # --------------------------------------------------------------------------
    # Get a list of all workflow instances in the database. Allows to filter
    # result by state.
    # Get a list of all workflow instances in the database.
    #
    # returns: [WorkflowDBInstance]
    # --------------------------------------------------------------------------
    @abstractmethod
    def list_workflows(self, state=None):
        pass

    # --------------------------------------------------------------------------
    # Replace existing workflow instance with given workflow instance. Result
    # is True if an entry in the database matched the identifier of the given
    # workflow instance and the update was successful.
    #
    # workflow_id::string
    # name::string
    # state::string
    # workflow_json::JsonObject (for workflow instance)
    #
    # returns::True|False
    # --------------------------------------------------------------------------
    @abstractmethod
    def update_workflow(self, workflow_id, name, state, workflow_json):
        pass


# ------------------------------------------------------------------------------
# CLASS: MongoDBFactory
#
# Wraps code to establish connection with MongoDB database that is used by the
# Web API and the Backend Manager.
# ------------------------------------------------------------------------------
class MongoDBFactory:
    # --------------------------------------------------------------------------
    # get reference to MongoDB database. We currently use database 'yadage'
    # from the MongoDB server running on local host.
    #
    # returns Database
    # --------------------------------------------------------------------------
    @staticmethod
    def get_database():
        return MongoClient().yadage


# ------------------------------------------------------------------------------
#
# CLASS: MongoDBInstanceManager
#
# Persistent implementation of a workflow instance manager using MongoDB
#
# ------------------------------------------------------------------------------
class MongoDBInstanceManager(WorkflowInstanceManager):
    # --------------------------------------------------------------------------
    # Intialize the MongoDB collection that contains workflow instance objects.
    # --------------------------------------------------------------------------
    def __init__(self, mongo_collection):
        self.collection = mongo_collection

    # --------------------------------------------------------------------------
    # Override WorkflowInstanceManager.create_workflow
    #
    # Create a new workflow instance for a given Json representation of the
    # workflow object. Assigns the given name with the new workflow instance.
    #
    # workflow_id::string
    # name::string
    # state::string
    # workflow_json::JsonObject (for workflow instance)
    #
    # returns: WorkflowDBInstance
    # --------------------------------------------------------------------------
    def create_workflow(self, workflow_id, name, state, workflow_json):
        # Create a new entry in the workflow collection and return new instance
        self.collection.insert_one(
            self.get_json_from_instance(
                workflow_id, name, state, workflow_json
            )
        )
        return WorkflowDBInstance(workflow_id, name, state, workflow_json)

    # --------------------------------------------------------------------------
    # Override WorkflowInstanceManager.delete_workflow
    #
    # Delete workflow instance with the given identifier. The result contains
    # a counter that is used to determine whether the object existed or not.
    #
    # workflow_id::string
    #
    # returns: True, if worlflow deleted, False if not found
    # --------------------------------------------------------------------------
    def delete_workflow(self, workflow_id):
        # Delete object with given identifier. Result contains object count
        # to determine if the object existed or not
        result = self.collection.delete_one({'_id': workflow_id})
        return result.deleted_count > 0

    # --------------------------------------------------------------------------
    # Static method that creates a WorkflowInstance object from a Json object as
    # stored in the database.
    #
    # obj: JsonObject (from database collection)\
    #
    # returns WorkflowDBInstance
    # --------------------------------------------------------------------------
    @staticmethod
    def get_instance_from_json(obj):
        identifier = obj['_id']
        name = obj['name']
        state = obj['state']
        workflow_json = obj['workflow']
        return WorkflowDBInstance(identifier, name, state, workflow_json)

    # --------------------------------------------------------------------------
    # Override WorkflowInstanceManager.get_workflow
    #
    # Get workflow instance with given identifier.
    #
    # workflow_id: string
    #
    # returns: Workflow instance or None
    # --------------------------------------------------------------------------
    def get_workflow(self, workflow_id):
        # Find all objects with given identifier. The result size is expected
        # to be zero or one. We only look at the first object of the result (if
        # any).
        cursor = self.collection.find({'_id': workflow_id})
        if cursor.count() > 0:
            return self.get_instance_from_json(cursor.next())
        else:
            return None

    # --------------------------------------------------------------------------
    # Override WorkflowInstanceManager.list_workflows
    #
    # Get a list of all workflow instances in the database. Use state as query
    # consition if not None.
    #
    # state::string
    #
    # returns: [WorkflowDBInstance]
    # --------------------------------------------------------------------------
    def list_workflows(self, state=None):
        result = []
        # Build the document query. Select all entries if no state filter is
        # given.
        if not state is None:
            cursor = self.collection.find( {'state' : state})
        else:
            cursor = self.collection.find()
        # Iterate over all objects in the query result. Add a workflow instance
        # object for each to the returned result
        for document in cursor:
            result.append(self.get_instance_from_json(document))
        return result

    # --------------------------------------------------------------------------
    # Create a Json object from all components of a workflow instance. Used to
    # generate the Json objects that are stored in the MongoDB collection.
    #
    # identfier::string
    # name::string
    # state::string
    # workflow_json::JsonObject (for workflow instance)
    #
    # returns JsonObject (for database)
    # --------------------------------------------------------------------------
    @staticmethod
    def get_json_from_instance(identifier, name, state, workflow_json):
        return {
            '_id' : identifier,
            'name' : name,
            'state' : state,
            'workflow' : workflow_json
        }

    # --------------------------------------------------------------------------
    # Override WorkflowInstanceManager.update_workflow
    #
    # Replace existing workflow instance with given workflow instance. Result
    # is True if an entry in the database matched the identifier of the given
    # workflow instance and the update was successful.
    #
    # workflow_id::string
    # name::string
    # state::string
    # workflow_json::JsonObject (for workflow instance)
    #
    # returns::True|False
    # --------------------------------------------------------------------------
    def update_workflow(self, workflow_id, name, state, workflow_json):
        obj = self.get_json_from_instance(
            workflow_id,
            name,
            state,
            workflow_json
        )
        # Replace document with given identfier. the result contains a counter
        # that is used to derive whether the instance identifier referenced an
        # existing workflow instance.
        result = self.collection.replace_one({'_id' : workflow_id}, obj)
        return result.matched_count > 0

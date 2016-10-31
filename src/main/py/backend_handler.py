#!venv/bin/python

import adage
import adage.nodestate as nodestate
from multiprocessing import Process
import time

import yadage.backends.packtivity_celery
import yadage.backends.celeryapp
from yadage.yadagemodels import YadageWorkflow

from server.backend import MongoBackendManager
from server.engine import YADAGEEngine
from server.repository import MongoDBFactory, MongoDBInstanceManager


# Initialize the workflow repository and backend manager.
db = MongoDBFactory.get_database()
backend_manager = MongoBackendManager(db.tasks)

# Initialize the default backend
yadage_backend = yadage.backends.packtivity_celery.PacktivityCeleryBackend(
    yadage.backends.celeryapp.app
)

# ------------------------------------------------------------------------------
# Submit a workflow node for execution and wait until the task is finished.
# ------------------------------------------------------------------------------
def submit_node(workflow_id, node_id):
    print str(workflow_id) + ':' + str(node_id)
    db = MongoClient().yadage
    instance_manager = MongoDBInstanceManager(db.workflows)
    # Remove task from queue
    MongoBackendManager(db.tasks).delete_task(workflow_id, node_id)
    # Get the workflow instance from the database. Return if it does
    # not exist.
    workflow_inst = instance_manager.get_workflow(workflow_id)
    if workflow_inst is None:
        return False
    workflow = YadageWorkflow.fromJSON(
        workflow_inst.workflow_json,
        yadage.backends.packtivity_celery.PacktivityCeleryProxy,
        backend=yadage_backend
    )
    # Get the node with given identifier and submit it ti the backend
    node = workflow.dag.getNode(node_id)
    proxy = adage.submit_node(node, yadage_backend)
    node.update_state()
    # Get the state of the workflow and update the workflow in the database.
    state = YADAGEEngine.get_workflow_state(workflow)
    workflow_json = workflow.json()
    instance_manager.update_workflow(workflow_id, workflow_inst.name, state.name, workflow_json)
    # If the node state is RUNNING, wait, until state changes. Update the
    # repository after state change
    if node.state == nodestate.RUNNING:
        while node.state == nodestate.RUNNING:
            time.sleep(1)
            node.update_state()
        state = YADAGEEngine.get_workflow_state(workflow)
        workflow_json = workflow.json()
        instance_manager.update_workflow(workflow_id, workflow_inst.name, state.name, workflow_json)
    return True

if __name__ == '__main__':
    # Endless loop. Every second, check for new tasks and execute them.
    while True:
        for workflow_id, node_id in backend_manager.list_tasks():
            #p = Process(target=submit_node, args=(workflow_id, node_id))
            #p.start()
            submit_node(workflow_id, node_id)
        time.sleep(1)

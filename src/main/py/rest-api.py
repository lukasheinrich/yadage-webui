#!env/bin/python

# ------------------------------------------------------------------------------'
#
# ADAGE - Web Server
#
# The ADAGE Web API is the access point to the AS from the Web. The Web server
# represents a thin layer around the ADAGE Engine that wraps all relevant
# methods of the engine API.
#
# ------------------------------------------------------------------------------

from flask import Flask, abort, jsonify, make_response, request
from flask_cors import CORS
from pymongo import MongoClient

from api.http import JsonResource
from api.web_service import WebServiceAPI
from server.engine import YADAGEEngine
from server.repository import MongoDBInstanceManager
from server.rule import RuleInstance

import logging
import sys

root = logging.getLogger()
root.setLevel(logging.DEBUG)

ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
root.addHandler(ch)

# ------------------------------------------------------------------------------
# App Configuration and Initialization
# ------------------------------------------------------------------------------

APP_PATH = '/yadage/api/v1'
SERVER_URL = 'http://cds-swg1.cims.nyu.edu'
PORT = 5006

# Create the app and enable cross-origin resource sharing
app = Flask(__name__)
app.config['APPLICATION_ROOT'] = APP_PATH
CORS(app)

# Base directory for all workflow files
WORK_BASE = '../../../../backend/data/'
# Initialize the URL factory
api = WebServiceAPI(SERVER_URL + ':' + str(PORT) + APP_PATH)
# Initialize the YADAGE Server engine. Here we use MongoDB as storage backend.
# Workflows are stored in database 'yadage' and collection 'workflows'.
yadage = YADAGEEngine(
    MongoDBInstanceManager(MongoClient().yadage.workflows),
    WORK_BASE
)


# ------------------------------------------------------------------------------
# API Call Handlers
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# GET: Workflow Listing
#
# Returns a list of workflows currently managed by the workflow engine
# ------------------------------------------------------------------------------
@app.route('/workflows')
def list_workflows():
    # Get list of worklows and return a list of workflow descriptors
    workflows = yadage.list_workflows()
    return jsonify(api.get_workflow_descriptors(workflows))

# ------------------------------------------------------------------------------
# POST: Submit RECAST request
#
# Handles request to run a workflow template.
# ------------------------------------------------------------------------------
@app.route('/workflows', methods=['POST'])
def create_workflow():
    # Abort with BAD REQUEST if the request body is not in Json format or
    # does not contain a reference to a workflow template
    if not request.json:
        abort(400)
    if not 'template' in request.json:
        abort(400)
    # Read the template at the given template URL
    template_url = request.json['template']
    workflow_def = JsonResource(template_url).json
    # Get the user provided workflow name. If no name was provided use the
    # template name
    if 'name' in request.json:
        workflow_name = request.json['name'].strip()
        if workflow_name == '':
            workflow_name = str(workflow_def['name'])
    else:
        workflow_name = str(workflow_def['name'])
    # Submit request to workflow engine
    workflow = yadage.create_workflow(workflow_def, workflow_name)
    #print workflow.identifier
    # Send response with code 201 (HTTP Created)
    return jsonify(api.get_workflow_descriptor(workflow)), 201

# ------------------------------------------------------------------------------
# GET: Workflow
#
# Retrieve workflow with given identifier
# ------------------------------------------------------------------------------
@app.route('/workflows/<string:workflow_id>')
def get_workflow(workflow_id):
    # Get workflow from engine. Abort with NOT FOUND (404) if result is null.
    workflow = yadage.get_workflow(workflow_id)
    if workflow:
        return jsonify(api.get_workflow(workflow))
    else:
        abort(404)

# ------------------------------------------------------------------------------
# DELETE: Workflow
#
# Deletes the workflow with the given id
# ------------------------------------------------------------------------------
@app.route('/workflows/<string:workflow_id>', methods=['DELETE'])
def delete_workflow(workflow_id):
    # Delete workflow with given identifier. The result is True if the workflow
    # was successfully deleted and False if the workflow identifier is unknown.
    # Abort with NOT FOUND (404) in the latter case. Send an empty response
    # in case of success.
    if yadage.delete_workflow(workflow_id):
        return '', 204
    else:
        abort(404)

# ------------------------------------------------------------------------------
# POST: Workflow extension
#
# Extend workflow with set of rules. Expects a list of rule identifiers.
# ------------------------------------------------------------------------------
@app.route('/workflows/<string:workflow_id>/apply', methods=['POST'])
def apply_rules(workflow_id):
    # Abort with BAD REQUEST if the request body is not in Json format or
    # does not contain a reference to a list of appliable rules
    if not request.json:
        abort(400)
    json_obj = request.json
    if not 'rules' in json_obj:
        abort(400)
    # Apply rule instances to given workflow. The result is False if the
    # workflow does not exist.
    if not yadage.apply_rules(workflow_id, json_obj['rules']):
        abort(404)
    # Return the descriptor of the modified workflow.
    workflow = yadage.get_workflow(workflow_id)
    return jsonify(api.get_workflow_descriptor(workflow))

# ------------------------------------------------------------------------------
# 404 JSON response generator
# ------------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(error):
    print str(error)
    return make_response(jsonify({'error': 'Not found'}), 404)


# ------------------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------------------
if __name__ == '__main__':
    # Relevant documents:
    # http://werkzeug.pocoo.org/docs/middlewares/
    # http://flask.pocoo.org/docs/patterns/appdispatch/
    from werkzeug.serving import run_simple
    from werkzeug.wsgi import DispatcherMiddleware
    app.config['DEBUG'] = True
    # Load a dummy app at the root URL to give 404 errors.
    # Serve app at APPLICATION_ROOT for localhost development.
    application = DispatcherMiddleware(Flask('dummy_app'), {
        app.config['APPLICATION_ROOT']: app,
    })
    run_simple('0.0.0.0', PORT, application, use_reloader=True)
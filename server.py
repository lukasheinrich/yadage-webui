from flask import Flask, render_template, jsonify, request,redirect,url_for,Blueprint

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.debug = True
# from flask_socketio import SocketIO, emit
# socketio = SocketIO(app)


import os
def workdirpath(wflowid):
    return '{}/{}'.format(
        os.environ.get('WORKDIRBASE',
                       '{}/workdirs'.format(os.getcwd())),wflowid)

def statefile(wflowid,mode = 'r'):
    return open('{}/_yadage/yadage_instance.json'.format(workdirpath(wflowid)),mode)

index = Blueprint('index', 'index')
from flask.ext.autoindex import AutoIndex
AutoIndex(index, browse_root=workdirpath(''),  add_url_rules = True)
app.register_blueprint(index, url_prefix='/index')


import celery
import os
import uuid
import wflowui
import json
from wflowui import backend as wflowbackend
import yadage.visualize

@app.route('/')
def index():
    existing_flows = os.listdir(workdirpath(''))
    return render_template('home.html', existing_flows = existing_flows)

@app.route('/startworkflow', methods = ['POST'])
def startworkflow():
    wflowid = str(uuid.uuid1())
    workdir = workdirpath(wflowid)
    workflow = request.form['workflow']
    toplevel = request.form['toplevel']
    initdata = json.loads(request.form['initdata'])
    wflow = wflowui.init_workflow(workdir,workflow,toplevel,initdata)
    return redirect(url_for('workflow',wflowid = wflowid))


def getui(wflowid):
    wflowbackend.adagebackend.app.set_current()
    return wflowui.wflowui(
        wflowui.load_workflow(
            workdirpath(wflowid),wflowbackend
        ),
        wflowbackend)

def save_state(ui,wflowid):
    yadage.visualize.write_prov_graph(
                    '{}/_yadage'.format(workdirpath(wflowid)),
                    ui.state, vizformat = 'png'
    )
    json.dump(ui.state.json(),statefile(wflowid,'w'))


@app.route('/apply')
def apply_rule():
    wflowid = request.args['wflowid']
    ruleid = request.args['ruleid']
    ui = getui(wflowid)
    ui.apply_rule(ruleid)
    save_state(ui,wflowid)
    return redirect(url_for('workflow',wflowid = wflowid))

@app.route('/submit')
def submit_node():
    wflowid = request.args['wflowid']
    workdir = workdirpath(wflowid)
    nodeid = request.args['nodeid']
    ui = getui(wflowid)
    ui.submit_node(nodeid)
    save_state(ui,wflowid)
    return redirect(url_for('workflow',wflowid = wflowid))

# @app.route('/workflow_json')
#

@app.route('/workflow/<wflowid>')
def workflow(wflowid):
    workdir = workdirpath(wflowid)
    ui = getui(wflowid)
    ui.status()
    return render_template('workflow.html', ui = ui, wflowid = wflowid)

# @socketio.on('hello')
# def hello(data):
#     emit('world',data)

if __name__ == '__main__':
    wflowbackend.adagebackend.app.set_current()
    app.run(host = '0.0.0.0')
    # socketio.run(app)

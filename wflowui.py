import adage
import adage.nodestate as nodestate
import adage.dagstate as dagstate

class wflowui(object):
    def __init__(self,stateobject,backend):
        self.state = stateobject
        self.backend = backend

    def status(self):
        if adage.nodes_left_or_rule_applicable(self.state):
            return 'RUNNING'

        failed = any(self.state.dag.getNode(x).state == nodestate.FAILED for x in self.state.dag.nodes())
        return 'FAILED' if failed else 'SUCCESS'

    def applicable_rules(self):
        applicable = []
        for rule in reversed([x for x in self.state.rules]):
            if rule.applicable(self.state):
                applicable += [rule.identifier]
        return applicable

    def rule(self,ruleid):
        return [(i,x) for i,x in enumerate(self.state.rules) if x.identifier==ruleid][0]

    def apply_rule(self,ruleid):
        index = self.rule(ruleid)[0]
        rule  = self.state.rules.pop(index)
        rule.apply(self.state)
        self.state.applied_rules.append(rule)

    def submittable_nodes(self):
        nodes = []
        for nodeid in self.state.dag.nodes():
            nodeobj = self.state.dag.getNode(nodeid)
            if nodeobj.submit_time:
                continue;
            if dagstate.upstream_ok(self.state.dag,nodeobj):
                nodes += [nodeid]
        return nodes

    def submit_node(self,nodeid):
        nodeobj = self.state.dag.getNode(nodeid)
        adage.submit_node(nodeobj,self.backend)


import yadage.yadagemodels
import yadage.workflow_loader
import yadage.interactive
import yadage.backends.packtivity_celery
import yadage.backends.celeryapp
import os
import json


backend = yadage.backends.packtivity_celery.PacktivityCeleryBackend(
        yadage.backends.celeryapp.app
    )

def init_workflow(workdir,workflow,toplevel,initdata):

    workflow_def = yadage.workflow_loader.workflow(
        toplevel = toplevel,
        source = workflow
    )

    rootcontext = {
        'readwrite': [os.path.abspath(workdir)],
        'readonly': []
    }

    print 'initializing workflow with root context: {}'.format(rootcontext)

    workflow = yadage.yadagemodels.YadageWorkflow.createFromJSON(workflow_def,rootcontext)
    workflow.view().init(initdata)
    os.makedirs('{}/_yadage/'.format(workdir))
    with open('{}/_yadage/yadage_instance.json'.format(workdir),'w') as f:
        json.dump(workflow.json(),f)
    return workflow

def load_workflow(workdir,backend):
    workflow = yadage.yadagemodels.YadageWorkflow.fromJSON(
        json.load(open('{}/_yadage/yadage_instance.json'.format(workdir))),
        yadage.backends.packtivity_celery.PacktivityCeleryProxy,
        backend
    )
    return workflow

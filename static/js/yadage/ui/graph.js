var WorkflowGraph = function(workflow) {
    this.workflow = workflow;
}

WorkflowGraph.prototype = {
    constructor: WorkflowGraph,
    /**
     * Display the workflow graph in the given element
     *
     * element_id: string
     */
    show : function(element_id) {

        var opts = {
            layout: {
                hierarchical: {
                    sortMethod: 'directed'
                }
            }
        };

        // List of nodes and edges in the graph
        var nodes = [];
        var edges = [];

        // Mapping of rule id's to node id's
        var node_hash = {};

        // Create nodes for existing workflow nodes
        this.workflow.dag.nodes.forEach(function(node) {
            var color;
            if (node.state === 'DEFINED') {
                color= '#ffebcc';
            } else if (node.state === 'RUNNING') {
                color = '#cce9ff';
            } else if (node.state === 'FAILED') {
                color = '#f9c7cf';
            } else if (node.state === 'SUCCESS') {
                color = '#b9e7e2';
            }
            var v = {
                'id' : node.id,
                'size' : 150,
                'label' : node.name,
                'color': color,
                'shape': 'box',
                'font': {'face': 'monospace', 'align': 'center'}
            };
            nodes.push(v);
            // Insert node into the node hash bucket for it's name
            if (node.name in node_hash) {
                node_hash[node.name].push(node);
            } else {
                node_hash[node.name] = [node];
            }
        });
        // Create edges between existing nodes
        this.workflow.dag.edges.forEach(function(edge) {
            edges.push({'from': edge.source, 'to': edge.target, 'arrows': 'to', 'smooth': {'type': 'horizontal'}})
        });

        // Create nodes for applicable rules
        var rules = this.workflow.rules;
        this.workflow.applicable_rules.forEach(function(rule_id) {
            var node_id = 'RULE_' + rule_id;
            rule = rules[rule_id]
            var v = {
                'id' : node_id,
                'size' : 150,
                'label' : rule.name,
                'color': '#ffffff',
                'shape': 'box',
                'font': {'face': 'monospace', 'align': 'center'}
            };
            nodes.push(v);
            // Create an edge from each node whose name matches one of the
            // dependencies of the applicable node. Note that dependencies may
            // be undefined
            if (rule.dependencies) {
                rule.dependencies.expressions.forEach(function(key) {
                    if (node_hash[key] != null) {
                        node_hash[key].forEach(function(source) {
                            edges.push({'from': source.id, 'to': node_id, 'arrows': 'to', 'smooth': {'type': 'horizontal'}})
                        });
                    }
                });
            }
        });

        var container = document.getElementById(element_id);
        var data = {'nodes': nodes, 'edges': edges};
        var gph = new vis.Network(container, data, opts);
    }
};


/**
 * ADAGE Edge - An edge in the ADAGE DAG. Nodes are referenced by their id.
 */
var ADAGEEdge = function(source, target) {
    /**
     * Source node identifier.
     *
     * @type: string
     */
    this.source = source;
    /**
     * Target node identifier.
     *
     * @type: string
     */
    this.target = target;
}


/**
 * ADAGE Node - A node in the workflow graph. Nodes have aN unique identifier,
 * a name (derived from the rule that created the node) and a state.
 */
var ADAGENode = function(node) {
    /**
     * Unique node identifier.
     *
     * @type: string
     */
    this.id = node.id;
    /**
     * Node state. The list of possible node states is: 'DEFINED', 'RUNNING',
     * 'FAILED', and 'SUCCESS'
     *
     * @type: string
     */
    this.state = node.state;
    /**
     * Node name. Correspondes to the name of the rule that created the node.
     *
     * @type: string
     */
    this.name = node.name;
;
};


/**
 * ADAGE DAG - Methods and properties for workflow DAG object returned by the
 * ADAGE Server API.
 */

var ADAGEDAG = function(dag_obj) {
    /**
     * List of edges in the graph.
     *
     * @type: [ADAGEdge]
     */
    this.edges = [];
    for (var i_edge = 0; i_edge < dag_obj.edges.length; i_edge++) {
        var edge = dag_obj.edges[i_edge];
        this.edges.push(new ADAGEEdge(edge[0], edge[1]));
    }
    /**
     * List of nodes in the graph.
     *
     * @type: [ADAGENode]
     */
     this.nodes = [];
     for (var i_node = 0; i_node < dag_obj.nodes.length; i_node++) {
         var node = dag_obj.nodes[i_node];
         this.nodes.push(new ADAGENode(node));
     }
     /**
      * Return node with given identifier
      *
      * @type ADAGENode
      */
     this.getNode = function(node_id) {
        for (var i_node = 0; i_node < this.nodes.length; i_node++) {
            var node = this.nodes[i_node];
            if (node.id === node_id) {
                return node;
            }
        }
     };
};

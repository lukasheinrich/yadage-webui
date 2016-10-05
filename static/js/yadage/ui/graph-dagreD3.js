var WorkflowGraph = function(workflow) {
    this.workflow = workflow;
}

WorkflowGraph.prototype = {
    constructor: WorkflowGraph,
    show : function() {
        // Create a new directed graph
        var g = new dagreD3.graphlib.Graph()
            .setGraph({})
            .setDefaultEdgeLabel(function() { return {}; });

        // Create nodes for existing workflow nodes
        this.workflow.dag.nodes.forEach(function(node) {
             g.setNode(node.rule.id, { label: node.name });
             v = g.node(node.rule.id);
             v.rx = v.ry = 5;
             if (node.state === 'DEFINED') {
                 v.style = "fill: #ffebcc";
             } else if (node.state === 'RUNNING') {
                 v.style = "fill: #cce9ff";
             } else if (node.state === 'FAILED') {
                 v.style = "fill: #f9c7cf";
             } else if (node.state === 'SUCCESS') {
                 v.style = "fill: #b9e7e2";
             }
         });

         // Create nodes for applicable rules
         this.workflow.applicable_rules.forEach(function(rule) {
              g.setNode(rule.id, { label: rule.name });
              v = g.node(rule.id);
              v.rx = v.ry = 5;
          });

         // Create edges
         this.workflow.dag.edges.forEach(function(edge) {
             g.setEdge(edge[0], edge[1]);
         });

         var width = 960,
           height = 400,
           center = [width / 2, height / 2];

        var svg = d3.select("svg"),
            inner = svg.select("g");

        // Set up zoom support
        var zoom = d3.behavior.zoom()
            .translate([0, 0])
            .scale(1)
            .size([900, 400])
            .scaleExtent([0, 8])
            .on("zoom", function() {
                inner.attr('transform', 'translate(' + zoom.translate() + ')scale(' + zoom.scale() + ')');
            });
        svg
        //.call(zoom)
        .call(zoom.event);

        // Create the renderer
        var render = new dagreD3.render();

        // Run the renderer. This is what draws the final graph.
        render(inner, g);

        // Center the graph
        var initialScale = 0.75;
        var _height = svg.attr('height') - g.graph().height;
        var _width = svg.attr('width') - g.graph().width;
        console.log(height / _height);

        var padding = 20,
            bBox = inner.node().getBBox(),
            hRatio = height / (bBox.height + padding),
            wRatio = width / (bBox.width + padding);

        zoom.translate([(width - bBox.width * initialScale) / 2, padding / 2])
        	.scale(hRatio < wRatio ? hRatio : wRatio)
          .event(svg);

        // Center the graph
        /*var initialScale = 1;
        /*zoom
          .translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20])
          .scale(initialScale)
          .event(svg);
        svg.attr('height', g.graph().height * initialScale + 40);*/
    }
};

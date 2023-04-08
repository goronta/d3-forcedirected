// create the SVG container
var svg = d3.select("body").append("svg")
    .attr("width", 600)
    .attr("height", 400);

// create the force simulation with collision detection
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(300, 200))
    .force("collision", d3.forceCollide().radius(50));

// load the data from a JSON file
d3.json("data.json", function(error, graph) {
  if (error) throw error;

// create the links between nodes
var link = svg.append("g")
    .attr("class", "links")
  .selectAll("line")
  .data(graph.links)
  .enter().append("line")
    .attr("stroke", "black")
    .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
    .attr("marker-end", "url(#arrowhead)")
    .raise(); // move lines to top of SVG stack

// define the arrowhead marker
svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 25)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "black")
    .raise(); // move marker to top of SVG stack

// create the nodes
var node = svg.append("g")
    .attr("class", "nodes")
  .selectAll("rect")
  .data(graph.nodes)
  .enter().append("rect")
    .attr("width", 80)
    .attr("height", 30)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("fill", "blue")
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
    .on("mouseover", function() {
        d3.select(this).attr("stroke", "black");
    })
    .on("mouseout", function() {
        d3.select(this).attr("stroke", null);
    });

// add labels to nodes
var label = svg.append("g")
    .attr("class", "labels")
  .selectAll("text")
  .data(graph.nodes)
  .enter().append("text")
    .text(function(d) { return d.id; })
    .attr('x', function(d) { return d.x + 40; })
    .attr('y', function(d) { return d.y + 18; })
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .attr('fill', 'black');

  // start the simulation
  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

// define the tick function
function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .raise(); // move lines to top of SVG stack
  
    node
        .attr("x", function(d) { return d.x - 40; })
        .attr("y", function(d) { return d.y - 15; });
  
    label
        .attr("x", function(d) { return d.x + 40; })
        .attr("y", function(d) { return d.y + 18; });
  
    // collision detection
    var padding = 2;
    var nodes = simulation.nodes();
    var q = d3.quadtree()
        .extent([[-1, -1], [600 + 1, 400 + 1]])
        .addAll(nodes);
  
    nodes.forEach(function(d) {
      var r = d.r + padding;
      var nx1 = d.x - r, ny1 = d.y - r;
      var nx2 = d.x + r, ny2 = d.y + r;
      q.visit(function(quad, x1, y1, x2, y2) {
        if (quad.data && (quad.data !== d)) {
          var x = d.x - quad.data.x;
          var y = d.y - quad.data.y;
          var l = Math.sqrt(x * x + y * y);
          var r = d.r + quad.data.r + padding;
          if (l < r) {
            l = (l - r) / l * 0.5;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.data.x += x;
            quad.data.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    });
  }

  // define the drag functions
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}
});

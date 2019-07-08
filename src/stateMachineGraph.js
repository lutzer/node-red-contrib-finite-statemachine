/* global d3 */
/* exported stateMachineGraph */

/* draws a graphical visualisation of the statemachine with d3 */
var stateMachineGraph = function (definition, canvasWidth, canvasHeight) {

    var canvas = d3.select('#fsm-graph');

    // clear canvas
    canvas.selectAll('svg').remove();

	// create svg canvas
    var svg = canvas.append('svg')
		.attr('height', canvasHeight)
        .attr('width', canvasWidth)
        .call(d3.behavior.zoom().on("zoom", onZoom))
		.append("g")
		
	// get size
	var size = canvas.node().getBoundingClientRect();
	var width = size.width;
	var height = size.height;

	// VECTOR OPERATIONS
	function vectorAdd (v1, v2) {
		return { x: v1.x + v2.x, y: v1.y + v2.y };
	}

	function vectorMultiply (v1, s) {
		return { x: v1.x * s, y: v1.y * s };
	}

	function vectorLength (v1) {
		return Math.sqrt(v1.x * v1.x + v1.y * v1.y);
	}

	function vectorSubtract (v1, v2) {
		return vectorAdd(v1, vectorMultiply(v2, -1));
	}

	function vectorNormalize (v1) {
		var length = vectorLength(v1)
		if (length == 0)
			return v1;
		else
			return vectorMultiply(v1, 1 / length);
	}

	var CIRCLE_RADIUS = 40;

	var lineFunction = d3.svg.line()
		.x(function (d) { return d.x ? d.x : 0; })
		.y(function (d) { return d.y ? d.y : 0; })
		.interpolate('basis');

	var states = Object.keys(definition.transitions);

	//convert definition to nodes and links
	var data = {
		nodes: states.map(function (state) {
			return { name: state, active: false };
		}),
		transitions: states.map(function (state, index) {
			var result = [];
			var transitionNames = Object.keys(definition.transitions[state]);
			transitionNames.forEach(function (val, i) {
				var target = states.findIndex(function (elem) {
					return elem === definition.transitions[state][val];
				});
				if (target > -1) {
					result.push({ source: index, target: target, name: val, offset: i });
				}
			});
			return result;
		}).flat()
	};

	// place nodes in circle
	data.nodes.forEach(function (value, index) {
		value.x = width / 2 + Math.cos(index / data.nodes.length * Math.PI * 2) * width / 4;
		value.y = height / 2 + Math.sin(index / data.nodes.length * Math.PI * 2) * height / 4;
	});

	data.transitions.forEach(function (value) {
		data.nodes[value.source].active = true;
		data.nodes[value.target].active = true;
	});

	var forceLinks = data.transitions;

	// define arrow heads
	var defs = svg.append('defs');
	defs.append('marker')
		.attr({
			'id': 'arrow',
			'viewBox': '0 -5 10 10',
			'refX': 10,
			'refY': 0,
			'markerWidth': 10,
			'markerHeight': 10,
			'orient': 'auto'
		}).append('path')
			.attr('d', 'M0,-5L10,0L0,5')
			.attr('class', 'arrowHead');

	var force = d3.layout.force()
		.size([width, height])
		.nodes(data.nodes)
		.links(forceLinks)
		.linkDistance(CIRCLE_RADIUS * 5)
		.gravity(0.1)
		.charge(-2000);

	// ADD TRANSITION CURVES
	var curves = svg.selectAll('path.transition-curve').data(data.transitions);

	curves.enter()
		.append('path')
		.attr({
			class: 'transition-curve',
			'marker-end': 'url(#arrow)'
		});

	curves.exit().remove();

	// ADD TRANSITION LABELS
	var lineLabels = svg.selectAll('text.transition-labels').data(data.transitions);

	lineLabels.enter()
		.append('text')
		.attr({
			'text-anchor': 'middle',
			class: 'transition-labels'
		})
		.text(function (d) { return d.name; });

	// ADD NODES
	var nodes = svg.selectAll('g.state-element').data(data.nodes);

	var nodeDrag = d3.behavior.drag()
		.on('dragstart', dragstart)
		.on('drag', dragmove)
		.on('dragend', dragend);

	var stateElement = nodes.enter()
		.append('g')
		.attr({
			class: 'state-element',
			transform: function (data) {
				return 'translate(' + data.x + ',' + data.y + ')';
			}
		});

	stateElement.append('circle')
		.attr({
			r: CIRCLE_RADIUS,
			class: function (d) { return d.active ? 'state-circle active' : 'state-circle'; }
		}).call(nodeDrag);

	stateElement.append('text')
		.attr({
			'text-anchor': 'middle',
			y: 5,
			class: function (d) { return d.active ? 'state-circle-text active' : 'state-circle-text'; }
		})
		.text(function (data) {
			return data.name;
		});
	//
	nodes.exit().remove();

	force.on('tick', function () {
		update();
	});

	function update () {
		nodes.attr('transform', function (data) {
			return 'translate(' + data.x + ',' + data.y + ')';
		});

		curves.attr({
			d: function (d) {

				var targetIsSource = source = d.target.index == d.source.index

				var source = !targetIsSource ? d.source : { x : d.source.x + CIRCLE_RADIUS * .7, y: d.source.y };
				var target = !targetIsSource ? d.target : { x : d.target.x - CIRCLE_RADIUS * .7, y: d.target.y };

				// middle point
				var mp = vectorMultiply(vectorAdd(target, source), 0.5)

				// orthagonal
				var orth = vectorNormalize({
					x: (target.y - source.y),
					y: -(target.x - source.x)
				});

				var curveMp = !targetIsSource ? vectorAdd(mp, vectorMultiply(orth, CIRCLE_RADIUS + 10)) : vectorAdd(mp, vectorMultiply(orth, CIRCLE_RADIUS + 50));

				// intersect point with target circle
				var endpoint = vectorSubtract(target, vectorMultiply(vectorNormalize(vectorSubtract(target, curveMp)), CIRCLE_RADIUS));

				var coords = [ source, curveMp, endpoint ];
				return lineFunction(coords);
			}
		});

		lineLabels.attr('transform', function (d) {

			var targetIsSource = source = d.target.index == d.source.index

			var source = !targetIsSource ? d.source : { x : d.source.x + CIRCLE_RADIUS * .7, y: d.source.y };
			var target = !targetIsSource ? d.target : { x : d.target.x - CIRCLE_RADIUS * .7, y: d.target.y };

			var mp = vectorMultiply(vectorAdd(target, source), 0.5)

			var orth = vectorNormalize({
					x: (target.y - source.y),
					y: -(target.x - source.x)
				});

			var curveMp = !targetIsSource ? vectorAdd(mp, vectorMultiply(orth, CIRCLE_RADIUS + 10)) : vectorAdd(mp, vectorMultiply(orth, CIRCLE_RADIUS + 50));

			// rotation
			var sub = vectorSubtract(target, source);

			var angle = Math.atan2(sub.y, sub.x) * 180 / Math.PI;

			// dont have text upside down
			angle = angle > 90 ? angle - 180 : angle;
			angle = angle < -90 ? angle + 180 : angle;

			return 'translate(' + curveMp.x + ',' + curveMp.y + ') rotate(' + angle + ')';
		});
	}
    
    function onZoom () {
        svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
    }

	function dragmove (d) {
		d.x += d3.event.x;
		d.y += d3.event.y;
		update();
		force.resume();
	}

	function dragstart (d, i) {
		force.resume();
	}

	function dragend (d, i) {
		force.resume();
	}
	force.start();
};

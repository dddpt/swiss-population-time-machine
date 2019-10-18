"use strict";

// SPTM - Didier Dupertuis & Nicolas Vallotton - Avril 2019

var tooltipGraph = void 0;

/*****
Initializing graphic - creating all svg elements (dots, axis)
*****/
APP.initGraph = function (data) {
  // Removing introduction text for graph
  $('#tuto').remove();

  // Creating margins for the svg
  var margin = { top: 20, right: 40, bottom: 30, left: 52 };

  // Setting dimensions of the svg and padding between each value of the barplot
  APP.graph.width = $('#graphPart').width() - margin.left - margin.right;
  APP.graph.height = 320 - margin.top - margin.bottom;

  // Creating svg, appending attributes
  APP.graph.svg = d3.select("#graph").append("svg").attr("width", APP.graph.width + margin.left + margin.right).attr("height", APP.graph.height + margin.top + margin.bottom).append("g").attr("transform", 'translate(' + margin.left + ',' + margin.top + ')');

  // Adding div tooltip
  tooltipGraph = d3.select('#graph').append('div').attr('class', 'tooltipGraph').style('left', '0px').style('top', '0px').style('opacity', 0);

  // Adding grid
  // X gridlines
  APP.graph.svg.append("g").attr("class", "xgrid").attr("transform", "translate(0," + APP.graph.height + ")");

  // Y gridlines
  APP.graph.svg.append("g").attr("class", "ygrid");

  // Adding axis
  APP.graph.svg.append('g').attr('class', 'xAxis').attr('transform', 'translate(0,' + APP.graph.height + ')');

  APP.graph.svg.append('g').attr('class', 'yAxis');

  // Adding axis labels
  APP.graph.svg.append("text").attr('class', 'axisLabel').attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
  .attr("transform", "translate(" + 20 + "," + 35 + ")rotate(-90)") // text is drawn off the screen top left, move down and out and rotate
  .style('opacity', 0).text("Population");

  APP.graph.svg.append("text").attr('class', 'axisLabel').attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
  .attr("transform", "translate(" + (APP.graph.width - 20) + "," + (APP.graph.height - 10) + ")") // centre below axis
  .style('opacity', 0).text("Année");

  // Calling method to update graph according to current data
  APP.addCommuneToGraph(data);
};

APP.addCommuneToGraph = function (newCommune) {
  //cl("APP.addCommuneToGraph() new commune: ",newCommune.name)

  if (!APP.graph.data.find(function (c) {
    return c.name == newCommune.name;
  })) {
    newCommune.graphColor = APP.graph.colorScale();
    APP.graph.counter = APP.graph.counter + 1;

    // insert newCommune at beginning of array 
    APP.graph.data.unshift(newCommune);

    APP.updateGraph();
  }
};

APP.removeCommuneFromGraph = function (communeToRemove) {
  cl("APP.removeCommuneFromGraph() commune to remove: ", communeToRemove.name);

  var ctrIndex = APP.graph.data.findIndex(function (c) {
    return c.name == communeToRemove.name;
  });

  cl("ctrIndex:", ctrIndex);

  if (ctrIndex != -1) {
    APP.graph.data.splice(ctrIndex, 1);

    APP.updateGraph();
  }
};

/*****
Updating graph - put all dots in place according to new data, rescale axis and and translate line
*****/
APP.updateGraph = function () {

  // Setting up X scale and axis
  var xScale = d3.scaleLinear().range([0, APP.graph.width]).domain([1200, 2000]);
  var xAxis = d3.axisBottom().scale(xScale);

  // only keep the first APP.graph.maxSize elements 
  APP.graph.data = APP.graph.data.filter(function (c, i) {
    return i < APP.graph.maxSize;
  });

  // Setting up Y scale and axis
  var yMax = d3.max(APP.graph.data.filter(function (c, i) {
    return i < APP.graph.maxSize;
  }).map(function (commune) {
    return commune.hab_year.map(function (hy) {
      return hy.pop;
    });
  }).flat());
  var yScale = d3.scaleLinear().range([APP.graph.height, 0]).domain([0, 1.1 * yMax]);
  var yAxis = d3.axisLeft().scale(yScale);

  // Rescale axis
  APP.graph.svg.select('.xAxis').transition().duration(APP.graph.transitionsDuration).call(xAxis).attr('x', APP.graph.width).attr('y', -3);

  APP.graph.svg.select('.yAxis').transition().duration(APP.graph.transitionsDuration).call(yAxis).attr('y', 6).attr('dy', '.71em');

  APP.graph.svg.selectAll('.axisLabel').style('opacity', 1);

  // Rescale grid
  APP.graph.svg.select('.xgrid').transition().duration(APP.graph.transitionsDuration).call(xAxis.tickSize(-APP.graph.height).tickFormat("")).attr('x', APP.graph.width);

  APP.graph.svg.select('.ygrid').transition().duration(APP.graph.transitionsDuration).call(yAxis.tickSize(-APP.graph.width).tickFormat(""));

  // create the legend
  var legendDiv = d3.select("#graphLegend2").selectAll(".graph-commune-legend").data(APP.graph.data.filter(function (c, i) {
    return i < APP.graph.maxSize;
  }), function (c) {
    return c ? "legend-" + c.name : this.id;
  } // /!\ function(){} needed here! arrow func not allowed
  );

  var legendDivEnter = legendDiv.enter().append("div").attr("id", APP.graph.legendId).attr("class", "graph-commune-legend");
  legendDivEnter.append("span").html("x ").attr("class", "remove-commune-from-graph").on("click", APP.removeCommuneFromGraph);
  legendDivEnter.append("span").html(function (c) {
    return c.name;
  }).style('color', function (c) {
    return c.graphColor;
  });
  legendDivEnter.append("span").html(" (");
  legendDivEnter.append("a").attr("href", function (c) {
    return "https://beta.hls-dhs-dss.ch" + c.url.replace("de", "fr");
  }).attr("target", "_blank").html("dhs");
  legendDivEnter.append("span").html(")");

  legendDiv.exit().remove();

  // returns a function to draw a line (the newLine simply has y=0 all along)
  var interpolatedLine = d3.line().curve(d3.curveLinear).x(function (hy) {
    return xScale(hy.year);
  }).y(function (hy) {
    return yScale(hy.pop);
  });
  var newLine = d3.line().curve(d3.curveLinear).x(function (hy) {
    return xScale(hy.year);
  }).y(yScale(0));

  // LINES
  var hyLines = APP.graph.svg.selectAll(".line").data(APP.graph.data.filter(function (c, i) {
    return i < APP.graph.maxSize;
  }), function (c) {
    return c ? APP.graph.lineClass(c) : this.id;
  } // /!\ function(){} needed here! arrow func not allowed
  );
  var hyLinesEnter = hyLines.enter().append("path").attr("id", APP.graph.lineClass).attr("class", "line").attr("d", function (c) {
    return newLine(c.hab_year);
  }).style('stroke', function (c) {
    return c.graphColor;
  })
  //.attr("clip-path", "url(#clipTemp)")
  .attr("fill", "none");
  //.attr("d", c => interpolatedLine(c.hab_year))

  hyLines.exit().remove();

  hyLines = hyLines.merge(hyLinesEnter).transition().duration(APP.graph.transitionsDuration).attr("d", function (c) {
    return interpolatedLine(c.hab_year);
  });

  // POINTS
  var hyPoints = APP.graph.svg.selectAll(".points-g").data(APP.graph.data.filter(function (c, i) {
    return i < APP.graph.maxSize;
  }), function (c) {
    return c ? APP.graph.pointsClass(c) : this.id;
  } // /!\ function(){} needed here! arrow func not allowed
  );

  var hyPointsEnter = hyPoints.enter().append('g').attr('id', APP.graph.pointsClass).attr('class', "points-g").each(function (commune) {
    var points = d3.select(this).selectAll(".point").data(commune.hab_year);
    points.enter().append('circle').attr('class', "point").attr('cx', function (hy) {
      return xScale(hy.year);
    }).attr('cy', yScale(0)).attr('r', 3).style('fill', commune.graphColor);
  });

  hyPoints.exit().remove();

  hyPoints = hyPoints.merge(hyPointsEnter).each(function (commune) {
    d3.select(this).selectAll(".point").transition().duration(APP.graph.transitionsDuration).attr('cx', function (hy) {
      return xScale(hy.year);
    }).attr('cy', function (hy) {
      return yScale(hy.pop);
    });
  });

  // Interaction events on graphic
  APP.graph.svg.selectAll('.point')
  // Adding information on specific point to the tooltip on mouseover
  .on('mouseover', function (d) {
    var dot = d3.select(this);
    var cx = dot.attr('cx'); // To get appropriate coordinates for tooltip
    var cy = dot.attr('cy'); // To get appropriate coordinates for tooltip
    tooltipGraph.html('ann\xE9e: ' + d.year + '<br/>pop: ' + d.pop).style('left', cx - 10 + 'px').style('top', cy - 25 + 'px');
    tooltipGraph.transition().duration(100).style('opacity', 0.8);
  })
  // Remove tooltip on mouseout
  .on('mouseout', function (d) {
    tooltipGraph.transition().duration(200).style('opacity', 0);
  });

  /*/ Replace part of the labels for french format
  $('text').each(function(){
      let legendText = $(this).text().replace(',',"'");
      $(this).text(legendText);
  });*/
};
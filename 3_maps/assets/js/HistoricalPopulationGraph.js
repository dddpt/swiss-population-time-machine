"use strict";

// SPTM - Didier Dupertuis & Nicolas Vallotton - Avril 2019

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HistoricalPopulationGraph = function () {

  /** HistoricalPopulationGraph constructor
   * 
   * @param {String} divId the id of the div in which the graph should be put
   * @param {Array[Commune]} communes array of Commune Objects
   * @param {number} minYear the minimum year that can be displayed
   * @param {number} maxYear the maximum year that can be displayed
   */
  function HistoricalPopulationGraph(divId, legendDivId, minYear, maxYear, colors) {
    var maxSize = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 3;
    var transitionsDuration = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 1000;
    var dimensions = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : [440, 320];
    var margins = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : { top: 20, right: 40, bottom: 30, left: 52 };

    _classCallCheck(this, HistoricalPopulationGraph);

    var self = this;
    this.divId = divId;
    this.legendDivId = legendDivId;
    this.minYear = minYear;
    this.maxYear = maxYear;
    this.tooltip = undefined;
    this.width = dimensions[0] - margins.left - margins.right;
    this.height = dimensions[1] - margins.top - margins.bottom;
    this.margins = margins;

    this.displayedCommunes = [];
    // Boolean to check if graph has already been initialized
    this.initialized = false;
    // Max nb of communes to display on graph
    this.maxSize = 3;
    this.counter = 0;
    var ms2 = 1 / (maxSize + 2);
    this.colors = colors ? colors : d3.range(ms2, 1, ms2).map(d3.interpolateRainbow);
    this.colorScale = function () {
      var usedColors = self.displayedCommunes.map(function (c) {
        return c.graphColor;
      });
      var freeColors = self.colors.filter(function (color) {
        return !usedColors.includes(color);
      });
      if (freeColors.length > 0) {
        return freeColors[0];
      }
      return "black";
    };
    this.transitionsDuration = transitionsDuration;
  }

  _createClass(HistoricalPopulationGraph, [{
    key: "init",
    value: function init() {
      var self = this;
      // Removing introduction text for graph
      $('#tuto').remove();

      // Creating svg, appending attributes
      this.svg = d3.select("#" + this.divId).append("svg").attr("width", self.width + self.margins.left + self.margins.right).attr("height", self.height + self.margins.top + self.margins.bottom).append("g").attr("transform", "translate(" + self.margins.left + "," + self.margins.top + ")");

      // Adding div tooltip
      this.tooltip = d3.select("#" + this.divId).append('div').attr('class', 'tooltipGraph').style('left', '0px').style('top', '0px').style('opacity', 0);

      // Adding grid
      // X gridlines
      this.svg.append("g").attr("class", "xgrid").attr("transform", "translate(0," + self.height + ")");

      // Y gridlines
      this.svg.append("g").attr("class", "ygrid");

      // Adding axis
      this.svg.append('g').attr('class', 'xAxis').attr('transform', "translate(0," + self.height + ")");

      this.svg.append('g').attr('class', 'yAxis');

      // Adding axis labels
      this.svg.append("text").attr('class', 'axisLabel').attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate(" + 20 + "," + 35 + ")rotate(-90)") // text is drawn off the screen top left, move down and out and rotate
      .style('opacity', 0).text("Population");

      this.svg.append("text").attr('class', 'axisLabel').attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate(" + (self.width - 20) + "," + (self.height - 10) + ")") // centre below axis
      .style('opacity', 0).text("Année");
    }
  }, {
    key: "addCommune",
    value: function addCommune(newCommune) {
      cl("this.displayedCommunes: ", this.displayedCommunes);
      if (!this.displayedCommunes.find(function (c) {
        return c.name == newCommune.name;
      })) {
        newCommune.graphColor = this.colorScale();
        this.counter = this.counter + 1;

        // insert newCommune at beginning of array 
        this.displayedCommunes.unshift(newCommune);

        this.update();
      }
    }
  }, {
    key: "removeCommune",
    value: function removeCommune(communeToRemove) {
      var ctrIndex = this.displayedCommunes.findIndex(function (c) {
        return c.name == communeToRemove.name;
      });
      if (ctrIndex != -1) {
        this.displayedCommunes.splice(ctrIndex, 1);
        this.update();
      }
    }
  }, {
    key: "update",
    value: function update() {
      var _this = this;

      var self = this;
      if (!this.initialized) {
        this.init();
        this.initialized = true;
      }

      // Setting up X scale and axis
      var xScale = d3.scaleLinear().range([0, self.width]).domain([1200, 2000]);
      var xAxis = d3.axisBottom().scale(xScale);

      // only keep the first this.maxSize elements 
      this.displayedCommunes = this.displayedCommunes.filter(function (c, i) {
        return i < _this.maxSize;
      });

      // Setting up Y scale and axis
      var yMax = d3.max(self.displayedCommunes.filter(function (c, i) {
        return i < self.maxSize;
      }).map(function (commune) {
        return commune.hab_year.map(function (hy) {
          return hy.pop;
        });
      }).flat());
      var yScale = d3.scaleLinear().range([self.height, 0]).domain([0, 1.1 * yMax]);
      var yAxis = d3.axisLeft().scale(yScale);

      // Rescale axis
      this.svg.select('.xAxis').transition().duration(self.transitionsDuration).call(xAxis).attr('x', self.width).attr('y', -3);

      this.svg.select('.yAxis').transition().duration(self.transitionsDuration).call(yAxis).attr('y', 6).attr('dy', '.71em');

      this.svg.selectAll('.axisLabel').style('opacity', 1);

      // Rescale grid
      this.svg.select('.xgrid').transition().duration(self.transitionsDuration).call(xAxis.tickSize(-self.height).tickFormat("")).attr('x', self.width);

      this.svg.select('.ygrid').transition().duration(self.transitionsDuration).call(yAxis.tickSize(-self.width).tickFormat(""));

      // create the legend
      var legendDiv = d3.select("#" + self.legendDivId).selectAll(".graph-commune-legend").data(self.displayedCommunes.filter(function (c, i) {
        return i < self.maxSize;
      }), function (c) {
        return c ? "legend-" + c.name : this.id;
      } // /!\ function(){} needed here! arrow func not allowed
      );

      var legendDivEnter = legendDiv.enter().append("div").attr("id", self.legendId).attr("class", "graph-commune-legend");
      legendDivEnter.append("span").html("x ").attr("class", "remove-commune-from-graph").on("click", function (c) {
        return self.removeCommune(c);
      });
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
      var hyLines = this.svg.selectAll(".line").data(self.displayedCommunes.filter(function (c, i) {
        return i < self.maxSize;
      }), function (c) {
        return c ? self.lineClass(c) : this.id;
      } // /!\ function(){} needed here! arrow func not allowed
      );
      var hyLinesEnter = hyLines.enter().append("path").attr("id", self.lineClass).attr("class", "line").attr("d", function (c) {
        return newLine(c.hab_year);
      }).style('stroke', function (c) {
        return c.graphColor;
      })
      //.attr("clip-path", "url(#clipTemp)")
      .attr("fill", "none");
      //.attr("d", c => interpolatedLine(c.hab_year))

      hyLines.exit().remove();

      hyLines = hyLines.merge(hyLinesEnter).transition().duration(self.transitionsDuration).attr("d", function (c) {
        return interpolatedLine(c.hab_year);
      });

      // POINTS
      var hyPoints = this.svg.selectAll(".points-g").data(self.displayedCommunes.filter(function (c, i) {
        return i < self.maxSize;
      }), function (c) {
        return c ? self.pointsClass(c) : this.id;
      } // /!\ function(){} needed here! arrow func not allowed
      );

      var hyPointsEnter = hyPoints.enter().append('g').attr('id', self.pointsClass).attr('class', "points-g").each(function (commune) {
        var points = d3.select(this).selectAll(".point").data(commune.hab_year);
        points.enter().append('circle').attr('class', "point").attr('cx', function (hy) {
          return xScale(hy.year);
        }).attr('cy', yScale(0)).attr('r', 3).style('fill', commune.graphColor);
      });

      hyPoints.exit().remove();

      hyPoints = hyPoints.merge(hyPointsEnter).each(function (commune) {
        d3.select(this).selectAll(".point").transition().duration(self.transitionsDuration).attr('cx', function (hy) {
          return xScale(hy.year);
        }).attr('cy', function (hy) {
          return yScale(hy.pop);
        });
      });

      // Interaction events on graphic
      this.svg.selectAll('.point')
      // Adding information on specific point to the tooltip on mouseover
      .on('mouseover', function (d) {
        var dot = d3.select(this);
        var cx = dot.attr('cx'); // To get appropriate coordinates for tooltip
        var cy = dot.attr('cy'); // To get appropriate coordinates for tooltip
        self.tooltip.html("ann\xE9e: " + d.year + "<br/>pop: " + d.pop).style('left', cx - 10 + "px").style('top', cy - 25 + "px");
        self.tooltip.transition().duration(100).style('opacity', 0.8);
      })
      // Remove tooltip on mouseout
      .on('mouseout', function (d) {
        self.tooltip.transition().duration(200).style('opacity', 0);
      });

      /*/ Replace part of the labels for french format
      $('text').each(function(){
          let legendText = $(this).text().replace(',',"'");
          $(this).text(legendText);
      });*/
    }

    // returns a class for points, lines and legend of given commune

  }, {
    key: "pointsClass",
    value: function pointsClass(commune) {
      return 'point-' + commune.name.replace(/\W/g, "-");
    }
  }, {
    key: "lineClass",
    value: function lineClass(commune) {
      return 'line-' + commune.name.replace(/\W/g, "-");
    }
  }, {
    key: "legendId",
    value: function legendId(commune) {
      return 'legend-' + commune.name.replace(/\W/g, "-");
    }
  }]);

  return HistoricalPopulationGraph;
}();
"use strict";

// SPTM - Didier Dupertuis & Nicolas Vallotton - Avril 2019


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HistoricPopulationMap = function () {

  /** HistoricPopulationMap constructor
   * 
   * @param {String} divId the id of the div in which the map should be put
   * @param {Array[Commune]} communes array of Commune Objects
   * @param {String} tilesURL a URL from which to fetch the background map data
   * @param {number} currentYear the year at which the map should be displayed, defaults to minYear
   * @param {number} minYear the minimum year that can be displayed
   * @param {number} maxYear the maximum year that can be displayed
   * @param {Object} LeafletMapArguments the arguments for the Leaflet Map object, default value given by HistoricPopulationMap.defaultLeafletMapArguments()
   */
  function HistoricPopulationMap(divId, communes, tilesURL, currentYear, minYear, maxYear, LeafletMapArguments) {
    _classCallCheck(this, HistoricPopulationMap);

    this.divId = divId;
    this.communes = communes;
    this.tilesURL = tilesURL;
    this.currentYear = currentYear;
    this.minYear = minYear;
    this.maxYear = maxYear;
    this.LeafletMapArguments = LeafletMapArguments ? LeafletMapArguments : HistoricPopulationMap.defaultLeafletMapArguments();
    this.tooltip = undefined;
    this.showCommunesWithData = true;
    this.showCommunesWithoutData = true;
  }

  /** Initializes the map background and tooltip object */


  _createClass(HistoricPopulationMap, [{
    key: 'init',
    value: function init() {
      // useful for functions not owned by this
      var self = this;

      // Initialize the map - definig parameters and adding cartodb basemap
      var map = new L.map(this.divId, this.LeafletMapArguments);
      var cartodb = L.tileLayer(this.tilesURL, {});

      // Getting tooltip ready for showing data
      this.tooltip = d3.select('#' + this.divId).append('div').attr('class', 'tooltip');

      // Add the cartodb layer to the map
      cartodb.addTo(map);

      // Creating the communes' data circles layer with
      // leaflet d3 svg overlay according to correct projection
      var communesOverlay = L.d3SvgOverlay(function (sel, proj) {
        // careful: here, "this" refers to internal L.d3SvgOverlay component, 
        // not HPM instance
        var communesUpd = sel.selectAll('circle').data(self.communes);
        communesUpd.enter().append("circle").attr('cx', function (d) {
          return proj.latLngToLayerPoint(d.latLng).x;
        }) // projecting points
        .attr('cy', function (d) {
          return proj.latLngToLayerPoint(d.latLng).y;
        }) // projecting points
        .attr('r', 0).style('position', 'relative').attr('opacity', .6).attr('class', "communesPop dot");
      });
      // Adding layer to the map
      communesOverlay.addTo(map);

      this.dataCircles()
      // on mouseenter: slightly increase circle size + show tooltip
      .on('mouseenter', function (d) {
        d3.select(this).transition().duration(100).attr('r', function (d) {
          return 1.3 * d.circleSize;
        });
        self.tooltip.html(function () {
          return d.name + ', pop: ' + Math.round(d.pop_calculator(self.currentYear));
        }).transition().duration(50).style('opacity', 0.8).style('left', d3.event.pageX + 'px').style('top', d3.event.pageY + 'px');
      })
      // on mouseout: reset normal circle size + hide tooltip
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('r', function (d) {
          return d.circleSize;
        });
        self.tooltip.transition().duration(200).style('opacity', 0);
      });
    }

    /** Updates visible states of all the dots: size, color (interpolated/real data) and display status */

  }, {
    key: 'update',
    value: function update() {
      var _this = this;

      var transitionMsec = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : APP.mapTransitionDuration;

      // display pop as it is at APP.currentYear
      this.dataCircles().classed('extrapolated', function (d) {
        return !APP.hasCommuneData(d, _this.currentYear);
      }).classed('intrapolated', function (d) {
        return APP.hasCommuneData(d, _this.currentYear);
      }).transition().duration(transitionMsec).attr("r", function (d) {
        d.circleSize = Math.sqrt(+d.pop_calculator(_this.currentYear)) / 14;
        return d.circleSize;
      });

      d3.selectAll('.dot.intrapolated').classed("hidden", !this.showCommunesWithData);
      d3.selectAll('.dot.extrapolated').classed("hidden", !this.showCommunesWithoutData);
    }
  }, {
    key: 'updateYear',


    /** Update the year of data shown */
    value: function updateYear(year) {
      var transitionMsec = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : APP.mapTransitionDuration;

      this.currentYear = year;
      this.update(transitionMsec);
    }

    /** Returns a d3 selection of all the commuens' data circles */

  }, {
    key: 'dataCircles',
    value: function dataCircles() {
      return d3.selectAll("#" + this.divId + ' .dot');
    }

    /** Toggles whether do show or hide communes with data at given year */

  }, {
    key: 'toggleShowCommunesWithData',
    value: function toggleShowCommunesWithData() {
      var _this2 = this;

      this.showCommunesWithData = !this.showCommunesWithData;
      d3.select("#legend-original-pop-data button").attr("data-i18n", function () {
        return (_this2.showCommunesWithData ? "hide" : "show") + "-communes-button";
      });
      this.update();
    }

    /** Toggles whether do show or hide communes without data at given year */

  }, {
    key: 'toggleShowCommunesWithoutData',
    value: function toggleShowCommunesWithoutData() {
      var _this3 = this;

      this.showCommunesWithoutData = !this.showCommunesWithoutData;
      d3.select("#legend-extrapolated-pop-data button").attr("data-i18n", function () {
        return (_this3.showCommunesWithoutData ? "hide" : "show") + "-communes-button";
      });
      this.update();
    }

    /** Default arguments for Leaflet Map background */

  }], [{
    key: 'defaultLeafletMapArguments',
    value: function defaultLeafletMapArguments() {
      return {
        center: [46.8, 8.2],
        zoom: 8,
        minZoom: 8,
        maxZoom: 20,
        maxBounds: [[44.5, 4.5], [49, 12]]
      };
    }
  }]);

  return HistoricPopulationMap;
}();
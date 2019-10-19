"use strict";

// SPTM - Didier Dupertuis & Nicolas Vallotton - Avril 2019


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HistoricPopulationMap = function () {

  /** HistoricPopulationMap constructor
   * 
   * @param {String} divId the id of the div in which the map should be put
   * @param {Array[Commune]} communes array of Commune Objects
   * @param {String} tilesURL a URL from which to fetch the background map data
   * @param {number} currentYear the year at which the map should be displayed, defaults to minYear
   * @param {number} minYear the minimum year that can be displayed, defaults to the minimum available in all the communes
   * @param {number} maxYear the maximum year that can be displayed, defaults to the maximum available in all the communes
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
    this.tooltipMap = undefined;
    this.showCommunesWithData = true;
    this.showCommunesWithoutData = true;
  }

  /** Initializes the map background and tooltip object */


  _createClass(HistoricPopulationMap, [{
    key: 'init',
    value: function init() {
      // Initiaize the map - definig parameters and adding cartodb basemap
      map = new L.map(this.divId, this.LeafletMapArguments);
      var cartodb = L.tileLayer(this.tilesURL, {});

      // Getting tooltip ready for showing data
      this.tooltipMap = d3.select('#' + this.divId).append('div').attr('class', 'tooltip');

      // Add the cartodb layer to the map
      cartodb.addTo(map);
    }

    /** Updates visible states of all the dots: size, color (interpolated/real data) and display status
     * 
     */

  }, {
    key: 'update',
    value: function update() {
      var _this = this;

      var transitionMsec = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : APP.mapTransitionDuration;

      // display pop as it is at APP.currentYear
      d3.selectAll("#" + this.divId + ' .dot').classed('extrapolated', function (d) {
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

      APP.showCommunesWithoutData = !APP.showCommunesWithoutData;
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

// Tooltip of the map


var map = void 0;
var tooltipMap = void 0;

/*****
Initializing map - leaflet with cartodb basemap and tooltip ready
*****/
APP.initMap = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
  var cartodb;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // Initiaize the map - definig parameters and adding cartodb basemap
          map = new L.map("map", { center: [46.8, 8.2], zoom: 8, minZoom: 8, maxZoom: 20, maxBounds: [[44.5, 4.5], [49, 12]] });
          cartodb = L.tileLayer('https://api.mapbox.com/styles/v1/nvallott/cjcw1ex6i0zs92smn584yavkn/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibnZhbGxvdHQiLCJhIjoiY2pjdzFkM2diMWFrMzJxcW80eTdnNDhnNCJ9.O853joFyvgOZv7y9IJAnlA', {
            // let cartodb = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>'
          });

          // Getting tooltip ready for showing data

          tooltipMap = d3.select('#map').append('div').attr('class', 'tooltip');

          // Add the cartodb layer to the map
          cartodb.addTo(map);

          // Calling metho to create heatmap overlay
          // APP.makeHeatMap();
          // Calling method to create - has to wait for the map to be created
          _context.next = 6;
          return APP.makeCommunes();

        case 6:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
}));

APP.updateMap = function () {
  var transitionMsec = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : APP.mapTransitionDuration;

  // display pop as it is at APP.currentYear
  d3.selectAll('.dot').classed('extrapolated', function (d) {
    return !APP.hasCommuneData(d, APP.currentYear);
  }).classed('intrapolated', function (d) {
    return APP.hasCommuneData(d, APP.currentYear);
  }).transition().duration(transitionMsec).attr("r", function (d) {
    //let hy1850 = d.hab_year.filter(hy=>hy.year==1850)
    //let radius = hy1850.length>0? hy1850[0].pop: 300
    d.circleSize = Math.sqrt(+d.pop_calculator(APP.currentYear)) / 14;
    return d.circleSize;
  });

  d3.selectAll('.dot.intrapolated').classed("hidden", !APP.showCommunesWithData);
  d3.selectAll('.dot.extrapolated').classed("hidden", !APP.showCommunesWithoutData);
};

APP.toggleShowCommunesWithData = function () {
  APP.showCommunesWithData = !APP.showCommunesWithData;
  d3.select("#legend-original-pop-data button").attr("data-i18n", function () {
    return (APP.showCommunesWithData ? "hide" : "show") + "-communes-button";
  });
  APP.updateMap();
};

APP.toggleShowCommunesWithoutData = function () {
  APP.showCommunesWithoutData = !APP.showCommunesWithoutData;
  d3.select("#legend-extrapolated-pop-data button").attr("data-i18n", function () {
    return (APP.showCommunesWithoutData ? "hide" : "show") + "-communes-button";
  });
  APP.updateMap();
};
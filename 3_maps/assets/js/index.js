"use strict";

// SPTM - Didier Dupertuis & Nicolas Vallotton - Avril 2019

// Creating APP object for storing all Methods

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var APP = {
  minYear: 1200,
  currentYear: 1536,
  maxYear: 1990,
  // list of communes
  communes: [],
  communesFile: "3_maps/communes_geo.csv",
  ygrs: [],
  ygrFile: "3_maps/avg_yearly_growth_rates.csv",
  showCommunesWithData: true,
  showCommunesWithoutData: true,
  mapTransitionDuration: 0,
  mapTransitionDurationDefault: 1000,
  graph: {
    // Array of 0 to initialize correct number of dots for scatterplot
    data: [],
    // Boolean to check if graph has already been initialized
    initialized: false,
    // Max nb of communes to display on graph:
    maxSize: 3,
    // returns a class for points and lines of given commune
    pointsClass: function pointsClass(commune) {
      return 'point-' + commune.name.replace(/\W/g, "-");
    },
    lineClass: function lineClass(commune) {
      return 'line-' + commune.name.replace(/\W/g, "-");
    },
    legendId: function legendId(commune) {
      return 'legend-' + commune.name.replace(/\W/g, "-");
    },
    counter: 0,
    // given a number returns
    colors: [0.2, 0.4, 0.6, 0.8].map(d3.interpolateRainbow),
    colorScale: function colorScale() {
      var usedColors = APP.graph.data.map(function (c) {
        return c.graphColor;
      });
      var freeColors = APP.graph.colors.filter(function (color) {
        return !usedColors.includes(color);
      });
      if (freeColors.length > 0) {
        return freeColors[0];
      }
      return "black";
    },
    transitionsDuration: 1000
  },
  i18nDir: "3_maps/assets/translations/",
  animationTotalTime: 7900,
  animationIntervalTime: 100,
  animationTimeoutId: undefined,
  animationIntervalId: undefined,
  animationStartTime: +new Date(),
  animationShowPlayButton: true
};

/*****
Declaring global variables
*****/

var cl = console.log;
var ct = console.table;

// Storing size of the browser viewport
var windowHeight = $(window).height(); // returns height of browser viewport
var windowWidth = $(window).width(); // returns width of browser viewport


// Correspondance table for slider values, buffer label in meters, buffer sizes in pixel and pop values for each
// let bufferVal = []; // initialized empty
// for(i = 1; i <= 10; i++){
// bufferVal.push({"sliderVal": i, "buffer": `${i*100}m`, "bufferPx": i*15, "pop":`pop${i*100}m`});
// }

/*****
Initializing the whole script of the page
*****/
APP.main = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          APP.togglePlayPauseButtons(true);

          // load communes data
          _context.next = 3;
          return d3.dsv(";", APP.communesFile, function (commune) {
            commune.hab_year = JSON.parse(commune.hab_year.replace(/'/g, '"'));
            commune.hab_year = commune.hab_year.sort(function (a, b) {
              return a.year - b.year;
            });
            commune.pop_calculator = pop_calculator(commune);
            commune.canton = commune.canton_x;
            commune.canton_x = null;
            commune.canton_y = null;
            commune.latLng = [+commune.Y, +commune.X];
            return commune;
          });

        case 3:
          APP.communes = _context.sent;


          console.log("APP.communes 0:", APP.communes);

          APP.hpm = new HistoricPopulationMap("map", APP.communes, 'https://api.mapbox.com/styles/v1/nvallott/cjcw1ex6i0zs92smn584yavkn/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibnZhbGxvdHQiLCJhIjoiY2pjdzFkM2diMWFrMzJxcW80eTdnNDhnNCJ9.O853joFyvgOZv7y9IJAnlA', 1536, 1200, 1990);
          APP.hpm.init();

          // communes circle onclick: display on graph
          APP.hpm.dataCircles().on('click', function (d) {
            if (APP.graph.initialized) {
              APP.addCommuneToGraph(d);
            } else {
              APP.graph.initialized = true;
              APP.initGraph(d);
            }
          });

          APP.sliderevent();
          _context.next = 11;
          return APP.loadYearlyGrowthRates();

        case 11:

          document.getElementById("slider1").value = APP.currentYear;

          APP.updateYear();

        case 13:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, this);
}));

/*****
Loading yearly growth rates data
*****/
APP.loadYearlyGrowthRates = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
  return regeneratorRuntime.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return d3.dsv(";", APP.ygrFile, function (ygr) {
            ygr.year = parseInt(ygr.year);
            ygr.data_pop = parseInt(ygr.data_pop);
            ygr.duration = parseInt(ygr.duration);
            ygr.ygr = parseFloat(ygr.ygr);
            ygr.gr = parseFloat(ygr.gr);
            return ygr;
          });

        case 2:
          APP.ygrs = _context2.sent;

        case 3:
        case "end":
          return _context2.stop();
      }
    }
  }, _callee2, this);
}));

// calculates total growth rate between two given year, assumes y1<y2
APP.calculateGrowthRate = function (y1, y2) {
  var ygrs12 = APP.ygrs.filter(function (ygr, i) {
    return (ygr.year >= y1 || APP.ygrs[i + 1] && APP.ygrs[i + 1].year > y1) && ygr.year < y2;
  });
  if (ygrs12.length > 0) {
    var ygrLast = ygrs12[ygrs12.length - 1];
    var y2Duration = y2 - ygrLast.year;
    ygrs12[ygrs12.length - 1] = {
      year: ygrLast.year,
      ygr: ygrLast.ygr,
      gr: Math.pow(ygrLast.ygr, y2Duration),
      duration: y2Duration
    };

    var ygrFirst = ygrs12[0];
    var y1Duration = ygrFirst.duration - (y1 - ygrFirst.year);
    ygrs12[0] = {
      year: y1,
      ygr: ygrFirst.ygr,
      gr: Math.pow(ygrFirst.ygr, y1Duration),
      duration: y1Duration
    };

    return ygrs12.reduce(function (tot, ygr) {
      return tot * ygr.gr;
    }, 1);
  }
  return null;
};

// extrapolate pop of a commune in the past
APP.extrapolatePop = function (commune, year) {
  var hy1 = commune.hab_year[0];
  //cl("year: ",year)
  //cl("hy1: ", hy1, ", bool(hy1): ", Boolean(hy1), ", hy1.year: ", hy1.year, ", hy1.year>year: ", hy1.year>year, ", hy1 && hy1.year>year: ", hy1 && hy1.year>year)
  if (hy1 && hy1.year > year) {
    return hy1.pop / APP.calculateGrowthRate(year, hy1.year);
  }
  return null;
};

function pop_calculator(commune) {
  commune.pop_interpolator = exponentialInterpolator(commune.hab_year.map(function (hy) {
    return [hy.year, hy.pop];
  }));
  commune.pop_extrapolator = function (year) {
    return APP.extrapolatePop(commune, year);
  };
  var hy1 = commune.hab_year[0];
  return function (year) {
    if (hy1 && year < hy1.year) {
      return commune.pop_extrapolator(year);
    } else {
      return commune.pop_interpolator(year);
    }
  };
}

APP.hasCommuneData = function (commune, year) {
  return commune.hab_year[0] && commune.hab_year[0].year <= year;
};

APP.animate = function () {
  var startYear = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : APP.minYear;
  var endYear = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : APP.maxYear;
  var timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : APP.animationTotalTime;
  var interval = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : APP.animationIntervalTime;

  APP.animationStop();
  var diffYear = endYear - startYear;
  var slider = document.getElementById("slider1");
  slider.value = startYear;
  APP.updateYear(0);
  APP.togglePlayPauseButtons(false);
  APP.animationStartTime = +new Date();
  var intervalId = setInterval(function () {
    var newTime = +new Date();
    APP.currentYear = Math.round(startYear + diffYear * (newTime - APP.animationStartTime) / timeout);
    slider.value = APP.currentYear;
    APP.updateYear(0);
  }, interval);
  APP.animationIntervalId = intervalId;
  var timeoutId = setTimeout(function () {
    return APP.animationStop(endYear, intervalId, timeoutId);
  }, timeout + 1);
  APP.animationTimeoutId = timeoutId;
  return function (func) {
    return setTimeout(func, timeout + 1);
  };
};
APP.animationStop = function () {
  var endYear = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : APP.currentYear;
  var intervalId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : APP.animationIntervalId;
  var timeoutId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : APP.animationTimeoutId;

  APP.currentYear = endYear;
  document.getElementById("slider1").value = APP.currentYear;
  APP.updateYear(0);
  APP.togglePlayPauseButtons(true);
  clearInterval(intervalId);
  clearTimeout(timeoutId);
};
APP.animationStart = function () {
  var endYear = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : APP.maxYear;

  var factor = Math.abs(endYear - APP.currentYear) / (APP.maxYear - APP.minYear);
  var timeout = APP.animationTotalTime * factor;
  cl("APP.animationStart timeout", timeout, ", endYear", endYear, "  Math.abs(endYear-APP.currentYear) ", Math.abs(endYear - APP.currentYear), ", factor", factor);
  return APP.animate(APP.currentYear, endYear, timeout, APP.animationIntervalTime);
};

APP.togglePlayPauseButtons = function () {
  var showPlay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : !APP.animationShowPlayButton;

  if (showPlay) {
    $("#map-pause-button").hide();
    $("#map-play-button").show();
  } else {
    $("#map-pause-button").show();
    $("#map-play-button").hide();
  }
  APP.animationShowPlayButton = showPlay;
};

/*****
Updating innerHTML of buffer size values according to slider value using conversion table
*****/
APP.sliderevent = function () {
  $('.slidBuffer').on("input", function () {
    APP.currentYear = parseInt($('#slider1').val());
    APP.updateYear();
  })
  // allow smooth 1sec transition for clicks and immediate changes when dragging
  .on("mousedown", function () {
    setTimeout(function () {
      APP.mapTransitionDuration = 0;
    }, 10);
  }).on("mouseup", function () {
    setTimeout(function () {
      APP.mapTransitionDuration = APP.mapTransitionDurationDefault;
    }, 11);
  });
};

APP.updateYear = function () {
  var transitionMsec = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : APP.mapTransitionDuration;

  $("#slider1_val").html(APP.currentYear);
  APP.i18n.data("label-original-pop-data", APP.communes.filter(function (c) {
    return c.hab_year[0] ? c.hab_year[0].year <= APP.currentYear : false;
  }).length);
  //$("#nb-communes-data").html(APP.communes.filter(c => c.hab_year[0]? c.hab_year[0].year<=APP.currentYear:false).length)
  APP.hpm.updateYear(APP.currentYear, transitionMsec);
};

/** Returns a linear interpolator from the given dataPoints
 * @param {*} dataPoints an array of length 2 arrays, each sub-array is a coordinate with sub-array[0]=x, sub-array[1]=y
 * @returns interpolate(x) a function taking a value x and returning the linear interpolation of y at x, or null if x is outside the x range of dataPoints
 */
function interpolator(dataPoints) {
  dataPoints.sort(function (a, b) {
    return a[0] - b[0];
  });
  //cl("dataPoints",dataPoints)
  return function interpolate(x) {
    if (dataPoints[0] && x == dataPoints[0][0]) {
      return dataPoints[0][1];
    }
    var bi = dataPoints.findIndex(function (b) {
      return b[0] >= x;
    });
    if (bi > 0 && bi <= dataPoints.length) {
      var a = dataPoints[bi - 1];
      var b = dataPoints[bi];
      //cl("a=",a,", b=",b, ", b[1]-a[1]=", b[1]-a[1], ", b[0]-a[0]=", b[0]-a[0], ", x-a[0]=", x-a[0])
      return a[1] + (b[1] - a[1]) / (b[0] - a[0]) * (x - a[0]);
    }
    return null;
  };
}
/** Returns an exponential interpolator from the given dataPoints
 * Useful to interpolate with growth rates
 * @param {*} dataPoints an array of length 2 arrays, each sub-array is a coordinate with sub-array[0]=x, sub-array[1]=y
 * @returns interpolate(x) a function taking a value x and returning the exponential interpolation of y at x, or null if x is outside the x range of dataPoints
 */
function exponentialInterpolator(dataPoints) {
  var linearInterpolator = interpolator(dataPoints.map(function (dp) {
    return [dp[0], Math.log(dp[1])];
  }));
  return function (year) {
    var logResult = linearInterpolator(year);
    if (logResult === null) {
      return null;
    }
    return Math.exp(logResult);
  };
}
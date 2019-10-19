"use strict";

// SPTM - Didier Dupertuis & Nicolas Vallotton - Avril 2019

// Creating APP object for storing all Methods
let APP = {
  minYear: 1200,
  currentYear: 1536,
  maxYear: 1990,
  // list of communes
  communes:[],
  communesFile: "3_maps/communes_geo.csv",
  ygrs:[],
  ygrFile: "3_maps/avg_yearly_growth_rates.csv",
  showCommunesWithData: true,
  showCommunesWithoutData: true,
  mapTransitionDuration: 0,
  mapTransitionDurationDefault: 1000,
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

let cl = console.log
let ct = console.table

// Storing size of the browser viewport
let windowHeight = $(window).height();  // returns height of browser viewport
let windowWidth = $(window).width();  // returns width of browser viewport


// Correspondance table for slider values, buffer label in meters, buffer sizes in pixel and pop values for each
// let bufferVal = []; // initialized empty
// for(i = 1; i <= 10; i++){
    // bufferVal.push({"sliderVal": i, "buffer": `${i*100}m`, "bufferPx": i*15, "pop":`pop${i*100}m`});
// }

/*****
Initializing the whole script of the page
*****/
APP.main = async function(){
    APP.togglePlayPauseButtons(true)

    // load communes data
    APP.communes = await d3.dsv(";",APP.communesFile, function(commune){
      commune.hab_year = JSON.parse(commune.hab_year.replace(/'/g,'"') )
      commune.hab_year = commune.hab_year.sort((a,b)=>a.year-b.year)
      commune.pop_calculator = pop_calculator(commune)
      commune.canton = commune.canton_x
      commune.canton_x = null
      commune.canton_y = null
      commune.latLng = [+commune.Y,+commune.X]
      return commune
    })

    console.log("APP.communes 0:", APP.communes)

    APP.hpm = new HistoricalPopulationMap(
      "map", APP.communes,
      'https://api.mapbox.com/styles/v1/nvallott/cjcw1ex6i0zs92smn584yavkn/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibnZhbGxvdHQiLCJhIjoiY2pjdzFkM2diMWFrMzJxcW80eTdnNDhnNCJ9.O853joFyvgOZv7y9IJAnlA',
      1536, 1200, 1990
    )
    APP.hpm.init();
    APP.graph = new HistoricalPopulationGraph(
      "graph",
      "graphLegend2",
      1200, 1990
    )

    // communes circle onclick: display on graph
    APP.hpm.dataCircles().on('click', c => APP.graph.addCommune(c))

    APP.sliderevent();
    await APP.loadYearlyGrowthRates()

    document.getElementById("slider1").value = APP.currentYear; 

    APP.updateYear()
};

/*****
Loading yearly growth rates data
*****/
APP.loadYearlyGrowthRates = async function(){
  APP.ygrs = await d3.dsv(";",APP.ygrFile, function(ygr){
    ygr.year=parseInt(ygr.year)
    ygr.data_pop=parseInt(ygr.data_pop)
    ygr.duration=parseInt(ygr.duration)
    ygr.ygr=parseFloat(ygr.ygr)
    ygr.gr=parseFloat(ygr.gr)
    return ygr
  })
}

// calculates total growth rate between two given year, assumes y1<y2
APP.calculateGrowthRate = function (y1,y2){
  let ygrs12 = APP.ygrs.filter((ygr,i) => 
    (ygr.year>=y1 || (APP.ygrs[i+1] && APP.ygrs[i+1].year>y1)) &&
     ygr.year<y2 )
  if(ygrs12.length>0){
    let ygrLast = ygrs12[ygrs12.length-1]
    let y2Duration = y2 - ygrLast.year
    ygrs12[ygrs12.length-1] = {
      year: ygrLast.year,
      ygr: ygrLast.ygr,
      gr: ygrLast.ygr ** y2Duration,
      duration: y2Duration,
    }

    let ygrFirst = ygrs12[0]
    let y1Duration = ygrFirst.duration - (y1-ygrFirst.year)
    ygrs12[0] = {
      year: y1,
      ygr: ygrFirst.ygr,
      gr: ygrFirst.ygr ** y1Duration,
      duration: y1Duration,
    }

    return ygrs12.reduce((tot,ygr) => tot*ygr.gr, 1)
  }
  return null
}

// extrapolate pop of a commune in the past
APP.extrapolatePop = function(commune, year){
  let hy1 = commune.hab_year[0]
  //cl("year: ",year)
  //cl("hy1: ", hy1, ", bool(hy1): ", Boolean(hy1), ", hy1.year: ", hy1.year, ", hy1.year>year: ", hy1.year>year, ", hy1 && hy1.year>year: ", hy1 && hy1.year>year)
  if(hy1 && hy1.year>year){
    return hy1.pop / APP.calculateGrowthRate(year,hy1.year)
  }
  return null
}

function pop_calculator(commune){
  commune.pop_interpolator = exponentialInterpolator(commune.hab_year.map(hy=>[hy.year,hy.pop]))
  commune.pop_extrapolator = year => APP.extrapolatePop(commune,year)
  let hy1 = commune.hab_year[0]
  return function(year){
    if(hy1 && year<hy1.year){
      return commune.pop_extrapolator(year)
    }
    else{
      return commune.pop_interpolator(year)
    }
  }
}

APP.hasCommuneData = function(commune, year){
  return commune.hab_year[0] && commune.hab_year[0].year<=year
}


APP.animate = function(startYear=APP.minYear, endYear=APP.maxYear, timeout=APP.animationTotalTime, interval=APP.animationIntervalTime){
  APP.animationStop()
  let diffYear = endYear-startYear
  let slider = document.getElementById("slider1")
  slider.value = startYear
  APP.updateYear(0)
  APP.togglePlayPauseButtons(false)
  APP.animationStartTime = +new Date()
  let intervalId = setInterval(function(){
    let newTime = +new Date()
    APP.currentYear = Math.round(startYear + diffYear * (newTime-APP.animationStartTime) / timeout)
    slider.value = APP.currentYear
    APP.updateYear(0)
  }, interval)
  APP.animationIntervalId = intervalId
  let timeoutId = setTimeout(()=>APP.animationStop(endYear, intervalId, timeoutId),timeout+1)
  APP.animationTimeoutId = timeoutId
  return func => setTimeout(func, timeout+1);
}
APP.animationStop = function(endYear=APP.currentYear, intervalId=APP.animationIntervalId, timeoutId=APP.animationTimeoutId){
  APP.currentYear = endYear
  document.getElementById("slider1").value = APP.currentYear
  APP.updateYear(0)
  APP.togglePlayPauseButtons(true)
  clearInterval(intervalId)
  clearTimeout(timeoutId)
}
APP.animationStart = function(endYear = APP.maxYear){
  let factor = Math.abs(endYear-APP.currentYear) / (APP.maxYear-APP.minYear)
  let timeout = APP.animationTotalTime * factor 
  cl("APP.animationStart timeout",timeout,", endYear",endYear,"  Math.abs(endYear-APP.currentYear) ",Math.abs(endYear-APP.currentYear), ", factor",factor)
  return APP.animate(APP.currentYear, endYear, timeout, APP.animationIntervalTime)
}

APP.togglePlayPauseButtons = function(showPlay = !APP.animationShowPlayButton){
  if(showPlay){  
    $("#map-pause-button").hide()
    $("#map-play-button").show()
  } else{
    $("#map-pause-button").show()
    $("#map-play-button").hide()
  }
  APP.animationShowPlayButton = showPlay
}

/*****
Updating innerHTML of buffer size values according to slider value using conversion table
*****/
APP.sliderevent = function(){
    $('.slidBuffer')
    .on("input",function(){
      APP.currentYear = parseInt($('#slider1').val())
      APP.updateYear()
    })
    // allow smooth 1sec transition for clicks and immediate changes when dragging
    .on("mousedown",function(){
      setTimeout(()=>{APP.mapTransitionDuration=0},10)
    })
    .on("mouseup",function(){
      setTimeout(()=>{APP.mapTransitionDuration=APP.mapTransitionDurationDefault},11)
    })
}

APP.updateYear = function(transitionMsec=APP.mapTransitionDuration){
  $("#slider1_val").html(APP.currentYear)
  APP.i18n.data("label-original-pop-data",APP.communes.filter(c => c.hab_year[0]? c.hab_year[0].year<=APP.currentYear:false).length)
  //$("#nb-communes-data").html(APP.communes.filter(c => c.hab_year[0]? c.hab_year[0].year<=APP.currentYear:false).length)
  APP.hpm.updateYear(APP.currentYear, transitionMsec)
}


/** Returns a linear interpolator from the given dataPoints
 * @param {*} dataPoints an array of length 2 arrays, each sub-array is a coordinate with sub-array[0]=x, sub-array[1]=y
 * @returns interpolate(x) a function taking a value x and returning the linear interpolation of y at x, or null if x is outside the x range of dataPoints
 */
function interpolator(dataPoints){
  dataPoints.sort((a,b)=>a[0]-b[0])
  //cl("dataPoints",dataPoints)
  return function interpolate(x){
    if(dataPoints[0] && x==dataPoints[0][0]){
      return dataPoints[0][1]
    }
    let bi = dataPoints.findIndex(b=>b[0]>=x)
    if(bi>0 && bi<=dataPoints.length){
      let a = dataPoints[bi-1]
      let b = dataPoints[bi]
      //cl("a=",a,", b=",b, ", b[1]-a[1]=", b[1]-a[1], ", b[0]-a[0]=", b[0]-a[0], ", x-a[0]=", x-a[0])
      return a[1]+ (b[1]-a[1])/(b[0]-a[0]) * (x-a[0])
    }
    return null
  }
}
/** Returns an exponential interpolator from the given dataPoints
 * Useful to interpolate with growth rates
 * @param {*} dataPoints an array of length 2 arrays, each sub-array is a coordinate with sub-array[0]=x, sub-array[1]=y
 * @returns interpolate(x) a function taking a value x and returning the exponential interpolation of y at x, or null if x is outside the x range of dataPoints
 */
function exponentialInterpolator(dataPoints){
  let linearInterpolator = interpolator(dataPoints.map(dp=>[dp[0],Math.log(dp[1])]))
  return function(year){
    let logResult = linearInterpolator(year)
    if(logResult===null){
      return null
    }
    return Math.exp(logResult)
  }
}

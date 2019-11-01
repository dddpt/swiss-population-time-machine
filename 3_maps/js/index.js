import {HistoricalPopulationGraph} from "./HistoricalPopulationGraph.js"
import {HistoricalPopulationMap} from "./HistoricalPopulationMap.js"
import {Commune} from "./Commune.js"

// SPTM - Didier Dupertuis & Nicolas Vallotton - Avril 2019

// Creating APP object for storing all Methods
export let APP = {
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
    APP.communes = await d3.dsv(";",APP.communesFile, function(d){
      return new Commune(
        d.bfsnr, d.name, d.canton_x, d.firstmention, JSON.parse(d.hab_year.replace(/'/g,'"') ),
        d.Y, d.X, d.url, d.zipcodes, d.language, d.notes, APP.extrapolatePop
      )
    })

    console.log("APP.communes 0:", APP.communes)

    APP.hpm = new HistoricalPopulationMap(
      "map", APP.communes,
      'https://api.mapbox.com/styles/v1/nvallott/cjcw1ex6i0zs92smn584yavkn/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibnZhbGxvdHQiLCJhIjoiY2pjdzFkM2diMWFrMzJxcW80eTdnNDhnNCJ9.O853joFyvgOZv7y9IJAnlA',
      1536, 1200, 1990, false, APP
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

    // add buttons event listeners
    document.getElementById("map-animation-minus-50y").addEventListener("click", ()=> APP.animationStart(Math.max(APP.minYear,APP.currentYear-50)))
    document.getElementById("map-animation-play").addEventListener("click", ()=> APP.animationStart())
    document.getElementById("map-animation-pause").addEventListener("click", ()=> APP.animationStop())
    document.getElementById("map-animation-plus-50y").addEventListener("click", ()=> APP.animationStart(Math.min(APP.maxYear,APP.currentYear+50)))
    document.getElementById("map-toggle-with-data").addEventListener("click", ()=> {
      APP.hpm.toggleShowCommunesWithData()
      d3.select("#legend-original-pop-data button")
          .attr("data-i18n",()=> (APP.hpm.showCommunesWithData? "hide":"show")+"-communes-button")
    })
    document.getElementById("map-toggle-without-data").addEventListener("click", ()=> {
      APP.hpm.toggleShowCommunesWithoutData()
      d3.select("#legend-extrapolated-pop-data button")
          .attr("data-i18n",()=> (APP.hpm.showCommunesWithoutData? "hide":"show")+"-communes-button")
    })
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
    $("#map-animation-pause").hide()
    $("#map-animation-play").show()
  } else{
    $("#map-animation-pause").show()
    $("#map-animation-play").hide()
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






async function languageLoader(lng){
  let translation = await fetch(APP.i18nDir+lng+".json")
  //console.log( "translation.status: ", translation.status, ", translation: ", translation)
  if(translation.status==200){
    translation = await translation.json()
    return translation
  }else{
    throw {
      message: 'loading of translation "'+lng+'" failed',
      lng: lng,
      response: translation
    }
  }
}

APP.i18n = new Internationalisation(["fr","de","it","en"],languageLoader)
//APP.i18n.useLocalStorage = false
APP.i18n.dynamic["label-original-pop-data"] = (t,d) => t.replace("{#nbcommunes}",d)
function onChangeLanguage(oldLng, newLng){
  $("#lang-dropdown .lang-current").text(" "+newLng.toUpperCase()+" ")
}
APP.i18n.languageChangeCallbacks.push(onChangeLanguage)
APP.i18n.observe(document)

// add language choice buttons:
for(let lng of APP.i18n.supportedLanguages){
  let langMenu = d3.select("#lang-menu")
  langMenu.append("a")
      .attr("class","dropdown-item")
      .attr("href",'javascript:void(0);')
      .html(lng.toUpperCase())
      .on("click.change-language", ()=> APP.i18n.changeLanguage(lng))
  langMenu.append("br")
}

APP.main();

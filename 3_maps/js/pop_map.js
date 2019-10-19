"use strict";

// SPTM - Didier Dupertuis & Nicolas Vallotton - Avril 2019


class HistoricPopulationMap{
  
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
  constructor(divId, communes, tilesURL, currentYear, minYear, maxYear, LeafletMapArguments){
    this.divId = divId
    this.communes = communes
    this.tilesURL = tilesURL
    this.currentYear = currentYear
    this.minYear = minYear
    this.maxYear = maxYear
    this.LeafletMapArguments = LeafletMapArguments? LeafletMapArguments : defaultLeafletMapArguments();
    this.tooltipMap = undefined
    this.showCommunesWithData = true
    this.showCommunesWithoutData = true
  }

  /** Initializes the map background and tooltip object */
  init(){
    // Initiaize the map - definig parameters and adding cartodb basemap
    let map = new L.map("divId", this.LeafletMapArguments)
    let cartodb = L.tileLayer(tilesURL, {});

    // Getting tooltip ready for showing data
    this.tooltipMap = d3.select('#'+this.divId)
      .append('div')
      .attr('class', 'tooltip');

    // Add the cartodb layer to the map
    cartodb.addTo(map);
  }

  /** Updates visible states of all the dots: size, color (interpolated/real data) and display status
   * 
   */
  update(transitionMsec=APP.mapTransitionDuration){
    // display pop as it is at APP.currentYear
    d3.selectAll("#" + this.divId + '.dot')
        .classed('extrapolated', d=> !APP.hasCommuneData(d, this.currentYear))
        .classed('intrapolated', d=> APP.hasCommuneData(d, this.currentYear))
        .transition().duration(transitionMsec)
        .attr("r",d=>{
          d.circleSize = Math.sqrt(+d.pop_calculator(this.currentYear))/14
          return d.circleSize
        })
    
    d3.selectAll('.dot.intrapolated').classed("hidden", !this.showCommunesWithData)
    d3.selectAll('.dot.extrapolated').classed("hidden", !this.showCommunesWithoutData)
  };

  /** Update the year of data shown */
  updateYear(year){
    this.currentYear = year
    this.update()
  }

  /** Toggles whether do show or hide communes with data at given year */
  toggleShowCommunesWithData(){
    this.showCommunesWithData = !this.showCommunesWithData
    d3.select("#legend-original-pop-data button")
        .attr("data-i18n",()=> (this.showCommunesWithData? "hide":"show")+"-communes-button")
    this.update()
  }

  /** Toggles whether do show or hide communes without data at given year */
  toggleShowCommunesWithoutData(){
    APP.showCommunesWithoutData = !APP.showCommunesWithoutData
    d3.select("#legend-extrapolated-pop-data button")
        .attr("data-i18n",()=> (this.showCommunesWithoutData? "hide":"show")+"-communes-button")
    this.update()
  }

  /** Default arguments for Leaflet Map background */
  static defaultLeafletMapArguments(){
    return {
      center: [	46.8,8.2],
      zoom: 8,
      minZoom: 8,
      maxZoom: 20,
      maxBounds: ([[44.5, 4.5],[49, 12]])
    }
  }
}

// Tooltip of the map
let map
let tooltipMap;

/*****
Initializing map - leaflet with cartodb basemap and tooltip ready
*****/
APP.initMap = async function(){
    // Initiaize the map - definig parameters and adding cartodb basemap
    map = new L.map("map", {center: [	46.8,8.2], zoom: 8, minZoom: 8, maxZoom: 20, maxBounds: ([[44.5, 4.5],[49, 12]])});
    let cartodb = L.tileLayer('https://api.mapbox.com/styles/v1/nvallott/cjcw1ex6i0zs92smn584yavkn/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibnZhbGxvdHQiLCJhIjoiY2pjdzFkM2diMWFrMzJxcW80eTdnNDhnNCJ9.O853joFyvgOZv7y9IJAnlA', {
    // let cartodb = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>'
    });

    // Getting tooltip ready for showing data
    tooltipMap = d3.select('#map')
      .append('div')
      .attr('class', 'tooltip');

    // Add the cartodb layer to the map
    cartodb.addTo(map);

    // Calling metho to create heatmap overlay
    // APP.makeHeatMap();
    // Calling method to create - has to wait for the map to be created
    await APP.makeCommunes();
};

APP.updateMap = function(transitionMsec=APP.mapTransitionDuration){
  // display pop as it is at APP.currentYear
  d3.selectAll('.dot')
      .classed('extrapolated', d=> !APP.hasCommuneData(d, APP.currentYear))
      .classed('intrapolated', d=> APP.hasCommuneData(d, APP.currentYear))
      .transition().duration(transitionMsec)
      .attr("r",d=>{
        //let hy1850 = d.hab_year.filter(hy=>hy.year==1850)
        //let radius = hy1850.length>0? hy1850[0].pop: 300
        d.circleSize = Math.sqrt(+d.pop_calculator(APP.currentYear))/14
        return d.circleSize
      })
  
  d3.selectAll('.dot.intrapolated').classed("hidden",!APP.showCommunesWithData)
  d3.selectAll('.dot.extrapolated').classed("hidden",!APP.showCommunesWithoutData)
  
};

APP.toggleShowCommunesWithData = function(){
  APP.showCommunesWithData = !APP.showCommunesWithData
  d3.select("#legend-original-pop-data button")
      .attr("data-i18n",()=> (APP.showCommunesWithData? "hide":"show")+"-communes-button")
  APP.updateMap()
}

APP.toggleShowCommunesWithoutData = function(){
  APP.showCommunesWithoutData = !APP.showCommunesWithoutData
  d3.select("#legend-extrapolated-pop-data button")
      .attr("data-i18n",()=> (APP.showCommunesWithoutData? "hide":"show")+"-communes-button")
  APP.updateMap()
}


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
  graph:{
    // Array of 0 to initialize correct number of dots for scatterplot
    data:[],
    // Boolean to check if graph has already been initialized
    initialized: false,
    // Max nb of communes to display on graph:
    maxSize: 3,
    // returns a class for points and lines of given commune
    pointsClass: commune => 'point-'+commune.name.replace(/\W/g,"-"),
    lineClass: commune => 'line-'+commune.name.replace(/\W/g,"-"),
    legendId: commune => 'legend-'+commune.name.replace(/\W/g,"-"),
    counter:0,
    // given a number returns
    colors: [0.2,0.4,0.6,0.8].map(d3.interpolateRainbow),
    colorScale: function(){
      let usedColors = APP.graph.data.map(c=>c.graphColor)
      let freeColors = APP.graph.colors.filter(color => !usedColors.includes(color))
      if(freeColors.length>0){
        return freeColors[0]
      }
      return "black"
    },
    transitionsDuration: 1000
  },
  i18nDir: "3_maps/assets/translations/",
  animationTotalTime: 5000,
  animationIntervalTime: 100,
  animationTimeoutId: undefined,
  animationIntervalId: undefined,
  animationStartTime: +new Date()
};




/*****
Declaring global variables
*****/

let cl = console.log
let ct = console.table

// Storing size of the browser viewport
let windowHeight = $(window).height();  // returns height of browser viewport
let windowWidth = $(window).width();  // returns width of browser viewport

// Map
let map;
// Tooltip of the map&graph
let tooltipMap;
let tooltipGraph;


// Correspondance table for slider values, buffer label in meters, buffer sizes in pixel and pop values for each
// let bufferVal = []; // initialized empty
// for(i = 1; i <= 10; i++){
    // bufferVal.push({"sliderVal": i, "buffer": `${i*100}m`, "bufferPx": i*15, "pop":`pop${i*100}m`});
// }

/*****
Initializing the whole script of the page
*****/
APP.main = async function(){
    await APP.initMap();
    APP.sliderevent();
    await APP.loadYearlyGrowthRates()

    document.getElementById("slider1").value = APP.currentYear; 
    APP.updateYear()
};

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

/*****
Creating heatmap overlay based on the populated hectares
*****/
// APP.makeHeatMap = function(){
//     // Empty array
//     let heathect = [];
//     // Loading population datas
//     d3.csv("PLZO_CSV_WGS84.csv", function(data) {
//         // Formatting data for heatLayer function
//         for(i = 0; i < data.length ; i++){
//             heathect.push([]);
//             heathect[i][0] = data[i].Y;
//             heathect[i][1] = data[i].X;
//             heathect[i][2] = data[i].B14BTOT;
//         }
//
//         // Adding the heatmap layer to the map - radius and max parameters optimized to get readable map through whole zoom range
//         let heatmap = L.heatLayer(heathect, {radius: 30, max: 500}).addTo(map);
//         // Calling method to opacity of heatmap
//         APP.changeOpacity();
//     })
//
//     // Declaring legend to be place over the map
//     var legend = L.control({position: 'bottomright'});
//
//     legend.onAdd = function (map) {
//         // Creating div for legend
//         let div = L.DomUtil.create('div', 'info legend');
//
//         // Inserting HTML table for custom gradient color and labels
//         div.innerHTML = 'POPULATION <table> <tbody> <tr> <td> <canvas id="myCanvas" width="20" height="75" style="border:1px solid #d3d3d3;opacity:0.7"> </canvas> </td> <td> &nbsp; Elevée </br> </br> </br> </br> &nbsp; Faible </td> </tr> </tbody> </table>';
//         return div;
//     };
//
//     // Adding legend to the map
//     // legend.addTo(map);
//
//     // Calling method for coloring legend
//     // APP.colorLegend();
// };

/*****
Coloring HTML part for the legend
*****/
// APP.colorLegend = function(){
//     // Adding color gradient to the legend
//     var c = document.getElementById("myCanvas");
//     var ctx = c.getContext("2d");
//     var grd = ctx.createLinearGradient(0,0,0,75);
//
//     // Creating different stops and color gradient
//     grd.addColorStop(0, "red");
//     grd.addColorStop(0.25, "yellow");
//     grd.addColorStop(0.5, "lime");
//     grd.addColorStop(0.75, "cyan");
//     grd.addColorStop(1, "blue");
//
//     // Parameters for HTML color gradient
//     ctx.fillStyle = grd;
//     ctx.fillRect(0, 0, 256, 256);
// }

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
APP.calculateGrowthRateOLD = function (y1,y2){
  let ygrs12 = APP.ygrs.filter((ygr,i) => 
    (ygr.year>=y1 || (APP.ygrs[i+1] && APP.ygrs[i+1].year>y1)) &&
     ygr.year<y2 )
  let ygr1 = ygrs12[0]
  let ygr2 = ygrs12[ygrs12.length-1]
  ygrs12 = ygrs12.filter((ygr,i) => i>0 && i< ygrs12.length-1)
  let y1Duration = ygrs12[0].year-y1
  let y2Duration = y2-ygr2.year
  let gr1 = ygr1.ygr**y1Duration
  let gr2 = ygr2.ygr**y2Duration
  let gr12 = ygrs12.reduce((tot,ygr) => tot*ygr.gr,gr1*gr2)
  return gr12
}
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

/*****
Creating points for communes and adding them to the map
*****/
let du = 32
APP.makeCommunes = async function(){
    console.log("coucou");
    // Empty array to store
    let communes = [];

    // Creating the public transportation layer with leaflet d3 svg overlay according to correct projection
    let communesOverlay = L.d3SvgOverlay(function(sel,proj){
        console.log(communes);
        var communesUpd = sel.selectAll('circle').data(communes);
        communesUpd.enter()
        .append("circle")
        .attr('cx', function(d){return proj.latLngToLayerPoint(d.latLng).x;}) // projecting points
        .attr('cy', function(d){return proj.latLngToLayerPoint(d.latLng).y;}) // projecting points
        .attr('r', 0)
        .style('position', 'relative')
        // .style('stroke','black')
        .attr('opacity', .6)
        .attr('class', function(d){
            return "communesPop dot"
            // different class attribute according to transport type
            // if(d.MOYEN_TRAN.match('CheminFer')){
            //     return "bigBuff dot"
            // } else if(d.MOYEN_TRAN == 'Bus'){
            //     return "smallBuff dot"
            // } else {
            //     return "midBuff dot"
            // }
        });
    });

    // Loading the public transportation datas
    await d3.dsv(";",APP.communesFile, function(commune){
      commune.hab_year = JSON.parse(commune.hab_year.replace(/'/g,'"') )
      commune.hab_year = commune.hab_year.sort((a,b)=>a.year-b.year)
      //cl("commune.hab_year: ", commune.raw_hab_year.replace(/'/g,'"'))
      //commune.raw_hab_year = JSON.parse(commune.raw_hab_year.replace(/'/g,'"'))
      //commune.pop_interpolator = exponentialInterpolator(commune.hab_year.map(hy=>[hy.year,hy.pop]))
      commune.pop_calculator = pop_calculator(commune)
      commune.canton = commune.canton_x
      commune.canton_x = null
      commune.canton_y = null
      // prepare interpolation:
      // points = [{x:1,y:8},{x:3,y:3},{x:9,y:33},{x:19,y:11},{x:21,y:2},{x:33,y:12}]
      // interpolation.single(points)({x:4})
      return commune
    }).then(function(data){
        // mapping data to get proper latLong values
        communes = data.map(function(d){
            d.latLng = [+d.Y,+d.X];
            return d;
        });
        APP.communes = communes

        // Adding layer to the map
        communesOverlay.addTo(map);

        d3.selectAll('.dot')
        // Changing buffer size according to selected values on mouseover + tooltip infos
        .on('mouseenter',function(d){
            d3.select(this)
            .transition()
            .duration(100)
            .attr('r', function(d){
                return 1.3*d.circleSize
            });
            // Showing value of buffer in the tooltip
            tooltipMap.html(function(){
                return `${d.name}, pop: ${Math.round(d.pop_calculator(APP.currentYear))}`
            })
            .transition()
            .duration(50)
            .style('opacity', 0.8)
            .style('left', `${d3.event.pageX}px`)
            .style('top', `${d3.event.pageY}px`);
        })
        // Change html header for the graphic when buffer is clicked
        .on('click', function(d){
            /*$('#graphLegend').html(function(){
                return `<table width="100%">
                <tr id="arret"> <td> </td> <td>  ${APP.currentYear} </td> <td> </td> </tr>
                </table>
                <table width="100%">
                <tr> <td> Canton : ${d.canton} </td> <td> &nbsp; </td> <td> Numéro OFS : ${d.bfsnr} </td> </tr>
                </table>`;
            })*/
            // If the graph has been launched once, update it - Else, initialize it
            if(APP.graph.initialized){
                APP.addCommuneToGraph(d);
            } else {
                APP.graph.initialized = true;
                APP.initGraph(d);
            }
        })
        // Reset normal size on buffer point on mouseout
        .on('mouseout', function(){
            d3.select(this)
            .transition()
            .duration(200)
            .attr('r', d=> d.circleSize);
            tooltipMap.transition()
            .duration(200)
            .style('opacity', 0);
        });
    })

}

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

/*****
Changing heatmap opacity for better readability
*****/
// APP.changeOpacity = function(){
//     d3.selectAll('.leaflet-heatmap-layer').style('opacity',0.4);
// };

APP.animate = function(startYear=APP.minYear, endYear=APP.maxYear, timeout=APP.animationTotalTime, interval=APP.animationIntervalTime){
  let diffYear = endYear-startYear
  let slider = document.getElementById("slider1")
  slider.value = startYear
  APP.updateYear(0)
  APP.animationStartTime = +new Date()
  APP.animationIntervalId = setInterval(function(){
    let newTime = +new Date()
    APP.currentYear = Math.round(startYear + diffYear * (newTime-APP.animationStartTime) / timeout)
    slider.value = APP.currentYear
    APP.updateYear(0)
  }, interval)
  APP.animationTimeoutId = setTimeout(()=>APP.animationStop(endYear),timeout+1)
}
APP.animationStop = function(endYear=APP.currentYear){
  APP.currentYear = endYear
  document.getElementById("slider1").value = APP.currentYear
  APP.updateYear(0)
  clearInterval(APP.animationIntervalId)
  clearTimeout(APP.animationTimeoutId)
}
APP.animationStart = function(){
  let timeout = APP.animationTotalTime * (APP.maxYear-APP.minYear) / (APP.maxYear-APP.currentYear) 
  APP.animate(APP.currentYear, APP.maxYear, timeout, APP.animationIntervalTime)
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
  APP.updateMap(transitionMsec)
}

/*****
Initializing graphic - creating all svg elements (dots, axis)
*****/
APP.initGraph = function(data){
    // Removing introduction text for graph
    $('#tuto').remove();

    // Creating margins for the svg
    let margin = {top : 20, right : 40, bottom : 30, left : 52};

    // Setting dimensions of the svg and padding between each value of the barplot
    APP.graph.width = $('#graphPart').width() - margin.left - margin.right;
    APP.graph.height = 320 - margin.top - margin.bottom;

    // Creating svg, appending attributes
    APP.graph.svg = d3.select("#graph")
      .append("svg")
      .attr("width", APP.graph.width + margin.left + margin.right)
      .attr("height", APP.graph.height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Adding div tooltip
    tooltipGraph = d3.select('#graph')
      .append('div')
      .attr('class', 'tooltipGraph')
      .style('left', '0px')
      .style('top', '0px')
      .style('opacity',0);

      // Adding grid
      // X gridlines
      APP.graph.svg.append("g")			
        .attr("class", "xgrid")
        .attr("transform", "translate(0," + APP.graph.height + ")")
  
      // Y gridlines
      APP.graph.svg.append("g")			
        .attr("class", "ygrid")

    // Adding axis
    APP.graph.svg.append('g')
      .attr('class','xAxis')
      .attr('transform', `translate(0,${APP.graph.height})`);

    APP.graph.svg.append('g')
      .attr('class', 'yAxis');

    // Adding axis labels
    APP.graph.svg.append("text")
      .attr('class', 'axisLabel')
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate("+ (20) +","+(35)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
      .style('opacity', 0)
      .text("Population");

    APP.graph.svg.append("text")
      .attr('class', 'axisLabel')
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate("+ (APP.graph.width-(20)) +","+(APP.graph.height-(10))+")")  // centre below axis
      .style('opacity', 0)
      .text("Année");


    // Calling method to update graph according to current data
    APP.addCommuneToGraph(data);
}

APP.addCommuneToGraph = function(newCommune){
  //cl("APP.addCommuneToGraph() new commune: ",newCommune.name)

  if(!APP.graph.data.find(c => c.name==newCommune.name)){
    newCommune.graphColor = APP.graph.colorScale()
    APP.graph.counter = APP.graph.counter+1

    // insert newCommune at beginning of array 
    APP.graph.data.unshift(newCommune)

    APP.updateGraph()
  }
}

APP.removeCommuneFromGraph = function(communeToRemove){
  cl("APP.removeCommuneFromGraph() commune to remove: ",communeToRemove.name)

  let ctrIndex = APP.graph.data.findIndex(c => c.name==communeToRemove.name)

  cl("ctrIndex:", ctrIndex)

  if(ctrIndex!=-1){
    APP.graph.data.splice(ctrIndex,1)

    APP.updateGraph()
  }
}

/*****
Updating graph - put all dots in place according to new data, rescale axis and and translate line
*****/
APP.updateGraph = function() {
    
    // Setting up X scale and axis
    let xScale = d3.scaleLinear().range([0,APP.graph.width]).domain([1200,2000]);
    let xAxis = d3.axisBottom().scale(xScale);

    // only keep the first APP.graph.maxSize elements 
    APP.graph.data = APP.graph.data.filter((c,i)=> i<APP.graph.maxSize)

    // Setting up Y scale and axis
    let yMax = d3.max(APP.graph.data.filter((c,i)=> i<APP.graph.maxSize).map(commune => commune.hab_year.map(hy =>hy.pop)).flat())
    let yScale = d3.scaleLinear().range([APP.graph.height,0]).domain([0,1.1*yMax]);
    let yAxis = d3.axisLeft().scale(yScale);

    // Rescale axis
    APP.graph.svg.select('.xAxis')
      .transition()
      .duration(APP.graph.transitionsDuration)
      .call(xAxis)
      .attr('x', APP.graph.width)
      .attr('y', -3);

    APP.graph.svg.select('.yAxis')
      .transition()
      .duration(APP.graph.transitionsDuration)
      .call(yAxis)
      .attr('y',6)
      .attr('dy', '.71em');

    APP.graph.svg.selectAll('.axisLabel')
      .style('opacity', 1);

    // Rescale grid
    APP.graph.svg.select('.xgrid')
      .transition()
      .duration(APP.graph.transitionsDuration)
      .call(xAxis
        .tickSize(-APP.graph.height)
        .tickFormat("")
      )
      .attr('x', APP.graph.width)

    APP.graph.svg.select('.ygrid')
      .transition()
      .duration(APP.graph.transitionsDuration)
      .call(yAxis
        .tickSize(-APP.graph.width)
        .tickFormat("")
      )


    // create the legend
    let legendDiv = d3.select("#graphLegend2").selectAll(".graph-commune-legend").data(
      APP.graph.data.filter((c,i)=>i<APP.graph.maxSize),
      function(c){return c? "legend-"+c.name : this.id} // /!\ function(){} needed here! arrow func not allowed
    )

    let legendDivEnter = legendDiv.enter()
      .append("div")
      .attr("id", APP.graph.legendId)
      .attr("class","graph-commune-legend")
    legendDivEnter.append("span")
      .html("x ")
      .attr("class","remove-commune-from-graph")
      .on("click", APP.removeCommuneFromGraph)
    legendDivEnter.append("span")
      .html(c => c.name)
      .style('color', c => c.graphColor);
    legendDivEnter.append("span")
      .html(" (")
    legendDivEnter.append("a")
      .attr("href", c=> "https://beta.hls-dhs-dss.ch"+c.url.replace("de","fr"))
      .attr("target","_blank")
      .html("dhs")
    legendDivEnter.append("span")
      .html(")")

    legendDiv.exit().remove()

    // returns a function to draw a line (the newLine simply has y=0 all along)
    let interpolatedLine = d3.line().curve(d3.curveLinear).x( hy=>xScale(hy.year) ).y( hy=> yScale(hy.pop) );
    let newLine =          d3.line().curve(d3.curveLinear).x( hy=>xScale(hy.year) ).y(yScale(0));

    // LINES
    let hyLines = APP.graph.svg.selectAll(".line").data(
      APP.graph.data.filter((c,i)=>i<APP.graph.maxSize),
      function(c){return c? APP.graph.lineClass(c) : this.id} // /!\ function(){} needed here! arrow func not allowed
    )
    let hyLinesEnter = hyLines.enter()
      .append("path")
      .attr("id",APP.graph.lineClass)
      .attr("class","line")
      .attr("d", c =>  newLine(c.hab_year))
      .style('stroke',c => c.graphColor)
      //.attr("clip-path", "url(#clipTemp)")
      .attr("fill","none")
      //.attr("d", c => interpolatedLine(c.hab_year))
    
    hyLines.exit().remove()

    hyLines = hyLines.merge(hyLinesEnter)
      .transition().duration(APP.graph.transitionsDuration)
      .attr("d", c => interpolatedLine(c.hab_year))

      
    // POINTS
    let hyPoints = APP.graph.svg.selectAll(".points-g").data(
      APP.graph.data.filter((c,i)=>i<APP.graph.maxSize),
      function(c){return c? APP.graph.pointsClass(c) : this.id} // /!\ function(){} needed here! arrow func not allowed
    )
      
    let hyPointsEnter = hyPoints.enter()
      .append('g')
      .attr('id', APP.graph.pointsClass)
      .attr('class', "points-g")
      .each(function(commune){
        let points = d3.select(this).selectAll(".point").data(commune.hab_year)
        points.enter()
          .append('circle')
          .attr('class', "point")
          .attr('cx', hy=>xScale(hy.year))
          .attr('cy', yScale(0))
          .attr('r',3)
          .style('fill',commune.graphColor);
      })

    hyPoints.exit().remove()

    hyPoints = hyPoints.merge(hyPointsEnter)
      .each(function(commune){
        d3.select(this).selectAll(".point")
          .transition().duration(APP.graph.transitionsDuration)
          .attr('cx', hy=>xScale(hy.year))
          .attr('cy', hy=>yScale(hy.pop))
      })

     // Interaction events on graphic
    APP.graph.svg.selectAll('.point')
    // Adding information on specific point to the tooltip on mouseover
      .on('mouseover', function(d){
        let dot = d3.select(this)
        let cx = dot.attr('cx') // To get appropriate coordinates for tooltip
        let cy = dot.attr('cy') // To get appropriate coordinates for tooltip
        tooltipGraph.html(`année: ${d.year}<br/>pop: ${d.pop}`)
        .style('left', `${cx-10}px`)
        .style('top', `${cy-25}px`);
        tooltipGraph.transition()
        .duration(100)
        .style('opacity', 0.8);
      })
      // Remove tooltip on mouseout
      .on('mouseout', function(d){
          tooltipGraph.transition()
          .duration(200)
          .style('opacity', 0);
      });

    /*/ Replace part of the labels for french format
    $('text').each(function(){
        let legendText = $(this).text().replace(',',"'");
        $(this).text(legendText);
    });*/
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

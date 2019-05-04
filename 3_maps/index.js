"use strict";

// SPTM - Didier Dupertuis & Nicolas Vallotton - Avril 2019

// Creating APP object for storing all Methods
let APP = {
  currentYear: 1850,
  // list of communes
  communes:[],
  graph:{
    // Array of 0 to initialize correct number of dots for scatterplot
    data:[],
    // Boolean to check if graph has already been initialized
    initialized: false,
    // Max nb of communes to display on graph:
    maxSize: 5,
  }
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
// Tooltip of the map
let tooltipMap;


// Correspondance table for slider values, buffer label in meters, buffer sizes in pixel and pop values for each
// let bufferVal = []; // initialized empty
// for(i = 1; i <= 10; i++){
    // bufferVal.push({"sliderVal": i, "buffer": `${i*100}m`, "bufferPx": i*15, "pop":`pop${i*100}m`});
// }

/*****
Initializing the whole script of the page
*****/
APP.main = function(){
    APP.initMap();
    APP.sliderevent();
};

/*****
Initializing map - leaflet with cartodb basemap and tooltip ready
*****/
APP.initMap = function(){
    // Initiaize the map - definig parameters and adding cartodb basemap
    map = new L.map("map", {center: [	47,7.5], zoom: 9, minZoom: 7, maxZoom: 20, maxBounds: ([[44.5, 4.5],[49, 12]])});
    let cartodb = L.tileLayer('https://api.mapbox.com/styles/v1/nvallott/cjcw1ex6i0zs92smn584yavkn/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibnZhbGxvdHQiLCJhIjoiY2pjdzFkM2diMWFrMzJxcW80eTdnNDhnNCJ9.O853joFyvgOZv7y9IJAnlA', {
    // let cartodb = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>'
    });

    // Add the cartodb layer to the map
    cartodb.addTo(map);

    // Calling metho to create heatmap overlay
    // APP.makeHeatMap();
    // Calling method to create - has to wait for the map to be created
    APP.makeCommunes();

    // Getting tooltip ready for showing data
    tooltipMap = d3.select('#map')
    .append('div')
    .attr('class', 'tooltip');

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
Creating points for PT stops and adding them to the map
*****/
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
        .attr('r', 3)
        .attr('fill', function(d){
            return "blue"
            // different fill color according to transport type
            // if(d.MOYEN_TRAN.match('CheminFer')){
            //     return "blue"
            // } else if(d.MOYEN_TRAN == 'Bus'){
            //     return "lime"
            // } else {
            //     return "turquoise"
            // }
        })
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
    await d3.dsv(";","communes_geo.csv", function(commune){
      commune.hab_year = JSON.parse(commune.hab_year.replace(/'/g,'"'))
      commune.hab_year = commune.hab_year.sort((a,b)=>a.year-b.year)
      commune.raw_hab_year = JSON.parse(commune.raw_hab_year.replace(/'/g,'"'))
      commune.pop_interpolator = exponentialInterpolator(commune.hab_year.map(hy=>[hy.year,hy.pop]))
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
                // // For each type of buffer, get the pixel size in the correspondance table bufferVal
                // if(d.MOYEN_TRAN.match('CheminFer')){
                //     return bufferVal[$('#slider1').val()-1].bufferPx;
                // } else if(d.MOYEN_TRAN == 'Bus'){
                //     return bufferVal[$('#slider3').val()-1].bufferPx;
                // } else {
                //     return bufferVal[$('#slider2').val()-1].bufferPx;
                // }
            });
            // Showing value of buffer in the tooltip
            tooltipMap.html(function(){
                // For each type of buffer, get the population value in the correspondance table bufferVal
                // let pop = "";
                // if(d.MOYEN_TRAN.match('CheminFer')){
                //     pop = d[bufferVal[$('#slider1').val()-1].pop];
                // } else if(d.MOYEN_TRAN == 'Bus'){
                //     pop = d[bufferVal[$('#slider3').val()-1].pop];
                // } else {
                //     pop = d[bufferVal[$('#slider2').val()-1].pop];
                // }
                // Replace unknown values with 0
                // if(pop == "NA"){
                //     pop = 0;
                // }
                // Return actual innerHTML text
                // return "hello";
                return `${d.name}`
                // Pop : ${d.X}`;
            })
            .transition()
            .duration(50)
            .style('opacity', 0.8)
            .style('left', `${d3.event.pageX}px`)
            .style('top', `${d3.event.pageY}px`);
        })
        // Change html header for the graphic when buffer is clicked
        .on('click', function(d){
            $('#graphLegend').html(function(){
                return `<table width="100%">
                <tr id="arret"> <td> </td> <td>  ${d.Ortschaftsname} </td> <td> </td> </tr>
                </table>
                <table width="100%">
                <tr> <td> Canton : ${d.Kanton} </td> <td> &nbsp; </td> <td> Numéro OFS : ${d.BFS_Nr} </td> </tr>
                </table>`;
            })
            // If the graph has been launched once, update it - Else, initialize it
            if(APP.graph.initialized){
                APP.updateGraph(d);
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


    APP.updateMap()
}

APP.updateMap = function(){
  // display pop as it was in 1850 (if available)
  d3.selectAll('.dot')
      .attr("r",d=>{
        //let hy1850 = d.hab_year.filter(hy=>hy.year==1850)
        //let radius = hy1850.length>0? hy1850[0].pop: 300
        d.circleSize = Math.sqrt(+d.pop_interpolator(APP.currentYear)/50)
        return d.circleSize
      })
};

/*****
Changing heatmap opacity for better readability
*****/
// APP.changeOpacity = function(){
//     d3.selectAll('.leaflet-heatmap-layer').style('opacity',0.4);
// };

/*****
Updating innerHTML of buffer size values according to slider value using conversion table
*****/
APP.sliderevent = function(){
    $('.slidBuffer').change(function(){
        //$('#slider1_val').html(bufferVal[$('#slider1').val()-1].buffer);
        cl("$('#slider1').val()")
        cl($('#slider1').val())
        APP.currentYear = $('#slider1').val()
        $("#slider1_val").html(APP.currentYear)
        APP.updateMap()
    });
}

/*****
Initializing graphic - creating all svg elements (dots, axis)
*****/
APP.initGraph = function(data){
    // Removing introduction text for graph
    $('#tuto').remove();

    // Creating margins for the svg
    let margin = {top : 40, right : 40, bottom : 55, left : 52};

    // Setting dimensions of the svg and padding between each value of the barplot
    APP.graph.width = $('#graphPart').width() - margin.left - margin.right;
    APP.graph.height = 400 - margin.top - margin.bottom;

    // Creating svg, appending attributes
    APP.graph.svg = d3.select("#graph")
    .append("svg")
    .attr("width", APP.graph.width + margin.left + margin.right)
    .attr("height", APP.graph.height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    // Adding div tooltip
    let tooltipGraph = d3.select('#graph')
    .append('div')
    .attr('class', 'tooltipGraph')
    .style('left', '0px')
    .style('top', '0px')
    .style('opacity',0);

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
    APP.updateGraph(data);
}

/*****
Updating graph - put all dots in place according to new data, rescale axis and and translate line
*****/
APP.updateGraph = function(newCommune) {

    cl("APP.updateGraph() new commune: ",newCommune.name)

    // insert newCommune at beginning of array and only keep the first APP.graph.maxSize elements 
    APP.graph.data.unshift(newCommune)
    APP.graph.data = APP.graph.data.filter((c,i)=> i<APP.graph.maxSize)
    cl("APP.graph.data:")
    ct(APP.graph.data)
    
    // Setting up X scale and axis
    let xScale = d3.scaleLinear().range([0,APP.graph.width]).domain([1200,2000]);
    let xAxis = d3.axisBottom().scale(xScale);

    // Setting up Y scale and axis
    let yMax = d3.max(APP.graph.data.map(commune => commune.hab_year.map(hy =>hy.pop)).flat())
    let yScale = d3.scaleLinear().range([APP.graph.height,0]).domain([0,1.1*yMax]);
    let yAxis = d3.axisLeft().scale(yScale);

    /*// Declare new svg line with new coordinates
    let line = d3.line()
    .x(function(d){
        return xScale(d.size);
    })
    .y(function(d){
        return yScale(d.pop);
    });*/

    // Rescale axis
    APP.graph.svg.select('.xAxis')
      .transition()
      .duration(1000)
      .call(xAxis)
      .attr('x', APP.graph.width)
      .attr('y', -3);

    APP.graph.svg.select('.yAxis')
      .transition()
      .duration(1000)
      .call(yAxis)
      .attr('y',6)
      .attr('dy', '.71em');

    APP.graph.svg.selectAll('.axisLabel')
      .style('opacity', 1);

    // returns a function to draw a line (the newLine simply has y=0 all along)
    let interpolatedLine = d3.line().curve(d3.curveLinear).x( hy=>xScale(hy.year) ).y( hy=> yScale(hy.pop) );
    let newLine = d3.line().curve(d3.curveLinear).x( hy=>xScale(hy.year) ).y(yScale(0));
    
    // returns a class for points and lines of given commune
    let pointsClass = commune => 'point-'+commune.name.replace(/\W/g,"-")
    let lineClass = commune => 'line-'+commune.name.replace(/\W/g,"-")

    APP.graph.data.forEach(commune=>{
    
      let hyPoints = APP.graph.svg.selectAll("."+pointsClass(commune))
        .data(commune.hab_year)
      
      let hyPointsEnter = hyPoints.enter()
        .append('circle')
        .attr('class',pointsClass(commune))
        .attr('cx', d=>xScale(d.year))
        .attr('cy', yScale(0))
        .attr('r',3)
        .style('opacity', 0.7)
        .style('fill','red');

      hyPoints = hyPoints.merge(hyPointsEnter)
        .transition(1000)
        .attr('cx', d=>xScale(d.year))
        .attr('cy', d=>yScale(d.pop))

      // Translate line according to new coordinates
      let hyLine = APP.graph.svg.selectAll('.'+lineClass(commune))
        .data([commune.hab_year])
      cl("commune.hab_year",commune.hab_year)
      cl("hyLine",hyLine)
      cl("hyLine.data()",hyLine.data())
      
      let hyLineEnter = hyLine.enter()
        .append("path")
        .classed(lineClass(commune),true)
        .attr("d", newLine)
        .style("stroke", "blue")
        //.attr("clip-path", "url(#clipTemp)")
        .attr("fill","none");
      cl("hyLineEnter",hyLineEnter)
      cl("hyLineEnter.datum():")
      ct(hyLineEnter.datum())

      hyLine = hyLine.merge(hyLineEnter)
        .transition(1000)
        .attr("d", interpolatedLine)
    })
    /*// Remap all dots according to new values
    APP.graph.svg.selectAll('.point')
      .data(APP.graph.data)
      .transition()
      .duration(1000)
      .attr('cx', d => xScale(d.size))
      .attr('cy', d => yScale(d.pop))
      .attr('r',6)
      .style('opacity', 0.7)
      .style('fill','red');

    // Translate line according to new coordinates
    APP.graph.svg.select('.line')
    .transition()
    .duration(1000)
    .attr('d',line(APP.graph.data))
    .style('stroke','black')
    .style('stroke-width',0.7)
    .style('fill','none');

    // Interaction events on graphic
    APP.graph.svg.selectAll('.point')
    // Adding information on specific point to the tooltip on mouseover
    .on('mouseover', function(d){
        let cx = d3.select(this).attr('cx'); // To get appropriate coordinates for tooltip
        let cy = d3.select(this).attr('cy'); // To get appropriate coordinates for tooltip
        tooltipGraph.html(function(){
            return `${d.pop} population <br> pour ${d.size}m`;
        })
        .style('left', `${cx}px`)
        .style('top', `${cy}px`);
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

    // Replace part of the labels for french format
    $('text').each(function(){
        let legendText = $(this).text().replace(',',"'");
        $(this).text(legendText);
    });
    */
}

/** Returns a linear interpolator from the given dataPoints
 * @param {*} dataPoints an array of length 2 arrays, each sub-array is a coordinate with sub-array[0]=x, sub-array[1]=y
 * @returns interpolate(x) a function taking a value x and returning the linear interpolation of y at x, or null if x is outside the x range of dataPoints
 */
function interpolator(dataPoints){
  dataPoints.sort((a,b)=>a[0]-b[0])
  //cl("dataPoints",dataPoints)
  return function interpolate(x){
    let bi = dataPoints.findIndex(b=>b[0]>=x)
    //cl("bi: ",bi)
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
    return Math.exp(linearInterpolator(year))
  }
}

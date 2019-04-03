// TPVD - Nicolas Vallotton & Lucas Martinez - Juillet 2017

// Creating APP object for storing all Methods
APP = {};

/*****
Declaring global variables
*****/

// Storing size of the browser viewport
let windowHeight = $(window).height();  // returns height of browser viewport
let windowWidth = $(window).width();  // returns width of browser viewport


// Map
let map;
// Tooltip of the map
let tooltipMap;

// Array of 0 to initialize correct number of dots for scatterplot
let dataGraph = [0,0,0,0,0,0,0,0,0,0];
// Boolean to check if graph has already been initialized
let graphInitialized = false;

// Correspondance table for slider values, buffer label in meters, buffer sizes in pixel and pop values for each
let bufferVal = []; // initialized empty
for(i = 1; i <= 10; i++){
    bufferVal.push({"sliderVal": i, "buffer": `${i*100}m`, "bufferPx": i*15, "pop":`pop${i*100}m`});
}

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
    map = new L.map("map", {center: [46.515228504114376, 6.629819869995117], zoom: 14, minZoom: 10, maxZoom: 15, maxBounds: ([[46.128688, 5.971754],[47.121474, 7.313116]])});
    let cartodb = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>'
    });

    // Add the cartodb layer to the map
    cartodb.addTo(map);

    // Calling metho to create heatmap overlay
    APP.makeHeatMap();
    // Calling method to create - has to wait for the map to be created
    setTimeout(function(){
        APP.makePtStops();
    }, 250);

    // Getting tooltip ready for showing data
    tooltipMap = d3.select('#map')
    .append('div')
    .attr('class', 'tooltip');
};

/*****
Creating heatmap overlay based on the populated hectares
*****/
APP.makeHeatMap = function(){
    // Empty array
    let heathect = [];
    // Loading population datas
    d3.csv("data/hectpop_xy4.csv", function(data) {
        // Formatting data for heatLayer function
        for(i = 0; i < data.length ; i++){
            heathect.push([]);
            heathect[i][0] = data[i].Y;
            heathect[i][1] = data[i].X;
            heathect[i][2] = data[i].B14BTOT;
        }

        // Adding the heatmap layer to the map - radius and max parameters optimized to get readable map through whole zoom range
        let heatmap = L.heatLayer(heathect, {radius: 30, max: 500}).addTo(map);
        // Calling method to opacity of heatmap
        APP.changeOpacity();
    })

    // Declaring legend to be place over the map
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {
        // Creating div for legend
        let div = L.DomUtil.create('div', 'info legend');

        // Inserting HTML table for custom gradient color and labels
        div.innerHTML = 'POPULATION <table> <tbody> <tr> <td> <canvas id="myCanvas" width="20" height="75" style="border:1px solid #d3d3d3;opacity:0.7"> </canvas> </td> <td> &nbsp; Elevée </br> </br> </br> </br> &nbsp; Faible </td> </tr> </tbody> </table>';
        return div;
    };

    // Adding legend to the map
    legend.addTo(map);

    // Calling method for coloring legend
    APP.colorLegend();
};

/*****
Coloring HTML part for the legend
*****/
APP.colorLegend = function(){
    // Adding color gradient to the legend
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    var grd = ctx.createLinearGradient(0,0,0,75);

    // Creating different stops and color gradient
    grd.addColorStop(0, "red");
    grd.addColorStop(0.25, "yellow");
    grd.addColorStop(0.5, "lime");
    grd.addColorStop(0.75, "cyan");
    grd.addColorStop(1, "blue");

    // Parameters for HTML color gradient
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 256, 256);
}

/*****
Creating points for PT stops and adding them to the map
*****/
APP.makePtStops = function(){
    // Empty array to store
    let ptStops = [];

    // Creating the public transportation layer with leaflet d3 svg overlay according to correct projection
    let ptsOverlay = L.d3SvgOverlay(function(sel,proj){

        var ptsUpd = sel.selectAll('circle').data(ptStops);
        ptsUpd.enter()
        .append("circle")
        .attr('cx', function(d){return proj.latLngToLayerPoint(d.latLng).x;}) // projecting points
        .attr('cy', function(d){return proj.latLngToLayerPoint(d.latLng).y;}) // projecting points
        .attr('r', 6)
        .attr('fill', function(d){
            // different fill color according to transport type
            if(d.MOYEN_TRAN.match('CheminFer')){
                return "blue"
            } else if(d.MOYEN_TRAN == 'Bus'){
                return "lime"
            } else {
                return "turquoise"
            }
        })
        .style('position', 'relative')
        .style('stroke','black')
        .attr('opacity', 0.5)
        .attr('class', function(d){
            // different class attribute according to transport type
            if(d.MOYEN_TRAN.match('CheminFer')){
                return "bigBuff dot"
            } else if(d.MOYEN_TRAN == 'Bus'){
                return "smallBuff dot"
            } else {
                return "midBuff dot"
            }
        });
    });

    // Loading the public transportation datas
    d3.csv("data/buffers.csv",function(data){
        // mapping data to get proper latLong values
        ptStops = data.map(function(d){
            d.latLng = [+d.Y,+d.X];
            return d;
        });
        // Adding layer to the map
        ptsOverlay.addTo(map);

    });

    // Defining interaction events - has to wait for the data to be loaded
    setTimeout(function(){
        d3.selectAll('.dot')
        // Changing buffer size according to selected values on mouseover + tooltip infos
        .on('mouseover',function(d){
            d3.select(this)
            .transition()
            .duration(100)
            .attr('r', function(d){
                // For each type of buffer, get the pixel size in the correspondance table bufferVal
                if(d.MOYEN_TRAN.match('CheminFer')){
                    return bufferVal[$('#slider1').val()-1].bufferPx;
                } else if(d.MOYEN_TRAN == 'Bus'){
                    return bufferVal[$('#slider3').val()-1].bufferPx;
                } else {
                    return bufferVal[$('#slider2').val()-1].bufferPx;
                }
            });
            // Showing value of buffer in the tooltip
            tooltipMap.html(function(){
                // For each type of buffer, get the population value in the correspondance table bufferVal
                let pop = "";
                if(d.MOYEN_TRAN.match('CheminFer')){
                    pop = d[bufferVal[$('#slider1').val()-1].pop];
                } else if(d.MOYEN_TRAN == 'Bus'){
                    pop = d[bufferVal[$('#slider3').val()-1].pop];
                } else {
                    pop = d[bufferVal[$('#slider2').val()-1].pop];
                }
                // Replace unknown values with 0
                if(pop == "NA"){
                    pop = 0;
                }
                // Return actual innerHTML text
                return `${d.NOM} </br>
                Population desservie : ${pop}`;
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
                <tr id="arret"> <td> </td> <td>  ${d.NOM} </td> <td> </td> </tr>
                </table>
                <table width="100%">
                <tr> <td> Commune : ${d.NOM_COMMUN} </td> <td> &nbsp; </td> <td> Altitude : ${d.ALTITUDE} </td> </tr>
                </table>`;
            })
            // If the graph has been launched once, update it - Else, initialize it
            if(graphInitialized){
                APP.updateGraph(d);
            } else {
                graphInitialized = true;
                APP.initGraph(d);
            }
        })
        // Reset normal size on buffer point on mouseout
        .on('mouseout', function(){
            d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 6);
            tooltipMap.transition()
            .duration(200)
            .style('opacity', 0);
        });
    }, 1000);
};

/*****
Changing heatmap opacity for better readability
*****/
APP.changeOpacity = function(){
    d3.selectAll('.leaflet-heatmap-layer').style('opacity',0.4);
};

/*****
Updating innerHTML of buffer size values according to slider value using conversion table
*****/
APP.sliderevent = function(){
    $('.slidBuffer').change(function(){
        $('#slider1_val').html(bufferVal[$('#slider1').val()-1].buffer);
        $('#slider2_val').html(bufferVal[$('#slider2').val()-1].buffer);
        $('#slider3_val').html(bufferVal[$('#slider3').val()-1].buffer);
    });
}

/*****
Initializing graphic - creating all svg elements (dots, axis)
*****/
APP.initGraph = function(data){
    // Removing introduction text for graph
    $('#tuto').remove();

    // Creating margins for the svg
    margin = {top : 40, right : 40, bottom : 55, left : 52};

    // Setting dimensions of the svg and padding between each value of the barplot
    wGraph = $('#graphPart').width() - margin.left - margin.right;
    hGraph = 400 - margin.top - margin.bottom;

    // Creating svg, appending attributes
    svgGraph = d3.select("#graph")
    .append("svg")
    .attr("width", wGraph + margin.left + margin.right)
    .attr("height", hGraph + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    // Adding div tooltip
    tooltipGraph = d3.select('#graph')
    .append('div')
    .attr('class', 'tooltipGraph')
    .style('left', '0px')
    .style('top', '0px')
    .style('opacity',0);

    // Adding dots with radius 0px
    svgGraph.selectAll('.point')
    .data(dataGraph)
    .enter()
    .append('circle')
    .attr('class','point')
    .attr('cx', function(d){
        return 0;
    })
    .attr('cy', hGraph)
    .attr('r',0)
    .style('fill', 'white');

    // Adding axis
    svgGraph.append('g')
    .attr('class','xAxis')
    .attr('transform', `translate(0,${hGraph})`);

    svgGraph.append('g')
    .attr('class', 'yAxis');

    // Adding axis labels
    svgGraph.append("text")
    .attr('class', 'axisLabel')
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (20) +","+(35)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
    .style('opacity', 0)
    .text("Population");

    svgGraph.append("text")
    .attr('class', 'axisLabel')
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (wGraph-(75)) +","+(hGraph-(10))+")")  // centre below axis
    .style('opacity', 0)
    .text("Zone tampon en mètres");

    // Adding line
    svgGraph.append('path')
    .attr('class','line')
    .style('stroke','none');

    // Calling method to update graph according to current data
    APP.updateGraph(data);
}

/*****
Updating graph - put all dots in place according to new data, rescale axis and and translate line
*****/
APP.updateGraph = function(data) {

    // Reset datagraph as empty array
    dataGraph = [];
    // Formatting data to be used on scatterplot
    for(i = 1; i <= 10; i++){
        string = `pop${i*100}m`;
        dataGraph.push({"size": i*100, "pop": +data[string]});
    }

    // Replacing falsey values (here NaN) with 0
    dataGraph.forEach(function(a){
        a.pop = a.pop || 0;
    })

    // Setting up X scale and axis
    xScale = d3.scale.linear().range([0,wGraph]).domain([0,1000]);
    xAxis = d3.svg.axis().scale(xScale).orient('bottom');

    // Setting up Y scale and axis
    let yMin = d3.min(dataGraph, function(d){return d.pop});
    let yMax = d3.max(dataGraph, function(d){return d.pop})
    yScale = d3.scale.linear().range([hGraph,0]).domain([yMin,yMax]);
    yAxis = d3.svg.axis().scale(yScale).orient('left');

    // Declare new svg line with new coordinates
    let line = d3.svg.line()
    .x(function(d){
        return xScale(d.size);
    })
    .y(function(d){
        return yScale(d.pop);
    });

    // Rescale axis
    svgGraph.select('.xAxis')
    .transition()
    .duration(1000)
    .call(xAxis)
    .attr('x', wGraph)
    .attr('y', -3);;

    svgGraph.select('.yAxis')
    .transition()
    .duration(1000)
    .call(yAxis)
    .attr('y',6)
    .attr('dy', '.71em');

    svgGraph.selectAll('.axisLabel')
    .style('opacity', 1);

    // Remap all dots according to new values
    svgGraph.selectAll('.point')
    .data(dataGraph)
    .transition()
    .duration(1000)
    .attr('cx', function(d){
        return xScale(d.size)
    })
    .attr('cy', function(d){
        return yScale(d.pop)
    })
    .attr('r',6)
    .style('opacity', 0.7)
    .style('fill','red');

    // Translate line according to new coordinates
    svgGraph.select('.line')
    .transition()
    .duration(1000)
    .attr('d',line(dataGraph))
    .style('stroke','black')
    .style('stroke-width',0.7)
    .style('fill','none');

    // Interaction events on graphic
    svgGraph.selectAll('.point')
    // Adding information on specific point to the tooltip on mouseover
    .on('mouseover', function(d){
        let cx = d3.select(this).attr('cx'); // To get appropriate coordinates for tooltip
        let cy = d3.select(this).attr('cy'); // To get appropriate coordinates for tooltip
        tooltipGraph.html(function(){
            return `${d.pop} habitants desservis <br> pour ${d.size}m`;
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
}

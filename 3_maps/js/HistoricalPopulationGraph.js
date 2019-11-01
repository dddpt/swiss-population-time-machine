"use strict";

// SPTM - Didier Dupertuis & Nicolas Vallotton - Avril 2019

export class HistoricalPopulationGraph{

  /** HistoricalPopulationGraph constructor
   * 
   * @param {String} divId the id of the div in which the graph should be put
   * @param {Array[Commune]} communes array of Commune Objects
   * @param {number} minYear the minimum year that can be displayed
   * @param {number} maxYear the maximum year that can be displayed
   */
  constructor(
      divId,
      legendDivId,
      minYear,
      maxYear, 
      colors,
      maxSize = 3,
      transitionsDuration = 1000,
      dimensions = [440, 320],
      margins = {top : 20, right : 40, bottom : 30, left : 52}
    ){
    let self = this
    this.divId = divId
    this.legendDivId = legendDivId
    this.minYear = minYear
    this.maxYear = maxYear
    this.tooltip = undefined
    this.width = dimensions[0] - margins.left - margins.right;
    this.height = dimensions[1] - margins.top - margins.bottom;
    this.margins = margins
    
    
    this.displayedCommunes =[]
    // Boolean to check if graph has already been initialized
    this.initialized = false
    // Max nb of communes to display on graph
    this.maxSize = 3
    this.counter =0
    let ms2 = 1/(maxSize+2)
    this.colors = colors? colors : d3.range(ms2, 1, ms2).map(d3.interpolateRainbow)
    this.colorScale = function(){
      let usedColors = self.displayedCommunes.map(c=>c.graphColor)
      let freeColors = self.colors.filter(color => !usedColors.includes(color))
      if(freeColors.length>0){
        return freeColors[0]
      }
      return "black"
    }
    this.transitionsDuration = transitionsDuration
  }

  init(){
    let self = this
    // Removing introduction text for graph
    $('#tuto').remove();

    // Creating svg, appending attributes
    this.svg = d3.select("#"+this.divId)
      .append("svg")
      .attr("width", self.width + self.margins.left + self.margins.right)
      .attr("height", self.height + self.margins.top + self.margins.bottom)
      .append("g")
      .attr("transform", `translate(${self.margins.left},${self.margins.top})`);

    // Adding div tooltip
    this.tooltip = d3.select("#"+this.divId)
      .append('div')
      .attr('class', 'tooltipGraph')
      .style('left', '0px')
      .style('top', '0px')
      .style('opacity',0);

    // Adding grid
    // X gridlines
    this.svg.append("g")			
      .attr("class", "xgrid")
      .attr("transform", `translate(0,${self.height})`);

    // Y gridlines
    this.svg.append("g")			
      .attr("class", "ygrid")

    // Adding axis
    this.svg.append('g')
      .attr('class','xAxis')
      .attr('transform', `translate(0,${self.height})`);

    this.svg.append('g')
      .attr('class', 'yAxis');

    // Adding axis labels
    this.svg.append("text")
      .attr('class', 'axisLabel')
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate("+ (20) +","+(35)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
      .style('opacity', 0)
      .text("Population");

    this.svg.append("text")
      .attr('class', 'axisLabel')
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate("+ (self.width-(20)) +","+(self.height-(10))+")")  // centre below axis
      .style('opacity', 0)
      .text("Année");

  }

  addCommune(newCommune){
    //cl("this.displayedCommunes: ", this.displayedCommunes)
    if(!this.displayedCommunes.find(c => c.name==newCommune.name)){
      newCommune.graphColor = this.colorScale()
      this.counter = this.counter+1
  
      // insert newCommune at beginning of array 
      this.displayedCommunes.unshift(newCommune)
  
      this.update()
    }
  }

  removeCommune(communeToRemove){
    let ctrIndex = this.displayedCommunes.findIndex(c => c.name==communeToRemove.name)
    if(ctrIndex!=-1){
      this.displayedCommunes.splice(ctrIndex,1)
      this.update()
    }
  }

  update() {
    let self = this
    if(!this.initialized){
      this.init()
      this.initialized = true
    }

    // Setting up X scale and axis
    let xScale = d3.scaleLinear().range([0,self.width]).domain([1200,2000]);
    let xAxis = d3.axisBottom().scale(xScale);

    // only keep the first this.maxSize elements 
    this.displayedCommunes = this.displayedCommunes.filter((c,i)=> i<this.maxSize)

    // Setting up Y scale and axis
    let yMax = d3.max(self.displayedCommunes.filter((c,i)=> i<self.maxSize).map(commune => commune.hab_year.map(hy =>hy.pop)).flat())
    let yScale = d3.scaleLinear().range([self.height,0]).domain([0,1.1*yMax]);
    let yAxis = d3.axisLeft().scale(yScale);

    // Rescale axis
    this.svg.select('.xAxis')
      .transition()
      .duration(self.transitionsDuration)
      .call(xAxis)
      .attr('x', self.width)
      .attr('y', -3);

    this.svg.select('.yAxis')
      .transition()
      .duration(self.transitionsDuration)
      .call(yAxis)
      .attr('y',6)
      .attr('dy', '.71em');

    this.svg.selectAll('.axisLabel')
      .style('opacity', 1);

    // Rescale grid
    this.svg.select('.xgrid')
      .transition()
      .duration(self.transitionsDuration)
      .call(xAxis
        .tickSize(-self.height)
        .tickFormat("")
      )
      .attr('x', self.width)

    this.svg.select('.ygrid')
      .transition()
      .duration(self.transitionsDuration)
      .call(yAxis
        .tickSize(-self.width)
        .tickFormat("")
      )


    // create the legend
    let legendDiv = d3.select("#"+self.legendDivId).selectAll(".graph-commune-legend").data(
      self.displayedCommunes.filter((c,i)=>i<self.maxSize),
      function(c){return c? "legend-"+c.name : this.id} // /!\ function(){} needed here! arrow func not allowed
    )

    let legendDivEnter = legendDiv.enter()
      .append("div")
      .attr("id", self.legendId)
      .attr("class","graph-commune-legend")
    legendDivEnter.append("span")
      .html("x ")
      .attr("class","remove-commune-from-graph")
      .on("click", c => self.removeCommune(c))
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
    let hyLines = this.svg.selectAll(".line").data(
      self.displayedCommunes.filter((c,i)=>i<self.maxSize),
      function(c){return c? self.lineClass(c) : this.id} // /!\ function(){} needed here! arrow func not allowed
    )
    let hyLinesEnter = hyLines.enter()
      .append("path")
      .attr("id",self.lineClass)
      .attr("class","line")
      .attr("d", c =>  newLine(c.hab_year))
      .style('stroke',c => c.graphColor)
      //.attr("clip-path", "url(#clipTemp)")
      .attr("fill","none")
      //.attr("d", c => interpolatedLine(c.hab_year))
    
    hyLines.exit().remove()

    hyLines = hyLines.merge(hyLinesEnter)
      .transition().duration(self.transitionsDuration)
      .attr("d", c => interpolatedLine(c.hab_year))

      
    // POINTS
    let hyPoints = this.svg.selectAll(".points-g").data(
      self.displayedCommunes.filter((c,i)=>i<self.maxSize),
      function(c){return c? self.pointsClass(c) : this.id} // /!\ function(){} needed here! arrow func not allowed
    )
      
    let hyPointsEnter = hyPoints.enter()
      .append('g')
      .attr('id', self.pointsClass)
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
          .transition().duration(self.transitionsDuration)
          .attr('cx', hy=>xScale(hy.year))
          .attr('cy', hy=>yScale(hy.pop))
      })

     // Interaction events on graphic
    this.svg.selectAll('.point')
    // Adding information on specific point to the tooltip on mouseover
      .on('mouseover', function(d){
        let dot = d3.select(this)
        let cx = dot.attr('cx') // To get appropriate coordinates for tooltip
        let cy = dot.attr('cy') // To get appropriate coordinates for tooltip
        self.tooltip.html(`année: ${d.year}<br/>pop: ${d.pop}`)
        .style('left', `${cx-10}px`)
        .style('top', `${cy-25}px`);
        self.tooltip.transition()
        .duration(100)
        .style('opacity', 0.8);
      })
      // Remove tooltip on mouseout
      .on('mouseout', function(d){
          self.tooltip.transition()
          .duration(200)
          .style('opacity', 0);
      });

    /*/ Replace part of the labels for french format
    $('text').each(function(){
        let legendText = $(this).text().replace(',',"'");
        $(this).text(legendText);
    });*/
}

  // returns a class for points, lines and legend of given commune
  pointsClass(commune){return 'point-'+commune.name.replace(/\W/g,"-")}
  lineClass(commune){return 'line-'+commune.name.replace(/\W/g,"-")}
  legendId(commune){return 'legend-'+commune.name.replace(/\W/g,"-")}
}

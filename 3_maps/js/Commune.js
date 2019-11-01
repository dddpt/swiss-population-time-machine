import {exponentialInterpolator} from "./util.js"

export class Commune{
  constructor(
    bfsnr,
    name,
    canton,
    firstmention,
    hab_year,
    latitude, //Y
    longitude, //X
    url,
    zipcodes,
    language,
    notes,
    populationExtrapolator
  ){
    this.name = name
    this.bfsnr = +bfsnr
    this.canton = canton
    this.firstmention = firstmention
    this.hab_year = hab_year
    this.hab_year = this.hab_year.sort((a,b)=>a.year-b.year)
    this.latitude = +latitude
    this.longitude = +longitude 
    this.latLng = [this.latitude, this.longitude]
    this.url = url
    this.zipcodes = zipcodes
    this.language = language
    this.notes = notes
    this.extrapolatePopulation = year => populationExtrapolator(this, year)
    this.interpolatePopulation = exponentialInterpolator(this.hab_year.map(hy=>[hy.year,hy.pop]))
  }

  calculatePopulation(year){
    if(this.hasPopulationData(year)){
      return this.interpolatePopulation(year)
    } else {
      return this.extrapolatePopulation(year)
    }
  }

  hasPopulationData(year){
    if(this.hab_year.length<1){
      console.log()
      return false
    }
    let firsthy = this.hab_year[0]
    let lasthy = this.hab_year[this.hab_year.length-1] 
    return firsthy.year<=year && lasthy.year>=year
  }
  
}
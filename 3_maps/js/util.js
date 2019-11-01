"use strict";

/** Returns a linear interpolator from the given dataPoints
 * @param {*} dataPoints an array of length 2 arrays, each sub-array is a coordinate with sub-array[0]=x, sub-array[1]=y
 * @returns interpolate(x) a function taking a value x and returning the linear interpolation of y at x, or null if x is outside the x range of dataPoints
 */
export function interpolator(dataPoints){
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
export function exponentialInterpolator(dataPoints){
  let linearInterpolator = interpolator(dataPoints.map(dp=>[dp[0],Math.log(dp[1])]))
  return function(year){
    let logResult = linearInterpolator(year)
    if(logResult===null){
      return null
    }
    return Math.exp(logResult)
  }
}
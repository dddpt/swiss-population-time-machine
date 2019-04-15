"use strict";
let interpolation = {}
/**
 * Format matrix points to simple structure points
 * @param {string} params interpolation params
 * @param {string} points interpolation matrix
 * @return {array} formatted points
 */
interpolation.format = function(params, points) {
    if ("x" in params) {
        points.sort(function (a, b) { return a.x - b.x; });
        return [params.x, points.map(function (i) { return [i.x, i.y]; })];
    }
    if ("y" in params) {
        points.sort(function (a, b) { return a.y - b.y; });
        return [params.y, points.map(function (i) { return [i.y, i.x]; })];
    }
    throw new Error("Can't calculate single interpolation");
}
/**
 * Single interpolation store
 * @param {string} points interpolation matrix data
 * @return {void} interpolation execut method
 */
interpolation.single = function(points) {
    if (points.length <= 1) {
        throw new Error("Can't calculate single interpolation, please provide more points");
    }
    return function (params) {
        var _a = interpolation.format(params, points), c = _a[0], p = _a[1];
        var n = points.length - 1;
        if (c <= p[0][0]) {
            return p[0][1] + (c - p[0][0]) * (p[1][1] - p[0][1]) / (p[1][0] - p[0][0]);
        }
        if (c >= p[n][0]) {
            return p[n][1] + (c - p[n][0]) * (p[n][1] - p[n - 1][1]) / (p[n][0] - p[n - 1][0]);
        }
        for (var i = 0; i < n; i += 1) {
            if (c > p[i][0] && c <= p[i + 1][0]) {
                return p[i][1] + (c - p[i][0]) * (p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]);
            }
        }
        throw new Error("Can't calculate single interpolation");
    };
}

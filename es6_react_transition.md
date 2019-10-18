


ES6
================

todo:
- separate index.js file in relevant chunks
- adopt object oriented approach for each component (map, graph, slider, etc..)
- make them properly data-independant and instanciable, (so as to make it possible to have multiple maps/graphs on 1 page)
- use the es6 module approach



Components of index.js:

Multiple/Problematic:
APP.makeCommunes

General:
APP.main
APP.animate
APP.animationIntervalId
APP.animationIntervalTime
APP.animationTotalTime
APP.animationTimeoutId
APP.animationShowPlayButton
APP.animationStart
APP.animationStartTime
APP.animationStop
APP.calculateGrowthRate
APP.communes
APP.communesFile
APP.i18n
APP.i18nDir
APP.loadYearlyGrowthRates
APP.mapTransitionDurationDefault
APP.togglePlayPauseButtons
APP.updateYear
APP.ygrFile

Map:
APP.minYear
APP.currentYear
APP.maxYear
APP.initMap
APP.mapTransitionDuration
APP.showCommunesWithData
APP.showCommunesWithoutData
APP.toggleShowCommunesWithData
APP.toggleShowCommunesWithoutData
APP.updateMap
APP.ygrs

Slider:
APP.sliderevent

Graph:
APP.minYear
APP.maxYear
APP.addCommuneToGraph
APP.graph
APP.initGraph
APP.removeCommuneFromGraph
APP.updateGraph

Commune:
APP.extrapolatePop
APP.hasCommuneData



React + redux
================

On wait until es6 transition done
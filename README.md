# The middle-ages of Swiss communes population

The aim of this project is to estimate population of swiss communes (=municipalities) for the last 8 centuries, put it on a beautiful map and share it with the world!
See the result here: https://dddpt.github.io/swiss-population-time-machine/

The data comes from the [Swiss Historical Dictionary](https://beta.hls-dhs-dss.ch), a wonderful online encyclopedia on Swiss history. All communes have population data back to 1850 (start of the official Swiss Statistics); some have data going back to around 1400, and a rare few even have data going as far back as 1170!

Once this is done, it could always be possible to add [roads](https://map.geo.admin.ch/?topic=ivs&lang=fr&bgLayer=ch.swisstopo.pixelkarte-farbe&layers=ch.astra.ivs-nat,ch.astra.ivs-nat-verlaeufe,ch.swisstopo.hiks-dufour,ch.swisstopo.hiks-siegfried&E=2524453.86&N=1157441.67&zoom=4.446120007631386&catalogNodes=340,350&layers_visibility=true,false,false,false), historically used communes' names, etc. A boy can dream.

# Structure of repo

The names speak for themselves:
- 0_pop_scraping: scraping of the data from DHS
- 1_pop_cleaning: cleaning (part automated, part by hand) of the data
- 2_pop_extrapolation: extrapolation of population for all communes
- 3_maps: creation of the map(s)


# Status of the project:

As of 16.06:
- scraping & cleaning is done for all communes existing in 2017 except canton Thurgau (2162 units), todo: no longer existing communes should also be scraped&cleaned
- extrapolation is done in a simplistic bruteforce way: done with the average growth rate of all communes having data in given timespan.
- Map is functional ;-) (With some mistakes, locations and population data having been joined with a fuzzy merge on communes' names)

Notes data-validation
====================================

Communes with problems:
Lausanne (Gemeinde): data in html tabelle
Blonay: 1764 count includes saint-légier
Bussy-Chardonney: with or without Chardonnay
Château-d'Œx: unclear population count (with or without l'etivaz)
Chavannes-sur-Moudon: unclear date 1406/36?
Corsier-sur-Vevey: 2000: quartier à vevey?
Lonay: 1453 mit denges
Lutry: with or without Savigny
Mont-la-Ville: 1416 mit Cuarnens
Montreux: fusions à répétition
Pampigny: 1453 with other villages
Valeyres-sous-Ursins: 1550: together with Sermuz
Vugelles-La-Mothe: 1850 mit Orges
Etoy: 30 foyer en 1453 with Lavigny
Yverdon-les-Bains: Gressy (1379)

Communes with dual foyer-habitant values:
Ballaigues
Belmont-sur-Yverdon
Borex
Château-d'Œx
Ependes (VD)
Lignerolle
Lutry -> LOTS OF VALUES!
Premier
Pully
Suchy
Ursins
-> most of them have the equivalence in 1764

Fusion and hence no data:
Bourg-en-Lavaux
Goumoëns (Gemeinde)
Jorat-Menthue
Jorat-Mézières
Lussery-Villars
Montanaire
Montilliez
Oron (Gemeinde)
Romainmôtier-Envy
Tévenon
Valbroye
Vully-les-Lacs

other demographic infos:
- nb of catholics
- nb of german speaking
- nb of ausländer

Possible interface improvement:
- link to original page
- notes 
- download link
- DOES NOT BUG WHEN NO COMMUNE LEFT


// get all uniques units
function unique(value, index, self) { 
    return self.indexOf(value) === index;
}
uhyunits = [].concat.apply([], reviewedCommunes.map(c=>c.hab_year.map(hy=>hy.unit)));
uhyunits = uhyunits.filter(unique)

Programmation objectif 18.2.2019
====================================

Data preparation python:
- add whole-matches text
- quality score based on:
	- ordering of dates
	- "unit" text
	- last index of found matches
	- length of whole match?

Data validation JS app:
- loads data from localStorage&remote URL
- sequentially shows documents with:
	- original text with detected date+population highlighted
	- table with data allowing to:
		- delete entry
		- modify it
		- add entry
		-> changes are dynamically stored in localStorage


todo:
- quality score

data-flow js:



DHS
============

http://henrysuter.ch/glossaires/toponymes.html
http://www.hls-dhs-dss.ch/textes/f/F7855.php

https://helvetiahistorica.org/2018/05/13/histoire-canal-entreroches/


MAPS:
============

get TOPOGRAPHIC MAP OF CH
https://github.com/interactivethings/swiss-maps

VAUD:
https://www.asitvd.ch/
https://www.geo.vd.ch/theme/patrimoine_thm
https://map.geo.admin.ch/?topic=kgs&X=159611.85&Y=539884.71&zoom=3&bgLayer=ch.swisstopo.pixelkarte-farbe&lang=fr&layers=ch.babs.kulturgueter&layers_opacity=0.75&catalogNodes=363
https://www.geocat.ch/geonetwork/srv/fre/catalog.search#/search?resultType=details&sortBy=relevance&from=1&to=20&any=arch%C3%A9ologique
https://www.vd.ch/themes/territoire-et-construction/archeologie/recenser-et-gerer-les-sites-archeologiques/sites-fouilles-une-selection/
http://www.patrimoine.vd.ch/accueil/
http://www.recensementarchitectural.vd.ch/territoire/recensementarchitectural/

geo metadata for CH
https://www.geocat.ch/geonetwork/srv/fre/md.viewer#/full_view/c1a6591c-31a8-416a-a871-666eeeb7dc91/tab/complete

carte cantons simple:
https://bl.ocks.org/mbostock/4207744

carte avec relief
http://bl.ocks.org/herrstucki/6312708

historical map:
http://www.zum.de/whkmla/histatlas/italy/haxswitzerland.html

interesting population map
http://www.ralphstraumann.ch/projects/swiss-population-cartogram/index_fr.html

http://www.martingrandjean.ch/cartes-suisse-regions/

Inventaire des voies historiques suisses:
https://map.geo.admin.ch/?topic=ivs&lang=fr&bgLayer=ch.swisstopo.pixelkarte-farbe&layers=ch.astra.ivs-nat,ch.astra.ivs-nat-verlaeufe,ch.swisstopo.hiks-dufour,ch.swisstopo.hiks-siegfried&E=2608271.36&N=1138704.04&zoom=1.1966666666666552&catalogNodes=340,350&layers_visibility=false,false,false,false

Carte des châteaux:
https://map.geo.admin.ch/?topic=ivs&lang=fr&bgLayer=ch.swisstopo.pixelkarte-farbe&layers=ch.astra.ivs-nat,ch.astra.ivs-nat-verlaeufe,ch.swisstopo.hiks-dufour,ch.swisstopo.hiks-siegfried,ch.swisstopo.burgenkarte200_papier.metadata&E=2608271.36&N=1138704.04&zoom=1.1966666666666552&catalogNodes=340&layers_visibility=false,false,false,false,true

PORTAIL DES CARTES SUISSES:
kartenportal.ch

Autre site de cartes
https://www.geocat.admin.ch/

histoire des cartes:
http://www.kartengeschichte.ch/ch/def-index0.html

vieille carte archéologique du canton de vaud
https://gallica.bnf.fr/ark:/12148/btv1b84404150

Inventaire de la confédération
------------------------------------------------------

Inventaire des voies historiques suisses:
https://map.geo.admin.ch/?topic=ivs&lang=fr&bgLayer=ch.swisstopo.pixelkarte-farbe&layers=ch.astra.ivs-nat,ch.astra.ivs-nat-verlaeufe,ch.swisstopo.hiks-dufour,ch.swisstopo.hiks-siegfried&E=2608271.36&N=1138704.04&zoom=1.1966666666666552&catalogNodes=340,350&layers_visibility=false,false,false,false
https://www.ivs.admin.ch/fr/

Inventaire fédéral des paysages, sites et monuments naturels
Inventaire fédéral des sites construits à protéger en Suisse

DATA
============

STATISTIQUES HISTORIQUES
https://hsso.ch
http://hist-ecosoc.ch/

Statistique suisse des monuments
https://www.bfs.admin.ch/bfs/fr/home/statistiques/culture-medias-societe-information-sport/enquetes/monuments.assetdetail.4442523.html
-> recense le nobmre et la surface... peut être surtout intéressant pour contacter des services archéologiques

SOURCE POUR LES POSITIONS DES COMMUNES:
Répertoire officiel des localités
https://www.cadastre.ch/fr/services/service/plz.html
fichier CSV (Excel) WGS84 

recueil de noms géographiques en Suisse:
https://shop.swisstopo.admin.ch/fr/products/landscape/names3D

https://archive.org/stream/bub_gb_2boTAAAAYAAJ/bub_gb_2boTAAAAYAAJ_djvu.txt

http://www.sgg-ssh.ch/fr
http://www.infoclio.ch

The Population of European Cities, 800-1850: Data Bank and Short Summary of Results
https://www.droz.org/en/2109-9782600042895.html
Paul bairoch, Jean Batou and Pierre Chèvre

POPULATION URBAINE ET TAILLE DES VILLES EN EUROPE DE 1600 A 1970: PRÉSENTATION DE SÉRIES STATISTIQUES 
https://www.jstor.org/stable/24079085?seq=1#page_scan_tab_contents
Paul bairoch

From Baghdad to London: Unraveling Urban Development in Europe, the Middle East, and North Africa, 800–1800 
https://www.mitpressjournals.org/doi/abs/10.1162/REST_a_00284
Maarten Bosker, Eltjo Buringh and Jan Luiten van Zanden

Spatial dynamics of economic growth in Switzerland from 1860 to 2000
https://archive-ouverte.unige.ch/unige:41760
Stohr, Christian

OTHER RELEVANT SOURCES
========================

http://www.chronologie-jurassienne.ch/fr/Accueil.html#



DHS DATA CLEANING
=======

main problems:
------------------

- " ca. "
- , as string terminator
- matches out of context, wildy further than rest...
- wrong units
- TG gemeinde...
(- Kirchgemeinde)


propositions:
-----------------
easy:
- add " ca. " to regex 
- handle matches out of context by dropping matches after first match with year>=1990
- add , as a possible replacement for ;?
harder:
- special case for TG gemeinden
impossible:
- wrong units
- kirchgemeinde

NOTES 21.3
--------------

- Affoltern: missing 15jh data
- reduce errors to 68 communes out of 667 (vs >230 out of 667 before) -> VERY GOOD!
- hard to reduce it more, but might be possible to raise flags for possible errors:
	- detect numbers that are not in a match but are between first match index and last match index
	- detect a few indicator keywords befor first match:
		- good words: Einw, Haushalte, [other units...], 
		- not sure: Jh
	- lack of units in first match

propositions bis:
--------------------
- refactor problems
	- commune.problems.<type>.short = relevant 2 word description -> RED
	- commune.warnings.<type>.short = relevant 2 word description -> Yellow
		- detect numbers that are not in a match but are between first match index and last match index
		- detect a few indicator keywords befor first match:
			- good words: Einw, Haus, [other units...], 
			- not sure: Jh
- todo reassemble:
	- revCom + revComTG
	- revCom.hy = revCom.ohy
	- raise flags
	- implement new problems&warnings setup in index.html


Notes 26.3
--------------------

-> communes without problems are correct!
-> communes VD: de-deprecate old-hab-year
-> add a "reviewed" flag to communes who have actually been hand-reviewed
-> only review problematic communes





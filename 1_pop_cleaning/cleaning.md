
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


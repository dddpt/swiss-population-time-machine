

import requests as r
import re
from lxml import html
from functools import reduce
import math
import numpy as np
import copy

# get vufflens la ville
#da = r.get("https://beta.hls-dhs-dss.ch/Articles/007383/?language=fr")
#re.search("Signau",da.text)

# get liste of commune in vd:
baseurl = "https://beta.hls-dhs-dss.ch"
# VD basic
url = "https://beta.hls-dhs-dss.ch/Search/Category?text=*&sort=hls.title_sortString&sortOrder=asc&collapsed=true&r=1&f_hls.lexicofacet_string=2%2F006800.006900.007800.&f_hls.placefacet_string=1%2F00200.03000&language=fr"
# VD 100 results
url1 = "https://beta.hls-dhs-dss.ch/Search/Category?text=*&sort=hls.title_sortString&sortOrder=asc&collapsed=true&r=1&f_hls.lexicofacet_string=2%2F006800.006900.007800.&f_hls.placefacet_string=1%2F00200.03000&language=fr&rows=100&firstIndex=0"
url2 = "https://beta.hls-dhs-dss.ch/Search/Category?text=*&sort=hls.title_sortString&sortOrder=asc&collapsed=true&r=1&f_hls.lexicofacet_string=2%2F006800.006900.007800.&f_hls.placefacet_string=1%2F00200.03000&language=fr&rows=100&firstIndex=100"
# whole switzerland:
url3 = "https://beta.hls-dhs-dss.ch/Search/Category?text=*&sort=hls.title_sortString&sortOrder=asc&collapsed=true&r=1&f_hls.lexicofacet_string=2%2F006800.006900.007800.&language=fr&rows=100"

url2fr = "https://beta.hls-dhs-dss.ch/Search/Category?text=*&sort=hls.title_sortString&sortOrder=asc&collapsed=true&r=1&f_hls.lexicofacet_string=2%2F006800.006900.007800.&f_hls.placefacet_string=1%2F00200.03000&language=fr&rows=100&firstIndex="
url2de =        "https://beta.hls-dhs-dss.ch/Search/Category?text=*&sort=hls.title_sortString&sortOrder=asc&collapsed=true&r=1&f_hls.lexicofacet_string=2%2F006800.006900.007800.&f_hls.placefacet_string=1%2F00200.03000&language=de&rows=100&firstIndex="
url2de_schweiz = "https://beta.hls-dhs-dss.ch/Search/Category?text=*&sort=hls.title_sortString&sortOrder=asc&collapsed=true&r=1&f_hls.lexicofacet_string=2%2F006800.006900.007800.&f_hls.placefacet_string=0%2F00200.&language=de&rows=100&firstIndex="

communes_list = {}
communes_page_url = url2de_schweiz+"0"
communes_page = r.get(communes_page_url)
tree = html.fromstring(communes_page.content)
communes_count = int(tree.cssselect(".hls-search-header__count")[0].text_content())
for i in range(0,math.ceil(communes_count/100)+1):
    print("Getting communes search results, firstIndex=",100*i, "\nurl = ",communes_page_url)
    search_results = tree.cssselect(".search-result a")
    for c in search_results:
        cname = c.text_content().strip()
        communes_list[cname] = {"url" : c.xpath("@href")[0]}
        print("url for ",cname,": ",c.xpath("@href")[0])
    communes_page_url = url2de_schweiz+str(i*100)
    communes_page = r.get(communes_page_url)
    tree = html.fromstring(communes_page.content)

# fetching all the pages
for n,c in communes_list.items():
    if "page" not in c:
        print(c)
        da = r.get(baseurl+c["url"])
        c["page"] = da

# works well but misses units such as "communiers" (eclagnens, "chef de famille" (goumoens le jux):
hab_year_regex_fr = re.compile(r"\W(\d+(?:\W\d+)?)\W(.{0,5}\W)?en\W([1-2]\d{3})\W")
# takes too much bullshit as units
#hab_year_regex_fr =  re.compile(r"\W(\d+(?:\W\d+)?)\W(.{0,10}?\W)?en\W([1-2]\d{3})\W")
hab_year_regex_de =           re.compile(r"\W([1-2]\d{3}) (\d+(?:'\d+)?)(\W.+?)??(?:;|\.)")
hab_year_regex_de_no_ending = re.compile(r"\W([1-2]\d{3}) (\d+(?:'\d+)?)(\W.+?)??")
demographics_regex = re.compile("("+hab_year_regex_de_no_ending.pattern+";)")#+("+hab_year_regex_de_no_ending.pattern+";).")
for n,c in communes_list.items():
    print(n)
    ctree = html.fromstring(c["page"].content)
    c["text"] = reduce(lambda s,el: s+"\n\n"+el.text_content(), ctree.cssselect(".hls-article-text-unit p"), "")
    c["hab_year"] = hab_year_regex_de.findall(c["text"])
    c["hab_year"] = [{"year": hy[0], "pop": re.sub("'","",hy[1]), "unit": hy[2]} for hy in c["hab_year"]]
    c["mhab_year"] = list(hab_year_regex_de.finditer(c["text"]))
    c["demogr"] = demographics_regex.search(c["text"])

# looking at frequency tables of number of samples of demographics
hy_freq = [len(c["hab_year"]) for n,c in communes_list.items()]
hy_freq_table = {}
for hyf in hy_freq: hy_freq_table[hyf] = hy_freq_table[hyf]+1 if hyf in hy_freq_table else 1


#hy_maxstart = [max([g.start() for g in c["mhab_year"]]) for n,c in communes_list.items()]
#hy_maxstart = [max([0].extend([g.start() for g in c["mhab_year"] if g])) for n,c in communes_list.items()]
hy_start = [[g.start() for g in c["mhab_year"]] for n,c in communes_list.items()]
hy_maxstart = [100*round(max(ms)/100) for ms in hy_start if len(ms)>0]
maxstart_freq_table = {}
for ms in hy_maxstart: maxstart_freq_table[ms] = maxstart_freq_table[ms]+1 if ms in maxstart_freq_table else 1
# -> most are at 200 start, 2 thirds at 300 start -> cut at 500

communes_to_inspect = np.array([ms>500 for ms in hy_maxstart])
communes_names = np.array(list(communes_list.keys()))
communes_names = communes_names[[(len(ms)>0) for ms in hy_start]]
communes_to_inspect = communes_names[communes_to_inspect ]

# units
units = {}#set()
accepted_units_fr = ['hab. ', '', 'feux '] # given the stats all hy[1] different from 'hab. ', '' and 'feux ' are anomalies
accepted_units_de = [' Einw', '', ' Haushalte', ' Feuerstätten'] # given the stats all hy[1] different from 'hab. ', '' and 'feux ' are anomalies
unit_problem_counter=0
for n,c in communes_list.items():
    print("data validation for: "+n)
    time_previous = -1
    incoherent_time_serie = False
    current_unit = ""
    c["problem_time"] = 0
    c["problem_unit"] = 0
    # max start
    max_start = max([g.start() for g in c["mhab_year"]]+[0])
    c["problem_start"] = max_start if max_start>300 else False

    for hy in c["hab_year"]:
        # units validation
        units[hy["unit"]] = units[hy["unit"]] + 1 if hy["unit"] in units else 1
        hy["problem_unit"] = hy["unit"] not in accepted_units_de
        if hy["problem_unit"]:
            c["problem_unit"] = c["problem_unit"]+1
            unit_problem_counter = unit_problem_counter+1
        # add correct unit
        if hy["unit"]!=current_unit and hy["unit"]!="":
            current_unit = hy["unit"]
        hy["unit"] = current_unit

        # time validation:
        if int(hy["year"]) <= time_previous:
            c["problem_time"] = c["problem_time"]+1
            incoherent_time_serie = True
        hy["problem_time"] = incoherent_time_serie
        time_previous = int(hy["year"])

    # add whole matches text
    for hyi in range(0,len(c["hab_year"])):
        c["hab_year"][hyi]["original_text"] = c["mhab_year"][hyi].group()


problems_communes = [n for n,c in communes_list.items() if c["problem_start"]]# or c["problem_time"] or c["problem_unit"]]

communes_to_JSON = copy.deepcopy(communes_list)
for n,c in communes_to_JSON.items():
    del c["page"], c["demogr"], c["mhab_year"]
    c["name"] = n
communes_to_JSON = [c for n,c in communes_to_JSON.items()]

import json
with open('../1_pop_cleaning/communes_CH.json', 'w') as fp:
    json.dump(communes_to_JSON, fp)
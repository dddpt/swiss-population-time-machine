
# coding: utf-8

# In[ ]:


import pandas as pd
import sklearn as sk
import seaborn as sns
import json
import copy
import re
import numpy as np
import scipy.optimize as opt

sns.set(style="darkgrid")

# Load an example dataset with long-form data
#fmri = sns.load_dataset("fmri")

# Plot the responses for different events and regions
#plt = sns.lineplot(x="timepoint", y="signal",
#             hue="region", style="event",
#             data=fmri)


#plt.show()


# ## Load geolocalized points for communes

# In[ ]:


geo_communes_columns = ["place","zipcode","zusatzziffer","commune","bfsnr","canton","X","Y","language"]
geo_communes = pd.read_csv("PLZO_CSV_WGS84.csv",sep=";",encoding="utf-8", names=geo_communes_columns, header=0)
# was encoding windows1252 (pandas encoding="cp1252"), now encoding unknown -> ?!?
print(geo_communes.shape)

# Only keep gemeinde:
#geo_communes = geo_communes[geo_communes.place==geo_communes.commune]
#print(geo_communes.shape)

# Drop thurgau for now
geo_communes = geo_communes[geo_communes.canton!="TG"]
print(geo_communes.shape)

geo_communes.head()


# There are many big cities with tons of zipcodes:

# In[ ]:


#geo_communes[geo_communes.place=="Zürich"]
geo_communes[geo_communes.place.duplicated()].place.unique()


# Group cities with multiple zip codes together and average their geo coordinates in a single point:

# In[ ]:


def averageMultipleZips(df):
    df.Y = df.Y.mean()
    df.X = df.X.mean()
    zipcodes = df.zipcode.values.tolist()
    zipcodes = [zipcodes for z in zipcodes]
    #print("zipcodes")
    #print(zipcodes)
    #print("df.zipcode")
    #print(df.zipcode)
    #print("df")
    #print(df)
    df.zipcode = zipcodes
    return df.iloc[0]

geo_communes = geo_communes.groupby('place', group_keys=False).apply(averageMultipleZips)

del geo_communes.index.name
geo_communes.head()


# ## Load cleaned communes population data

# In[ ]:


columns_communes = ["name","canton","url","firstmention","hab_year","notes"]

with open('../2_pop_extrapolation/communes_units_converted.json', 'r') as cf:
    communes = json.load(cf)
    
dfcommunes = pd.DataFrame(communes)[columns_communes]
print(dfcommunes.shape)


# Drop thurgau for now
dfcommunes = dfcommunes[dfcommunes.canton!="TG"]
print(dfcommunes.shape)


# In[ ]:


type(communes[0])


# ### Hand correction for communes:

# In[ ]:


# correct canton value for Basel-Stadt and Moutier
dfcommunes.loc[dfcommunes.name=="Moutier","canton"]="BE"
dfcommunes.loc[dfcommunes.name=="Basel-Stadt","canton"]="BS"
# Rename communes to their nom d'usage in french:
dfcommunes.loc[dfcommunes.name=="Sitten","name"]="Sion"
dfcommunes.loc[dfcommunes.name=="Neuenburg","name"]="Neuchâtel"
dfcommunes.loc[dfcommunes.name=="Greyerz","name"]="Gruyères"


# In[ ]:


pd.reset_option('display.max_rows')
dfcommunes.to_csv("communes.csv", sep=";", index=False)


# ## Reshape DataFrame to 1 line per datapoint

# In[ ]:


columns_communes_datapoints = ["year","pop","unit","name","canton","url","firstmention","hab_year","notes"]
communes_datapoints = []

for commune in communes:
    for hy in commune["hab_year"]:
        hy_dict = copy.deepcopy(commune)
        hy_dict["year"] =  hy["year"]
        hy_dict["pop"] =  hy["pop"]
        hy_dict["unit"] = hy["unit"] if "unit" in hy else "undefined"
        communes_datapoints.append(hy_dict)

dfcommunes_datapoints = pd.DataFrame(communes_datapoints)[columns_communes_datapoints]
dfcommunes_datapoints = dfcommunes_datapoints.drop(columns=["hab_year"])
print(dfcommunes_datapoints.shape)

# Drop thurgau for now
dfcommunes_datapoints = dfcommunes_datapoints[dfcommunes_datapoints.canton!="TG"]
print(dfcommunes_datapoints.shape)

dfcommunes_datapoints


# In[ ]:


dfcommunes_datapoints.to_csv("communes_datapoints.csv", sep=";", index=False)


# ## merge communes and geo_communes using Hungarian algorithm
# https://docs.scipy.org/doc/scipy-0.19.0/reference/generated/scipy.optimize.linear_sum_assignment.html
# 
# ##### Create the fuzzy merke_keys:

# In[ ]:


from jellyfish import jaro_distance

#create unique list of names
cantons = [ c for c in dfcommunes.canton.unique() if c!="MA"]
test_canton = "BE"

communes_per_canton = {}
geo_communes_per_canton = {}
distance_matrix_per_canton = {}
merge_keys_per_canton = {}
for canton in cantons:
    communes_per_canton[canton] = dfcommunes.name[dfcommunes.canton == canton].unique()
    geo_communes_per_canton[canton] = geo_communes.place[geo_communes.canton == canton].unique()
    
    # do the fuzzy merge_keys
    #if canton==test_canton:
    def distance(i, j):
        return 1-jaro_distance(communes_per_canton[canton][np.int(i)], geo_communes_per_canton[canton][np.int(j)])

    jaroDistanceProxy = np.vectorize(distance)
    distance_matrix_per_canton[canton] = np.fromfunction(
        jaroDistanceProxy,
        shape=(len(communes_per_canton[canton]),
               len(geo_communes_per_canton[canton])))

    fuzzy_merge = opt.linear_sum_assignment(distance_matrix_per_canton[canton])
    merge_keys_per_canton[canton] = {
        communes_per_canton[canton][fuzzy_merge[0][i]]:
        geo_communes_per_canton[canton][fuzzy_merge[1][i]]
        for i in range(0,len(fuzzy_merge[0]))
    }
        
    
    
    

print(communes_per_canton[test_canton])
print(geo_communes_per_canton[test_canton])
merge_keys_per_canton[test_canton]


# ### Hand-correction for wrong keys

# In[ ]:


merge_keys_per_canton["BE"]['Biel (BE,'] = 'Biel/Bienne'
merge_keys_per_canton["BE"]['Biel (BE,']


# #### Do the fuzzy merge:
# ...on dfcommunes:

# In[ ]:


dfcommunes["place"] = ""

for index, row in dfcommunes.iterrows():
    if row["canton"]!="MA" and row["name"] in merge_keys_per_canton[row["canton"]]:
        dfcommunes.loc[index,"place"] = merge_keys_per_canton[row["canton"]][row["name"]] 
    #print(dfcommunes.iloc[index])

#dfcommunes.canton=="MA"
result_communes = pd.merge(dfcommunes, geo_communes, on='place', how='left')
result_communes.to_csv("communes_geo.csv", sep=";", index=False)

result_communes


# ...on dfcommunes_datapoints:

# In[ ]:


dfcommunes_datapoints["place"] = ""

for index, row in dfcommunes_datapoints.iterrows():
    if row["canton"]!="MA" and row["name"] in merge_keys_per_canton[row["canton"]]:
        dfcommunes_datapoints.loc[index,"place"] = merge_keys_per_canton[row["canton"]][row["name"]] 
    #print(dfcommunes.iloc[index])

#dfcommunes.canton=="MA"
result_communes_datapoints = pd.merge(dfcommunes_datapoints, geo_communes, on='place', how='left')
result_communes_datapoints.to_csv("communes_datapoints_geo.csv", sep=";", index=False)

result_communes_datapoints


# In[ ]:


print(result_communes.shape)
print(dfcommunes.shape)


# In[ ]:


print("Nb of communes that didn't get a geo localisation:")
print(np.sum(dfcommunes.place==""))
dfcommunes[dfcommunes.place==""]


#!/bin/sh
# 
# Apache License Version 2.0, January 2004
# Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)
# Credits: Didier Dupertuis


# small script to remove the output of all jupyter notebooks

# get all .ipynb files (not optimal as force to commit changes to all .ipynb files in every commits):
ipynbfiles=$(find . -type f | grep ".ipynb" | grep -v "/venv/" | grep -v "/.ipynb_checkpoints/")
# only get staged .ipynb files:
#ipynbfiles=$(git diff --name-only --cached | grep ".ipynb")
ipynbfilespy=$(echo $ipynbfiles | awk '{gsub(/\.ipynb/,".py");}1')

# create&stage python version of juypter notebooks:
jupyter nbconvert --ClearOutputPreprocessor.enabled=True --to python $ipynbfiles
git add $ipynbfilespy

# clear out output of staged notebooks & restage them without outputs:
# note: if the notebook is opened at the same time, it will display a warning that
# the notebook has changed on disk. It is normal and it can be safely "overwritten".
jupyter nbconvert --ClearOutputPreprocessor.enabled=True --inplace $ipynbfiles
git add $ipynbfiles


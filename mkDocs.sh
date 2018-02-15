#!/bin/bash

## CREATE TARGET DIRECTORY ##
rm -rf target
mkdir target
mkdir target/generated-docs

## GENERATE THE TYPESCRIPT DOCUMENTATION##
docker run --rm -it -v `pwd`:/docs gisaia/typedocgen:0.0.4 generatedoc src/components

## GENERATE THE CSS DOCUMENTATION##
echo "# Customize your components style" > style.md
for file in $(find src/components -name '*.css')
do

  ## ADD TITLE FOR EACH CSS FILE
  if  [[ $file == src/components/powerbars* ]]  ;
  then
      echo "## PowerbarsComponent" >> style.md
  fi

  if [[ $file == src/components/mapgl/mapgl* ]]
  then
      echo "## MapglComponent" >> style.md
  fi

  if [[ $file == src/components/results/result-item* ]]
  then
      echo "## ResultItemComponent" >> style.md
  fi

  if [[ $file == src/components/results/result-detailed-item* ]]
  then
      echo "## ResultDetailedItemComponent" >> style.md
  fi

  if [[ $file == src/components/results/result-grid-tile* ]]
  then
      echo "## ResultGridTileComponent" >> style.md
  fi

  if [[ $file == src/components/results/result-detailed-grid* ]]
  then
      echo "## ResultDetailedGridComponent" >> style.md
  fi

  if [[ $file == src/components/results/result-list/* ]]
  then
      echo "## ResultListComponent" >> style.md
  fi

  if [[ $file == src/components/results/result-filter/* ]]
  then
      echo "## ResultFilterComponent" >> style.md
  fi

  if [[ $file == src/components/histogram/* ]]
  then
      echo "## HistogramComponent" >> style.md
  fi

  ## "DRAW" THE HEADER OF THE
  echo "| Css class name | Description |" >> style.md
  echo "| -------------- | ----------- |" >> style.md

  ## EXTRACT DOCUMENTATION FROM CSS
  grep "/\\*public\\*/" $file | sort | awk -F "/\\*public\\*/" '{print "| `"$1"` | "$2" |"}' >> style.md
done

## REMOVE /* AND */ CARACHTERS
sed 's|[/*]||g' style.md > style-intermediate.md
sed 's|[,]||g' style-intermediate.md > target/generated-docs/style-your-components.md

rm style.md
rm style-intermediate.md

## MOVE ALL THE DOCUMENTATION TO THE 'generated-docs' FOLDER ##
mv typedoc_docs/* target/generated-docs
if [ -d ./docs ] ; then
    cp -r docs/* target/generated-docs
fi

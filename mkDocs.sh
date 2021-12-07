#!/bin/bash -e

## CREATE TARGET DIRECTORY ##
rm -rf target
mkdir target
mkdir target/generated-docs

## GENERATE THE TYPESCRIPT DOCUMENTATION##
docker run -a STDERR --rm -i -v `pwd`:/docs gisaia/typedocgen:0.0.7 generatedoc projects/arlas-components/src/lib/components

## GENERATE THE CSS DOCUMENTATION##
echo "# Customize your components style" > style.md
for file in $(find projects/arlas-components/src/lib/components -name '*.css')
do

  echo "" >> style.md
  ## ADD TITLE FOR EACH CSS FILE
  if  [[ $file == projects/arlas-components/src/lib/components/powerbars* ]]  ;
  then
      echo "## PowerbarsComponent" >> style.md
  fi

  if [[ $file == projects/arlas-components/src/lib/components/mapgl/mapgl* ]]
  then
      echo "## MapglComponent" >> style.md
  fi

  if [[ $file == projects/arlas-components/src/lib/components/results/result-item* ]]
  then
      echo "## ResultItemComponent" >> style.md
  fi

  if [[ $file == projects/arlas-components/src/lib/components/results/result-detailed-item* ]]
  then
      echo "## ResultDetailedItemComponent" >> style.md
  fi

  if [[ $file == projects/arlas-components/src/lib/components/results/result-grid-tile* ]]
  then
      echo "## ResultGridTileComponent" >> style.md
  fi

  if [[ $file == projects/arlas-components/src/lib/components/results/result-detailed-grid* ]]
  then
      echo "## ResultDetailedGridComponent" >> style.md
  fi

  if [[ $file == projects/arlas-components/src/lib/components/results/result-list/* ]]
  then
      echo "## ResultListComponent" >> style.md
  fi

  if [[ $file == projects/arlas-components/src/lib/components/results/result-filter/* ]]
  then
      echo "## ResultFilterComponent" >> style.md
  fi

  if [[ $file == projects/arlas-components/src/lib/components/histogram/* ]]
  then
      echo "## HistogramComponent" >> style.md
  fi

  ## "DRAW" THE HEADER OF THE
  echo "" >> style.md
  echo "| Css class name | Description |" >> style.md
  echo "| -------------- | ----------- |" >> style.md

  ## EXTRACT DOCUMENTATION FROM CSS
  grep "@doc" $file | sort | awk -F "/\*( *)@doc" '{print "| `"$1"` | "$2" |"}' | sed 's|/\*||g'| sed 's|\*/||g' >> style.md
  echo "" >> style.md
done

mv style.md target/generated-docs/style-your-components.md
## MOVE ALL THE DOCUMENTATION TO THE 'generated-docs' FOLDER ##
mv typedoc_docs/* target/generated-docs
cp CHANGELOG.md target/generated-docs/CHANGELOG_ARLAS-web-components.md
if [ -d ./docs ] ; then
    cp -r docs/* target/generated-docs
fi

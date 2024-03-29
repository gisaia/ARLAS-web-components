#!/bin/bash
set -e
npm run i18n:init
npm run i18n:extract
if grep '""' projects/arlas-components/assets/i18n/fr.json
then
    # code if found
    echo "A i18n key in projects/arlas-components/assets/i18n/fr.json has no value, please fix it."
    exit 1
fi
if grep '""' projects/arlas-components/assets/i18n/en.json
then
    # code if found
    echo "A i18n key in projects/arlas-components/assets/i18n/en.json has no value, please fix it."
    exit 1
fi
if grep '""' projects/arlas-components/assets/i18n/es.json
then
    # code if found
    echo "A i18n key in projects/arlas-components/assets/i18n/es.json has no value, please fix it."
    exit 1
fi

#!/bin/bash
set -e

usage(){
	echo "Usage: ./release.sh -version='1.0.0' -ref_branch=develop -s=beta|rc|stable"
	echo " -version     arlas-web-components version release,level of evolution"
    echo " -s           Stage of the release : beta | rc | stable. If --stage is 'rc' or 'beta', there is no merge of develop into master (if -ref_branch=develop)"
    echo " -i           The released version will be : [x].[y].[z]-beta.[n] OR  [x].[y].[z]-rc.[n] according to the given -s"
	echo " -ref_branch  From which branch to start the release."
    echo "    Add -ref_branch=develop for a new official release"
    echo "    Add -ref_branch=x.x.x for a maintenance release"
	exit 1
    return 0
}

send_chat_message(){
    MESSAGE=$1
    if [[ -z "$GOOGLE_CHAT_RELEASE_CHANEL" ]] ; then
        echo "Environement variable GOOGLE_CHAT_RELEASE_CHANEL is not definied ... skipping message publishing"
    else
        DATA='{"text":"'${MESSAGE}'"}'
        echo $DATA
        curl -X POST --header "Content-Type:application/json" $GOOGLE_CHAT_RELEASE_CHANEL -d "${DATA}"
    fi
    return 0
}

uninstall_dependencies(){
    echo "=> Uninstall arlas-web-components library in arlas-map"
    npm uninstall arlas-web-components --workspace=projects/arlas-map

    echo "=> Uninstall arlas-map library in arlas-maplibre"
    npm uninstall arlas-map --workspace=projects/arlas-maplibre

    echo "=> Uninstall arlas-map library in arlas-mapbox"
    npm uninstall arlas-map --workspace=projects/arlas-mapbox
    return O
}


# ARGUMENTS $1 = version  $2 = ref_branch $3 stage $4 stage iteration (for beta & rc)
release_prod(){

    local version=$1
    local branch=$2
    local stage=$3
    local stage_iteration=$4

    if [[ "${stage}" == "rc" ]] || [[ "${stage}" == "beta" ]];
        then
        local version="${version}-${stage}.${stage_iteration}"
    fi

    echo "=> Get "$branch" branch of ARLAS-web-components project"
    git fetch
    git checkout "$branch"
    git pull origin "$branch"
    echo "=> Test to lint and build the project on "$branch" branch"
    npm --no-git-tag-version version ${version}
    npm --no-git-tag-version --prefix projects/arlas-components version ${version}
    npm --no-git-tag-version --prefix projects/arlas-map version ${version}
    npm --no-git-tag-version --prefix projects/arlas-maplibre version ${version}
    npm --no-git-tag-version --prefix projects/arlas-mapbox version ${version}
    echo "=> Installing"
    uninstall_dependencies
    npm install

    echo "=> Update arlas-web-components library in arlas-map"
    npm install --save-exact arlas-web-components@${version} --workspace=projects/arlas-map

    echo "=> Update arlas-map library in arlas-maplibre"
    npm install --save-exact arlas-map@${version} --workspace=projects/arlas-maplibre

    echo "=> Update arlas-map library in arlas-mapbox"
    npm install --save-exact arlas-map@${version} --workspace=projects/arlas-mapbox

    echo "=> Build the ARLAS-web-components library"

    npm run lint
    npm run build-components
    npm run build-map
    npm run build-maplibre
    npm run build-mapbox

    echo "=> Tag version $version"
    git add .
    git config --local user.email "github-actions[bot]@users.noreply.github.com"
    git config --local user.name "github-actions[bot]"
    commit_message_release="Release prod version $version"
    git tag -a v"$version" -m "$commit_message_release"
    git push origin v"$version"

    echo "=> Generate CHANGELOG"
    docker run --rm -v "$(pwd)":/usr/local/src/your-app gisaia/github-changelog-generator:latest github_changelog_generator \
      -u gisaia -p ARLAS-web-components --token ${GITHUB_CHANGELOG_TOKEN} --no-pr-wo-labels --no-issues-wo-labels --no-compare-link --no-unreleased \
      --issue-line-labels conf,documentation,CI,ALL,DONUT,RESULTLIST,POWERBARS,HISTOGRAM,MAP,METRIC,METRICS-TABLE,SWIMLANE,MAP_SETTINGS \
      --exclude-labels type:duplicate,type:question,type:wontfix,type:invalid \
      --bug-labels type:bug --enhancement-labels type:enhancement --breaking-labels type:breaking \
      --enhancement-label "**New stuff:**" --issues-label "**Miscellaneous:**" \
      --exclude-tags-regex 'rc|beta' \
      --since-tag v4.0.0

    echo "  -- Remove tag to add generated CHANGELOG"
    git tag -d v"$version"
    git push origin :v"$version"

    echo "  -- Commit release version"
    git commit -a -m "$commit_message_release" --allow-empty
    git tag v"$version"
    git push origin v"$version"
    git push origin "$branch"

    cp README-NPM.md dist/arlas-web-components/README.md
    cp LICENSE.txt dist/arlas-web-components/LICENSE
    cp LICENSE.txt dist/arlas-map/LICENSE
    cp LICENSE.txt dist/arlas-maplibre/LICENSE
    cp LICENSE.txt dist/arlas-mapbox/LICENSE
    cd dist/arlas-web-components/

    echo "=> Publish arlas-web-components to npm"
    if [[ "${stage}" == "rc" ]] || [[ "${stage}" == "beta" ]];
        then
        echo "  -- tagged as ${stage}"
        npm publish --tag=${stage}
    else
        npm publish
    fi
    cd ../..

    cd dist/arlas-map/

    echo "=> Publish arlas-map to npm"
    if [[ "${stage}" == "rc" ]] || [[ "${stage}" == "beta" ]];
        then
        echo "  -- tagged as ${stage}"
        npm publish --tag=${stage}
    else
        npm publish
    fi
    cd ../..

    cd dist/arlas-maplibre/

    echo "=> Publish arlas-maplibre to npm"
    if [[ "${stage}" == "rc" ]] || [[ "${stage}" == "beta" ]];
        then
        echo "  -- tagged as ${stage}"
        npm publish --tag=${stage}
    else
        npm publish
    fi
    cd ../..

    cd dist/arlas-mapbox/

    echo "=> Publish arlas-mapbox to npm"
    if [[ "${stage}" == "rc" ]] || [[ "${stage}" == "beta" ]];
        then
        echo "  -- tagged as ${stage}"
        npm publish --tag=${stage}
    else
        npm publish
    fi
    cd ../..
    rm -rf dist
    if [[ "$branch" == "develop" ]] && [[ "$stage" == "stable" ]];
        then
        echo "=> Merge develop into master"
        git checkout master
        git pull origin master
        git merge origin/develop
        git push origin master

        git checkout develop
        git pull origin develop
        git rebase origin/master
    fi
    IFS='.' read -ra TAB <<< "$version"
    major=${TAB[0]}
    minor=${TAB[1]}
    newminor=$(( $minor + 1 ))
    newDevVersion=${major}.${newminor}.0
    npm --no-git-tag-version version ""$newDevVersion"-dev0"

    # remove released dependencies and keep based on npm workspaces for dev.
    uninstall_dependencies

    git add .
    commit_message="update package.json to"-"$newDevVersion"
    git commit -m "$commit_message" --allow-empty
    git push origin "$branch"
    echo "Well done :)"
    if [[ "$stage" == "stable" ]] || [[ "$stage" == "rc" ]];
        then
        send_chat_message "Release of arlas-web-components, version ${version}"
    fi
    return 0
}

for i in "$@"
do
case $i in
    -version=*)
    RELEASE_VERSION="${i#*=}"
    shift # past argument=value
    ;;
    -ref_branch=*)
    REF_BRANCH="${i#*=}"
    shift # past argument=value
    ;;
    -s=*)
    STAGE="${i#*=}"
    shift # past argument=value
    ;;
    -i=*)
    STAGE_ITERATION="${i#*=}"
    shift # past argument=value
    ;;
    *)
            # unknown option
    ;;
esac
done

ERROR_DELIMITOR="###########"

if [[ -z ${REF_BRANCH+x} ]];
    then
        echo ""
        echo $ERROR_DELIMITOR
        echo "Reference branch is missing."
        echo "  Add -ref_branch=develop for a new official release"
        echo "  Add -ref_branch=x.x.x for a maintenance release"
        echo $ERROR_DELIMITOR
        echo ""
        usage;
fi

if [[ -z ${STAGE+x} ]];
    then
        echo ""
        echo $ERROR_DELIMITOR
        echo "Stage is missing."
        echo "  Add -s=beta|rc|stable to define the release stage"
        echo $ERROR_DELIMITOR
        echo ""
        usage;
fi

if [[ "${STAGE}" != "beta" ]] && [[ "${STAGE}" != "rc" ]] && [[ "${STAGE}" != "stable" ]];
    then
        echo ""
        echo $ERROR_DELIMITOR
        echo "Stage ${STAGE} is invalid."
        echo "  Add --stage=beta|rc|stable to define the release stage"
        echo $ERROR_DELIMITOR
        echo ""
        usage;
fi

echo $STAGE
echo $STAGE_ITERATION
if [[ "${STAGE}" == "beta" || "${STAGE}" == "rc" ]] && [[ -z ${STAGE_ITERATION+x} ]];
    then
        echo ""
        echo $ERROR_DELIMITOR
        echo "You chose to release this version as ${STAGE}."
        echo "Stage iteration is missing."
        echo "  Add -i=n, the released version will be : [x].[y].[z]-${STAGE}.[n]"
        echo $ERROR_DELIMITOR
        echo ""
        usage;
fi

if [[ ! -z ${RELEASE_VERSION+x} ]];
    then
        echo "Release ARLAS-web-components version                    : ${RELEASE_VERSION}";
        release_prod ${RELEASE_VERSION} ${REF_BRANCH} ${STAGE} ${STAGE_ITERATION}
fi

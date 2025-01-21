#!/bin/bash
set -e

usage(){
	echo "Usage: ./release.sh -version='1.0.0' -ref_branch=develop --stage=beta|rc|stable"
	echo " -version     arlas-web-components version release,level of evolution"
  echo " -s|--stage    Stage of the release : beta | rc | stable. If --stage is 'rc' or 'beta', there is no merge of develop into master (if -ref_branch=develop)"
  echo " -i|--stage_iteration=n, the released version will be : [x].[y].[z]-beta.[n] OR  [x].[y].[z]-rc.[n] according to the given --stage"
	echo " -ref_branch | --reference_branch  from which branch to start the release."
  echo "    Add -ref_branch=develop for a new official release"
  echo "    Add -ref_branch=x.x.x for a maintenance release"
	exit 1
}

send_chat_message(){
    MESSAGE=$1
    if [ -z "$GOOGLE_CHAT_RELEASE_CHANEL" ] ; then
        echo "Environement variable GOOGLE_CHAT_RELEASE_CHANEL is not definied ... skipping message publishing"
    else
        DATA='{"text":"'${MESSAGE}'"}'
        echo $DATA
        curl -X POST --header "Content-Type:application/json" $GOOGLE_CHAT_RELEASE_CHANEL -d "${DATA}"
    fi
}


# ARGUMENTS $1 = VERSION  $2 = ref_branch $3 stage $4 stage iteration (for beta & rc)
releaseProd(){

    local VERSION=$1
    local BRANCH=$2
    local STAGE_LOCAL=$3
    local STAGE_ITERATION_LOCAL=$4

    if [ "${STAGE_LOCAL}" == "rc" ] || [ "${STAGE_LOCAL}" == "beta" ];
        then
        local VERSION="${VERSION}-${STAGE_LOCAL}.${STAGE_ITERATION_LOCAL}"
    fi

    echo "=> Get "$BRANCH" branch of ARLAS-web-components project"
    git fetch
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    echo "=> Test to lint and build the project on "$BRANCH" branch"
    npm --no-git-tag-version version ${VERSION}
    npm --no-git-tag-version --prefix projects/arlas-components version ${VERSION}
    npm --no-git-tag-version --prefix projects/arlas-map version ${VERSION}
    npm --no-git-tag-version --prefix projects/arlas-maplibre version ${VERSION}
    npm --no-git-tag-version --prefix projects/arlas-mapbox version ${VERSION}
    echo "=> Installing"
    npm install

    echo "=> Update arlas-web-components library in arlas-map"
    cd projects/arlas-map
    npm install --save-exact arlas-web-components@${VERSION}
    cd ../..
    echo "=> Update arlas-map library in arlas-maplibre"

    cd projects/arlas-maplibre
    npm install --save-exact arlas-map@${VERSION}
    cd ../..

    cd projects/arlas-mapbox
    npm install --save-exact arlas-map@${VERSION}
    cd ../..

    echo "=> Build the ARLAS-web-components library"
   
    npm run lint
    npm run build-components
    npm run build-map
    npm run build-maplibre
    npm run build-mapbox

    echo "=> Tag version $VERSION"
    git add .
    git config --local user.email "github-actions[bot]@users.noreply.github.com"
    git config --local user.name "github-actions[bot]"
    commit_message_release="Release prod version $VERSION"
    git tag -a v"$VERSION" -m "$commit_message_release"
    git push origin v"$VERSION"

    echo "=> Generate CHANGELOG"
    docker run --rm -v "$(pwd)":/usr/local/src/your-app gisaia/github-changelog-generator:latest github_changelog_generator \
      -u gisaia -p ARLAS-web-components --token ${GITHUB_CHANGELOG_TOKEN} --no-pr-wo-labels --no-issues-wo-labels --no-unreleased \
      --issue-line-labels conf,documentation,CI,ALL,DONUT,RESULTLIST,POWERBARS,HISTOGRAM,MAP \
      --exclude-labels type:duplicate,type:question,type:wontfix,type:invalid \
      --bug-labels type:bug --enhancement-labels type:enhancement --breaking-labels type:breaking \
      --enhancement-label "**New stuff:**" --issues-label "**Miscellaneous:**" \
      --exclude-tags v3.1.2 --since-tag v4.0.0

    echo "  -- Remove tag to add generated CHANGELOG"
    git tag -d v"$VERSION"
    git push origin :v"$VERSION"

    echo "  -- Commit release version"
    git commit -a -m "$commit_message_release" --allow-empty
    git tag v"$VERSION"
    git push origin v"$VERSION"
    git push origin "$BRANCH"

    cp README-NPM.md dist/arlas-web-components/README.md
    cp LICENSE.txt dist/arlas-web-components/LICENSE
    cp LICENSE.txt dist/arlas-map/LICENSE
    cp LICENSE.txt dist/arlas-maplibre/LICENSE
    cp LICENSE.txt dist/arlas-mapbox/LICENSE
    cd dist/arlas-web-components/

    echo "=> Publish arlas-web-components to npm"
    if [ "${STAGE_LOCAL}" == "rc" ] || [ "${STAGE_LOCAL}" == "beta" ];
        then
        echo "  -- tagged as ${STAGE_LOCAL}"
        npm publish --tag=${STAGE_LOCAL}
    else
        npm publish
    fi
    cd ../..

    cd dist/arlas-map/

    echo "=> Publish arlas-map to npm"
    if [ "${STAGE_LOCAL}" == "rc" ] || [ "${STAGE_LOCAL}" == "beta" ];
        then
        echo "  -- tagged as ${STAGE_LOCAL}"
        npm publish --tag=${STAGE_LOCAL}
    else
        npm publish
    fi
    cd ../..

    cd dist/arlas-maplibre/

    echo "=> Publish arlas-maplibre to npm"
    if [ "${STAGE_LOCAL}" == "rc" ] || [ "${STAGE_LOCAL}" == "beta" ];
        then
        echo "  -- tagged as ${STAGE_LOCAL}"
        npm publish --tag=${STAGE_LOCAL}
    else
        npm publish
    fi
    cd ../..

    cd dist/arlas-mapbox/

    echo "=> Publish arlas-mapbox to npm"
    if [ "${STAGE_LOCAL}" == "rc" ] || [ "${STAGE_LOCAL}" == "beta" ];
        then
        echo "  -- tagged as ${STAGE_LOCAL}"
        npm publish --tag=${STAGE_LOCAL}
    else
        npm publish
    fi
    cd ../..
    rm -rf dist
    if [ "$BRANCH" == "develop" ] && [ "$STAGE_LOCAL" == "stable" ];
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
    IFS='.' read -ra TAB <<< "$VERSION"
    major=${TAB[0]}
    minor=${TAB[1]}
    newminor=$(( $minor + 1 ))
    newDevVersion=${major}.${newminor}.0
    npm --no-git-tag-version version ""$newDevVersion"-dev0"

    # remove released dependencies and keep based on npm workspaces for dev.
    cd projects/arlas-map
    npm uninstall arlas-web-components
    cd ../..
    echo "=> Update arlas-map library in arlas-maplibre"

    cd projects/arlas-maplibre
    npm uninstall arlas-map
    cd ../..

    cd projects/arlas-mapbox
    npm uninstall arlas-map
    cd ../..

    
    git add .
    commit_message="update package.json to"-"$newDevVersion"
    git commit -m "$commit_message" --allow-empty
    git push origin "$BRANCH"
    echo "Well done :)"
    if [ "$STAGE_LOCAL" == "stable" ] || [ "$STAGE_LOCAL" == "rc" ];
        then
        send_chat_message "Release of arlas-web-components, version ${VERSION}"
    fi

}

# ARGUMENTS $1 = VERSION  $2 = patch/minor/major $3 = PROJECT $4 ref_branch $5 is beta $6 stage_iteration
# ARGUMENTS $1 = VERSION  $2 = ref_branch $3 stage $4 stage iteration (for beta & rc)
release(){
    releaseProd $1 $2 $3 $4
}
STAGE="stable"
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

if [ -z ${REF_BRANCH+x} ];
    then
        echo ""
        echo "###########"
        echo "-ref_branch is missing."
        echo "  Add -ref_branch=develop for a new official release"
        echo "  Add -ref_branch=x.x.x for a maintenance release"
        echo "###########"
        echo ""
        usage;
fi

if [ -z ${STAGE+x} ];
    then
        echo ""
        echo "###########"
        echo "-s=*|--stage* is missing."
        echo "  Add --stage=beta|rc|stable to define the release stage"
        echo "###########"
        echo ""
        usage;
fi

if [ "${STAGE}" != "beta" ] && [ "${STAGE}" != "rc" ] && [ "${STAGE}" != "stable" ];
    then
        echo ""
        echo "###########"
        echo "Stage ${STAGE} is invalid."
        echo "  Add --stage=beta|rc|stable to define the release stage"
        echo "###########"
        echo ""
        usage;
fi

if [ "${STAGE}" == "beta" ] || [ "${STAGE}" == "rc" ];
    then
        if [ -z ${STAGE_ITERATION+x} ];
            then
                echo ""
                echo "###########"
                echo "You chose to release this version as ${STAGE}."
                echo "--stage_iteration is missing."
                echo "  Add -i=n|--stage_iteration=n, the released version will be : [x].[y].[z]-${STAGE}.[n]"
                echo "###########"
                echo ""
                usage;
        fi
fi

if [ ! -z ${RELEASE_VERSION+x} ];
    then
        echo "Release ARLAS-web-components version                    : ${RELEASE_VERSION}";
        release ${RELEASE_VERSION} ${REF_BRANCH} ${STAGE} ${STAGE_ITERATION}
fi

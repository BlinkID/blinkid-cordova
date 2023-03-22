#!/bin/bash

# enter into ios project folder
HERE="$(dirname "$(test -L "$0" && readlink "$0" || echo "$0")")"
pushd "${HERE}/../src/ios/" > /dev/null

LINK='https://github.com/BlinkID/blinkid-ios/releases/download/v6.1.2/BlinkID.xcframework.zip'
FILENAME='BlinkID.xcframework.zip'

# check if BlinkID framework and bundle already exist
wget --version > /dev/null 2>&1 || { echo "ERROR: couldn't download BlinkID framework, install wget" &&  exit 1; }
wget -O "${FILENAME}" "${LINK}" -nv --show-progress || ( echo "ERROR: couldn't download BlinkID framework, Something went wrong while downloading framework from ${LINK}" && exit 1 )

if [ -d 'BlinkID.bundle' ] ; then
    rm -rf BlinkID.bundle && echo "Removing BlinkID.bundle"
fi

if [ -d 'BlinkID.framework' ] ; then
    rm -rf BlinkID.framework && echo "Removing BlinkID.framework"
fi 


if [ -d 'BlinkID.xcframework' ] ; then
    rm -rf BlinkID.xcframework && echo "Removing BlinkID.xcframework"
fi 

echo "Unzipping ${FILENAME}"
unzip -v > /dev/null 2>&1 || { echo "ERROR: couldn't unzip BlinkID xcframework, install unzip" && exit 1; }
unzip -o "${FILENAME}" > /dev/null 2>&1 && echo "Unzipped ${FILENAME}"

echo "Removing unnecessary files"

rm -rfv BlinkID.xcframework.zip >/dev/null 2>&1
rm "${FILENAME}" >/dev/null 2>&1

popd

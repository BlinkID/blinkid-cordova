#!/bin/bash

# enter into ios project folder
HERE="$(dirname "$(test -L "$0" && readlink "$0" || echo "$0")")"
pushd "${HERE}/../src/ios/" > /dev/null

LINK='https://github.com/BlinkID/blinkid-ios/releases/download/v5.16.1/Microblink.xcframework.zip'
FILENAME='Microblink.xcframework.zip'

# check if Microblink framework and bundle already exist
wget --version > /dev/null 2>&1 || { echo "ERROR: couldn't download Microblink framework, install wget" &&  exit 1; }
wget -O "${FILENAME}" "${LINK}" -nv --show-progress || ( echo "ERROR: couldn't download Microblink framework, Something went wrong while downloading framework from ${LINK}" && exit 1 )

if [ -d 'Microblink.bundle' ] ; then
    rm -rf Microblink.bundle && echo "Removing Microblink.bundle"
fi

if [ -d 'Microblink.framework' ] ; then
    rm -rf Microblink.framework && echo "Removing Microblink.framework"
fi 


if [ -d 'Microblink.xcframework' ] ; then
    rm -rf Microblink.xcframework && echo "Removing Microblink.xcframework"
fi 

echo "Unzipping ${FILENAME}"
unzip -v > /dev/null 2>&1 || { echo "ERROR: couldn't unzip Microblink xcframework, install unzip" && exit 1; }
unzip -o "${FILENAME}" > /dev/null 2>&1 && echo "Unzipped ${FILENAME}"

echo "Removing unnecessary files"

rm -rfv Microblink.xcframework.zip >/dev/null 2>&1
rm "${FILENAME}" >/dev/null 2>&1

popd

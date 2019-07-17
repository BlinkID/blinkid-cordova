#!/bin/bash

# enter into ios project folder
HERE="$(dirname "$(test -L "$0" && readlink "$0" || echo "$0")")"
pushd "${HERE}/../src/ios/" > /dev/null

LINK='https://github.com/BlinkID/blinkid-ios/releases/download/v4.10.0/blinkid-ios_v4.10.0.zip'
FILENAME='blinkid-ios.zip'

# check if Microblink framework and bundle already exist
wget --version > /dev/null 2>&1 || { echo "ERROR: couldn't download Microblink framework, install wget" &&  exit 1; }
wget -O "${FILENAME}" "${LINK}" -nv --show-progress || ( echo "ERROR: couldn't download Microblink framework, Something went wrong while downloading framework from ${LINK}" && exit 1 )

echo "Unzipping ${FILENAME}"
unzip -v > /dev/null 2>&1 || { echo "ERROR: couldn't unzip Microblink framework, install unzip" && exit 1; }
unzip -o "${FILENAME}" > /dev/null 2>&1 && echo "Unzipped ${FILENAME}"

if [ -d 'Microblink.bundle' ] ; then
    rm -rf Microblink.bundle && echo "Removing Microblink.bundle"
fi

if [ -d 'Microblink.framework' ] ; then
    rm -rf Microblink.framework && echo "Removing Microblink.framework"
fi 

cd blinkid-ios || exit 1

mv -f Microblink.framework ../Microblink.framework
mv -f Microblink.bundle ../Microblink.bundle

cd ..

echo "Removing unnecessary files"

rm -rfv blinkid-ios >/dev/null 2>&1
rm "${FILENAME}" >/dev/null 2>&1

popd

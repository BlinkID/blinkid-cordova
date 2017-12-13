#!/bin/bash

# enter into ios project folder
pushd src/ios/

VERSION='2.14.0'

# check if Microblink framework and bundle already exist
if [ ! -d 'blinkid-ios' ] ; then
    echo "Cloning repo with Microblink framework v${VERSION}"
    # clone blinkID repository
    git clone "https://github.com/BlinkID/blinkid-ios.git"
fi

echo "Checking out v${VERSION}"

cd blinkid-ios || exit 1
git checkout "v${VERSION}" >/dev/null 2>&1 || exit 1

mv Microblink.framework ../Microblink.framework
mv Microblink.bundle ../Microblink.bundle

echo "Deleting unnecessary files"
rm -rfv * >/dev/null 2>&1

mv ../Microblink.framework Microblink.framework
mv ../Microblink.bundle Microblink.bundle

popd

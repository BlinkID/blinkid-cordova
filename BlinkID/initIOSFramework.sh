#!/bin/bash

# enter into ios project folder
cd src/ios/

# check if Microblink framework and bundle already exist
if [ ! -d 'blinkid-ios' ] ; then

    VERSION='2.12.0'

    echo "Cloning repo with Microblink framework v${VERSION}"
    # clone blinkID repository
    git clone "git@github.com:BlinkID/blinkid-ios.git"
    cd blinkid-ios
    git checkout "v${VERSION}"

    mv Microblink.framework ../Microblink.framework
    mv Microblink.bundle ../Microblink.bundle

    rm -rfv *

    mv ../Microblink.framework Microblink.framework
    mv ../Microblink.bundle Microblink.bundle

    cd ..

fi

cd ../../
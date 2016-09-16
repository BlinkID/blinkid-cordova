#!/bin/bash

# position to a relative path
HERE="$(dirname "$(test -L "$0" && readlink "$0" || echo "$0")")"
pushd $HERE >> /dev/null

# remove any existing code
rm -rf BlinkIdDemo

# create a sample application
cordova create BlinkIdDemo com.microblink.blinkid BlinkIdDemo

# enter into demo project folder
cd BlinkIdDemo

# add the BlinkID plugin
cordova plugin add ../BlinkID

# add ios, android and wp8 support to the project
cordova platform add android
cordova platform add ios
# cordova platform add wp8

# copy content of the www folder
cp  -f -r ../www .

# build app
cordova build

# how to run
echo "To run iOS demo application open Xcode project BlinkIdDemo.xcodeproj"
echo "To run Android demo application, position to BlinkIdDemo folder and type: cordova run android"

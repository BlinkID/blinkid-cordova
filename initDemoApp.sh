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

# copy index.html, index.js and usdl_keys.js
cp  -f ../index.html www/index.html
cp  -f ../index.js www/js/index.js
cp  -f ../usdl_keys.js www/js/usdl_keys.js
cp  -f ../mrtd_keys.js www/js/mrtd_keys.js
cp  -f ../mykad_keys.js www/js/mykad_keys.js
cp  -f ../ukdl_keys.js www/js/ukdl_keys.js

# add logo
cp  -f ../logo.png www/img/logo.png

# build app
cordova build

# how to run
echo "To run iOS demo application open Xcode project BlinkIdDemo.xcodeproj"
echo "To run Android demo application type cordova run android"

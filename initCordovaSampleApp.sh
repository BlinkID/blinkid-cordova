#!/bin/bash

APP_NAME="sample"

# position to a relative path
HERE="$(dirname "$(test -L "$0" && readlink "$0" || echo "$0")")"
pushd "${HERE}" >> /dev/null

# remove any existing code
rm -rf $APP_NAME

# create a sample application
cordova create $APP_NAME com.microblink.sample $APP_NAME

# enter into demo project folder
cd $APP_NAME

# add the BlinkID plugin
IS_LOCAL_BUILD=false || exit 1
if [ "$IS_LOCAL_BUILD" = true ]; then
  # using cordova plugin from NPM
  cordova plugin add ../BlinkID --variable CAMERA_USAGE_DESCRIPTION="Camera permission is required for automated scanning"
  echo "Using plugin from this repo instead from NPM"
else
  cordova plugin add blinkid-cordova
  echo "Using plugin from NPM"
fi

# cordova-plugin-camera plugin needed only for sample application with DirectAPI to get the document images
cordova plugin add https://github.com/jalios/cordova-plugin-camera.git

# add ios and android support to the project
cordova platform add android@13
cordova platform add ios

# copy content of the www folder
cp  -f -r ../sample_files/www .

# build app
cordova prepare

# how to run
echo "To run iOS demo application:
1. Open Xcode project $APP_NAME/platforms/ios/$APP_NAME.xcodeproj
2. Add the NSPhotoLibraryUsageDescription key to Info.plist if DirectAPI will be used
3. Set your development team."
echo "To run Android demo application, position to $APP_NAME folder and type: cordova run android"

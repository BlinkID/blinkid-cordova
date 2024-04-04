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
cordova platform add android@10
cordova platform add ios

# copy content of the www folder
cp  -f -r ../sample_files/www .

# build app
cordova prepare

#temporary fix until new version of cordova-android with support for API 31 with android:exported="true" is released
sed -i '' 's#<platform name="android">#<platform name="android"> <edit-config file="app/src/main/AndroidManifest.xml" target="/manifest/application/activity[@android:name='\'MainActivity\'']" mode="merge"> <activity android:exported="true"/></edit-config><preference name="android-targetSdkVersion" value="33" />#g' config.xml
sed -i '' 's#xmlns:cdv="http://cordova.apache.org/ns/1.0"#xmlns:cdv="http://cordova.apache.org/ns/1.0" xmlns:android="http://schemas.android.com/apk/res/android"#g' config.xml
sed -i '' 's#minSdkVersion cordovaConfig.MIN_SDK_VERSION#minSdkVersion 22#g' ./platforms/android/app/build.gradle
sed -i '' 's#compileSdkVersion cordovaConfig.SDK_VERSION#compileSdkVersion 33#g' ./platforms/android/app/build.gradle
sed -i '' 's#targetSdkVersion cordovaConfig.SDK_VERSION#targetSdkVersion 33#g' ./platforms/android/app/build.gradle

# how to run
echo "To run iOS demo application open Xcode project $APP_NAME/platforms/ios/$APP_NAME.xcodeproj, add the NSPhotoLibraryUsageDescription key to Info.plist if the DirectAPI will be used set your development team."
echo "To run Android demo application, position to $APP_NAME folder and type: cordova run android"

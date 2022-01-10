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
cordova plugin add ../BlinkID --variable CAMERA_USAGE_DESCRIPTION="Camera permission is required for automated scanning"

# add ios and android support to the project
cordova platform add android@10
cordova platform add ios

# copy content of the www folder
cp  -f -r ../sample_files/www .

# build app
cordova prepare

#temporary fix until new version of cordova-android with support for API 31 with android:exported="true" is released
sed -i '' 's#<platform name="android">#<platform name="android"> <edit-config file="app/src/main/AndroidManifest.xml" target="/manifest/application/activity[@android:name='\'MainActivity\'']" mode="merge"> <activity android:exported="true"/></edit-config><preference name="android-targetSdkVersion" value="31" />#g' config.xml
sed -i '' 's#xmlns:cdv="http://cordova.apache.org/ns/1.0"#xmlns:cdv="http://cordova.apache.org/ns/1.0" xmlns:android="http://schemas.android.com/apk/res/android"#g' config.xml

# how to run
echo "To run iOS demo application open Xcode project $APP_NAME/platforms/ios/$APP_NAME.xcodeproj and set your development team."
echo "To run Android demo application, position to $APP_NAME folder and type: cordova run android"

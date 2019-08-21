#!/bin/bash

APP_NAME="BlinkIDDemo"
APP_ID="com.microblink.blinkid"

# remove any existing code
rm -rf $APP_NAME

# create a sample application
ionic start $APP_NAME blank --type=ionic1
# enter into demo project folder
cd $APP_NAME

# add the BlinkID plugin
ionic cordova plugin add ../BlinkID

# add ios and android support to the project
ionic cordova platform add android@8
ionic cordova platform add ios

# build app
ionic build

# change the name and id of the application
sed -i "" "s/io.ionic.starter/$APP_ID/" config.xml
sed -i "" "s/MyApp/$APP_NAME/" config.xml

# copy content of the www folder
cp -f -r ../www/index.html ./www/
cp -f -r ../www/js ./www/

# how to run
echo "To run iOS demo application open Xcode project $APP_NAME.xcodeproj"
echo "To run Android demo application, position to $APP_NAME folder and type: ionic cordova run android"
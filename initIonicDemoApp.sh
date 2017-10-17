#!/bin/bash

APP_NAME="BlinkIdDemo"
APP_ID="com.microblink.blinkid"

# enter BlinkID framework folder
cd BlinkID
# init blinkid-ios using cococapods
./initIOSFramework.sh
# go back to root folder
cd ..

# remove any existing code
rm -rf $APP_NAME

# create a sample application
ionic start $APP_NAME blank --no-link

# enter into demo project folder
cd $APP_NAME

# change the name and id of the application
sed -i "" "s/io.ionic.starter/$APP_ID/" config.xml
sed -i "" "s/MyApp/$APP_NAME/" config.xml

# add the BlinkID plugin
ionic cordova plugin add ../BlinkID

# add ios and android support to the project
ionic cordova platform add android
ionic cordova platform add ios

# copy content of the www folder
cp  -f -r ../www/index.html ./src/
cp  -f -r ../www/js ./www/

# build app
ionic build

# how to run
echo "To run iOS demo application open Xcode project $APP_NAME.xcodeproj"
echo "To run Android demo application, position to $APP_NAME folder and type: ionic cordova run android"
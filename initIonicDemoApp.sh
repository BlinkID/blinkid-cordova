#!/bin/bash

# remove any existing code
rm -rf BlinkIdDemo

# create a sample application
ionic start --id=com.microblink.blinkid BlinkIdDemo ./www

# enter into demo project folder
cd BlinkIdDemo

# add the BlinkID plugin
ionic plugin add ../BlinkID

# add ios and android support to the project
ionic platform add android
ionic platform add ios

# build app
ionic build android
ionic build ios

# how to run
echo "To run iOS demo application open Xcode project BlinkIdDemo.xcodeproj"
echo "To run Android demo application, position to BlinkIdDemo folder and type: ionic run android"
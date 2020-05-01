#!/bin/sh

# ../initCordovaDemoApp.sh 

xcodebuild -project ../BlinkIDDemo/platforms/ios/BlinkIDDemo.xcodeproj -sdk iphoneos archive -archivePath app.xcarchive -scheme BlinkIDDemo

xcodebuild -exportArchive -archivePath app.xcarchive -exportPath app.ipa -exportOptionsPlist exportOptions.plist -allowProvisioningUpdates

cp "app.ipa/App Thinning Size Report.txt" .

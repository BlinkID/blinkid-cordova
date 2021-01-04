# BlinkID SDK wrapper for Cordova

Enhance your Cordova cross-platform apps with an AI-driven mobile ID scanner.

We made it quick and easy for you to create a sample application or install the plugin into your existing iOS or Android project.

For a full access to all features and functionalities, it’s best to go with one of our native SDKs (for [iOS](https://github.com/BlinkID/blinkid-ios) or [Android](https://github.com/BlinkID/blinkid-android)).

## Cordova version
BlinkID Cordova requires Cordova **v7.0.0 or later** and cordova-android plugin **v8.0.0 or later**.

## Ionic version

Latest version has been tested using Ionic **3.19.0** version.

## Adding blinkid-cordova to your application

You can add blinkid-cordova by cloning the repository and following instructions below or by running

```shell
cordova plugin add blinkid-cordova
```

> The shown instructions are for **Cordova**, the instructions for **Ionic** and **PhoneGap** are practically the same, except for some slight command line argument differences.

In the repository you will find scripts to create sample applications.

## Clone or Download repository
Downloading a repository just downloads the files from the most recent commit of the default branch but without all the dependencies which are in submodules. We recommend that you clone directory. With a clone option you will get a copy of the history and it’s functional git repository.

To clone repository:

+ **Copy URL from the `Clone or download` button: https://github.com/BlinkID/blinkid-phonegap.git**
+ **Open terminal on Mac/Linux or [GitBash](https://git-for-windows.github.io/) on Windows.**
+ **cd into directory where you want the cloned directory to be made.**
+ **Type `git clone ` , than past URL**
+ **Press enter**

## How to get started

### Cordova

Sample Cordova app is generated with a script

```shell
./initCordovaSampleApp.sh
```

To run iOS sample application open Xcode project found in `sample/platforms/ios/sample.xcodeproj` and set your signing team.

To run Android sample application type

```shell
cordova run android
```

### Ionic

Sample Ionic app is generated with a script

```shell
./initIonicSampleApp.sh
```

When Ionic asks the following question **Would you like to integrate your new app with Cordova to target native iOS and Android?** answer with **y**.

To run iOS sample application open Xcode project found in `sample/platforms/ios/sample.xcodeproj` and set your signing team.

To run Android sample application type

```shell
ionic run android
```

### Licensing

- [Generate](https://microblink.com/login?url=/customer/generatedemolicence) a **free trial license key** to start using the SDK in your app (registration required)

- For production licensing, please [contact sales](https://microblink.com/contact-us) to request a quote.

**Keep in mind:** Versions 5.8.0 and above require an internet connection to work under our new License Management Program.

We’re only asking you to do this so we can validate your trial license key. Scanning or data extraction of identity documents still happens offline, on the device itself. 

Once the validation is complete, you can continue using the SDK in offline mode (or over a private network) until the next check.


## Video tutorial

### Cordova

Step by step guide how to start blinkid-phonegap using Cordova. A tutorial flows from cloning repository via git clone to successfully deployed sample application on Android and iOS device with real-time screen mirroring. Application sample contains simple use of USDL recognizer with Ontario drivers license card.

<p align="center" >
  <a href="https://vimeo.com/278694990" target="_blank">
    <img src="https://i.vimeocdn.com/video/725381205_1280x720.jpg" alt="Video tutorial" />
  </a>
  <a href="https://vimeo.com/278694990" target="_blank">Watch on Vimeo</a>  <a href=https://www.youtube.com/watch?v=Q8KiKb0n0wE target="_blank">Watch on Youtube</a
</p>
  
  
  
  ### Using documentVerificationOverlay and CombinedRecognizer

This video tutorial describes how to use documentVerificationOverlay with UsdlCombinedRecognizer.
DocumentVerificationOverlay is overlay for RecognizerRunnerFragment best suited for combined recognizers because it manages scanning of multiple document sides in the single camera opening and guides the user through the scanning process. It can also be used for single side scanning of ID cards, passports, driver’s licenses, etc

<p align="center" >
  <a href="https://vimeo.com/289673374" target="_blank">
    <img src="https://i.vimeocdn.com/video/725380540_1280x720.jpg" alt="Video tutorial" />
  </a>
  <a href="https://vimeo.com/289673374" target="_blank">Watch on Vimeo</a>  <a href=https://www.youtube.com/watch?v=0C2BirZt9sg target="_blank">Watch on Youtube</a
</p>
  
  

## Installation

First generate a empty project if needed:

```shell
cordova create <path> <package> <name>
```

> The shown instructions are for **Cordova**, the instructions for **Ionic** and **PhoneGap** are practically the same, except for some slight command line argument differences.

Initialize the iOS framework:

```shell
cd BlinkID
./initIOSFramework.sh
cd ..
```

Add the **BlinkID** plugin to your project:

```shell
cd <path_to_your_project>
cordova plugin add <blinkID_plugin_path> # or blinkid-cordova if you don't have blinkid-phonegap locally
```

**Ionic specific:**

Copy the BlinkID plugin's JavaScript files to your project:
```shell
cp  -f -r <blinkID_plugin_path>/www/js ./www/
```

### Android

Add Android platform support to the project:

    cordova platform add android@8
    
### iOS

> If you want to add iOS as a platform for your application, you will need to install **unzip** and **wget**.

Add iOS plaform support to the project:

    cordova platform add ios

## Sample

Here's a complete example of how to create and build a project for **Android** and **iOS** using **cordova** (you can substitute equivalent commands for **phonegap**):

```shell
# pull the plugin and sample application from Github
git clone https://github.com/BlinkID/blinkid-phonegap.git

# create a empty application
cordova create testcordova

cd testcordova

# add the blinkID plugin
cordova plugin add ../blinkid-phonegap/BlinkID # or just 'blinkid-cordova' if you don't have blinkid-phonegap locally

# add android support to the project
cordova platform add android@8

# build the project, the binary will appear in the bin/ folder
cordova build android

# add ios support to the project
cordova platform add ios

# build the project
cordova build ios
```

In **phonegap** CLI instead of `platform add` just request a build for the platform using `build android` or `build ios`. You will have to do the manual steps described above to be able to do a successfull build.

You can also use provided `initCordovaSampleApp.sh` script that will generate a sample app that uses the plugin:

```shell
./initCordovaSampleApp.sh
```

To run the script, you'll need BASH environment on Windows (Linux and MacOS use BASH by default).


## Usage

To use the plugin you call it in your Javascript code like the [sample application](www/js/index.js).

Documentation for all features and JS API is available in [blinkIdScanner.js JS API file](BlinkID/www/blinkIdScanner.js).


## Changing scanner settings

To change scanner settings you need to modify Phonegap plugin classes for iOS and Android. Plugin classes are located in `./BlinkID/src`. All necessary settings documentation is located in those source files. 

For platform specific implementation details refer to the [BlinkID-iOS](https://github.com/BlinkID/blinkid-ios) and [BlinkID-android](https://github.com/BlinkID/blinkid-android) documentation.

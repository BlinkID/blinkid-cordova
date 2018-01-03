# BlinkID SDK wrapper for PhoneGap

This repository contains example wrapper for BlinkID native SDKs ([iOS](https://github.com/BlinkID/blinkid-ios) and [Android](https://github.com/BlinkID/blinkid-android)). Not all features of native SDKs are available in PhoneGap wrapper. However, the wrapper is open source, so you can easily add features that you need. For 100% of features and maximum control, consider using native SDKs.

## Cordova version
BlinkID PhoneGap requires Cordova **v7.0.0 or later** and cordova-android plugin **v7.0.0 or later**.

## Dependencies
MicroBlink.framework/MicroBlink file in iOS submodule exceeds GitHubs limited file size of 100MB.
To correctly init the submodule Git LFS is needed. Git LFS can be installed with homebrew:

```shell
brew install git-lfs
```

After installation, don't forget to restart the terminal!

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
./initCordovaDemoApp.sh
```

To run iOS demo application open Xcode project BlinkIdDemo.xcodeproj

To run Android demo application type

```shell
cordova run android
```

### Ionic

Sample Ionic app is generated with a script

```shell
./initIonicDemoApp.sh
```

To run iOS demo application open Xcode project BlinkIdDemo.xcodeproj

To run Android demo application type

```shell
ionic run android
```
### Video tutorial
Step by step guide how to start BlinkID Ionic v2. A tutorial flows from git clone to successfully deployed demo application on Android and iOS device with real-time screen mirroring. Application demo contains simple use of MRTD recognizer with Croatian ID card.
<p align="center" >
  <a href="https://vimeo.com/205045804" target="_blank">
    <img src="https://i.vimeocdn.com/video/621406873.webp?mw=960&mh=540" alt="Video tutorial" />
  </a>
  <a href="https://vimeo.com/205045804" target="_blank">Watch on Vimeo</a>
</p>


### Licensing

- [Generate](https://microblink.com/login?url=/customer/generatedemolicence) a **free demo license key** to start using the SDK in your app (registration required)

- Get information about pricing and licensing of [BlinkID](https://microblink.com/blinkid)

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
cordova plugin add <blinkID_plugin_path>
```

**Ionic specific:**

Copy the BlinkID plugin's JavaScript files to your project:
```shell
cp  -f -r <blinkID_plugin_path>/www/js ./www/
```

### Android

Add Android platform support to the project:

    cordova platform add android@7
    
### iOS

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
cordova plugin add ../blinkid-phonegap/BlinkID

# add android support to the project
cordova platform add android@7

# build the project, the binary will appear in the bin/ folder
cordova build android

# add ios support to the project
cordova platform add ios

# build the project
cordova build ios
```

In **phonegap** CLI instead of `platform add` just request a build for the platform using `build android` or `build ios`. You will have to do the manual steps described above to be able to do a successfull build.

You can also use provided `initDemoApp.sh` script that will generate a demo app that uses the plugin:

```shell
./initCordovaDemoApp.sh
```

To run the script, you'll need BASH environment on Windows (Linux and MacOS use BASH by default).


## Usage

To use the plugin you call it in your Javascript code like the demo application:

```javascript

/**
* Use these scanner types
* Available: "PDF417", "USDL", "Barcode", "MRTD", "EUDL", "UKDL", "DEDL", "MyKad", "DocumentFace"
* PDF417 - scans PDF417 barcodes
* USDL - scans barcodes located on the back of US driver's license
* Barcode - scans various types of codes (i.e. QR, UPCA, UPCE...). Types of scanned codes can be modified in plugin classes (Explained later in this readme). By default, scanned codes are set to: Code 39, Code 128, EAN 13, EAN 8, QR, UPCA, UPCE
* MRTD - scans Machine Readable Travel Document, contained in various IDs and passports
* EUDL - scans the front of European driver's license
* UKDL - scans the front of United Kingom driver's license
* DEDL - scans the front of German driver's license
* MyKad - scans the front of Malaysian ID cards
* DocumentFace - scans documents which contain owner's face image
* 
* Variable << types >> declared below has to contain all the scanners needed by your application. Applying additional scanners will slow down the scanning process
*/
var types = ["PDF417", "UKDL", "MRTD"];

/**
 * Image type defines type of the image that will be returned in scan result (image is returned as Base64 encoded JPEG)
 * available:
 *  empty array - do not return any images - IMPORTANT : THIS IMPROVES SCANNING SPEED!
 *  "IMAGE_SUCCESSFUL_SCAN" : return full camera frame of successful scan
 *  "IMAGE_DOCUMENT" : return cropped document image
 *  "IMAGE_FACE" : return image of the face from the ID
 */
var imageTypes = ["IMAGE_SUCCESSFUL_SCAN", "IMAGE_FACE", "IMAGE_DOCUMENT"]

/**
* Language to be used in the scanning UI
* Available:
*  - English: "en"
*  - Croatian: "hr"
*/
var language = "en"

// Note that each platform requires its own license key

// This license key allows setting overlay views for this application ID: com.microblink.blinkid
var licenseiOs = "RYRTHFTE-BGSW25OV-22FACO5I-XKFH6NNV-EYKLREEQ-SCIJBEEQ-SCIJAMA4-CTCG345C"; // valid until 2018-03-04

// This license is only valid for package name "com.microblink.blinkid"
var licenseAndroid = "HOTRRR7E-GOK7UXTG-4EZJS4BX-QCZHZEPZ-JGPURT4Y-GD4K5X42-OJL67PQQ-K3FMQDM3";  // valid until 2018-03-04

scanButton.addEventListener('click', function() {    
    cordova.plugins.blinkIdScanner.scan(

        // Register the callback handler
        function callback(scanningResult) {

            // handle cancelled scanning
            if (scanningResult.cancelled == true) {
                resultDiv.innerHTML = "Cancelled!";
                return;
            }
            
            // Obtain list of recognizer results
            var resultList = scanningResult.resultList;

            successfulImageDiv.style.visibility = "hidden"
            documentImageDiv.style.visibility = "hidden"
            faceImageDiv.style.visibility = "hidden"

            // Image is returned as Base64 encoded JPEG
            var image = scanningResult.resultImage;

            // Successful image is returned as Base64 encoded JPEG
            var resultSuccessfulImage = scanningResult.resultSuccessfulImage;
            if (resultSuccessfulImage) {
                successfulImage.src = "data:image/jpg;base64, " + resultSuccessfulImage;
                successfulImageDiv.style.visibility = "visible"
            }
            // Iterate through all results
            for (var i = 0; i < resultList.length; i++) {

                // Get individual resilt
                var recognizerResult = resultList[i];

                if (recognizerResult.resultType == "Barcode result") {
                    // handle Barcode scanning result

                    var raw = "";
                    if (typeof(recognizerResult.raw) != "undefined" && recognizerResult.raw != null) {
                        raw = " (raw: " + hex2a(recognizerResult.raw) + ")";
                    }
                    resultDiv.innerHTML = "Data: " + recognizerResult.data +
                                       raw +
                                       " (Type: " + recognizerResult.type + ")";

                } else if (recognizerResult.resultType == "USDL result") {
                    // handle USDL parsing result

                    var fields = recognizerResult.fields;

                    resultDiv.innerHTML = /** Personal information */
                                       "USDL version: " + fields[kPPStandardVersionNumber] + "; " +
                                        "Family name: " + fields[kPPCustomerFamilyName] + "; " +
                                        "First name: " + fields[kPPCustomerFirstName] + "; " +
                                        "Date of birth: " + fields[kPPDateOfBirth] + "; " +
                                        "Sex: " + fields[kPPSex] + "; " +
                                        "Eye color: " + fields[kPPEyeColor] + "; " +
                                        "Height: " + fields[kPPHeight] + "; " +
                                        "Street: " + fields[kPPAddressStreet] + "; " +
                                        "City: " + fields[kPPAddressCity] + "; " +
                                        "Jurisdiction: " + fields[kPPAddressJurisdictionCode] + "; " +
                                        "Postal code: " + fields[kPPAddressPostalCode] + "; " +

                                        /** License information */
                                        "Issue date: " + fields[kPPDocumentIssueDate] + "; " +
                                        "Expiration date: " + fields[kPPDocumentExpirationDate] + "; " +
                                        "Issuer ID: " + fields[kPPIssuerIdentificationNumber] + "; " +
                                        "Jurisdiction version: " + fields[kPPJurisdictionVersionNumber] + "; " +
                                        "Vehicle class: " + fields[kPPJurisdictionVehicleClass] + "; " +
                                        "Restrictions: " + fields[kPPJurisdictionRestrictionCodes] + "; " +
                                        "Endorsments: " + fields[kPPJurisdictionEndorsementCodes] + "; " +
                                        "Customer ID: " + fields[kPPCustomerIdNumber] + "; ";

                } else if (recognizerResult.resultType == "MRTD result") {

                    var fields = recognizerResult.fields;

                    resultDiv.innerHTML = /** Personal information */
                                        "Family name: " + fields[kPPmrtdPrimaryId] + "; " +
                                        "First name: " + fields[kPPmrtdSecondaryId] + "; " +
                                        "Date of birth: " + fields[kPPmrtdBirthDate] + "; " +
                                        "Sex: " + fields[kPPmrtdSex] + "; " +
                                        "Nationality: " + fields[kPPmrtdNationality] + "; " +
                                        "Date of Expiry: " + fields[kPPmrtdExpiry] + "; " +
                                        "Document Code: " + fields[kPPmrtdDocCode] + "; " +
                                        "Document Number: " + fields[kPPmrtdDocNumber] + "; " +
                                        "Issuer: " + fields[kPPmrtdIssuer] + "; " +
                                        "ID Type: " + fields[kPPmrtdDataType] + "; " +
                                        "Opt1: " + fields[kPPmrtdOpt1] + "; " +
                                        "Opt2: " + fields[kPPmrtdOpt2] + "; ";

                } else if (recognizerResult.resultType == "EUDL result" || recognizerResult.resultType == "UKDL result" || recognizerResult.resultType == "DEDL result") {
                    
                    var fields = recognizerResult.fields;

                    resultDiv.innerHTML = /** Personal information */
                                        recognizerResult.resultType + "; " + 
                                        "ID Type: " + fields[kPPeudlDataType] + "; " +
                                        "Date of Expiry: : " + fields[kPPeudlExpiry] + "; " +
                                        "Issue Date: " + fields[kPPeudlIssueDate] + "; " +
                                        "Issuing Authority: " + fields[kPPeudlIssuingAuthority] + "; " +
                                        "Driver Number: " + fields[kPPeudlDriverNumber] + "; " +
                                        "Address: " + fields[kPPeudlAddress] + "; " +
                                        "Birth Data: " + fields[kPPeudlBirthData] + "; " +
                                        "First name: " + fields[kPPeudlFirstName] + "; " +
                                        "Last name: " + fields[kPPeudlLastName] + "; ";

                } else if (recognizerResult.resultType == "MyKad result") {
                    
                    var fields = recognizerResult.fields;

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPmyKadDataType] + "; " +
                                        "NRIC Number: " + fields[kPPmyKadNricNumber] + "; " +
                                        "Address: " + fields[kPPmyKadAddress] + "; " +
                                        "Birth Date: " + fields[kPPmyKadBirthDate] + "; " +
                                        "Full Name: " + fields[kPPmyKadFullName] + "; " +
                                        "Religion: " + fields[kPPmyKadReligion] + "; " +
                                        "Sex: " + fields[kPPmyKadSex] + "; ";

                } else if (recognizerResult.resultType == "DocumentFace result") {

                    var fields = recognizerResult.fields;

                    resultDiv.innerHTML = "Found document with face";
                }

                // Document image is returned as Base64 encoded JPEG
                var resultDocumentImage = recognizerResult.resultDocumentImage;
                if (resultDocumentImage) {
                    documentImage.src = "data:image/jpg;base64, " + resultDocumentImage;
                    documentImageDiv.style.visibility = "visible"
                } else {
                    documentImageDiv.style.visibility = "hidden"
                }

                // Face image is returned as Base64 encoded JPEG
                var resultFaceImage = recognizerResult.resultFaceImage;
                if (resultFaceImage) {
                    faceImage.src = "data:image/jpg;base64, " + resultFaceImage;
                    faceImageDiv.style.visibility = "visible"
                } else {
                    faceImageDiv.style.visibility = "hidden"
                }
            }
        },

        // Register the error callback
        function errorHandler(err) {
            alert('Error: ' + err);
        },

        types, imageTypes, licenseiOs, licenseAndroid, language
    );
});
```

+ Available scanners are:
    + **PDF417** - scans PDF417 barcodes
    + **USDL**  - scans barcodes located on the back of US driver's license
    + **Barcode** - scans various types of codes (i.e. QR, UPCA, UPCE...). Types of scanned codes can be modified in plugin classes (Explained later in this readme). By default, scanned codes are set to: Code 39, Code 128, EAN 13, EAN 8, QR, UPCA, UPCE.
    + **MRTD** - scans Machine Readable Travel Document, contained in various IDs and passports
    + **EUDL** - scans the front of European driver's license
    + **UKDL** - scans the front of United Kingom driver's license
    + **DEDL** - scans the front of German driver's license
    + **MyKad** - scans the front of Malaysian ID cards
    + **DocumentFace** - scans documents which contain owner's face image
	
+ On returned result, images can also be returned (under "resultSuccessfulImage" field for successful scan image and under fields "resultDocumentImage" and "resultFaceImage" in each concrete recognizer result) as base64 string of JPEG image. Image types that should be returned are specified as second argument (array). Set empty array to disable returning of images - **IMPORTANT : THIS IMPROVES SCANNING SPEED!**. Available types are:
	+ `IMAGE_SUCCESSFUL_SCAN` - Full camera frame of successful scan.
	+ `IMAGE_DOCUMENT` - Cropped document image.
	+ `IMAGE_FACE` - Image of the face from the ID.

+ All license parameters must be provided (for **iOS** and **Android**) even if you do not plan to run the application on both platforms. The licenses that you do not have/use must be set to `null`.


## Changing scanner settings

To change scanner settings you need to modify Phonegap plugin classes for iOS and Android. Plugin classes are located in `./BlinkID/src`. All necessary settings documentation is located in those source files. 

For platform specific implementation details refer to the [BlinkID-iOS](https://github.com/BlinkID/blinkid-ios) and [BlinkID-android](https://github.com/BlinkID/blinkid-android) documentation.

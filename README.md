# BlinkID SDK wrapper for PhoneGap

This repository contains example wrapper for BlinkID native SDKs ([iOS](https://github.com/BlinkID/blinkid-ios) and [Android](https://github.com/BlinkID/blinkid-android)). Not all features of native SDKs are available in PhoneGap wrapper. However, the wrapper is open source, so you can easily add features that you need. For 100% of features and maximum control, consider using native SDKs.

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

When Ionic asks the following question **Would you like to integrate your new app with Cordova to target native iOS and Android?** answer with **y**.

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

    cordova platform add android@6
    
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
cordova platform add android@6

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
 * Available: "PDF417", "USDL", "Barcode", "MRTD", "EUDL", "UKDL", "DEDL", "MyKadFront", "MyKadBack", "IKad", "MyTentera", "GermanOldID", "GermanIDFront", "GermanIDBack", "GermanPassport", "UnitedArabEmiratesIDFront", "UnitedArabEmiratesIDBack", "SingaporeIDFront", "SingaporeIDBack", "DocumentFace", "DocumentDetector"
 * PDF417 - scans PDF417 barcodes
 * USDL - scans barcodes located on the back of US driver's license
 * Barcode - scans various types of codes (i.e. QR, UPCA, UPCE...). Types of scanned codes can be modified in plugin classes (Explained later in this readme). By default, scanned codes are set to: Code 39, Code 128, EAN 13, EAN 8, QR, UPCA, UPCE
 * MRTD - scans Machine Readable Travel Document, contained in various IDs and passports
 * EUDL - scans the front side of European driver's license
 * UKDL - scans the front side of United Kingom driver's license
 * DEDL - scans the front side of German driver's license
 * MyKadFront - scans the front side of Malaysian ID card
 * MyKadBack - scans the back side of Malaysian ID card
 * IKad - scans the front side of IKad card
 * MyTentera - scans the front side of Malaysian Tentera card
 * GermanOldID - scans the front side of old German ID card
 * GermanIDFront - scans the front side of German ID card
 * GermanIDBack - scans the back side of German ID card
 * GermanPassport - scans the front side of German passport
 * UnitedArabEmiratesIDFront - scans the front side of UnitedArabEmirates ID card
 * UnitedArabEmiratesIDBack - scans the back side of UnitedArabEmirates ID card
 * SingaporeIDFront - scans the front side of Singapore ID card
 * SingaporeIDBack - scans the back side of Singapore ID card
 * DocumentFace - scans documents which contain owner's face image
 * DocumentDetector - scans documents that are specified as ID1 or ID2 and returns their image
 *
 * Variable << types >> declared below has to contain all the scanners needed by your application. Applying additional scanners will slow down the scanning process
 */
var types = ["USDL", "MRTD", "Barcode"];

/**
 * Image type defines type of the image that will be returned in scan result (image is returned as Base64 encoded JPEG)
 * available:
 *  empty - do not return any images - IMPORTANT : THIS IMPROVES SCANNING SPEED!
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
var licenseiOs = "VD62UVB5-H24WWCCB-CCR443VD-IOD4AEF6-6W6P2KED-PIZ7VRQA-EVEKPC34-O27IFYXG"; // valid until 2018-05-09

// This license is only valid for package name "com.microblink.blinkid"
var licenseAndroid = "FESCWEBI-3FQIPFNN-UOA3DVXD-CARRDWLE-P7SQBC3D-V3PZU4SX-54PGVNWO-NQ5WS5HX";

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
                var fields = recognizerResult.fields;

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

                    resultDiv.innerHTML = /** Personal information */
                                        "USDL version: " + fields[kPPStandardVersionNumber] + "<br>" +
                                        "Family name: " + fields[kPPCustomerFamilyName] + "<br>" +
                                        "First name: " + fields[kPPCustomerFirstName] + "<br>" +
                                        "Date of birth: " + fields[kPPDateOfBirth] + "<br>" +
                                        "Sex: " + fields[kPPSex] + "<br>" +
                                        "Eye color: " + fields[kPPEyeColor] + "<br>" +
                                        "Height: " + fields[kPPHeight] + "<br>" +
                                        "Street: " + fields[kPPAddressStreet] + "<br>" +
                                        "City: " + fields[kPPAddressCity] + "<br>" +
                                        "Jurisdiction: " + fields[kPPAddressJurisdictionCode] + "<br>" +
                                        "Postal code: " + fields[kPPAddressPostalCode] + "<br>" +

                                        /** License information */
                                        "Issue date: " + fields[kPPDocumentIssueDate] + "<br>" +
                                        "Expiration date: " + fields[kPPDocumentExpirationDate] + "<br>" +
                                        "Issuer ID: " + fields[kPPIssuerIdentificationNumber] + "<br>" +
                                        "Jurisdiction version: " + fields[kPPJurisdictionVersionNumber] + "<br>" +
                                        "Vehicle class: " + fields[kPPJurisdictionVehicleClass] + "<br>" +
                                        "Restrictions: " + fields[kPPJurisdictionRestrictionCodes] + "<br>" +
                                        "Endorsments: " + fields[kPPJurisdictionEndorsementCodes] + "<br>" +
                                        "Customer ID: " + fields[kPPCustomerIdNumber] + "<br>";

                } else if (recognizerResult.resultType == "MRTD result" || recognizerResult.resultType == "UnitedArabEmiratesIDBack result") {
                    // UnitedArabEmiratesIDBack result contains only fields from the MRZ (Machine Readable Zone)

                    resultDiv.innerHTML = /** Personal information */
                                        "Type: " + fields[kPPDataType] + "<br>" +
                                        "Family name: " + fields[kPPmrtdPrimaryId] + "<br>" +
                                        "First name: " + fields[kPPmrtdSecondaryId] + "<br>" +
                                        "Date of birth: " + fields[kPPmrtdBirthDate] + "<br>" +
                                        "Sex: " + fields[kPPmrtdSex] + "<br>" +
                                        "Nationality: " + fields[kPPmrtdNationality] + "<br>" +
                                        "Date of Expiry: " + fields[kPPmrtdExpiry] + "<br>" +
                                        "Document Code: " + fields[kPPmrtdDocCode] + "<br>" +
                                        "Document Number: " + fields[kPPmrtdDocNumber] + "<br>" +
                                        "Issuer: " + fields[kPPmrtdIssuer] + "<br>" +
                                        "ID Type: " + fields[kPPmrtdDataType] + "<br>" +
                                        "Opt1: " + fields[kPPmrtdOpt1] + "<br>" +
                                        "Opt2: " + fields[kPPmrtdOpt2] + "<br>";

                } else if (recognizerResult.resultType == "EUDL result" || recognizerResult.resultType == "UKDL result" || recognizerResult.resultType == "DEDL result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "Date of Expiry: " + fields[kPPeudlExpiry] + "<br>" +
                                        "Issue Date: " + fields[kPPeudlIssueDate] + "<br>" +
                                        "Issuing Authority: " + fields[kPPeudlIssuingAuthority] + "<br>" +
                                        "Driver Number: " + fields[kPPeudlDriverNumber] + "<br>" +
                                        "Address: " + fields[kPPeudlAddress] + "<br>" +
                                        "Birth Data: " + fields[kPPeudlBirthData] + "<br>" +
                                        "First name: " + fields[kPPeudlFirstName] + "<br>" +
                                        "Last name: " + fields[kPPeudlLastName] + "<br>";

                } else if (recognizerResult.resultType == "MyKadFront result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "NRIC Number: " + fields[kPPmyKadNricNumber] + "<br>" +
                                        "Address: " + fields[kPPmyKadAddress] + "<br>" +
                                        "Address ZIP Code: " + fields[kPPmyKadAddressZipCode] + "<br>" +
                                        "Address Street: " + fields[kPPmyKadAddressStreet] + "<br>" +
                                        "Address City: " + fields[kPPmyKadAddressCity] + "<br>" +
                                        "Address State: " + fields[kPPmyKadAddressState] + "<br>" +
                                        "Birth Date: " + fields[kPPmyKadBirthDate] + "<br>" +
                                        "Full Name: " + fields[kPPmyKadFullName] + "<br>" +
                                        "Religion: " + fields[kPPmyKadReligion] + "<br>" +
                                        "Sex: " + fields[kPPmyKadSex] + "<br>";

                } else if (recognizerResult.resultType == "MyKadBack result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "NRIC Number: " + fields[kPPmyKadNricNumber] + "<br>" +
                                        "Extended NRIC Number: " + fields[kPPmyKadBackExtendedNricNumber] + "<br>" +
                                        "Birth Date: " + fields[kPPmyKadBackBirthDate] + "<br>" +
                                        "Sex: " + fields[kPPmyKadBackSex] + "<br>";

                } else if (recognizerResult.resultType == "MyTentera result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "Army Number: " + fields[kPPmyTenteraArmyNumber] + "<br>" +
                                        "NRIC Number: " + fields[kPPmyTenteraNricNumber] + "<br>" +
                                        "Address: " + fields[kPPmyTenteraAddress] + "<br>" +
                                        "Address ZIP Code: " + fields[kPPmyTenteraAddressZipCode] + "<br>" +
                                        "Address Street: " + fields[kPPmyTenteraAddressStreet] + "<br>" +
                                        "Address City: " + fields[kPPmyTenteraAddressCity] + "<br>" +
                                        "Address State: " + fields[kPPmyTenteraAddressState] + "<br>" +
                                        "Birth Date: " + fields[kPPmyTenteraBirthDate] + "<br>" +
                                        "Full Name: " + fields[kPPmyTenteraFullName] + "<br>" +
                                        "Religion: " + fields[kPPmyTenteraReligion] + "<br>" +
                                        "Sex: " + fields[kPPmyTenteraSex] + "<br>";

                } else if (recognizerResult.resultType == "IKad result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "Address: " + fields[kPPiKadAddress] + "<br>" +
                                        "Birth Date: " + fields[kPPiKadDateOfBirth] + "<br>" +
                                        "Employer: " + fields[kPPiKadEmployer] + "<br>" +
                                        "Expiry Date: " + fields[kPPiKadExpiryDate] + "<br>" +
                                        "Name: " + fields[kPPiKadName] + "<br>" +
                                        "Nationality: " + fields[kPPiKadNationality] + "<br>" +
                                        "Passport Number: " + fields[kPPiKadPassportNumber] + "<br>" +
                                        "Sector: " + fields[kPPiKadSector] + "<br>" +
                                        "Sex: " + fields[kPPiKadSex] + "<br>";

                } else if (recognizerResult.resultType == "GermanOldID result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "Family name: " + fields[kPPmrtdPrimaryId] + "<br>" +
                                        "First name: " + fields[kPPmrtdSecondaryId] + "<br>" +
                                        "Date of birth: " + fields[kPPmrtdBirthDate] + "<br>" +
                                        "Nationality: " + fields[kPPmrtdNationality] + "<br>" +
                                        "Document Code: " + fields[kPPmrtdDocCode] + "<br>" +
                                        "Document Number: " + fields[kPPmrtdDocNumber] + "<br>" +
                                        "Issuer: " + fields[kPPmrtdIssuer] + "<br>" +
                                        "Place of birth: " + fields[kPPgermanIdBirthPlace] + "<br>";

                } else if (recognizerResult.resultType == "GermanFrontID result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "Last name: " + fields[kPPgermanIdLastName] + "<br>" +
                                        "First name: " + fields[kPPgermanIdFirstName] + "<br>" +
                                        "Date of birth: " + fields[kPPgermanIdBirthDate] + "<br>" +
                                        "Place of birth: " + fields[kPPgermanIdBirthPlace] + "<br>" +
                                        "Nationality: " + fields[kPPgermanIdNationality] + "<br>" +
                                        "Date of expiry: " + fields[kPPgermanIdExpiryDate] + "<br>" +
                                        "Card number: " + fields[kPPgermanIdCardNumber] + "<br>";

                } else if (recognizerResult.resultType == "GermanBackID result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "Colour of eyes: " + fields[kPPgermanIdEyeColour] + "<br>" +
                                        "Height: " + fields[kPPgermanIdHeight] + "<br>" +
                                        "Issue date: " + fields[kPPgermanIdIssueDate] + "<br>" +
                                        "Issuing authority: " + fields[kPPgermanIdIssuingAuthority] + "<br>" +
                                        "Address: " + fields[kPPgermanIdAddress] + "<br>";

                } else if (recognizerResult.resultType == "GermanPassport result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "Type: " + fields[kPPDataType] + "<br>" +
                                        "Passport number: " + fields[kPPmrtdDocNumber] + "<br>" +
                                        "Surname: " + fields[kPPgermanPassSurname] + "<br>" +
                                        "Name: " + fields[kPPgermanPassName] + "<br>" +
                                        "Nationality: " + fields[kPPgermanPassNationality] + "<br>" +
                                        "Date of birth: " + fields[kPPmrtdBirthDate] + "<br>" +
                                        "Sex: " + fields[kPPmrtdSex] + "<br>" +
                                        "Place of birth: " + fields[kPPgermanPassBirthPlace] + "<br>" +
                                        "Date of issue: " + fields[kPPgermanPassIssueDate] + "<br>" +
                                        "Date of expiry: " + fields[kPPmrtdExpiry] + "<br>" +
                                        "Authority: " + fields[kPPgermanPassIssuingAuthority] + "<br>";

                } else if (recognizerResult.resultType == "UnitedArabEmiratesIDFront result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "ID number: " + fields[kPPuaeIdFrontIdNumber] + "<br>" +
                                        "Name: " + fields[kPPuaeIdFrontName] + "<br>" +
                                        "Nationality: " + fields[kPPuaeIdFrontNationality] + "<br>";

                } else if (recognizerResult.resultType == "SingaporeFrontID result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "Card number: " + fields[kPPsingaporeCardNumberFront] + "<br>" +
                                        "Date of birth: " + fields[kPPsingaporeDateOfBirth] + "<br>" +
                                        "Country of birth: " + fields[kPPsingaporeCountryOfBirth] + "<br>" +
                                        "Race: " + fields[kPPsingaporeRace] + "<br>" +
                                        "Name: " + fields[kPPsingaporeName] + "<br>" +
                                        "Sex: " + fields[kPPsingaporeSex] + "<br>";

                } else if (recognizerResult.resultType == "SingaporeBackID result") {

                    resultDiv.innerHTML = /** Personal information */
                                        "ID Type: " + fields[kPPDataType] + "<br>" +
                                        "Card number: " + fields[kPPsingaporeCardNumberBack] + "<br>" +
                                        "Date of issue: " + fields[kPPsingaporeDateOfIssue] + "<br>" +
                                        "Blood group: " + fields[kPPsingaporeBloodGroup] + "<br>" +
                                        "Address: " + fields[kPPsingaporeAddress] + "<br>";

                } else if (recognizerResult.resultType == "DocumentDetector result") {

                    resultDiv.innerHTML = "Found a document";

                } else if (recognizerResult.resultType == "DocumentFace result") {

                    resultDiv.innerHTML = "Found document with face";

                } else {
                    
                    resultDiv.innerHTML = recognizerResult.resultType;

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
    + **MyKadFront** - scans the front side of Malaysian ID card
    + **MyKadBack** - scans the back side of Malaysian ID card
    + **IKad** - scans the front side of IKad card
    + **MyTentera** - scans the front side of Malaysian Tentera card
    + **GermanOldID** - scans the front of old German ID cards
    + **GermanIDFront** - scans the front of German ID cards
    + **GermanIDBack** - scans the back of German ID cards
    + **GermanPassport** - scans the front of German passports
    + **UnitedArabEmiratesIDFront** - scans the front side of United Arab Emirates ID card
    + **UnitedArabEmiratesIDBack** - scans the back side of United Arab Emirates ID card
    + **SingaporeIDFront** - scans the front side of Singapore ID card
    + **SingaporeIDBack** - scans the back side of Singapore ID card
    + **DocumentFace** - scans documents which contain owner's face image
    + **DocumentDetector** - scans documents that are specified as ID1 or ID2 and returns their image
	
+ On returned result, images can also be returned (under "resultSuccessfulImage" field for successful scan image and under fields "resultDocumentImage" and "resultFaceImage" in each concrete recognizer result) as base64 string of JPEG image. Image types that should be returned are specified as second argument (array). Set empty array to disable returning of images - **IMPORTANT : THIS IMPROVES SCANNING SPEED!**. Available types are:
	+ `IMAGE_SUCCESSFUL_SCAN` - Full camera frame of successful scan.
	+ `IMAGE_DOCUMENT` - Cropped document image.
	+ `IMAGE_FACE` - Image of the face from the ID.

+ All license parameters must be provided (for **iOS** and **Android**) even if you do not plan to run the application on both platforms. The licenses that you do not have/use must be set to `null`.


## Changing scanner settings

To change scanner settings you need to modify Phonegap plugin classes for iOS and Android. Plugin classes are located in `./BlinkID/src`. All necessary settings documentation is located in those source files. 

For platform specific implementation details refer to the [BlinkID-iOS](https://github.com/BlinkID/blinkid-ios) and [BlinkID-android](https://github.com/BlinkID/blinkid-android) documentation.

## 6.11.1

- We have updated the plugin to [Android SDK v6.11.2](https://github.com/BlinkID/blinkid-android/releases/tag/v6.11.2) and [iOS SDK v6.11.1](https://github.com/BlinkID/blinkid-ios/releases/tag/v6.11.1)

**Bug fixes**

- NYC Municipal ID & USA Border Crossing Card 
    - Resolved an issue where the scanning process could get stuck on the back side during multi-side scanning.

## 6.11.0

- We have updated the plugin to [Android SDK v6.11.1](https://github.com/BlinkID/blinkid-android/releases/tag/v6.11.1) and [iOS SDK v6.11.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v6.11.0)

**Expanded document coverage**

- All of the new documents & document versions can also be found in the release notes for native Android and iOS SDKs.

**New features**

- **Greek Alphabet Support**
    - Added support for extracting `Place of Birth` in both Greek and Latin scripts.
- New result fields in the `BlinkIdSingleSideRecognizer` and `BlinkIdMultiSideRecognizer`
    - `manufacturingYear`, `vehicleType`, `eligibilityCategory`, `specificDocumentValidity`, `dependentsInfo`

**Bug fixes**

- Android specific
    - Removed unused `libc++_shared.so` from the SDK
    - Fix for duplicate attrs resource: `attr/mb_onboardingImageColor` when combining multiple Microblink's SDKs in the same app

## 6.10.0

- We have updated the plugin to [Android SDK v6.10.0](https://github.com/BlinkID/blinkid-android/releases/tag/v6.10.0) and [iOS SDK v6.10.1](https://github.com/BlinkID/blinkid-ios/releases/tag/v6.10.1)

**Expanded document coverage**

- All of the new documents & document versions can also be found in the release notes for native Android and iOS SDKs.

**New features**

- ***Avoiding Double Scans of the Front Side***: For a more reliable scanning process, BlinkID now prompts users to flip the document when they scan the front side twice. This improves the overall experience and reduces the chance of mistakes.
- ***Starting with the Right Side***: If users attempt to scan the back side of a document first, BlinkID will prompt them to begin with the front side. This feature ensures that users follow the correct order, leading to a more reliable and user-friendly experience.
- Added `imageExtractionFailures` to `AdditionalProcessingInfo`
    - `imageExtractionFailures` allows tracking if any images are not visible on the presented document
    - Added  `ImageExtractionType` (`FullDocument`, `Face`, `Signature`) enum to specify the image type
- Added a new result member, `barcodeStepUsed` to BlinkID recognizers, which indicates whether the barcode scanning step was utilized during the scanning process.
- Added two new settings to BlinkID recognizers:
    - `allowBarcodeScanOnly` - allows barcode recognition to proceed even if the initial extraction fails - set to `false` by default
    - `combineFrameResults` - enables the aggregation of data from multiple frames - set to `true` by default
    
## 6.9.0

- We have updated the plugin to [Android SDK v6.9.0](https://github.com/BlinkID/blinkid-android/releases/tag/v6.9.0) and [iOS SDK v6.9.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v6.9.0)

**Expanded document coverage**

- All of the new documents & document versions can also be seen in the release notes for native Android and iOS SDKs.

**Custom mandatory fields**

- We’re introducing the option to define a custom set of mandatory fields. This feature allows greater flexibility in the scanning process by enabling the extraction of only the necessary information from identity documents.
- Custom mandatory fields can be set at the document level or applied universally to all document types.
- Custom mandatory fields can be set with `CustomClassRules` and `DetailedFieldType`

**Glare and blur detection**

- We’ve introduced glare detection to BlinkID, which removes occlusion on document images caused by glare.
- We’ve raised the threshold for our blur model, making it stricter. This improvement ensures that sharper images are accepted for processing.
    - To disable the glare and blur filters, modify the `enableBlurFilter` and `enableGlareFilter` properties on the BlinkID recognizers (filters are enabled by default).
    - The strictness level can be modified to `Strict`, `Normal` and `Relaxed` on the `glareStrictnessLevel` and `blurStrictnessLevel` properties with `StrictnessLevel`.
    - To check if glare and blur are present on the document after the scanning process has finished, see glareDetected and blurDetected properties ****in ****ImageAnalysisResult.

**UI Settings**

- Real-time feedback during scanning includes a new UI message to help users position the document correctly and reduce glare and blur.
    - Check `errorGlareDetected` and `errorBlurDetected` in the `BlinkIdOverlaySettings`.
- We have added camera presets to each platform
    - Modify `AndroidCameraResolutionPreset` and `iOSCameraResolutionPreset` in `BlinkIdOverlaySettings` to change different to camera resolutions if necessary.
- Camera Legacy API - Android-specific
    - We have added `enableAndroidLegacyCameraApi` property. This setting should only be used if the new Camera2 API is not working on the device, and it should not be applied to all devices.

## 6.7.0

- Updated to [Android SDK v6.7.0](https://github.com/BlinkID/blinkid-android/releases/tag/v6.7.0) and [iOS SDK v6.7.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v6.7.0)
- Updated the SDK with new regions and types, which can be found in the native documentation with version 6.6.0 [Android](https://github.com/BlinkID/blinkid-android/releases/tag/v6.6.0) and [iOS](https://github.com/BlinkID/blinkid-ios/releases/tag/v6.6.0)
- Added Real ID symbol detection on US driver's licenses in the `ImageAnalysisResult` class.
- Added partial anonymization of the Document Number field.
    - Anonymization can be added in `ClassAnonymizationSettings` class by additionally adding `DocumentNumberAnonymizationSettings`.
- Added `BarcodeDetectionFailed` to `ProcessingStatus`.
    - It is returned when the mandatory barcode is not present on the back of US documents.
- Added settings `showCancelButton` and `showTorchButton` in `BlinkIdOverlaySettings` with which the ‘Cancel’ and ‘Torch’ buttons in the scanning UI can be shown or hidden.
- This version of the SDK contains the native iOS `BlinkID.xcframework` with the privacy manifest file (`PrivacyInfo.xcprivacy`).
- Fixed issue with setting the SDK language for Android.

### Major API update

- We have introduced the **DirectAPI** method of scanning, which allows the SDK to extract the document information from static images without the need to use the device’s camera and our UI.
- Usage:
    - The `scanWithDirectApi` method requires four parameters:
    - `recognizerCollection`, which is a collection of Recognizers used for document scanning.
    - `frontImage`, which would represent the front image of the document in the Base64 format string
    - `backImage`,  which would represent the back image of the document in the Base64 format string
        - the `backImage` parameter is optional when using the `BlinkIdSingleSideRecognizer`, and can be passed as `null` or an empty string (`””`).
    - `licenses`, the licenses for iOS and Android required to unlock the SDK
- An example of its usage can be found in the [sample application](https://github.com/BlinkID/blinkid-cordova/blob/master/sample_files/www/js/index.js) , both for the Multiside and Singleside scanning. 
- More information about the DirectAPI scanning can be found here in the native documentation for [Android](https://github.com/BlinkID/blinkid-android?tab=readme-ov-file#direct-api) and [iOS](https://github.com/BlinkID/blinkid-ios?tab=readme-ov-file#direct-api-processing) .
- We still recommend using our ‘regular’ way of scanning with the camera, as static images can sometimes be in lower-quality which can cause SDK extraction error. It would be best to use the `scanWithDirectApi` method when using the device’s camera is not an option.

## 6.5.0
- Updated to [Android SDK v6.5.0](https://github.com/BlinkID/blinkid-android/releases/tag/v6.5.0) and [iOS SDK v6.4.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v6.5.0)
- Added `cardOrientation` property to `ImageAnalysisResult`

## 6.4.0
- Updated to [Android SDK v6.4.0](https://github.com/BlinkID/blinkid-android/releases/tag/v6.4.0) and [iOS SDK v6.4.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v6.4.0)

## 6.3.0
- Updated to [Android SDK v6.3.0](https://github.com/BlinkID/blinkid-android/releases/tag/v6.3.0) and [iOS SDK v6.3.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v6.3.0)

## 6.1.2
- Fixed UI customization and added new settings

## 6.1.1
- Updated to [Android SDK v6.1.2](https://github.com/BlinkID/blinkid-android/releases/tag/v6.1.2)

## 6.1.0
- Updated to [Android SDK v6.1.1](https://github.com/BlinkID/blinkid-android/releases/tag/v6.1.1) and [iOS SDK v6.1.2](https://github.com/BlinkID/blinkid-ios/releases/tag/v6.1.2)

## 5.17.0
- Updated to [Android SDK v5.17.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.17.0) and [iOS SDK v5.17.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.17.0)

## 5.16.0
- Updated to [Android SDK v5.16.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.16.0) and [iOS SDK v5.16.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.16.0)

## 5.15.0
- Updated to [Android SDK v5.15.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.15.0) and [iOS SDK v5.15.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.15.0)

## 5.14.0
- Updated to [Android SDK v5.14.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.14.0) and [iOS SDK v5.14.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.14.0)

## 5.13.1

- Fixed problem with building the iOS plugin

## 5.13.0
- Updated to [Android SDK v5.13.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.13.0) and [iOS SDK v5.13.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.13.0)

## 5.12.0
- Updated to [Android SDK v5.12.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.12.0) and [iOS SDK v5.12.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.12.0)

## 5.11.0
- Updated to [Android SDK v5.11.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.11.0) and [iOS SDK v5.11.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.11.0)

## 5.10.0
- Updated to [Android SDK v5.10.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.10.0) and [iOS SDK v5.10.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.10.0)

## 5.9.0
- Updated to [Android SDK v5.9.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.9.0) and [iOS SDK v5.9.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.9.0)

## 5.8.1
- Fixed `documentDataMatch` serialization.

## 5.8.0
- Updated to [Android SDK v5.8.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.8.0) and [iOS SDK v5.8.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.8.0)

## 5.7.1
- Updated to [iOS SDK v5.7.1](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.7.1)

## 5.7.0
- Updated to [Android SDK v5.7.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.7.0) and [iOS SDK v5.7.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.7.0)

## 5.6.1
- Fixed `MBBarcodeResult rawData` serialization which caused crashes on iOS.

## 5.6.0
- Updated to [Android SDK v5.6.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.6.0) and [iOS SDK v5.6.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.6.0)

## 5.5.0
- Updated to [Android SDK v5.5.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.5.0) and [iOS SDK v5.5.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.5.0)

## 5.4.0
- Updated to [Android SDK v5.4.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.4.0) and [iOS SDK v5.4.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.4.0)

## 5.3.0
- Updated to [Android SDK v5.3.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.3.0) and [iOS SDK v5.3.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.3.0)

## 5.2.0
- Updated to [Android SDK v5.2.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.2.0) and [iOS SDK v5.2.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.2.0)

## 5.1.0
- Updated to [Android SDK v5.1.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.1.0) and [iOS SDK v5.1.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.1.0)

## 5.0.0
- Updated to [Android SDK v5.0.0](https://github.com/BlinkID/blinkid-android/releases/tag/v5.0.0) and [iOS SDK v5.0.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v5.0.0)

## 4.11.1
- Updated to [Android SDK v4.11.1](https://github.com/BlinkID/blinkid-android/releases/tag/v4.11.1)

## 4.11.0
- Updated to [Android SDK v4.11.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.11.0) and [iOS SDK v4.11.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.11.0)

## 4.10.0
- Updated to [Android SDK v4.10.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.10.0) and [iOS SDK v4.10.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.10.0)

## 4.9.0
- Updated to [Android SDK v4.9.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.9.0) and [iOS SDK v4.9.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.9.0)

## 4.8.0
- Updated to [Android SDK v4.8.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.8.0) and [iOS SDK v4.8.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.8.0)

## 4.7.0
- Updated to [Android SDK v4.7.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.7.0) and [iOS SDK v4.7.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.7.0)

## 4.6.0
- Updated to [Android SDK v4.6.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.6.0) and [iOS SDK v4.6.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.6.0)

## 4.5.0
- Updated to [Android SDK v4.5.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.5.0) and [iOS SDK v4.5.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.5.0)

## 4.4.0
- Updated to [Android SDK v4.4.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.4.0) and [iOS SDK v4.4.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.4.0)
- [android, iOS] added support for changing tooltip strings in  `DocumentVerificationOverlay`

## 4.3.0
- Updated to [Android SDK v4.3.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.3.0) and [iOS SDK v4.3.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.3.0)

## 4.2.1
- [android] fixed error in `*OverlaySettingsSerialization`: package com.microblink.blinkid does not exist

## 4.2.0
- Updated to [Android SDK v4.2.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.2.0) and [iOS SDK v4.2.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.2.0)
- [android, iOS] added option to disable warning for time limited license key
- [android] fixed NPE when serializing recognizer result containing `null` byte array field 
- [android] removed Microblink logo from camera splash screen


## 4.1.0
- Updated to [Android SDK v4.1.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.1.0) and [iOS SDK v4.1.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.1.0)

## 4.0.0
- new API, which is not backward compatible with 1.x.x release series, but resembles native iOS and Android APIs and also has feature parity with all recognizers available in native SDKs
    - using [iOS SDK v4.0.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v4.0.0) and [Android SDK v4.0.0](https://github.com/BlinkID/blinkid-android/releases/tag/v4.0.0)
    - check updated [demo app](www/js/index.js) for information how to use v4.0.0 and [README](README.md) for information about using BlinkID in your project

## 1.5.7
- [android] By default, uncertain scanning is enabled for PDF417 barcode

## 1.5.6
- Fixed issue in `initIOSFramework` script for case sensitive systems

## 1.5.5
- [ios] Updated SDK to v2.17.3
- [ios] Added Date of expiry and date of birth to GermanIDFront
- [ios] Added date of expiry and date of birth to GermanPassport
- Added date of expiry to GermanOldID

## 1.5.4
- fixed bug on Android which caused that Indonesian ID is always scanned

## 1.5.3
- updated Android SDK to v3.16.0
- fixed returning of face image for Indonesian ID on Android

## 1.5.2
- updated iOS SDK to v2.17.0
- added `IndonesiaID` recognizer

## 1.5.1
- renamed `MyKad` recognizer to `MyKadFront`
- updated iOS SDK to v2.16.1
- added the following recognizers:
    - `iKad` - scans the front of iKad cards
    - `MyTentera` - scans the front of MyTentera cards
    - `MyKadBack` - scans the back of MyKad cards

## 1.5.0
- added the following recognizers:
    - `SingaporeIDFrontRecognizer` - scans the front of Singapore ID cards
    - `SingaporeIDBackRecognizer` - scans the back of Singapore ID cards

## 1.4.4
- added the following recognizers:
    - `UnitedArabEmiratesIDBack` - scans the back of United Arab Emirates ID cards
    - `UnitedArabEmiratesIDFront` - scans the front of United Arab Emirates ID cards
- updated iOS SDK to [2.16.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v2.16.0)
- updated Android SDK to [v3.15.1](https://github.com/BlinkID/blinkid-android/releases/tag/v3.15.1)

## 1.4.3
- added the following recognizers:
    - `GermanOldID` - scans the front of old German ID cards
    - `GermanIDFront` - scans the front of German ID cards
    - `GermanIDBack` - scans the back of German ID cards
    - `GermanPassport` - scans the front of German passports
- added `DocumentDetector` supporting ID1 and ID2
- updated iOS SDK to [2.15.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v2.15.0)
- return image encoded as a single line

## 1.4.2
- added languages support for scanning window
    - out-of-the-box support for English and Croatian
- updated Android SDK to [v3.14.0](https://github.com/BlinkID/blinkid-android/releases/tag/v3.14.0)
    - introduced API changes regarding MyKad (read [release notes](https://github.com/BlinkID/blinkid-android/releases/tag/v3.14.0))

## 1.4.1
- upgraded support for Cordova v7.0.0 or higher
- upgraded support for Cordova Android platform v7.0.0 or higher
  * sources for Android are now compliant with the Android Studio project structure
- replaced the SSH link with the HTTPS link in the iOS init script (solves `public-key denied` issues)

## 1.4.0
- updated Android SDK to [v3.13.0](https://github.com/BlinkID/blinkid-android/releases/tag/v3.13.0)
- updated iOS SDK to [v2.14.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v2.14.0)
- added feature to return Face images from ID documents
- images of cropped documents and face images are returned per Recognizer. This means that each result now (optionally) has keys "resultDocumentImage" for image of the document, and "resultFaceImage" for image of the Face
- frame which resulted with a successful scan is now returned under key "resultSuccessfulImage"
- muliple image types can now be returned. Specify which with new property "imageTypes" ->, e.g var imageTypes = ["IMAGE\_SUCCESSFUL\_SCAN", "IMAGE\_FACE", "IMAGE\_DOCUMENT"]
- removed deprecated recognizers "ZXing" and "BarDecoder". Use "Barcode" instead.
- fixed issue with type of the EUDL being returned as EUDL on iOS, and as UKDL or DEDL on Android. Now we always return the more specific type, e.g "DEDL" for German Driver's license
- added new result keys for Malaysian MyKad to mykad_keys.js for obtaining parsed address fields (ZIP code, street, city and state)

## 1.3.0
- updated support for Ionic v3
- replaced BlinkID iOS submodule dependency with cococapods dependency

## 1.2.0
- replaced BlinkID Android submodule dependency with Maven dependency
- updated Android SDK to [v3.11.0](https://github.com/BlinkID/blinkid-android/releases/tag/v3.11.0)

## 1.1.9
- update Android SDK to [v3.10.1](https://github.com/BlinkID/blinkid-android/releases/tag/v3.10.1)

## 1.1.8
- fixed support for DocumentFace, EUDL and German DL recognizers on Android

## 1.1.7
- update Android SDK to [v3.10.0](https://github.com/BlinkID/blinkid-android/releases/tag/v3.10.0)

## 1.1.6
- update iOS SDK to [v2.11.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v2.11.0)

## 1.1.5
- update iOS SDK to [v2.7.1](https://github.com/BlinkID/blinkid-ios/releases/tag/v2.7.1)

## 1.1.4
- update iOS SDK to [v2.6.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v2.6.6)
- added DocumentFace recognizer
- Fixed issues with obtaining images of EUDL and MyKad documents

## 1.1.3
- update Android SDK to [v3.4.1](https://github.com/BlinkID/blinkid-android/releases/tag/v3.4.1)

## 1.1.2
- fixed returning of date of birth and date of expiry for Machine Readable Travel Documents

## 1.1.1
- updated iOS native SDK to [v2.5.1](https://github.com/BlinkID/blinkid-ios/releases/tag/v2.5.1). This changes the default UI when scanning IDs.

## 1.1.0
- updated Android SDK to [v3.2.0](https://github.com/BlinkID/blinkid-android/releases/tag/v3.2.0)
- updated iOS SDK to [v2.5.0](https://github.com/BlinkID/blinkid-ios/releases/tag/v2.5.0)
- added support for returning cropped image of scanned document
- added example for Ionic framework

## 1.0.2
- updated [Android SDK](https://github.com/BlinkID/blinkid-android) to  v2.5.0

## 1.0.1
- updated [Android SDK](https://github.com/BlinkID/blinkid-android) to  v2.2.0

## 1.0.0

-  Initial plugin release  with [iOS SDK](https://github.com/BlinkID/blinkid-ios)  v1.2.0 and [Android SDK](https://github.com/BlinkID/blinkid-android) v2.1.0

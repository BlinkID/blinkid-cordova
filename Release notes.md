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

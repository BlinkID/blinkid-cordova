/**
 * cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) Matt Kane 2010
 * Copyright (c) 2011, IBM Corporation
 */


var exec = require("cordova/exec");

/**
 * Constructor.
 *
 * @returns {BlinkID}
 */
function BlinkID() {

};

/**
 * successCallback: callback that will be invoked on successful scan
 * errorCallback: callback that will be invoked on error
 * overlaySettings: settings for desired camera overlay
 * recognizerCollection: {RecognizerCollection} containing recognizers to use for scanning
 * licenses: object containing base64 licenses for iOS and Android in format
 *  {
 *      ios: 'base64iOSLicense',
 *      android: 'base64AndroidLicense'
 *  }
 */
BlinkID.prototype.scanWithCamera = function (successCallback, errorCallback, overlaySettings, recognizerCollection, licenses) {
    if (errorCallback == null) {
        errorCallback = function () {
        };
    }

    if (typeof errorCallback != "function") {
        console.log("BlinkIdScanner.scan failure: failure parameter not a function");
        throw new Error("BlinkIdScanner.scan failure: failure parameter not a function");
        return;
    }

    if (typeof successCallback != "function") {
        console.log("BlinkIdScanner.scan failure: success callback parameter must be a function");
        throw new Error("BlinkIdScanner.scan failure: success callback parameter must be a function");
        return;
    }

    exec(
        function internalCallback(scanningResult) { 
            var cancelled = scanningResult.cancelled;

            if (cancelled) {
                successCallback(true);
            } else {
                var results = scanningResult.resultList;
                if (results.length != recognizerCollection.recognizerArray.length) {
                    console.log("INTERNAL ERROR: native plugin returned wrong number of results!");
                    throw new Error("INTERNAL ERROR: native plugin returned wrong number of results!");
                    errorCallback(new Error("INTERNAL ERROR: native plugin returned wrong number of results!"));
                } else {
                    for (var i = 0; i < results.length; ++i) {
                        // native plugin must ensure types match
                        recognizerCollection.recognizerArray[i].result = recognizerCollection.recognizerArray[i].createResultFromNative(results[i]);
                    }
                    successCallback(false);
                }
            }    
        },
        errorCallback, 'BlinkIdScanner', 'scanWithCamera', [overlaySettings, recognizerCollection, licenses]);
};

// COMMON CLASSES

function Recognizer(recognizerType) {
    this.recognizerType = recognizerType;
    this.result = null;
}

function RecognizerResult(resultState) {
    // 'empty', 'uncertain' or 'valid'
    this.resultState = resultState;
}

function RecognizerCollection(recognizerArray) {
    this.recognizerArray = recognizerArray;
    this.allowMultipleResults = false;
    this.milisecondsBeforeTimeout = 10000;
    this.result = null;

    if (!(this.recognizerArray.constructor === Array)) {
        throw new Error("recognizerArray must be array of Recognizer objects!");
    }
    // ensure every element in array is Recognizer
    for (var i = 0; i < this.recognizerArray.length; ++i) {
        if (!(this.recognizerArray[i] instanceof Recognizer )) {
            throw new Error( "Each element in recognizerArray must be instance of Recognizer" );
        }
    }
}

BlinkID.prototype.RecognizerCollection = RecognizerCollection;

function Date(nativeDate) {
    this.day = nativeDate.day;
    this.month = nativeDate.month;
    this.year = nativeDate.year;
}

BlinkID.prototype.Date = Date;

// COMMON CLASSES

// OVERLAY SETTINGS

function OverlaySettings(overlaySettingsType) {
    this.overlaySettingsType = overlaySettingsType;
}

function DocumentOverlaySettings() {
    OverlaySettings.call(this, 'DocumentOverlaySettings');
}
DocumentOverlaySettings.prototype = DocumentOverlaySettings.prototype;

BlinkID.prototype.DocumentOverlaySettings = DocumentOverlaySettings;

// OVERLAY SETTINGS

// RECOGNIZERS

function CroatianIDFrontSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    this.firstName = nativeResult.firstName;
    this.lastName = nativeResult.lastName;
    this.identityCardNumber = nativeResult.identityCardNumber;
    this.sex = nativeResult.sex;
    this.citizenship = nativeResult.citizenship;
    this.documentDateOfExpiry = new Date(nativeResult.documentDateOfExpiry);
    this.documentDateOfExpiryPermanent = nativeResult.documentDateOfExpiryPermanent;
    this.documentBilingual = nativeResult.documentBilingual;
    this.faceImage = nativeResult.faceImage;
    this.signatureImage = nativeResult.signatureImage;
    this.fullDocumentImage = nativeResult.fullDocumentImage;
}

CroatianIDFrontSideRecognizerResult.prototype = RecognizerResult.prototype;

BlinkID.prototype.CroatianIDFrontSideRecognizerResult = CroatianIDFrontSideRecognizerResult;

function CroatianIDFrontSideRecognizer() {
    Recognizer.call(this, 'CroatianIDFrontSideRecognizer');
    this.extractSex = true;
    this.extractCitizenship = true;
    this.extractDateOfExpiry = true;
    this.detectGlare = true;
    this.returnFaceImage = false;
    this.returnSignatureImage = false;
    this.returnFullDocumentImage = false;
    this.createResultFromNative = function (nativeResult) { return new CroatianIDFrontSideRecognizerResult(nativeResult); }
}

CroatianIDFrontSideRecognizer.prototype = Recognizer.prototype;

BlinkID.prototype.CroatianIDFrontSideRecognizer = CroatianIDFrontSideRecognizer;

// RECOGNIZERS

// export BlinkIdScanner
module.exports = new BlinkID();
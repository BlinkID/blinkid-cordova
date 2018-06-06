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
        console.log("BlinkIDScanner.scanWithCamera failure: failure parameter not a function");
        throw new Error("BlinkIDScanner.scanWithCamera failure: failure parameter not a function");
        return;
    }

    if (typeof successCallback != "function") {
        console.log("BlinkIDScanner.scanWithCamera failure: success callback parameter must be a function");
        throw new Error("BlinkIDScanner.scanWithCamera failure: success callback parameter must be a function");
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
        errorCallback, 'BlinkIDScanner', 'scanWithCamera', [overlaySettings, recognizerCollection, licenses]);
};

// COMMON CLASSES

/**
 * Base class for all recognizers.
 * Recognizer is object that performs recognition of image
 * and updates its result with data extracted from the image.
 */
function Recognizer(recognizerType) {
    /** Type of recognizer */
    this.recognizerType = recognizerType;
    /** Recognizer's result */
    this.result = null;
}

/**
 * Possible states of the Recognizer's result
 */
var RecognizerResultState = Object.freeze(
    {
        /** Recognizer result is empty */
        empty : 1,
        /** Recognizer result contains some values, but is incomplete or it contains all values, but some are not uncertain */
        uncertain : 2,
        /** Recognizer resul contains all required values */
        valid : 3
    }
);

/**
 * Possible states of the Recognizer's result
 */
BlinkID.prototype.RecognizerResultState = RecognizerResultState;

/**
 * Base class for all recognizer's result objects.
 * Recoginzer result contains data extracted from the image.
 */
function RecognizerResult(resultState) {
    /** State of the result. It is always one of the values represented by BlinkIDScanner.RecognizerResultState enum */
    this.resultState = resultState;
}

/**
 * Represents a collection of recognizer objects.
 * @param recognizerArray Array of recognizer objects that will be used for recognition. Must not be empty!
 */
function RecognizerCollection(recognizerArray) {
    /** Array of recognizer objects that will be used for recognition */
    this.recognizerArray = recognizerArray;
    /** 
     * Whether or not it is allowed for multiple recognizers to process the same image.
     * If not, then first recognizer that will be successful in processing the image will
     * end the processing chain and other recognizers will not get the chance to process 
     * that image.
     */
    this.allowMultipleResults = false;
    /** Number of miliseconds after first non-empty result becomes available to end scanning with a timeout */
    this.milisecondsBeforeTimeout = 10000;

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

/**
 * Represents a date extracted from image.
 */
function Date(nativeDate) {
    this.day = nativeDate.day;
    this.month = nativeDate.month;
    this.year = nativeDate.year;
}

BlinkID.prototype.Date = Date;
/**
 * Possible types of Machine Readable Travel Documents (MRTDs).
 */
BlinkID.prototype.MRTDDocumentType = Object.freeze(
    {
        /** Unknown document type */
        Unknown : 1,
        /** Identity card */
        IdentityCard : 2,
        /** Passport */
        Passport : 3,
        /** Visa */
        Visa : 4,
        /** US Green Card */
        GreenCard : 5,
        /** Malaysian PASS type IMM13P */
        MalaysianPassIMM13P : 6
    }
);

/**
 * Represents data extracted from MRZ (Machine Readable Zone) of Machine Readable Travel Document (MRTD).
 */
function MRZResult(nativeMRZResult) {
    /**
     * Type of recognized document. It is always one of the values represented by BlinkIDScanner.MRTDDocumentType
     */
    this.documentType = nativeMRZResult.documentType;
    /** The primary indentifier. If there is more than one component, they are separated with space. */
    this.primaryId = nativeMRZResult.primaryId;
    /** The secondary identifier. If there is more than one component, they are separated with space. */
    this.secondaryId = nativeMRZResult.secondaryId;
    /**
     * Three-letter or two-letter code which indicate the issuing State. Three-letter codes are based
     * on Aplha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. Two-letter
     * codes are based on Aplha-2 codes for entities specified in ISO 3166-1, with extensions for certain States.
     */
    this.issuer = nativeMRZResult.issuer;
    /** Holder's date of birth */
    this.dateOfBirth = new Date(nativeMRZResult.dateOfBirth);
    /**
     * The document number. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property.
     */
    this.documentNumber = nativeMRZResult.documentNumber;
    /**
     * The nationality of the holder represented by a three-letter or two-letter code. Three-letter
     * codes are based on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain
     * States. Two-letter codes are based on Aplha-2 codes for entities specified in ISO 3166-1, with
     * extensions for certain States.
     */
    this.nationality = nativeMRZResult.nationality;
    /**
     * The gender of the card holder. Gender is specified by use of the single initial, capital letter F for female,
     * M for male or <code>&lt;</code> for unspecified.
     */
    this.gender = nativeMRZResult.gender;
    /**
     * The document code. Document code contains two characters. For MRTD the first character shall
     * be A, C or I. The second character shall be discretion of the issuing State or organization except
     * that V shall not be used, and `C` shall not be used after `A` except in the crew member certificate.
     * On machine-readable passports (MRP) first character shall be `P` to designate an MRP. One additional
     * letter may be used, at the discretion of the issuing State or organization, to designate a particular
     * MRP. If the second character position is not used for this purpose, it shall be filled by the filter
     * character <code>&lt;</code>.
     */
    this.documentCode = nativeMRZResult.documentCode;
    /** The date of expiry */
    this.dateOfExpiry = new Date(nativeMRZResult.dateOfExpiry);
    /**
     * The first optional data. Contains empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use the documentType property.
     */
    this.opt1 = nativeMRZResult.opt1;
    /**
     * The second optional data. Contains empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use the documentType property.
     */
    this.opt2 = nativeMRZResult.opt2;
    /**
     * The alien number. Contains empty string if not available.
     * Exists only on US Green Cards. To see which document was scanned use the documentType property.
     */
    this.alienNumber = nativeMRZResult.alienNumber;
    /**
     * The application receipt number. Contains empty string if not available.
     * Exists only on US Green Cards. To see which document was scanned use the documentType property.
     */
    this.applicationReceiptNumber = nativeMRZResult.applicationReceiptNumber;
    /**
     * The immigrant case number. Contains empty string if not available.
     * Exists only on US Green Cards. To see which document was scanned use the documentType property.
     */
    this.immigrantCaseNumber = nativeMRZResult.immigrantCaseNumber;
    /**
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements.
     * NOTE: This string is available only if OCR result was parsed successfully.
     */
    this.mrzText = nativeMRZResult.mrzText;
    /** true if Machine Readable Zone has been parsed, false otherwise. */
    this.mrzParsed = nativeMRZResult.mrzParsed;
    /** true if all check digits inside MRZ are correct, false otherwise. */
    this.mrzVerified = nativeMRZResult.mrzVerified;
}

/**
 * Possible values for EUDL country field.
 */
var EUDLCountry = Object.freeze(
    {
        /** UK Driver's license */
        UK : 1,
        /** German driver's license */
        Germany : 2,
        /** Austrian driver's license */
        Austria : 3,
        /** Performs country detection and uses scanning parameters for detected country */
        Automatic : 4
    }
);

/**
 * Possible values for EUDL country field.
 */
BlinkID.prototype.EUDLCountry = EUDLCountry;

/** Possible supported detectors for documents containing face image */
var DocumentFaceDetectorType = Object.freeze(
    {
        /** Uses document detector for TD1 size identity cards */
        TD1 : 1,
        /** Uses document detector for TD2 size identity cards  */
        TD2 : 2,
        /** Uses MRTD detector for detecting documents with MRZ */
        PassportsAndVisas : 3
    }
);

/**
 * Possible values for EUDL country field.
 */
BlinkID.prototype.DocumentFaceDetectorType = DocumentFaceDetectorType;

// COMMON CLASSES

// OVERLAY SETTINGS

/** Base class for all overlay settings objects */
function OverlaySettings(overlaySettingsType) {
    /** type of the overlay settings object */
    this.overlaySettingsType = overlaySettingsType;
}

/** 
 * Class for setting up barcode overlay.
 * Barcode overlay is best suited for recognizers that perform barcode scanning.
 */
function BarcodeOverlaySettings() {
    OverlaySettings.call(this, 'BarcodeOverlaySettings');
}

BarcodeOverlaySettings.prototype = new OverlaySettings();

BlinkID.prototype.BarcodeOverlaySettings = BarcodeOverlaySettings;
/**
 * Class for setting up document overlay.
 * Document overlay is best suited for recognizers that perform ID document scanning.
 */
function DocumentOverlaySettings() {
    OverlaySettings.call(this, 'DocumentOverlaySettings');
}
DocumentOverlaySettings.prototype = new OverlaySettings();

BlinkID.prototype.DocumentOverlaySettings = DocumentOverlaySettings;

/**
 * Class for setting up document verification overlay.
 * Document verification overlay is best suited for combined recognizers - recognizer that perform scanning of both sides of ID documents.
 */
function DocumentVerificationOverlaySettings() {
    OverlaySettings.call(this, 'DocumentVerificationOverlaySettings');
}
DocumentVerificationOverlaySettings.prototype = new OverlaySettings();

BlinkID.prototype.DocumentVerificationOverlaySettings = DocumentVerificationOverlaySettings;

// OVERLAY SETTINGS

// RECOGNIZERS

/**
 * Result object for AustraliaDLBackSideRecognizer.
 */
function AustraliaDLBackSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * address of the Australian DL owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * the date of expiry of Australian DL. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * last name of the Australian DL owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * the licence number of Australian DL. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
}

AustraliaDLBackSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustraliaDLBackSideRecognizerResult = AustraliaDLBackSideRecognizerResult;

/**
 *  Recognizer which can scan back side of austrian driver's license.

 */
function AustraliaDLBackSideRecognizer() {
    Recognizer.call(this, 'AustraliaDLBackSideRecognizer');
    
    /** 
     * true if address of Australian DL owner is being extracted 
     */
    this.extractAddress = true;
    
    /** 
     * true if date of expiry of Australian DL is being extracted 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * true if last name of Australian DL owner is being extracted 
     */
    this.extractLastName = true;
    
    /** 
     * Defines the DPI (Dots Per Inch) for full document image that should be returned. 
     */
    this.fullDocumentImageDPI = 250;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new AustraliaDLBackSideRecognizerResult(nativeResult); }

}

AustraliaDLBackSideRecognizer.prototype = new Recognizer('AustraliaDLBackSideRecognizer');

BlinkID.prototype.AustraliaDLBackSideRecognizer = AustraliaDLBackSideRecognizer;

/**
 * Result object for AustraliaDLFrontSideRecognizer.
 */
function AustraliaDLFrontSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * address of the Australian DL owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * the date of birth of Australian DL owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * the date of expiry of Australian DL. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the licence number of Australian DL. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * the licence type of the Australian DL. 
     */
    this.licenceType = nativeResult.licenceType;
    
    /** 
     * the full name of the Australian ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

AustraliaDLFrontSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustraliaDLFrontSideRecognizerResult = AustraliaDLFrontSideRecognizerResult;

/**
 *  Recognizer which can scan front side of austrian driver's license.

 */
function AustraliaDLFrontSideRecognizer() {
    Recognizer.call(this, 'AustraliaDLFrontSideRecognizer');
    
    /** 
     * true if address of Australian DL owner is being extracted 
     */
    this.extractAddress = true;
    
    /** 
     * true if date of birth of Australian DL owner is being extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if date of expiry of Australian DL is being extracted 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * true if licence number of Australian DL is being extracted 
     */
    this.extractLicenceNumber = true;
    
    /** 
     * Defines the DPI (Dots Per Inch) for full document image that should be returned. 
     */
    this.fullDocumentImageDPI = 250;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new AustraliaDLFrontSideRecognizerResult(nativeResult); }

}

AustraliaDLFrontSideRecognizer.prototype = new Recognizer('AustraliaDLFrontSideRecognizer');

BlinkID.prototype.AustraliaDLFrontSideRecognizer = AustraliaDLFrontSideRecognizer;

/**
 * Result object for AustriaCombinedRecognizer.
 */
function AustriaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the date of birth of Austrian ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * the date of issuance of the Austrian ID. 
     */
    this.dateOfIssuance = nativeResult.dateOfIssuance;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * the document date of expiry of the Austrian ID. 
     */
    this.documentDateOfExpiry = nativeResult.documentDateOfExpiry;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     *  encoded signature in JPEG from the document 
     */
    this.encodedSignatureImage = nativeResult.encodedSignatureImage;
    
    /** 
     * the eye colour of the card holder. 
     */
    this.eyeColour = nativeResult.eyeColour;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Austrian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * the height of the cardholder in centimeters. 
     */
    this.height = nativeResult.height;
    
    /** 
     * the identity card number of Austrian ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * the issuing authority of Austrian ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * the last name of the Austrian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * the nationality of card holder. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * the place of birth of the card holder. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * principal residendce at issuance of the card holder. 
     */
    this.principalResidenceAtIssuance = nativeResult.principalResidenceAtIssuance;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * sex of the Austrian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

AustriaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustriaCombinedRecognizerResult = AustriaCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of both front and back side of Austrian ID.

 */
function AustriaCombinedRecognizer() {
    Recognizer.call(this, 'AustriaCombinedRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether encoding of signature image and writing it into the recognition result is enabled. 
     */
    this.encodeSignatureImage = false;
    
    /** 
     * true if date of birth of Austrian ID owner is being extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if date of expiry is being extracted 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * true if date of issue is being extracted from Austrian ID 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * true if height is being extracted from Austrian ID 
     */
    this.extractHeight = true;
    
    /** 
     * true if issuing authority is being extracted from Austrian ID 
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * true if nationality is being extracted from Austrian ID 
     */
    this.extractNationality = true;
    
    /** 
     * true if place of birth is being extracted from Austrian ID 
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * true if principal residence is being extracted from Austrian ID 
     */
    this.extractPrincipalResidence = true;
    
    /** 
     * true if sex of Austrian ID owner is being extracted 
     */
    this.extractSex = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new AustriaCombinedRecognizerResult(nativeResult); }

}

AustriaCombinedRecognizer.prototype = new Recognizer('AustriaCombinedRecognizer');

BlinkID.prototype.AustriaCombinedRecognizer = AustriaCombinedRecognizer;

/**
 * Result object for AustriaIDBackSideRecognizer.
 */
function AustriaIDBackSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.MRZResult = nativeResult.MRZResult;
    
    /** 
     * the date of issuance of the ID. 
     */
    this.dateOfIssuance = new Date(nativeResult.dateOfIssuance);
    
    /** 
     *  encoded full document image in JPEG format 
     */
    this.encodedFullDocumentImage = nativeResult.encodedFullDocumentImage;
    
    /** 
     * the eye colour of the card holder. 
     */
    this.eyeColour = nativeResult.eyeColour;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the issuing authority of Austrian ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * the place of birth of the card holder. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * principal residence at issuance of the card holder. 
     */
    this.principalResidence = nativeResult.principalResidence;
    
    /** 
     * the height of the cardholder in centimeters. 
     */
    this.height = nativeResult.height;
    
}

AustriaIDBackSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustriaIDBackSideRecognizerResult = AustriaIDBackSideRecognizerResult;

/**
 * Recognizer which can scan back side of austrian national ID cards.
 */
function AustriaIDBackSideRecognizer() {
    Recognizer.call(this, 'AustriaIDBackSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines if date of issuance should be extracted 
     */
    this.extractDateOfIssuance = true;
    
    /** 
     * Defines if height of Austrian ID owner should be extracted 
     */
    this.extractHeight = true;
    
    /** 
     * Defines if issuing authority should be extracted 
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if place of birth of Austrian ID owner should be extracted 
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if principal residence of Austrian ID owner should be extracted 
     */
    this.extractPrincipalResidence = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new AustriaIDBackSideRecognizerResult(nativeResult); }

}

AustriaIDBackSideRecognizer.prototype = new Recognizer('AustriaIDBackSideRecognizer');

BlinkID.prototype.AustriaIDBackSideRecognizer = AustriaIDBackSideRecognizer;

/**
 * Result object for AustriaIDFrontSideRecognizer.
 */
function AustriaIDFrontSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the date of birth of Austrian ID owner 
     */
    this.dateOfBirth = new Date(nativeResult.dateOfBirth);
    
    /** 
     * the document number of Austrian ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image in JPEG format 
     */
    this.encodedFullDocumentImage = nativeResult.encodedFullDocumentImage;
    
    /** 
     *  encoded signature in JPEG from the document 
     */
    this.encodedSignatureImage = nativeResult.encodedSignatureImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the given name of the Austrian ID owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * sex of the Austrian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * the surname of the Austrian ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

AustriaIDFrontSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustriaIDFrontSideRecognizerResult = AustriaIDFrontSideRecognizerResult;

/**
 * Recognizer which can scan front side of austrian national ID cards.
 */
function AustriaIDFrontSideRecognizer() {
    Recognizer.call(this, 'AustriaIDFrontSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether encoding of signature image and writing it into the recognition result is enabled. 
     */
    this.encodeSignatureImage = false;
    
    /** 
     * Defines if date of birth of Austrian ID owner should be extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if given name of Austrian ID owner should be extracted 
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if sex of Austrian ID owner should be extracted 
     */
    this.extractSex = true;
    
    /** 
     * Defines if surname of Austrian ID owner should be extracted 
     */
    this.extractSurname = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new AustriaIDFrontSideRecognizerResult(nativeResult); }

}

AustriaIDFrontSideRecognizer.prototype = new Recognizer('AustriaIDFrontSideRecognizer');

BlinkID.prototype.AustriaIDFrontSideRecognizer = AustriaIDFrontSideRecognizer;

/**
 * Result object for AustriaPassportRecognizer.
 */
function AustriaPassportRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.MRZResult = nativeResult.MRZResult;
    
    /** 
     * the date of birth of Austrian passport owner 
     */
    this.dateOfBirth = new Date(nativeResult.dateOfBirth);
    
    /** 
     * the date of expiry of Austrian passport 
     */
    this.dateOfExpiry = new Date(nativeResult.dateOfExpiry);
    
    /** 
     * the date of issue of Austrian passport 
     */
    this.dateOfIssue = new Date(nativeResult.dateOfIssue);
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image in JPEG format 
     */
    this.encodedFullDocumentImage = nativeResult.encodedFullDocumentImage;
    
    /** 
     *  encoded signature in JPEG from the document 
     */
    this.encodedSignatureImage = nativeResult.encodedSignatureImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the given name of the Austrian passport owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * issuing authority of the Austrian passport. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * nationality of the Austrian passport owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * passport number of the Austrian passport. 
     */
    this.passportNumber = nativeResult.passportNumber;
    
    /** 
     * place of birth of the Austrian passport owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * sex of the Austrian passport owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * the surname of the Austrian passport owner. 
     */
    this.surname = nativeResult.surname;
    
    /** 
     * the height of the passport in centimeters. 
     */
    this.height = nativeResult.height;
    
}

AustriaPassportRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustriaPassportRecognizerResult = AustriaPassportRecognizerResult;

/**
 * Recognizer which can scan austrian passport.
 */
function AustriaPassportRecognizer() {
    Recognizer.call(this, 'AustriaPassportRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether encoding of signature image and writing it into the recognition result is enabled. 
     */
    this.encodeSignatureImage = false;
    
    /** 
     * Defines if date of birth of Austrian passport owner should be extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry of Austrian passport should be extracted 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Austrian passport should be extracted 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if given name of Austrian passport owner should be extracted 
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if height of Austrian passport owner should be extracted 
     */
    this.extractHeight = true;
    
    /** 
     * Defines if issuing authority of Austrian passport should be extracted 
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if nationality of Austrian passport owner should be extracted 
     */
    this.extractNationality = false;
    
    /** 
     * Defines if passport number of Austrian passport should be extracted 
     */
    this.extractPassportNumber = true;
    
    /** 
     * Defines if place of birth of Austrian passport owner should be extracted 
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if sex of Austrian passport owner should be extracted 
     */
    this.extractSex = true;
    
    /** 
     * Defines if surname of Austrian passport owner should be extracted 
     */
    this.extractSurname = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new AustriaPassportRecognizerResult(nativeResult); }

}

AustriaPassportRecognizer.prototype = new Recognizer('AustriaPassportRecognizer');

BlinkID.prototype.AustriaPassportRecognizer = AustriaPassportRecognizer;

/**
 * Result object for BarcodeRecognizer.
 */
function BarcodeRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The format of the scanned barcode. 
     */
    this.barcodeFormat = nativeResult.barcodeFormat;
    
    /** 
     * The raw bytes contained inside barcode. 
     */
    this.rawData = nativeResult.rawData;
    
    /** 
     * String representation of data inside barcode. 
     */
    this.stringData = nativeResult.stringData;
    
    /** 
     * True if returned result is uncertain, i.e. if scanned barcode was incomplete (i.e. 
     */
    this.uncertain = nativeResult.uncertain;
    
}

BarcodeRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BarcodeRecognizerResult = BarcodeRecognizerResult;

/**
 * Recognizer that can perform recognition of any supported barcode type.
 */
function BarcodeRecognizer() {
    Recognizer.call(this, 'BarcodeRecognizer');
    
    /** 
     * Allow enabling the autodetection of image scale when scanning barcodes. 
     */
    this.autoScaleDetection = true;
    
    /** 
     * Enables scanning of barcodes with inverse intensity values (e.g. white barcode on black background) 
     */
    this.inverseScanning = false;
    
    /** 
     * Allow scanning PDF417 barcodes which don't have quiet zone 
     */
    this.nullQuietZoneAllowed = false;
    
    /** 
     * Enable reading code39 barcode contents as extended data. For more information about code39 
     */
    this.readCode39AsExtendedData = false;
    
    /** 
     * Should Aztec 2D barcode be scanned. 
     */
    this.scanAztecCode = false;
    
    /** 
     * Should Code128 barcode be scanned. 
     */
    this.scanCode128 = false;
    
    /** 
     * Should Code39 barcode be scanned. 
     */
    this.scanCode39 = false;
    
    /** 
     * Should DataMatrix 2D barcode be scanned. 
     */
    this.scanDataMatrixCode = false;
    
    /** 
     * Should EAN13 barcode be scanned. 
     */
    this.scanEAN13Code = false;
    
    /** 
     * Should EAN8 barcode be scanned. 
     */
    this.scanEAN8Code = false;
    
    /** 
     * Should ITF barcode be scanned. 
     */
    this.scanITFCode = false;
    
    /** 
     * Should PDF417 2D barcode be scanned. 
     */
    this.scanPDF417 = false;
    
    /** 
     * Should QR code be scanned. 
     */
    this.scanQRCode = false;
    
    /** 
     * Should UPCA barcode be scanned. 
     */
    this.scanUPCACode = false;
    
    /** 
     * Should UPCE barcode be scanned. 
     */
    this.scanUPCECode = false;
    
    /** 
     * Enable slower, but more thorough scanning, thus giving higher possibility of successful scan. 
     */
    this.slowerThoroughScan = true;
    
    /** 
     * Enable decoding of non-standard PDF417 barcodes, but without 
     */
    this.uncertainDecoding = true;
    
    this.createResultFromNative = function (nativeResult) { return new BarcodeRecognizerResult(nativeResult); }

}

BarcodeRecognizer.prototype = new Recognizer('BarcodeRecognizer');

BlinkID.prototype.BarcodeRecognizer = BarcodeRecognizer;

/**
 * Result object for ColombiaIDBackSideRecognizer.
 */
function ColombiaIDBackSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the Colombian ID document number number. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * owner blood type 
     */
    this.ownerBloodGroup = nativeResult.ownerBloodGroup;
    
    /** 
     * owner date of birth 
     */
    this.ownerDateOfBirth = nativeResult.ownerDateOfBirth;
    
    /** 
     * owner fingerprint 
     */
    this.ownerFingerprint = nativeResult.ownerFingerprint;
    
    /** 
     * owner first name 
     */
    this.ownerFirsName = nativeResult.ownerFirsName;
    
    /** 
     * owner first name 
     */
    this.ownerLastName = nativeResult.ownerLastName;
    
    /** 
     * owner sex 
     */
    this.ownerSex = nativeResult.ownerSex;
    
}

ColombiaIDBackSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.ColombiaIDBackSideRecognizerResult = ColombiaIDBackSideRecognizerResult;

/**
 *  Recognizer for reading Colombia ID Back document.

 */
function ColombiaIDBackSideRecognizer() {
    Recognizer.call(this, 'ColombiaIDBackSideRecognizer');
    
    /** 
     * true if null quiet zone is allowed 
     */
    this.nullQuietZoneAllowed = true;
    
    /** 
     * true if should scan uncertain results 
     */
    this.scanUncertain = true;
    
    this.createResultFromNative = function (nativeResult) { return new ColombiaIDBackSideRecognizerResult(nativeResult); }

}

ColombiaIDBackSideRecognizer.prototype = new Recognizer('ColombiaIDBackSideRecognizer');

BlinkID.prototype.ColombiaIDBackSideRecognizer = ColombiaIDBackSideRecognizer;

/**
 * Result object for ColombiaIDFrontSideRecognizer.
 */
function ColombiaIDFrontSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the Colombian ID document number number. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * owner first name 
     */
    this.ownerFirsName = nativeResult.ownerFirsName;
    
    /** 
     * owner first name 
     */
    this.ownerLastName = nativeResult.ownerLastName;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

ColombiaIDFrontSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.ColombiaIDFrontSideRecognizerResult = ColombiaIDFrontSideRecognizerResult;

/**
 *  Recognizer for reading Colombia ID Front document.

 */
function ColombiaIDFrontSideRecognizer() {
    Recognizer.call(this, 'ColombiaIDFrontSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if first name of Colombia ID Front owner is being extracted 
     */
    this.extractFirstName = true;
    
    /** 
     * true if last name of Colombia ID Front owner is being extracted 
     */
    this.extractLastName = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new ColombiaIDFrontSideRecognizerResult(nativeResult); }

}

ColombiaIDFrontSideRecognizer.prototype = new Recognizer('ColombiaIDFrontSideRecognizer');

BlinkID.prototype.ColombiaIDFrontSideRecognizer = ColombiaIDFrontSideRecognizer;

/**
 * Result object for CroatiaCombinedRecognizer.
 */
function CroatiaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the address of the Croatian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * citizenship of the Croatian ID owner. 
     */
    this.citizenship = nativeResult.citizenship;
    
    /** 
     * the date of birth of Croatian ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * true if scanned document is bilingual 
     */
    this.documentBilingual = nativeResult.documentBilingual;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * the document date of expiry of the Croatian ID. 
     */
    this.documentDateOfExpiry = nativeResult.documentDateOfExpiry;
    
    /** 
     * true if document expiry is permanent 
     */
    this.documentDateOfExpiryPermanent = nativeResult.documentDateOfExpiryPermanent;
    
    /** 
     * the document date of issue of the Croatian ID. 
     */
    this.documentDateOfIssue = nativeResult.documentDateOfIssue;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     *  encoded signature in JPEG from the document 
     */
    this.encodedSignatureImage = nativeResult.encodedSignatureImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Croatian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * the identity card number of Croatian ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * the issuing authority of Croatian ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * the last name of the Croatian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * personal identification number of the Croatian ID holder. 
     */
    this.personalIdentificationNumber = nativeResult.personalIdentificationNumber;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * sex of the Croatian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

CroatiaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CroatiaCombinedRecognizerResult = CroatiaCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of both front and back side of Croatian ID.

 */
function CroatiaCombinedRecognizer() {
    Recognizer.call(this, 'CroatiaCombinedRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether encoding of signature image and writing it into the recognition result is enabled. 
     */
    this.encodeSignatureImage = false;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new CroatiaCombinedRecognizerResult(nativeResult); }

}

CroatiaCombinedRecognizer.prototype = new Recognizer('CroatiaCombinedRecognizer');

BlinkID.prototype.CroatiaCombinedRecognizer = CroatiaCombinedRecognizer;

/**
 * Result object for CroatiaIDBackSideRecognizer.
 */
function CroatiaIDBackSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the address of the Croatian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * true if date of expiry of the Croatian ID is permanent else false 
     */
    this.documentDateOfExpiryPermanent = nativeResult.documentDateOfExpiryPermanent;
    
    /** 
     * the document date of issue of the Croatian ID 
     */
    this.documentDateOfIssue = nativeResult.documentDateOfIssue;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * the issuing authority of Croatian ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
}

CroatiaIDBackSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CroatiaIDBackSideRecognizerResult = CroatiaIDBackSideRecognizerResult;

/**
 *  Recognizer for back side of Croatian ID.

 */
function CroatiaIDBackSideRecognizer() {
    Recognizer.call(this, 'CroatiaIDBackSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if date of issue is being extracted from Croatian ID 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * true if issuing authority is being extracted from Croatian ID 
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new CroatiaIDBackSideRecognizerResult(nativeResult); }

}

CroatiaIDBackSideRecognizer.prototype = new Recognizer('CroatiaIDBackSideRecognizer');

BlinkID.prototype.CroatiaIDBackSideRecognizer = CroatiaIDBackSideRecognizer;

/**
 * Result object for CroatiaIDFrontSideRecognizer.
 */
function CroatiaIDFrontSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * citizenship of the Croatian ID owner. 
     */
    this.citizenship = nativeResult.citizenship;
    
    /** 
     * the date of birth of Croatian ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * true if scanned document is bilingual 
     */
    this.documentBilingual = nativeResult.documentBilingual;
    
    /** 
     * the document date of expiry of the Croatian ID 
     */
    this.documentDateOfExpiry = nativeResult.documentDateOfExpiry;
    
    /** 
     * true if date of expiry of the Croatian ID is permanent else false 
     */
    this.documentDateOfExpiryPermanent = nativeResult.documentDateOfExpiryPermanent;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Croatian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the identity card number of Croatian ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * the last name of the Croatian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * sex of the Croatian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

CroatiaIDFrontSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CroatiaIDFrontSideRecognizerResult = CroatiaIDFrontSideRecognizerResult;

/**
 *  Recognizer which can scan front side of croatian national ID cards.

 */
function CroatiaIDFrontSideRecognizer() {
    Recognizer.call(this, 'CroatiaIDFrontSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if citizenship of Croatian ID owner is being extracted 
     */
    this.extractCitizenship = true;
    
    /** 
     * true if date of birth of Croatian ID owner is being extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if date of expiry is being extracted from Croatian ID 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * true if sex of Croatian ID owner is being extracted 
     */
    this.extractSex = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new CroatiaIDFrontSideRecognizerResult(nativeResult); }

}

CroatiaIDFrontSideRecognizer.prototype = new Recognizer('CroatiaIDFrontSideRecognizer');

BlinkID.prototype.CroatiaIDFrontSideRecognizer = CroatiaIDFrontSideRecognizer;

/**
 * Result object for CzechiaCombinedRecognizer.
 */
function CzechiaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the address of the Czech ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * the date of birth of Czech ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * the document date of expiry of the Czech ID. 
     */
    this.documentDateOfExpiry = nativeResult.documentDateOfExpiry;
    
    /** 
     * the document date of issue of the Czech ID. 
     */
    this.documentDateOfIssue = nativeResult.documentDateOfIssue;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     *  encoded signature in JPEG from the document 
     */
    this.encodedSignatureImage = nativeResult.encodedSignatureImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Czech ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * the identity card number of Czech ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * the issuing authority of Czech ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * the last name of the Czech ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * nationality of the Czech ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * personal identification number of the Czech ID holder. 
     */
    this.personalIdentificationNumber = nativeResult.personalIdentificationNumber;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * sex of the Czech ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

CzechiaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CzechiaCombinedRecognizerResult = CzechiaCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of both front and back side of Czech ID.

 */
function CzechiaCombinedRecognizer() {
    Recognizer.call(this, 'CzechiaCombinedRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether encoding of signature image and writing it into the recognition result is enabled. 
     */
    this.encodeSignatureImage = false;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new CzechiaCombinedRecognizerResult(nativeResult); }

}

CzechiaCombinedRecognizer.prototype = new Recognizer('CzechiaCombinedRecognizer');

BlinkID.prototype.CzechiaCombinedRecognizer = CzechiaCombinedRecognizer;

/**
 * Result object for CzechiaIDBackSideRecognizer.
 */
function CzechiaIDBackSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the address of the card holder. 
     */
    this.address = nativeResult.address;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * the authority of Czech ID. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * personal number of the card holder. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
}

CzechiaIDBackSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CzechiaIDBackSideRecognizerResult = CzechiaIDBackSideRecognizerResult;

/**
 *  Recognizer for back side of Czech ID.

 */
function CzechiaIDBackSideRecognizer() {
    Recognizer.call(this, 'CzechiaIDBackSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new CzechiaIDBackSideRecognizerResult(nativeResult); }

}

CzechiaIDBackSideRecognizer.prototype = new Recognizer('CzechiaIDBackSideRecognizer');

BlinkID.prototype.CzechiaIDBackSideRecognizer = CzechiaIDBackSideRecognizer;

/**
 * Result object for CzechiaIDFrontSideRecognizer.
 */
function CzechiaIDFrontSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the date of birth of Czech ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * the date of expiry of Czech ID 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * the date of issue of Czech ID 
     */
    this.dateOfIssue = nativeResult.dateOfIssue;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Czech ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the identity card number of Czech ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * the last name of the Czech ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * the place of birth of Czech ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * sex of the Czech ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

CzechiaIDFrontSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CzechiaIDFrontSideRecognizerResult = CzechiaIDFrontSideRecognizerResult;

/**
 *  Recognizer which can scan front side of czech national ID cards.

 */
function CzechiaIDFrontSideRecognizer() {
    Recognizer.call(this, 'CzechiaIDFrontSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new CzechiaIDFrontSideRecognizerResult(nativeResult); }

}

CzechiaIDFrontSideRecognizer.prototype = new Recognizer('CzechiaIDFrontSideRecognizer');

BlinkID.prototype.CzechiaIDFrontSideRecognizer = CzechiaIDFrontSideRecognizer;

/**
 * Result object for DocumentFaceRecognizer.
 */
function DocumentFaceRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image in JPEG format 
     */
    this.encodedFullDocumentImage = nativeResult.encodedFullDocumentImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
}

DocumentFaceRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.DocumentFaceRecognizerResult = DocumentFaceRecognizerResult;

/**
 * Recognizer for detecting holder's photo on documents containing image.
 */
function DocumentFaceRecognizer() {
    Recognizer.call(this, 'DocumentFaceRecognizer');
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * currently used detector type. 
     */
    this.detectorType = DocumentFaceDetectorType.TD1;
    
    this.createResultFromNative = function (nativeResult) { return new DocumentFaceRecognizerResult(nativeResult); }

}

DocumentFaceRecognizer.prototype = new Recognizer('DocumentFaceRecognizer');

BlinkID.prototype.DocumentFaceRecognizer = DocumentFaceRecognizer;

/**
 * Result object for EUDLRecognizer.
 */
function EUDLRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the address of the Driver's Licence owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * the driver number. 
     */
    this.driverNumber = nativeResult.driverNumber;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image in JPEG format 
     */
    this.encodedFullDocumentImage = nativeResult.encodedFullDocumentImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Driver's Licence owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * document issuing authority. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * the last name of the Driver's Licence owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * the personal number of the Driver's Licence owner. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     * the place of birth of Driver's Licence owner 
     */
    this.birthPlace = nativeResult.birthPlace;
    
    /** 
     * the country where the driver's license has been issued. 
     */
    this.country = nativeResult.country;
    
}

EUDLRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.EUDLRecognizerResult = EUDLRecognizerResult;

/**
 * Recognizer for scanning driver's licence of several european countries
 */
function EUDLRecognizer() {
    Recognizer.call(this, 'EUDLRecognizer');
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines if address should be extracted from EU driver's license 
     */
    this.extractAddress = true;
    
    /** 
     * Defines if expiry date should be extracted from EU driver's license 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if issue date should be extracted from EU driver's license 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if issuing authority should be extracted from EU driver's license 
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if personal number should be extracted from EU driver's license 
     */
    this.extractPersonalNumber = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * currently used country. 
     */
    this.country = EUDLCountry.Automatic;
    
    this.createResultFromNative = function (nativeResult) { return new EUDLRecognizerResult(nativeResult); }

}

EUDLRecognizer.prototype = new Recognizer('EUDLRecognizer');

BlinkID.prototype.EUDLRecognizer = EUDLRecognizer;

/**
 * Result object for EgyptIDFrontRecognizer.
 */
function EgyptIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the Egypt ID document number. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the Egypt ID card owner national number. 
     */
    this.nationalNumber = nativeResult.nationalNumber;
    
}

EgyptIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.EgyptIDFrontRecognizerResult = EgyptIDFrontRecognizerResult;

/**
 *  Recognizer for reading Egypt ID Front document.

 */
function EgyptIDFrontRecognizer() {
    Recognizer.call(this, 'EgyptIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if national number of Egypt ID Front owner is being extracted 
     */
    this.extractNationalNumber = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new EgyptIDFrontRecognizerResult(nativeResult); }

}

EgyptIDFrontRecognizer.prototype = new Recognizer('EgyptIDFrontRecognizer');

BlinkID.prototype.EgyptIDFrontRecognizer = EgyptIDFrontRecognizer;

/**
 * Result object for GermanyCombinedRecognizer.
 */
function GermanyCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the address of the German ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * the date of birth of German ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * the document date of expiry of the German ID. 
     */
    this.documentDateOfExpiry = nativeResult.documentDateOfExpiry;
    
    /** 
     * the document date of issue of the German ID. 
     */
    this.documentDateOfIssue = nativeResult.documentDateOfIssue;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     *  encoded signature in JPEG from the document 
     */
    this.encodedSignatureImage = nativeResult.encodedSignatureImage;
    
    /** 
     * the issuing authority of German ID. 
     */
    this.eyeColor = nativeResult.eyeColor;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the German ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * the issuing authority of German ID. 
     */
    this.height = nativeResult.height;
    
    /** 
     * the identity card number of German ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * the issuing authority of German ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * the last name of the German ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * nationality of the German ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * the issuing authority of German ID. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * sex of the German ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

GermanyCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyCombinedRecognizerResult = GermanyCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of both front and back side of German ID.

 */
function GermanyCombinedRecognizer() {
    Recognizer.call(this, 'GermanyCombinedRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether encoding of signature image and writing it into the recognition result is enabled. 
     */
    this.encodeSignatureImage = false;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyCombinedRecognizerResult(nativeResult); }

}

GermanyCombinedRecognizer.prototype = new Recognizer('GermanyCombinedRecognizer');

BlinkID.prototype.GermanyCombinedRecognizer = GermanyCombinedRecognizer;

/**
 * Result object for GermanyIDBackSideRecognizer.
 */
function GermanyIDBackSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the full address of the card holder. 
     */
    this.address = nativeResult.address;
    
    /** 
     * extracted city from the address of the card holder. 
     */
    this.addressCity = nativeResult.addressCity;
    
    /** 
     * extracted house number from the address of the card holder. 
     */
    this.addressHouseNumber = nativeResult.addressHouseNumber;
    
    /** 
     * extracted street name from the address of the card holder. 
     */
    this.addressStreet = nativeResult.addressStreet;
    
    /** 
     * extracted ZIP code from the address of the card holder. 
     */
    this.addressZipCode = nativeResult.addressZipCode;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * the issuing authority of German ID. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * the date of issue of the ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     * the card holder's eye colour. 
     */
    this.eyeColour = nativeResult.eyeColour;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the height of the card holder. 
     */
    this.height = nativeResult.height;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
}

GermanyIDBackSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyIDBackSideRecognizerResult = GermanyIDBackSideRecognizerResult;

/**
 *  Recognizer which can scan the back side of German national ID cards.

 */
function GermanyIDBackSideRecognizer() {
    Recognizer.call(this, 'GermanyIDBackSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyIDBackSideRecognizerResult(nativeResult); }

}

GermanyIDBackSideRecognizer.prototype = new Recognizer('GermanyIDBackSideRecognizer');

BlinkID.prototype.GermanyIDBackSideRecognizer = GermanyIDBackSideRecognizer;

/**
 * Result object for GermanyIDFrontSideRecognizer.
 */
function GermanyIDFrontSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the date of birth of German ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * the date of expiry of German ID 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the German ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the identity card number of German ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * the last name of the German ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * nationality of the German ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * the place of birth of German ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

GermanyIDFrontSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyIDFrontSideRecognizerResult = GermanyIDFrontSideRecognizerResult;

/**
 *  Recognizer which can scan the front side of German national ID cards.

 */
function GermanyIDFrontSideRecognizer() {
    Recognizer.call(this, 'GermanyIDFrontSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyIDFrontSideRecognizerResult(nativeResult); }

}

GermanyIDFrontSideRecognizer.prototype = new Recognizer('GermanyIDFrontSideRecognizer');

BlinkID.prototype.GermanyIDFrontSideRecognizer = GermanyIDFrontSideRecognizer;

/**
 * Result object for GermanyOldIDRecognizer.
 */
function GermanyOldIDRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * the card holder's place of birth (only on old cards). 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

GermanyOldIDRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyOldIDRecognizerResult = GermanyOldIDRecognizerResult;

/**
 *  Recognizer which can scan old German ID cards.

 */
function GermanyOldIDRecognizer() {
    Recognizer.call(this, 'GermanyOldIDRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyOldIDRecognizerResult(nativeResult); }

}

GermanyOldIDRecognizer.prototype = new Recognizer('GermanyOldIDRecognizer');

BlinkID.prototype.GermanyOldIDRecognizer = GermanyOldIDRecognizer;

/**
 * Result object for GermanyPassportRecognizer.
 */
function GermanyPassportRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * the authority of German passport. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * the date of issue of German passport. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * the name of the German passport owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * the place of birth of the German passport owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * the surname of the German passport owner. 
     */
    this.surname = nativeResult.surname;
    
}

GermanyPassportRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyPassportRecognizerResult = GermanyPassportRecognizerResult;

/**
 *  Recognizer which scans German passports.

 */
function GermanyPassportRecognizer() {
    Recognizer.call(this, 'GermanyPassportRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * {true} if the authority is being extracted, {false} otherwise. 
     */
    this.extractAuthority = true;
    
    /** 
     * {true} if the date of issue is being extracted, {false} otherwise. 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * {true} if name is being extracted, {false} otherwise. 
     */
    this.extractName = true;
    
    /** 
     * {true} if nationality is being extracted, {false} otherwise. 
     */
    this.extractNationality = true;
    
    /** 
     * {true} if the place of birth is being extracted, {false} otherwise. 
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * {true} if surname is being extracted, {false} otherwise. 
     */
    this.extractSurname = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyPassportRecognizerResult(nativeResult); }

}

GermanyPassportRecognizer.prototype = new Recognizer('GermanyPassportRecognizer');

BlinkID.prototype.GermanyPassportRecognizer = GermanyPassportRecognizer;

/**
 * Result object for HongKongIDFrontRecognizer.
 */
function HongKongIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * ID date of issue it is successfully converted to {Date} from date format: <code>DDMMYYYY</code>. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue;
    
    /** 
     * the Hong Kong document number. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * owner's date of birth if it is successfully converted to {Date} from date format: <code>DDMMYYYY</code>. 
     */
    this.ownerBirthDate = nativeResult.ownerBirthDate;
    
    /** 
     * owner commercial code if written on ID 
     */
    this.ownerCommercialCode = nativeResult.ownerCommercialCode;
    
    /** 
     * owner full name. 
     */
    this.ownerFullName = nativeResult.ownerFullName;
    
    /** 
     * owner sex (M for male, F for female). 
     */
    this.ownerSex = nativeResult.ownerSex;
    
}

HongKongIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.HongKongIDFrontRecognizerResult = HongKongIDFrontRecognizerResult;

/**
 *  Recognizer for reading Hong Kong ID front document.

 */
function HongKongIDFrontRecognizer() {
    Recognizer.call(this, 'HongKongIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if commercial code of Hong Kong ID owner is being extracted 
     */
    this.extractCommercialCode = true;
    
    /** 
     * true if date of birth of Hong Kong ID owner is being extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if date of issue of Hong Kong ID owner is being extracted 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * true if full name of Hong Kong ID owner is being extracted 
     */
    this.extractFullName = true;
    
    /** 
     * true if sex of Hong Kong ID owner is being extracted 
     */
    this.extractSex = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new HongKongIDFrontRecognizerResult(nativeResult); }

}

HongKongIDFrontRecognizer.prototype = new Recognizer('HongKongIDFrontRecognizer');

BlinkID.prototype.HongKongIDFrontRecognizer = HongKongIDFrontRecognizer;

/**
 * Result object for IKadRecognizer.
 */
function IKadRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * address of the Malaysian iKad owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * the date of birth of Malaysian iKad owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * employer of the Malaysian iKad owner. 
     */
    this.employer = nativeResult.employer;
    
    /** 
     * the expiry date of the Malaysian iKad 
     */
    this.expiryDate = nativeResult.expiryDate;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the full name of the Malaysian iKad owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * the nationality of the Malaysian iKad owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * the passport number of Malaysian iKad. 
     */
    this.passportNumber = nativeResult.passportNumber;
    
    /** 
     * the sector of Malaysian iKad. 
     */
    this.sector = nativeResult.sector;
    
    /** 
     * sex of the Malaysian iKad owner. 
     */
    this.sex = nativeResult.sex;
    
}

IKadRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.IKadRecognizerResult = IKadRecognizerResult;

/**
 *  Recognizer for reading Malaysian iKad.

 */
function IKadRecognizer() {
    Recognizer.call(this, 'IKadRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if address is being extracted 
     */
    this.extractAddress = true;
    
    /** 
     * true if employer is being extracted 
     */
    this.extractEmployer = true;
    
    /** 
     * true if expiry date is being extracted 
     */
    this.extractExpiryDate = true;
    
    /** 
     * true if nationality is being extracted 
     */
    this.extractNationality = true;
    
    /** 
     * true if passport number is being extracted 
     */
    this.extractPassportNumber = true;
    
    /** 
     * true if sector is being extracted 
     */
    this.extractSector = true;
    
    /** 
     * true if sex is being extracted 
     */
    this.extractSex = true;
    
    /** 
     * Defines the DPI (Dots Per Inch) for full document image that should be returned. 
     */
    this.fullDocumentImageDPI = 250;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new IKadRecognizerResult(nativeResult); }

}

IKadRecognizer.prototype = new Recognizer('IKadRecognizer');

BlinkID.prototype.IKadRecognizer = IKadRecognizer;

/**
 * Result object for IndonesiaIDFrontRecognizer.
 */
function IndonesiaIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * address of Indonesian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * blood type of Indonesian ID owner. 
     */
    this.bloodType = nativeResult.bloodType;
    
    /** 
     * citizenship of Indonesian ID owner. 
     */
    this.citizenship = nativeResult.citizenship;
    
    /** 
     * the city of Indonesian ID. 
     */
    this.city = nativeResult.city;
    
    /** 
     * date of birth of Indonesian ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * district of Indonesian ID owner. 
     */
    this.district = nativeResult.district;
    
    /** 
     * document classifier of Indonesian ID. 
     */
    this.documentClassifier = nativeResult.documentClassifier;
    
    /** 
     * the document number of Indonesian ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Kel/ Desa of Indonesian ID owner. 
     */
    this.kelDesa = nativeResult.kelDesa;
    
    /** 
     * marital status of Indonesian ID owner. 
     */
    this.maritalStatus = nativeResult.maritalStatus;
    
    /** 
     * the name of Indonesian ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * occupation of Indonesian ID owner. 
     */
    this.occupation = nativeResult.occupation;
    
    /** 
     * place of birth of Indonesian ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * the province of Indonesian ID. 
     */
    this.province = nativeResult.province;
    
    /** 
     * RT of Indonesian ID. 
     */
    this.rT = nativeResult.rT;
    
    /** 
     * RW of Indonesian ID. 
     */
    this.rW = nativeResult.rW;
    
    /** 
     * religion of Indonesian ID owner. 
     */
    this.religion = nativeResult.religion;
    
    /** 
     * sex of Indonesian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * valid until of Indonesian ID. 
     */
    this.validUntil = nativeResult.validUntil;
    
    /** 
     * {true} if date of expiry of the Indonesian ID is permanent, {false} otherwise. 
     */
    this.validUntilPermanent = nativeResult.validUntilPermanent;
    
}

IndonesiaIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.IndonesiaIDFrontRecognizerResult = IndonesiaIDFrontRecognizerResult;

/**
 *  Recognizer for reading front side of indonesian ID document.

 */
function IndonesiaIDFrontRecognizer() {
    Recognizer.call(this, 'IndonesiaIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if address of Indonesian ID owner is being extracted 
     */
    this.extractAddress = true;
    
    /** 
     * true if blood type of Indonesian ID owner is being extracted 
     */
    this.extractBloodType = true;
    
    /** 
     * true if citizenship of Indonesian ID owner is being extracted 
     */
    this.extractCitizenship = true;
    
    /** 
     * true if city of Indonesian ID owner is being extracted 
     */
    this.extractCity = true;
    
    /** 
     * true if district of Indonesian ID owner is being extracted 
     */
    this.extractDistrict = true;
    
    /** 
     * true if Kel/Desa of Indonesian ID owner is being extracted 
     */
    this.extractKelDesa = true;
    
    /** 
     * true if marital status of Indonesian ID owner is being extracted 
     */
    this.extractMaritalStatus = true;
    
    /** 
     * true if name of Indonesian ID owner is being extracted 
     */
    this.extractName = true;
    
    /** 
     * true if occupation of Indonesian ID owner is being extracted 
     */
    this.extractOccupation = true;
    
    /** 
     * true if place of birth of Indonesian ID owner is being extracted 
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * true if RT of Indonesian ID owner is being extracted 
     */
    this.extractRT = true;
    
    /** 
     * true if RW of Indonesian ID owner is being extracted 
     */
    this.extractRW = true;
    
    /** 
     * true if religion of Indonesian ID owner is being extracted 
     */
    this.extractReligion = true;
    
    /** 
     * true if valid until of Indonesian ID owner is being extracted 
     */
    this.extractValidUntil = true;
    
    /** 
     * true if valid until permanent of Indonesian ID owner is being extracted 
     */
    this.extractValidUntilPermanent = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new IndonesiaIDFrontRecognizerResult(nativeResult); }

}

IndonesiaIDFrontRecognizer.prototype = new Recognizer('IndonesiaIDFrontRecognizer');

BlinkID.prototype.IndonesiaIDFrontRecognizer = IndonesiaIDFrontRecognizer;

/**
 * Result object for JordanCombinedRecognizer.
 */
function JordanCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the date of birth of Jordan ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * the document date of expiry of the Jordan ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * the document number of Jordan ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * the issuer of Jordan ID. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * the name of the Jordan ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * the national number of Jordan ID owner. 
     */
    this.natianalNumber = nativeResult.natianalNumber;
    
    /** 
     * nationality of the Jordan ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * sex of the Jordan ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

JordanCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.JordanCombinedRecognizerResult = JordanCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of both front and back side of Jordan ID.

 */
function JordanCombinedRecognizer() {
    Recognizer.call(this, 'JordanCombinedRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * true if date of birth of Jordan owner is being extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if name of Jordan ID owner is being extracted 
     */
    this.extractName = true;
    
    /** 
     * true if sex of Jordan owner is being extracted 
     */
    this.extractSex = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new JordanCombinedRecognizerResult(nativeResult); }

}

JordanCombinedRecognizer.prototype = new Recognizer('JordanCombinedRecognizer');

BlinkID.prototype.JordanCombinedRecognizer = JordanCombinedRecognizer;

/**
 * Result object for JordanIDBackRecognizer.
 */
function JordanIDBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
}

JordanIDBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.JordanIDBackRecognizerResult = JordanIDBackRecognizerResult;

/**
 *  Recognizer for the back side of Jordan ID.

 */
function JordanIDBackRecognizer() {
    Recognizer.call(this, 'JordanIDBackRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new JordanIDBackRecognizerResult(nativeResult); }

}

JordanIDBackRecognizer.prototype = new Recognizer('JordanIDBackRecognizer');

BlinkID.prototype.JordanIDBackRecognizer = JordanIDBackRecognizer;

/**
 * Result object for JordanIDFrontRecognizer.
 */
function JordanIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * date of birth of Jordan ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * name of Jordan ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * the national number of Jordan ID card owner. 
     */
    this.natianalNumber = nativeResult.natianalNumber;
    
    /** 
     * sex of Jordan ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

JordanIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.JordanIDFrontRecognizerResult = JordanIDFrontRecognizerResult;

/**
 *  Recognizer for reading front side of Jordan ID.

 */
function JordanIDFrontRecognizer() {
    Recognizer.call(this, 'JordanIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if date of birth of Jordan owner is being extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if name of Jordan ID owner is being extracted 
     */
    this.extractName = true;
    
    /** 
     * true if sex of Jordan owner is being extracted 
     */
    this.extractSex = true;
    
    /** 
     * Defines the DPI (Dots Per Inch) for full document image that should be returned. 
     */
    this.fullDocumentImageDPI = 250;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new JordanIDFrontRecognizerResult(nativeResult); }

}

JordanIDFrontRecognizer.prototype = new Recognizer('JordanIDFrontRecognizer');

BlinkID.prototype.JordanIDFrontRecognizer = JordanIDFrontRecognizer;

/**
 * Result object for MRTDCombinedRecognizer.
 */
function MRTDCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     * encoded machine readable zone image from the back side in JPEG format if image encoding 
     */
    this.encodedMachineReadableZoneImage = nativeResult.encodedMachineReadableZoneImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     *  MRZ image from the document 
     */
    this.mrzImage = nativeResult.mrzImage;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
}

MRTDCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MRTDCombinedRecognizerResult = MRTDCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of face from front side of documents and MRZ from back side of
 Machine Readable Travel Document.

 */
function MRTDCombinedRecognizer() {
    Recognizer.call(this, 'MRTDCombinedRecognizer');
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * whether encoding of face image from ID and writing it into the recognition result is enabled. 
     */
    this.encodeMRZImage = false;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether MRZ image will be available in result. 
     */
    this.returnMRZImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new MRTDCombinedRecognizerResult(nativeResult); }

}

MRTDCombinedRecognizer.prototype = new Recognizer('MRTDCombinedRecognizer');

BlinkID.prototype.MRTDCombinedRecognizer = MRTDCombinedRecognizer;

/**
 * Result object for MRTDRecognizer.
 */
function MRTDRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The Data extracted from the machine readable zone. 
     */
    this.MRZResult = nativeResult.MRZResult;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     *  MRZ image from the document 
     */
    this.mrzImage = nativeResult.mrzImage;
    
}

MRTDRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MRTDRecognizerResult = MRTDRecognizerResult;

/**
 * Recognizer that can recognizer Machine Readable Zone (MRZ) of the Machine Readable Travel Document (MRTD)
 */
function MRTDRecognizer() {
    Recognizer.call(this, 'MRTDRecognizer');
    
    /** 
     * Whether returning of unparsed results is allowed 
     */
    this.allowUnparsedResults = false;
    
    /** 
     * Whether returning of unverified results is allowed 
     */
    this.allowUnverifiedResults = false;
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether MRZ image will be available in result. 
     */
    this.returnMRZImage = false;
    
    /** 
     * Desired DPI for MRZ and full document images (if saving of those is enabled) 
     */
    this.saveImageDPI = 250;
    
    this.createResultFromNative = function (nativeResult) { return new MRTDRecognizerResult(nativeResult); }

}

MRTDRecognizer.prototype = new Recognizer('MRTDRecognizer');

BlinkID.prototype.MRTDRecognizer = MRTDRecognizer;

/**
 * Result object for MalaysiaDLFrontRecognizer.
 */
function MalaysiaDLFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * extracted city from the owner address. 
     */
    this.city = nativeResult.city;
    
    /** 
     * Malaysian DL class. 
     */
    this.dLClass = nativeResult.dLClass;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full owner address. 
     */
    this.fullAddress = nativeResult.fullAddress;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the Malaysian DL identity number. 
     */
    this.identityNumber = nativeResult.identityNumber;
    
    /** 
     * name of Malaysian DL owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * nationality of Malaysian DL owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * extracted state from the owner address. 
     */
    this.state = nativeResult.state;
    
    /** 
     * extracted street from the owner address. 
     */
    this.street = nativeResult.street;
    
    /** 
     * Malaysian DL valid from. 
     */
    this.validFrom = nativeResult.validFrom;
    
    /** 
     * Malaysian DL valid until. 
     */
    this.validUntil = nativeResult.validUntil;
    
    /** 
     * extracted ZIP code from the owner address. 
     */
    this.zipCode = nativeResult.zipCode;
    
}

MalaysiaDLFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MalaysiaDLFrontRecognizerResult = MalaysiaDLFrontRecognizerResult;

/**
 *  Recognizer for reading Malaysian driving license document.

 */
function MalaysiaDLFrontRecognizer() {
    Recognizer.call(this, 'MalaysiaDLFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if DL class is being extracted 
     */
    this.extractDLClass = true;
    
    /** 
     * true if full address of Malaysian DL owner is being extracted 
     */
    this.extractFullAddress = true;
    
    /** 
     * true if name of Malaysian DL owner is being extracted 
     */
    this.extractName = true;
    
    /** 
     * true if nationality of Malaysian DL owner is being extracted 
     */
    this.extractNationality = true;
    
    /** 
     * true if valid from is being extracted 
     */
    this.extractValidFrom = true;
    
    /** 
     * true if valid until is being extracted 
     */
    this.extractValidUntil = true;
    
    /** 
     * Defines the DPI (Dots Per Inch) for full document image that should be returned. 
     */
    this.fullDocumentImageDPI = 250;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new MalaysiaDLFrontRecognizerResult(nativeResult); }

}

MalaysiaDLFrontRecognizer.prototype = new Recognizer('MalaysiaDLFrontRecognizer');

BlinkID.prototype.MalaysiaDLFrontRecognizer = MalaysiaDLFrontRecognizer;

/**
 * Result object for MyKadBackRecognizer.
 */
function MyKadBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * date of birth of MyKad owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * document classifier of MyKad. 
     */
    this.documentClassifier = nativeResult.documentClassifier;
    
    /** 
     * extended NRIC (National Registration Identity Card Number) of MyKad. 
     */
    this.extendedNRIC = nativeResult.extendedNRIC;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * NRIC (National Registration Identity Card Number) of MyKad. 
     */
    this.nRIC = nativeResult.nRIC;
    
    /** 
     * sex of MyKad owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

MyKadBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MyKadBackRecognizerResult = MyKadBackRecognizerResult;

/**
 *  Recognizer for reading back side of Malaysian MyKad.

 */
function MyKadBackRecognizer() {
    Recognizer.call(this, 'MyKadBackRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines the DPI (Dots Per Inch) for full document image that should be returned. 
     */
    this.fullDocumentImageDPI = 250;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new MyKadBackRecognizerResult(nativeResult); }

}

MyKadBackRecognizer.prototype = new Recognizer('MyKadBackRecognizer');

BlinkID.prototype.MyKadBackRecognizer = MyKadBackRecognizer;

/**
 * Result object for MyKadFrontRecognizer.
 */
function MyKadFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * owner army number if written on MyTentera 
     */
    this.armyNumber = nativeResult.armyNumber;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * NRIC number (National Registration Identity Card Number) 
     */
    this.nRICNumber = nativeResult.nRICNumber;
    
    /** 
     * full owner address. 
     */
    this.ownerAddress = nativeResult.ownerAddress;
    
    /** 
     * extracted city from the owner address. 
     */
    this.ownerAddressCity = nativeResult.ownerAddressCity;
    
    /** 
     * extracted state from the owner address. 
     */
    this.ownerAddressState = nativeResult.ownerAddressState;
    
    /** 
     * extracted street from the owner address. 
     */
    this.ownerAddressStreet = nativeResult.ownerAddressStreet;
    
    /** 
     * extracted ZIP code from the owner address. 
     */
    this.ownerAddressZipCode = nativeResult.ownerAddressZipCode;
    
    /** 
     * owner's date of birth if it is successfully converted to {Date} from date format: <code>YYMMDD</code>. 
     */
    this.ownerBirthDate = nativeResult.ownerBirthDate;
    
    /** 
     * owner full name 
     */
    this.ownerFullName = nativeResult.ownerFullName;
    
    /** 
     * owner religion if written on MyKad 
     */
    this.ownerReligion = nativeResult.ownerReligion;
    
    /** 
     * owner sex (M for male, F for female) 
     */
    this.ownerSex = nativeResult.ownerSex;
    
    /** 
     * owner's date of birth as raw string in format {YYMMDD}. 
     */
    this.rawBirthDate = nativeResult.rawBirthDate;
    
}

MyKadFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MyKadFrontRecognizerResult = MyKadFrontRecognizerResult;

/**
 *  Recognizer for reading front side of Malaysian MyKad.

 */
function MyKadFrontRecognizer() {
    Recognizer.call(this, 'MyKadFrontRecognizer');
    
    /** 
     * true if army number of Malaysian MyTentera owner is being extracted 
     */
    this.extractArmyNumber = false;
    
    /** 
     * Defines the DPI (Dots Per Inch) for full document image that should be returned. 
     */
    this.fullDocumentImageDPI = 250;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new MyKadFrontRecognizerResult(nativeResult); }

}

MyKadFrontRecognizer.prototype = new Recognizer('MyKadFrontRecognizer');

BlinkID.prototype.MyKadFrontRecognizer = MyKadFrontRecognizer;

/**
 * Result object for MyTenteraRecognizer.
 */
function MyTenteraRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the Malaysian tentra number. 
     */
    this.armyNumber = nativeResult.armyNumber;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * NRIC number (National Registration Identity Card Number) 
     */
    this.nRICNumber = nativeResult.nRICNumber;
    
    /** 
     * full owner address. 
     */
    this.ownerAddress = nativeResult.ownerAddress;
    
    /** 
     * extracted city from the owner address. 
     */
    this.ownerAddressCity = nativeResult.ownerAddressCity;
    
    /** 
     * extracted state from the owner address. 
     */
    this.ownerAddressState = nativeResult.ownerAddressState;
    
    /** 
     * extracted street from the owner address. 
     */
    this.ownerAddressStreet = nativeResult.ownerAddressStreet;
    
    /** 
     * extracted ZIP code from the owner address. 
     */
    this.ownerAddressZipCode = nativeResult.ownerAddressZipCode;
    
    /** 
     * owner's date of birth if it is successfully converted to {Date} from date format: <code>YYMMDD</code>. 
     */
    this.ownerBirthDate = nativeResult.ownerBirthDate;
    
    /** 
     * owner full name 
     */
    this.ownerFullName = nativeResult.ownerFullName;
    
    /** 
     * owner religion if written on MyTentera 
     */
    this.ownerReligion = nativeResult.ownerReligion;
    
    /** 
     * owner sex (M for male, F for female) 
     */
    this.ownerSex = nativeResult.ownerSex;
    
}

MyTenteraRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MyTenteraRecognizerResult = MyTenteraRecognizerResult;

/**
 *  Recognizer for reading Malaysian MyTentera document.

 */
function MyTenteraRecognizer() {
    Recognizer.call(this, 'MyTenteraRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if full address of Malaysian MyTentera owner is being extracted 
     */
    this.extractFullNameAndAddress = true;
    
    /** 
     * true if religion of Malaysian MyTentera owner is being extracted 
     */
    this.extractReligion = true;
    
    /** 
     * Defines the DPI (Dots Per Inch) for full document image that should be returned. 
     */
    this.fullDocumentImageDPI = 250;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new MyTenteraRecognizerResult(nativeResult); }

}

MyTenteraRecognizer.prototype = new Recognizer('MyTenteraRecognizer');

BlinkID.prototype.MyTenteraRecognizer = MyTenteraRecognizer;

/**
 * Result object for NewZealandDLFrontRecognizer.
 */
function NewZealandDLFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * address on New Zealand drivers license. 
     */
    this.address = nativeResult.address;
    
    /** 
     * card version on New Zealand drivers license. 
     */
    this.cardVersion = nativeResult.cardVersion;
    
    /** 
     * date of birth on New Zealand drivers license. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * true if DONOR is on New Zealand drivers license else returns false. 
     */
    this.donorIndicator = nativeResult.donorIndicator;
    
    /** 
     * expiry date on New Zealand drivers license. 
     */
    this.expiryDate = nativeResult.expiryDate;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * first names on New Zealand drivers license. 
     */
    this.firstNames = nativeResult.firstNames;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * issue date on New Zealand drivers license. 
     */
    this.issueDate = nativeResult.issueDate;
    
    /** 
     * license number on New Zealand drivers license. 
     */
    this.licenseNumber = nativeResult.licenseNumber;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * surname on New Zealand drivers license. 
     */
    this.surname = nativeResult.surname;
    
}

NewZealandDLFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.NewZealandDLFrontRecognizerResult = NewZealandDLFrontRecognizerResult;

/**
 *  Recognizer for reading front side of New Zealand driver's licence.

 */
function NewZealandDLFrontRecognizer() {
    Recognizer.call(this, 'NewZealandDLFrontRecognizer');
    
    /** 
     * true if address of New Zealand DL owner is being extracted 
     */
    this.extractAddress = true;
    
    /** 
     * true if date of birth on New Zealand DL is being extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if donor indicator of New Zealand DL owner is being extracted 
     */
    this.extractDonorIndicator = true;
    
    /** 
     * true if expiry date on New Zealand DL is being extracted 
     */
    this.extractExpiryDate = true;
    
    /** 
     * true if first names of New Zealand DL owner is being extracted 
     */
    this.extractFirstNames = true;
    
    /** 
     * true if issue date on New Zealand DL is being extracted 
     */
    this.extractIssueDate = true;
    
    /** 
     * true if surname of New Zealand DL owner is being extracted 
     */
    this.extractSurname = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new NewZealandDLFrontRecognizerResult(nativeResult); }

}

NewZealandDLFrontRecognizer.prototype = new Recognizer('NewZealandDLFrontRecognizer');

BlinkID.prototype.NewZealandDLFrontRecognizer = NewZealandDLFrontRecognizer;

/**
 * Result object for Pdf417Recognizer.
 */
function Pdf417RecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The format of the scanned barcode. 
     */
    this.barcodeFormat = nativeResult.barcodeFormat;
    
    /** 
     * The raw bytes contained inside barcode. 
     */
    this.rawData = nativeResult.rawData;
    
    /** 
     * String representation of data inside barcode. 
     */
    this.stringData = nativeResult.stringData;
    
    /** 
     * True if returned result is uncertain, i.e. if scanned barcode was incomplete (i.e. 
     */
    this.uncertain = nativeResult.uncertain;
    
}

Pdf417RecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.Pdf417RecognizerResult = Pdf417RecognizerResult;

/**
 * A recognizer that can scan PDF417 2D barcodes.
 */
function Pdf417Recognizer() {
    Recognizer.call(this, 'Pdf417Recognizer');
    
    /** 
     * Enables scanning of barcodes with inverse intensity values (e.g. white barcode on black background) 
     */
    this.inverseScanning = false;
    
    /** 
     * Allow scanning PDF417 barcodes which don't have quiet zone 
     */
    this.nullQuietZoneAllowed = false;
    
    /** 
     * Enable decoding of non-standard PDF417 barcodes, but without 
     */
    this.uncertainDecoding = true;
    
    this.createResultFromNative = function (nativeResult) { return new Pdf417RecognizerResult(nativeResult); }

}

Pdf417Recognizer.prototype = new Recognizer('Pdf417Recognizer');

BlinkID.prototype.Pdf417Recognizer = Pdf417Recognizer;

/**
 * Result object for PolandCombinedRecognizer.
 */
function PolandCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the date of birth of Polish ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * the document date of expiry of the Polish ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * the document number of the Polish ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the family name of the Polish ID owner. 
     */
    this.familyName = nativeResult.familyName;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * the given names of the Polish ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * the issuer of the Polish ID. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * the nationality of the Polish ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * the parents' given names of the Polish ID owner. 
     */
    this.parentsGivenNames = nativeResult.parentsGivenNames;
    
    /** 
     * personal number of the Polish ID owner. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * sex of the Polish ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * the surname of the Polish ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

PolandCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.PolandCombinedRecognizerResult = PolandCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of both front and back side of Polish ID.

 */
function PolandCombinedRecognizer() {
    Recognizer.call(this, 'PolandCombinedRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * true if date of birth is being extracted from ID 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if family name is being extracted from ID 
     */
    this.extractFamilyName = true;
    
    /** 
     * true if first name is being extracted from ID 
     */
    this.extractFirstName = true;
    
    /** 
     * true if last name is being extracted from ID 
     */
    this.extractLastName = true;
    
    /** 
     * true if parents' names is being extracted from ID 
     */
    this.extractParentsName = true;
    
    /** 
     * true if sex is being extracted from ID 
     */
    this.extractSex = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new PolandCombinedRecognizerResult(nativeResult); }

}

PolandCombinedRecognizer.prototype = new Recognizer('PolandCombinedRecognizer');

BlinkID.prototype.PolandCombinedRecognizer = PolandCombinedRecognizer;

/**
 * Result object for PolandIDBackSideRecognizer.
 */
function PolandIDBackSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
}

PolandIDBackSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.PolandIDBackSideRecognizerResult = PolandIDBackSideRecognizerResult;

/**
 *  Recognizer for the back side of Polish ID.

 */
function PolandIDBackSideRecognizer() {
    Recognizer.call(this, 'PolandIDBackSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new PolandIDBackSideRecognizerResult(nativeResult); }

}

PolandIDBackSideRecognizer.prototype = new Recognizer('PolandIDBackSideRecognizer');

BlinkID.prototype.PolandIDBackSideRecognizer = PolandIDBackSideRecognizer;

/**
 * Result object for PolandIDFrontSideRecognizer.
 */
function PolandIDFrontSideRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the date of birth of Polish ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the family name of Polish ID owner. 
     */
    this.familyName = nativeResult.familyName;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the given names of the Polish ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * the parents' given names of the Polish ID owner. 
     */
    this.parentsGivenNames = nativeResult.parentsGivenNames;
    
    /** 
     * sex of the Polish ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * the surname of the Polish ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

PolandIDFrontSideRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.PolandIDFrontSideRecognizerResult = PolandIDFrontSideRecognizerResult;

/**
 *  Recognizer which can scan front side of Polish national ID cards.

 */
function PolandIDFrontSideRecognizer() {
    Recognizer.call(this, 'PolandIDFrontSideRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if date of birth is being extracted from ID 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if family name is being extracted from ID 
     */
    this.extractFamilyName = true;
    
    /** 
     * true if first name is being extracted from ID 
     */
    this.extractFirstName = true;
    
    /** 
     * true if last name is being extracted from ID 
     */
    this.extractLastName = true;
    
    /** 
     * true if parents' names is being extracted from ID 
     */
    this.extractParentsName = true;
    
    /** 
     * true if sex is being extracted from ID 
     */
    this.extractSex = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new PolandIDFrontSideRecognizerResult(nativeResult); }

}

PolandIDFrontSideRecognizer.prototype = new Recognizer('PolandIDFrontSideRecognizer');

BlinkID.prototype.PolandIDFrontSideRecognizer = PolandIDFrontSideRecognizer;

/**
 * Result object for RomaniaIDFrontRecognizer.
 */
function RomaniaIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * address of the Romanian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * the CNP of Romanian ID owner. 
     */
    this.cNP = nativeResult.cNP;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Romanian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the identity card number of Romanian ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * the identity card series of Romanian ID. 
     */
    this.identityCardSeries = nativeResult.identityCardSeries;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * issuing authority the Romanian ID. 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * the last name of the Romanian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * nationality of the Romanian ID owner which is extracted from the non MRZ field. 
     */
    this.nonMRZNationality = nativeResult.nonMRZNationality;
    
    /** 
     * sex of the Romanian ID owner which is extracted from the non MRZ field. 
     */
    this.nonMRZSex = nativeResult.nonMRZSex;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * the parent names of Romanian ID owner. 
     */
    this.parentNames = nativeResult.parentNames;
    
    /** 
     * place of birth of the Romanian ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * the valid from date of Romanian ID. 
     */
    this.validFrom = nativeResult.validFrom;
    
    /** 
     * the valid until date of Romanian ID. 
     */
    this.validUntil = nativeResult.validUntil;
    
}

RomaniaIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.RomaniaIDFrontRecognizerResult = RomaniaIDFrontRecognizerResult;

/**
 *  Recognizer for front side of Romanian ID.

 */
function RomaniaIDFrontRecognizer() {
    Recognizer.call(this, 'RomaniaIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if address is being extracted from Romanian ID 
     */
    this.extractAddress = true;
    
    /** 
     * true if first name is being extracted from Romanian ID 
     */
    this.extractFirstName = true;
    
    /** 
     * true if issuing authority is being extracted from Romanian ID 
     */
    this.extractIssuedBy = true;
    
    /** 
     * true if last name is being extracted from Romanian ID 
     */
    this.extractLastName = true;
    
    /** 
     * true if sex field outside of the MRZ is being extracted from Romanian ID 
     */
    this.extractNonMRZSex = true;
    
    /** 
     * true if place of birth is being extracted from Romanian ID 
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * true if valid from is being extracted from Romanian ID 
     */
    this.extractValidFrom = true;
    
    /** 
     * true if valid until is being extracted from Romanian ID 
     */
    this.extractValidUntil = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new RomaniaIDFrontRecognizerResult(nativeResult); }

}

RomaniaIDFrontRecognizer.prototype = new Recognizer('RomaniaIDFrontRecognizer');

BlinkID.prototype.RomaniaIDFrontRecognizer = RomaniaIDFrontRecognizer;

/**
 * Result object for SerbiaCombinedRecognizer.
 */
function SerbiaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * the date of birth of the Serbian ID holder. 
     */
    this.documentDateOfBirth = nativeResult.documentDateOfBirth;
    
    /** 
     * the document date of expiry of the Serbian ID. 
     */
    this.documentDateOfExpiry = nativeResult.documentDateOfExpiry;
    
    /** 
     * the document date of issue of the Serbian ID. 
     */
    this.documentDateOfIssue = nativeResult.documentDateOfIssue;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     *  encoded signature in JPEG from the document 
     */
    this.encodedSignatureImage = nativeResult.encodedSignatureImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * first name of the Serbian ID holder. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * the identity card number of Serbian ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * issuer of the Serbian ID holder. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * personal identification number of the Serbian ID holder. 
     */
    this.jMBG = nativeResult.jMBG;
    
    /** 
     * last name of the Serbian ID holder. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * nationality of the Serbian ID holder. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * sex of the Serbian ID holder. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

SerbiaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SerbiaCombinedRecognizerResult = SerbiaCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of both front and back side of Serbian ID.

 */
function SerbiaCombinedRecognizer() {
    Recognizer.call(this, 'SerbiaCombinedRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether encoding of signature image and writing it into the recognition result is enabled. 
     */
    this.encodeSignatureImage = false;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new SerbiaCombinedRecognizerResult(nativeResult); }

}

SerbiaCombinedRecognizer.prototype = new Recognizer('SerbiaCombinedRecognizer');

BlinkID.prototype.SerbiaCombinedRecognizer = SerbiaCombinedRecognizer;

/**
 * Result object for SerbiaIDBackRecognizer.
 */
function SerbiaIDBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
}

SerbiaIDBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SerbiaIDBackRecognizerResult = SerbiaIDBackRecognizerResult;

/**
 *  Recognizer for back side of Serbian ID.

 */
function SerbiaIDBackRecognizer() {
    Recognizer.call(this, 'SerbiaIDBackRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SerbiaIDBackRecognizerResult(nativeResult); }

}

SerbiaIDBackRecognizer.prototype = new Recognizer('SerbiaIDBackRecognizer');

BlinkID.prototype.SerbiaIDBackRecognizer = SerbiaIDBackRecognizer;

/**
 * Result object for SerbiaIDFrontRecognizer.
 */
function SerbiaIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the document number of Serbian ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the issuing date of the Serbian ID. 
     */
    this.issuingDate = nativeResult.issuingDate;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * the valid until of the Serbian ID. 
     */
    this.validUntil = nativeResult.validUntil;
    
}

SerbiaIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SerbiaIDFrontRecognizerResult = SerbiaIDFrontRecognizerResult;

/**
 *  Recognizer for front side of Serbian ID.

 */
function SerbiaIDFrontRecognizer() {
    Recognizer.call(this, 'SerbiaIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if issuing date of Serbian ID is being extracted 
     */
    this.extractIssuingDate = true;
    
    /** 
     * true if valid until is being extracted from Serbian ID 
     */
    this.extractValidUntil = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SerbiaIDFrontRecognizerResult(nativeResult); }

}

SerbiaIDFrontRecognizer.prototype = new Recognizer('SerbiaIDFrontRecognizer');

BlinkID.prototype.SerbiaIDFrontRecognizer = SerbiaIDFrontRecognizer;

/**
 * Result object for SimNumberRecognizer.
 */
function SimNumberRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Recognized SIM number from barcode or empty string if recognition failed. 
     */
    this.simNumber = nativeResult.simNumber;
    
}

SimNumberRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SimNumberRecognizerResult = SimNumberRecognizerResult;

/**
 * Recognizer that can perform recognition of barcodes on SIM packaging.
 */
function SimNumberRecognizer() {
    Recognizer.call(this, 'SimNumberRecognizer');
    
    this.createResultFromNative = function (nativeResult) { return new SimNumberRecognizerResult(nativeResult); }

}

SimNumberRecognizer.prototype = new Recognizer('SimNumberRecognizer');

BlinkID.prototype.SimNumberRecognizer = SimNumberRecognizer;

/**
 * Result object for SingaporeCombinedRecognizer.
 */
function SingaporeCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the address of the Singapore ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * blood group of the Singapore ID holder. 
     */
    this.bloodGroup = nativeResult.bloodGroup;
    
    /** 
     * the card number of Singapore ID. 
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /** 
     * the country of birth of Singapore ID. 
     */
    this.countryOfBirth = nativeResult.countryOfBirth;
    
    /** 
     * the date of birth of Singapore ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * the document date of issue of the Singapore ID. 
     */
    this.documentDateOfIssue = nativeResult.documentDateOfIssue;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * the name of the Singapore ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * race of the Singapore ID owner. 
     */
    this.race = nativeResult.race;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * sex of the Singapore ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

SingaporeCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SingaporeCombinedRecognizerResult = SingaporeCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of both front and back side of Singaporean ID.

 */
function SingaporeCombinedRecognizer() {
    Recognizer.call(this, 'SingaporeCombinedRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new SingaporeCombinedRecognizerResult(nativeResult); }

}

SingaporeCombinedRecognizer.prototype = new Recognizer('SingaporeCombinedRecognizer');

BlinkID.prototype.SingaporeCombinedRecognizer = SingaporeCombinedRecognizer;

/**
 * Result object for SingaporeIDBackRecognizer.
 */
function SingaporeIDBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * address of the Singapore ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * blood group of the Singapore ID owner. 
     */
    this.bloodGroup = nativeResult.bloodGroup;
    
    /** 
     * the card number of Singapore ID. 
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /** 
     * the document date of issue of the Singapore ID 
     */
    this.documentDateOfIssue = nativeResult.documentDateOfIssue;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
}

SingaporeIDBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SingaporeIDBackRecognizerResult = SingaporeIDBackRecognizerResult;

/**
 *  Recognizer for back side of Singapore ID.

 */
function SingaporeIDBackRecognizer() {
    Recognizer.call(this, 'SingaporeIDBackRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if blood group of Singapore ID owner is being extracted 
     */
    this.extractBloodGroup = true;
    
    /** 
     * true if date of issue is being extracted from Singapore ID 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SingaporeIDBackRecognizerResult(nativeResult); }

}

SingaporeIDBackRecognizer.prototype = new Recognizer('SingaporeIDBackRecognizer');

BlinkID.prototype.SingaporeIDBackRecognizer = SingaporeIDBackRecognizer;

/**
 * Result object for SingaporeIDFrontRecognizer.
 */
function SingaporeIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the card number of Singapore ID. 
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /** 
     * country of birth of the Singapore ID owner 
     */
    this.countryOfBirth = nativeResult.countryOfBirth;
    
    /** 
     * the date of birth of Singapore ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * name of the Singapore ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * race of the Singapore ID owner. 
     */
    this.race = nativeResult.race;
    
    /** 
     * sex of the Singapore ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

SingaporeIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SingaporeIDFrontRecognizerResult = SingaporeIDFrontRecognizerResult;

/**
 *  Recognizer for front side of Singapore ID.

 */
function SingaporeIDFrontRecognizer() {
    Recognizer.call(this, 'SingaporeIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if country of birth of Singapore ID owner is being extracted 
     */
    this.extractCountryOfBirth = true;
    
    /** 
     * true if date of birth of Singapore ID owner is being extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if race of Singapore ID owner is being extracted 
     */
    this.extractRace = true;
    
    /** 
     * true if sex of Singapore ID owner is being extracted 
     */
    this.extractSex = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SingaporeIDFrontRecognizerResult(nativeResult); }

}

SingaporeIDFrontRecognizer.prototype = new Recognizer('SingaporeIDFrontRecognizer');

BlinkID.prototype.SingaporeIDFrontRecognizer = SingaporeIDFrontRecognizer;

/**
 * Result object for SlovakiaCombinedRecognizer.
 */
function SlovakiaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the address of the Slovak ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * place of birth of the Slovak ID holder. 
     */
    this.combinedPlaceOfBirth = nativeResult.combinedPlaceOfBirth;
    
    /** 
     * the date of birth of Slovak ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * the document date of expiry of the Slovak ID. 
     */
    this.documentDateOfExpiry = nativeResult.documentDateOfExpiry;
    
    /** 
     * the document date of issue of the Slovak ID. 
     */
    this.documentDateOfIssue = nativeResult.documentDateOfIssue;
    
    /** 
     * the identity card number of Slovak ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     *  encoded signature in JPEG from the document 
     */
    this.encodedSignatureImage = nativeResult.encodedSignatureImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Slovak ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * the issuing authority of Slovak ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * the last name of the Slovak ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * nationality of the Slovak ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * personal number of the Slovak ID holder. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * sex of the Slovak ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * special remarks of the Slovak ID holder. 
     */
    this.specialRemarks = nativeResult.specialRemarks;
    
    /** 
     * surname at birth of the Slovak ID holder. 
     */
    this.surnameAtBirth = nativeResult.surnameAtBirth;
    
}

SlovakiaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SlovakiaCombinedRecognizerResult = SlovakiaCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of both front and back side of Slovak ID.

 */
function SlovakiaCombinedRecognizer() {
    Recognizer.call(this, 'SlovakiaCombinedRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether encoding of signature image and writing it into the recognition result is enabled. 
     */
    this.encodeSignatureImage = false;
    
    /** 
     * true if date of birth is being extracted from ID 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if date of expiry is being extracted from ID 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * true if date of issue is being extracted from ID 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * true if document number is being extracted from ID 
     */
    this.extractDocumentNumber = true;
    
    /** 
     * true if issuer is being extracted from ID 
     */
    this.extractIssuedBy = true;
    
    /** 
     * true if nationality is being extracted from ID 
     */
    this.extractNationality = true;
    
    /** 
     * true if place of birth is being extracted from ID 
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * true if sex is being extracted from ID 
     */
    this.extractSex = true;
    
    /** 
     * true if special remarks are being extracted from ID 
     */
    this.extractSpecialRemarks = true;
    
    /** 
     * true if surname at birth is being extracted from ID 
     */
    this.extractSurnameAtBirth = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new SlovakiaCombinedRecognizerResult(nativeResult); }

}

SlovakiaCombinedRecognizer.prototype = new Recognizer('SlovakiaCombinedRecognizer');

BlinkID.prototype.SlovakiaCombinedRecognizer = SlovakiaCombinedRecognizer;

/**
 * Result object for SlovakiaIDBackRecognizer.
 */
function SlovakiaIDBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the address of the card holder. 
     */
    this.address = nativeResult.address;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * place of birth of the card holder. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * special remarks concerning the card holder. 
     */
    this.specialRemarks = nativeResult.specialRemarks;
    
    /** 
     * surname at birth of the card holder. 
     */
    this.surnameAtBirth = nativeResult.surnameAtBirth;
    
}

SlovakiaIDBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SlovakiaIDBackRecognizerResult = SlovakiaIDBackRecognizerResult;

/**
 *  Recognizer for back side of Slovak ID.

 */
function SlovakiaIDBackRecognizer() {
    Recognizer.call(this, 'SlovakiaIDBackRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if place of birth is being extracted from ID 
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * true if special remarks are being extracted from ID 
     */
    this.extractSpecialRemarks = true;
    
    /** 
     * true if surname at birth is being extracted from ID 
     */
    this.extractSurnameAtBirth = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SlovakiaIDBackRecognizerResult(nativeResult); }

}

SlovakiaIDBackRecognizer.prototype = new Recognizer('SlovakiaIDBackRecognizer');

BlinkID.prototype.SlovakiaIDBackRecognizer = SlovakiaIDBackRecognizer;

/**
 * Result object for SlovakiaIDFrontRecognizer.
 */
function SlovakiaIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the date of birth of Slovak ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * the date of expiry of Slovak ID 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * the date of issue of Slovak ID 
     */
    this.dateOfIssue = nativeResult.dateOfIssue;
    
    /** 
     * the identity card number of Slovak ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Slovak ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the issuer of the Slovak ID. 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * the last name of the Slovak ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * the nationality of the Slovak ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * the personal number of the Slovak ID owner. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     * sex of the Slovak ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

SlovakiaIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SlovakiaIDFrontRecognizerResult = SlovakiaIDFrontRecognizerResult;

/**
 *  Recognizer which can scan front side of slovak national ID cards.

 */
function SlovakiaIDFrontRecognizer() {
    Recognizer.call(this, 'SlovakiaIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if date of birth is being extracted from ID 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if date of expiry is being extracted from ID 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * true if date of issue is being extracted from ID 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * true if document number is being extracted from ID 
     */
    this.extractDocumentNumber = true;
    
    /** 
     * true if issuer is being extracted from ID 
     */
    this.extractIssuedBy = true;
    
    /** 
     * true if nationality is being extracted from ID 
     */
    this.extractNationality = true;
    
    /** 
     * true if sex is being extracted from ID 
     */
    this.extractSex = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SlovakiaIDFrontRecognizerResult(nativeResult); }

}

SlovakiaIDFrontRecognizer.prototype = new Recognizer('SlovakiaIDFrontRecognizer');

BlinkID.prototype.SlovakiaIDFrontRecognizer = SlovakiaIDFrontRecognizer;

/**
 * Result object for SloveniaCombinedRecognizer.
 */
function SloveniaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the address of the Slovenian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * citizenship of the Slovenian ID owner. 
     */
    this.citizenship = nativeResult.citizenship;
    
    /** 
     * the date of birth of Slovenian ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines digital signature of recognition results. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Defines digital signature version. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Defines {true} if data from scanned parts/sides of the document match, 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * the document date of expiry of the Slovenian ID. 
     */
    this.documentDateOfExpiry = nativeResult.documentDateOfExpiry;
    
    /** 
     * the document date of issue of the Slovenian ID. 
     */
    this.documentDateOfIssue = nativeResult.documentDateOfIssue;
    
    /** 
     *  encoded full document image from the back side in JPEG format 
     */
    this.encodedBackFullDocumentImage = nativeResult.encodedBackFullDocumentImage;
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image from the front side in JPEG format 
     */
    this.encodedFrontFullDocumentImage = nativeResult.encodedFrontFullDocumentImage;
    
    /** 
     *  encoded signature in JPEG from the document 
     */
    this.encodedSignatureImage = nativeResult.encodedSignatureImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Slovenian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  back side image of the document 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     *  front side image of the document 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * the identity card number of Slovenian ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * the issuing authority of Slovenian ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * the last name of the Slovenian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * personal identification number of the Slovenian ID holder. 
     */
    this.personalIdentificationNumber = nativeResult.personalIdentificationNumber;
    
    /** 
     *  {true} if recognizer has finished scanning first side and is now scanning back side, 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * sex of the Slovenian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

SloveniaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SloveniaCombinedRecognizerResult = SloveniaCombinedRecognizerResult;

/**
 *  Recognizer for combined reading of both front and back side of Slovenian ID.

 */
function SloveniaCombinedRecognizer() {
    Recognizer.call(this, 'SloveniaCombinedRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether encoding of signature image and writing it into the recognition result is enabled. 
     */
    this.encodeSignatureImage = false;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    /** 
     * Defines whether or not recognition result should be signed. 
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new SloveniaCombinedRecognizerResult(nativeResult); }

}

SloveniaCombinedRecognizer.prototype = new Recognizer('SloveniaCombinedRecognizer');

BlinkID.prototype.SloveniaCombinedRecognizer = SloveniaCombinedRecognizer;

/**
 * Result object for SloveniaIDBackRecognizer.
 */
function SloveniaIDBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * the address of the card holder. 
     */
    this.address = nativeResult.address;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * the issuing authority of Slovenian ID. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * the date of issue of the ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
}

SloveniaIDBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SloveniaIDBackRecognizerResult = SloveniaIDBackRecognizerResult;

/**
 *  Recognizer for the back side of Slovenian ID.

 */
function SloveniaIDBackRecognizer() {
    Recognizer.call(this, 'SloveniaIDBackRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if issuing authority is being extracted from Slovenian ID 
     */
    this.extractAuthority = true;
    
    /** 
     * true if date of issue is being extracted from Slovenian ID 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SloveniaIDBackRecognizerResult(nativeResult); }

}

SloveniaIDBackRecognizer.prototype = new Recognizer('SloveniaIDBackRecognizer');

BlinkID.prototype.SloveniaIDBackRecognizer = SloveniaIDBackRecognizer;

/**
 * Result object for SloveniaIDFrontRecognizer.
 */
function SloveniaIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the date of birth of Slovenian ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * the date of expiry of Slovenian ID owner 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Slovenian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the last name of the Slovenian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * nationality of the Slovenian ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * sex of the Slovenian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

SloveniaIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SloveniaIDFrontRecognizerResult = SloveniaIDFrontRecognizerResult;

/**
 *  Recognizer which can scan the front side of Slovenian national ID cards.

 */
function SloveniaIDFrontRecognizer() {
    Recognizer.call(this, 'SloveniaIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if date of birth of Slovenian ID owner is being extracted 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * true if date of expiry is being extracted from Slovenian ID 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * true if nationality of Slovenian ID owner is being extracted 
     */
    this.extractNationality = true;
    
    /** 
     * true if sex of Slovenian ID owner is being extracted 
     */
    this.extractSex = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SloveniaIDFrontRecognizerResult(nativeResult); }

}

SloveniaIDFrontRecognizer.prototype = new Recognizer('SloveniaIDFrontRecognizer');

BlinkID.prototype.SloveniaIDFrontRecognizer = SloveniaIDFrontRecognizer;

/**
 * Result object for SwitzerlandIDBackRecognizer.
 */
function SwitzerlandIDBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * the authority of Swiss ID card. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * the date of issue of Swiss ID card. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the height of the Swiss ID card owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * the date of expiry of Swiss ID card. 
     */
    this.nonMRZDateOfExpiry = nativeResult.nonMRZDateOfExpiry;
    
    /** 
     * the sex of the Swiss ID card owner. 
     */
    this.nonMRZSex = nativeResult.nonMRZSex;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * the place of origin of the Swiss ID card owner. 
     */
    this.placeOfOrigin = nativeResult.placeOfOrigin;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
}

SwitzerlandIDBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwitzerlandIDBackRecognizerResult = SwitzerlandIDBackRecognizerResult;

/**
 *  Recognizer which scans back side of Swiss ID card.

 */
function SwitzerlandIDBackRecognizer() {
    Recognizer.call(this, 'SwitzerlandIDBackRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * {true} if the authority is being extracted, {false} otherwise. 
     */
    this.extractAuthority = true;
    
    /** 
     * {true} if the date of expiry is being extracted, {false} otherwise. 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * {true} if the date of issue is being extracted, {false} otherwise. 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * {true} if the height is being extracted, {false} otherwise. 
     */
    this.extractHeight = true;
    
    /** 
     * {true} if the place of origin is being extracted, {false} otherwise. 
     */
    this.extractPlaceOfOrigin = true;
    
    /** 
     * {true} if the sex is being extracted, {false} otherwise. 
     */
    this.extractSex = true;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SwitzerlandIDBackRecognizerResult(nativeResult); }

}

SwitzerlandIDBackRecognizer.prototype = new Recognizer('SwitzerlandIDBackRecognizer');

BlinkID.prototype.SwitzerlandIDBackRecognizer = SwitzerlandIDBackRecognizer;

/**
 * Result object for SwitzerlandIDFrontRecognizer.
 */
function SwitzerlandIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * the date of birth of Swiss ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * the first name of the Swiss ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the last name of the Swiss ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     *  signature image from the document 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

SwitzerlandIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwitzerlandIDFrontRecognizerResult = SwitzerlandIDFrontRecognizerResult;

/**
 *  Recognizer which can scan the front side of Swiss national ID cards.

 */
function SwitzerlandIDFrontRecognizer() {
    Recognizer.call(this, 'SwitzerlandIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * true if first name of Swiss ID owner is being extracted 
     */
    this.extractFirstName = true;
    
    /** 
     * true if last name of Swiss ID owner is being extracted 
     */
    this.extractLastName = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Defines whether signature image will be available in result. 
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SwitzerlandIDFrontRecognizerResult(nativeResult); }

}

SwitzerlandIDFrontRecognizer.prototype = new Recognizer('SwitzerlandIDFrontRecognizer');

BlinkID.prototype.SwitzerlandIDFrontRecognizer = SwitzerlandIDFrontRecognizer;

/**
 * Result object for SwitzerlandPassportRecognizer.
 */
function SwitzerlandPassportRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Defines true if Machine Readable Zone has been parsed, false otherwise. 
     */
    this.MRZParsed = nativeResult.MRZParsed;
    
    /** 
     * Defines the entire Machine Readable Zone text from ID. This text is usually used for parsing 
     */
    this.MRZText = nativeResult.MRZText;
    
    /** 
     * Defines true if all check digits inside MRZ are correct, false otherwise. 
     */
    this.MRZVerified = nativeResult.MRZVerified;
    
    /** 
     * Defines alien number.<code>null</code> or empty string if not available. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Defines application receipt number.<code>null</code> or empty string if not available. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * the authority of Swiss passport. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Defines holder's date of birth if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth;
    
    /** 
     * Defines date of expiry if it is successfully converted to result from MRZ date format: <code>YYMMDD</code>. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry;
    
    /** 
     * the date of issue of Swiss passport. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue;
    
    /** 
     * Defines document code. Document code contains two characters. For MRTD the first character shall 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Defines document number. Document number contains up to 9 characters. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Defines the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the height of the Swiss passport owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * Defines immigrant case number.<code>null</code> or empty string if not available. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Defines three-letter or two-letter code which indicate the issuing State. Three-letter codes are based 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * the name of the Swiss passport owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * Defines nationality of the holder represented by a three-letter or two-letter code. Three-letter 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * the date of birth of Swiss passport. 
     */
    this.nonMRZDateOfBirth = nativeResult.nonMRZDateOfBirth;
    
    /** 
     * the date of expiry of Swiss passport. 
     */
    this.nonMRZDateOfExpiry = nativeResult.nonMRZDateOfExpiry;
    
    /** 
     * the sex of the Swiss passport owner. 
     */
    this.nonMRZSex = nativeResult.nonMRZSex;
    
    /** 
     * Defines first optional data.<code>null</code> or empty string if not available. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Defines second optional data.<code>null</code> or empty string if not available. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * the passport number of Swiss passport. 
     */
    this.passportNumber = nativeResult.passportNumber;
    
    /** 
     * the place of origin of the Swiss passport owner. 
     */
    this.placeOfOrigin = nativeResult.placeOfOrigin;
    
    /** 
     * Defines the primary indentifier. If there is more than one component, they are separated with space. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Defines holder's date of birth as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfBirth = nativeResult.rawDateOfBirth;
    
    /** 
     * Defines date of expiry as raw string from MRZ zone in format <code>YYMMDD</code>. 
     */
    this.rawDateOfExpiry = nativeResult.rawDateOfExpiry;
    
    /** 
     * Defines the secondary identifier. If there is more than one component, they are separated with space. 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Defines sex of the card holder. Sex is specified by use of the single initial, 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * the surname of the Swiss passport owner. 
     */
    this.surname = nativeResult.surname;
    
}

SwitzerlandPassportRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwitzerlandPassportRecognizerResult = SwitzerlandPassportRecognizerResult;

/**
 *  Recognizer which scans Swiss passports.

 */
function SwitzerlandPassportRecognizer() {
    Recognizer.call(this, 'SwitzerlandPassportRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * {true} if the authority is being extracted, {false} otherwise. 
     */
    this.extractAuthority = true;
    
    /** 
     * {true} if the date of birth is being extracted, {false} otherwise. 
     */
    this.extractDateOfBirth = true;
    
    /** 
     * {true} if the date of expiry is being extracted, {false} otherwise. 
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * {true} if the date of issue is being extracted, {false} otherwise. 
     */
    this.extractDateOfIssue = true;
    
    /** 
     * {true} if the height is being extracted, {false} otherwise. 
     */
    this.extractHeight = true;
    
    /** 
     * {true} if name is being extracted, {false} otherwise. 
     */
    this.extractName = true;
    
    /** 
     * {true} if the authority is being extracted, {false} otherwise. 
     */
    this.extractPassportNumber = true;
    
    /** 
     * {true} if the place of origin is being extracted, {false} otherwise. 
     */
    this.extractPlaceOfOrigin = true;
    
    /** 
     * {true} if the sex is being extracted, {false} otherwise. 
     */
    this.extractSex = true;
    
    /** 
     * {true} if surname is being extracted, {false} otherwise. 
     */
    this.extractSurname = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SwitzerlandPassportRecognizerResult(nativeResult); }

}

SwitzerlandPassportRecognizer.prototype = new Recognizer('SwitzerlandPassportRecognizer');

BlinkID.prototype.SwitzerlandPassportRecognizer = SwitzerlandPassportRecognizer;

/**
 * Result object for UnitedArabEmiratesIDBackRecognizer.
 */
function UnitedArabEmiratesIDBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.MRZResult = nativeResult.MRZResult;
    
    /** 
     *  encoded full document image in JPEG format 
     */
    this.encodedFullDocumentImage = nativeResult.encodedFullDocumentImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
}

UnitedArabEmiratesIDBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.UnitedArabEmiratesIDBackRecognizerResult = UnitedArabEmiratesIDBackRecognizerResult;

/**
 * Recognizer which can scan back side of United Arab Emirates national ID cards.
 */
function UnitedArabEmiratesIDBackRecognizer() {
    Recognizer.call(this, 'UnitedArabEmiratesIDBackRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new UnitedArabEmiratesIDBackRecognizerResult(nativeResult); }

}

UnitedArabEmiratesIDBackRecognizer.prototype = new Recognizer('UnitedArabEmiratesIDBackRecognizer');

BlinkID.prototype.UnitedArabEmiratesIDBackRecognizer = UnitedArabEmiratesIDBackRecognizer;

/**
 * Result object for UnitedArabEmiratesIDFrontRecognizer.
 */
function UnitedArabEmiratesIDFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     *  encoded face image in JPEG from the document 
     */
    this.encodedFaceImage = nativeResult.encodedFaceImage;
    
    /** 
     *  encoded full document image in JPEG format 
     */
    this.encodedFullDocumentImage = nativeResult.encodedFullDocumentImage;
    
    /** 
     *  face image from the document 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     *  image of the full document 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * the idNumber of the United Arab Emirates ID owner. 
     */
    this.idNumber = nativeResult.idNumber;
    
    /** 
     * the name of the United Arab Emirates ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * the nationality of the United Arab Emirates ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
}

UnitedArabEmiratesIDFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.UnitedArabEmiratesIDFrontRecognizerResult = UnitedArabEmiratesIDFrontRecognizerResult;

/**
 * Recognizer which can scan front side of United Arab Emirates national ID cards.
 */
function UnitedArabEmiratesIDFrontRecognizer() {
    Recognizer.call(this, 'UnitedArabEmiratesIDFrontRecognizer');
    
    /** 
     * Defines whether glare detector is enabled. 
     */
    this.detectGlare = true;
    
    /** 
     * Defines whether encoding of face image from document and writing it into the recognition result is enabled. 
     */
    this.encodeFaceImage = false;
    
    /** 
     * Defines whether encoding of full document images and writing them into the recognition result is enabled. 
     */
    this.encodeFullDocumentImage = false;
    
    /** 
     * Defines if name of United Arab Emirates ID owner should be extracted 
     */
    this.extractName = true;
    
    /** 
     * Defines if nationality of United Arab Emirates ID owner should be extracted 
     */
    this.extractNationality = true;
    
    /** 
     * Defines whether face image will be available in result. 
     */
    this.returnFaceImage = false;
    
    /** 
     * Defines whether full document image will be available in result. 
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new UnitedArabEmiratesIDFrontRecognizerResult(nativeResult); }

}

UnitedArabEmiratesIDFrontRecognizer.prototype = new Recognizer('UnitedArabEmiratesIDFrontRecognizer');

BlinkID.prototype.UnitedArabEmiratesIDFrontRecognizer = UnitedArabEmiratesIDFrontRecognizer;

/**
 * Result object for VinRecognizer.
 */
function VinRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * scanned VIN (Vehicle Identification Number). 
     */
    this.vin = nativeResult.vin;
    
}

VinRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.VinRecognizerResult = VinRecognizerResult;

/**
 * Recognizer that can scan VIN (Vehicle Identification Number) barcode.
 */
function VinRecognizer() {
    Recognizer.call(this, 'VinRecognizer');
    
    this.createResultFromNative = function (nativeResult) { return new VinRecognizerResult(nativeResult); }

}

VinRecognizer.prototype = new Recognizer('VinRecognizer');

BlinkID.prototype.VinRecognizer = VinRecognizer;

BlinkID.prototype.USDLKeys = Object.freeze(
    {
        //==============================================================/
        //============== 1. DETERMINING BARCODE VERSION ================/
        //==============================================================/

        /**
         Mandatory on all driver's licenses. All barcodes which are using 3-track magnetic
         stripe encoding used in the interest of smoothing a transition from legacy documents
         shall be designated as "Magnetic". All barcodes which are using compact encoding
         compliant with ISO/IEC 18013-2 shall be designated as "Compact". All barcodes (majority)
         compliant with Mandatory PDF417 Bar Code of the American Association of Motor Vehicle
         Administrators (AAMVA) Card Design Standard from AAMVA DL/ID-2000 standard to DL/ID-2013
         shall be designated as "AAMVA".
         */
        DocumentType : 0,

        /**
         Mandatory on all driver's licenses.

         AAMVA Version Number: This is a decimal value between 0 and 99 that
         specifies the version level of the PDF417 bar code format. Version "0" and "00"
         is reserved for bar codes printed to the specification of the American Association
         of Motor Vehicle Administrators (AAMVA) prior to the adoption of the AAMVA DL/ID-2000
         standard. All bar codes compliant with the AAMVA DL/ID-2000 standard are designated
         Version "01." All barcodes compliant with AAMVA Card Design Specification version
         1.0, dated 09-2003 shall be designated Version "02." All barcodes compliant with
         AAMVA Card Design Specification version 2.0, dated 03-2005 shall be designated
         Version "03." All barcodes compliant with AAMVA Card Design Standard version 1.0,
         dated 07-2009 shall be designated Version "04." All barcodes compliant with AAMVA
         Card Design Standard version 1.0, dated 07-2010 shall be designated Version "05."
         All barcodes compliant with AAMVA Card Design Standard version 1.0, dated 07- 2011
         shall be designated Version "06". All barcodes compliant with AAMVA Card Design
         Standard version 1.0, dated 06-2012 shall be designated Version "07". All barcodes
         compliant with this current AAMVA standard shall be designated "08". Should a need
         arise requiring major revision to the format, this field provides the means to
         accommodate additional revision.

         If document type is not "AAMVA", this field defines version number of the
         given document type's standard.
         */
        StandardVersionNumber : 1,

        //==============================================================/
        //==========          2. PERSONAL DATA KEYS          ===========/
        //==============================================================/

        /**
         Mandatory on all AAMVA, Magnetic and Compact barcodes.

         Family name of the cardholder. (Family name is sometimes also called "last name" or "surname.")
         Collect full name for record, print as many characters as possible on portrait side of DL/ID.
         */
        CustomerFamilyName : 2,

        /**
         Mandatory on all AAMVA, Magnetic and Compact barcodes.

         First name of the cardholder.
         */
        CustomerFirstName : 3,

        /**
         Mandatory on all AAMVA, Magnetic and Compact barcodes.

         Full name of the individual holding the Driver License or ID.

         The Name field contains up to four portions, separated with the "," delimiter:
         Last Name (required)
         , (required)
         First Name (required)
         , (required if other name portions follow, otherwise optional)
         Middle Name(s) (optional)
         , (required if other name portions follow, otherwise optional)
         Suffix (optional)
         , (optional)

         If indvidual has more than one middle name they are separated with space.
         */
        CustomerFullName : 4,

        /**
         Mandatory on all AAMVA, Magentic and Compact barcodes.

         Date on which the cardholder was born. (MMDDCCYY format)
         */
        DateOfBirth : 5,

        /**
         Mandatory on all AAMVA, Magentic barcodes.
         Optional on Compact barcodes.

         Gender of the cardholder. 1 = male, 2 = female.
         */
        Sex : 6,

        /**
         Mandatory on AAMVA 02, 03, 04, 05, 06, 07, 08 barcodes.
         Optional on AAMVA 01, Magnetic and Compact barcodes.

         Color of cardholder's eyes. (ANSI D-20 codes)

         Code   Description
         BLK    Black
         BLU    Blue
         BRO    Brown
         GRY    Gray
         GRN    Green
         HAZ    Hazel
         MAR    Maroon
         PNK    Pink
         DIC    Dichromatic
         UNK    Unknown
         */
        EyeColor : 7,

        /**
         Mandatory on all AAMVA and Magnetic barcodes.

         On compact barcodes, use kFullAddress.

         Street portion of the cardholder address.
         The place where the registered driver of a vehicle (individual or corporation)
         may be contacted such as a house number, street address etc.
         */
        AddressStreet : 8,

        /**
         Mandatory on all AAMVA and Magnetic barcodes.

         On compact barcodes, use kFullAddress.

         City portion of the cardholder address.
         */
        AddressCity : 9,

        /**
         Mandatory on all AAMVA and Magnetic barcodes.

         On compact barcodes, use kFullAddress.

         State portion of the cardholder address.
         */
        AddressJurisdictionCode : 10,

        /**
         Mandatory on all AAMVA and Magnetic barcodes.

         On compact barcodes, use kFullAddress.

         Postal code portion of the cardholder address in the U.S. and Canada. If the
         trailing portion of the postal code in the U.S. is not known, zeros can be used
         to fill the trailing set of numbers up to nine (9) digits.
         */
        AddressPostalCode : 11,

        /**
         Mandatory on all AAMVA and Magnetic barcodes.
         Optional on Compact barcodes.

         Full address of the individual holding the Driver License or ID.

         The full address field contains up to four portions, separated with the "," delimiter:
         Street Address (required)
         , (required if other address portions follow, otherwise optional)
         City (optional)
         , (required if other address portions follow, otherwise optional)
         Jurisdiction Code (optional)
         , (required if other address portions follow, otherwise optional)
         ZIP - Postal Code (optional)

         */
        FullAddress : 12,

        /**
         Mandatory on AAMVA 02, 03, 04, 05, 06, 07, 08 and Compact barcodes.
         Optional on AAMVA 01 and Magnetic barcodes.

         Height of cardholder, either in Inches or in Centimeters.

         Inches (in): number of inches followed by " in"
         example: 6'1'' = "73 in"

         Centimeters (cm): number of centimeters followed by " cm"
         example: 181 centimeters = "181 cm"
         */
        Height : 13,

        /**
         Mandatory on AAMVA 02, 03, 04, 05, 06, 07, 08 and Compact barcodes.
         Optional on AAMVA 01 and Magnetic barcodes.

         Height of cardholder in Inches.
         Example: 5'9'' = "69".
         */
        HeightIn : 14,

        /**
         Mandatory on AAMVA 02, 03, 04, 05, 06, 07, 08 Compact barcodes.
         Optional on AAMVA 01 and Magnetic barcodes.

         Height of cardholder in Centimeters.
         Example: 180 Centimeters = "180".
         */
        HeightCm : 15,

        /**
         Mandatory on AAMVA 04, 05, 06, 07, 08.
         Optional on AAMVA 01, 02, 03, Magnetic and Compcat barcodes.

         Middle name(s) of the cardholder. In the case of multiple middle names they
         shall be separated by space " ".
         */
        CustomerMiddleName : 16,

        /**
         Optional on all AAMVA, Magnetic and Compact barcodes.

         Bald, black, blonde, brown, gray, red/auburn, sandy, white, unknown. If the issuing
         jurisdiction wishes to abbreviate colors, the three-character codes provided in ANSI D20 must be
         used.

         Code   Description
         BAL    Bald
         BLK    Black
         BLN    Blond
         BRO    Brown
         GRY    Grey
         RED    Red/Auburn
         SDY    Sandy
         WHI    White
         UNK    Unknown
         */
        HairColor : 17,

        /**
         Mandatory on AAMVA 02 barcodes.
         Optional on AAMVA 01, 03, 04, 05, 06, 07, 08, Magnetic and Compact barcodes.

         Name Suffix (If jurisdiction participates in systems requiring name suffix (PDPS, CDLIS, etc.),
         the suffix must be collected and displayed on the DL/ID and in the MRT).
         - JR (Junior)
         - SR (Senior)
         - 1ST or I (First)
         - 2ND or II (Second)
         - 3RD or III (Third)
         - 4TH or IV (Fourth)
         - 5TH or V (Fifth)
         - 6TH or VI (Sixth)
         - 7TH or VII (Seventh)
         - 8TH or VIII (Eighth)
         - 9TH or IX (Ninth)
         */
        NameSuffix : 18,

        /**
         Optional on all AAMVA and Compact barcodes.

         Other name by which cardholder is known. ALTERNATIVE NAME(S) of the individual
         holding the Driver License or ID.

         The Name field contains up to four portions, separated with the "," delimiter:
         AKA Last Name (required)
         , (required)
         AKA First Name (required)
         , (required if other name portions follow, otherwise optional)
         AKA Middle Name(s) (optional)
         , (required if other name portions follow, otherwise optional)
         AKA Suffix (optional)
         , (optional)

         If indvidual has more than one AKA middle name they are separated with space.
         */
        // internal node: Filled by DataExpander
        AKAFullName : 19,

        /**
         Optional on all AAMVA and Compact barcodes.

         Other family name by which cardholder is known.
         */
        // internal node: Filled by DataExpander
        AKAFamilyName : 20,

        /**
         Optional on all AAMVA and Compact barcodes.

         Other given name by which cardholder is known
         */
        // internal node: Filled by DataExpander
        AKAGivenName : 21,

        /**
         Optional on all AAMVA and Compact barcodes.

         Other suffix by which cardholder is known.

         The Suffix Code Portion, if submitted, can contain only the Suffix Codes shown in the following table (e.g., Andrew Johnson, III = JOHNSON@ANDREW@@3RD):

         Suffix     Meaning or Synonym
         JR         Junior
         SR         Senior or Esquire 1ST First
         2ND        Second
         3RD        Third
         4TH        Fourth
         5TH        Fifth
         6TH        Sixth
         7TH        Seventh
         8TH        Eighth
         9TH        Ninth
         */
        // internal node: Filled by DataExpander
        AKASuffixName : 22,

        /**
         Mandatory on AAMVA 02 barcodes.
         Optional on AAMVA 01, 03, 04, 05, 06, 07, 08, Magnetic and Compact barcodes.

         Indicates the approximate weight range of the cardholder:
         0 = up to 31 kg (up to 70 lbs)
         1 = 32 – 45 kg (71 – 100 lbs)
         2 = 46 - 59 kg (101 – 130 lbs)
         3 = 60 - 70 kg (131 – 160 lbs)
         4 = 71 - 86 kg (161 – 190 lbs)
         5 = 87 - 100 kg (191 – 220 lbs)
         6 = 101 - 113 kg (221 – 250 lbs)
         7 = 114 - 127 kg (251 – 280 lbs)
         8 = 128 – 145 kg (281 – 320 lbs)
         9 = 146+ kg (321+ lbs)
         */
        // internal note: Filled by DataExpander
        WeightRange : 23,

        /**
         Mandatory on AAMVA 02 barcodes.
         Optional on AAMVA 01, 03, 04, 05, 06, 07, 08, Magnetic and Compact barcodes.

         Cardholder weight in pounds Example: 185 lb = "185"
         */
        // internal note: Filled by DataExpander
        WeightPounds : 24,

        /**
         Mandatory on AAMVA 02 barcodes.
         Optional on AAMVA 01, 03, 04, 05, 06, 07, 08, Magnetic and Compact barcodes.

         Cardholder weight in kilograms Example: 84 kg = "084"
         */
        // internal note: Filled by DataExpander
        WeightKilograms : 25,

        /**
         Mandatory on all AAMVA and Compact barcodes

         The number assigned or calculated by the issuing authority.
         */
        CustomerIdNumber : 26,

        /**
         Mandatory on AAMVA 04, 05, 06, 07, 08 barcodes.
         Optional on Compact barcodes.

         A code that indicates whether a field has been truncated (T), has not been
         truncated (N), or – unknown whether truncated (U).
         */
        FamilyNameTruncation : 27,

        /**
         Mandatory on AAMVA 04, 05, 06, 07, 08 barcodes.
         Optional on Compact barcodes.

         A code that indicates whether a field has been truncated (T), has not been
         truncated (N), or – unknown whether truncated (U).
         */
        FirstNameTruncation : 28,

        /**
         Mandatory on AAMVA 04, 05, 06, 07, 08

         A code that indicates whether a field has been truncated (T), has not been
         truncated (N), or – unknown whether truncated (U).
         */
        MiddleNameTruncation : 29,

        /**
         Optional on AAMVA 02, 03, 04, 05, 06, 07, 08 and Compact barcodes

         Country and municipality and/or state/province
         */
        PlaceOfBirth : 30,

        /**
         Optional on all AAMVA barcodes

         On Compact barcodes, use kFullAddress

         Second line of street portion of the cardholder address.
         */
        AddressStreet2 : 31,

        /**
         Optional on AAMVA 02, 03, 04, 05, 06, 07, 08 and Compact barcodes

         Codes for race or ethnicity of the cardholder, as defined in ANSI D20.

         Race:
         Code   Description
         AI     Alaskan or American Indian (Having Origins in Any of The Original Peoples of
         North America, and Maintaining Cultural Identification Through Tribal
         Affiliation of Community Recognition)
         AP     Asian or Pacific Islander (Having Origins in Any of the Original Peoples of
         the Far East, Southeast Asia, or Pacific Islands. This Includes China, India,
         Japan, Korea, the Philippines Islands, and Samoa)
         BK     Black (Having Origins in Any of the Black Racial Groups of Africa)
         W      White (Having Origins in Any of The Original Peoples of Europe, North Africa,
         or the Middle East)

         Ethnicity:
         Code   Description
         H      Hispanic Origin (A Person of Mexican, Puerto Rican, Cuban, Central or South
         American or Other Spanish Culture or Origin, Regardless of Race)
         O      Not of Hispanic Origin (Any Person Other Than Hispanic)
         U      Unknown

         */
        RaceEthnicity : 32,

        /**
         Optional on AAMVA 01

         PREFIX to Driver Name. Freeform as defined by issuing jurisdiction.
         */
        NamePrefix : 33,

        /**
         Mandatory on AAMVA 02, 03, 04, 05, 06, 07, 08 and Compact barcodes.

         Country in which DL/ID is issued. U.S. = USA, Canada = CAN.
         */
        CountryIdentification : 34,

        /**
         Optional on AAMVA version 01.

         Driver Residence Street Address 1.
         */
        ResidenceStreetAddress : 35,

        /**
         Optional on AAMVA version 01.

         Driver Residence Street Address 2.
         */
        ResidenceStreetAddress2 : 36,

        /**
         Optional on AAMVA version 01.

         Driver Residence City
         */
        ResidenceCity : 37,

        /**
         Optional on AAMVA version 01.

         Driver Residence Jurisdiction Code.
         */
        ResidenceJurisdictionCode : 38,

        /**
         Optional on AAMVA 01 barcodes.

         Driver Residence Postal Code.
         */
        ResidencePostalCode : 39,

        /**
         Optional on AAMVA 01 barcodes.

         Full residence address of the individual holding the Driver License or ID.

         The full address field contains up to four portions, separated with the "," delimiter:
         Residence Street Address (required)
         , (required if other address portions follow, otherwise optional)
         Residence City (optional)
         , (required if other address portions follow, otherwise optional)
         Residence Jurisdiction Code (optional)
         , (required if other address portions follow, otherwise optional)
         Residence ZIP - Residence Postal Code (optional)
         */
        ResidenceFullAddress : 40,

        /**
         Optional on AAMVA 05, 06, 07, 08

         Date on which the cardholder turns 18 years old. (MMDDCCYY format)
         */
        Under18 : 41,

        /**
         Optional on AAMVA 05, 06, 07, 08

         Date on which the cardholder turns 19 years old. (MMDDCCYY format)
         */
        Under19 : 42,

        /**
         Optional on AAMVA 05, 06, 07, 08

         Date on which the cardholder turns 21 years old. (MMDDCCYY format)
         */
        Under21 : 43,

        /**
         Optional on AAMVA version 01.

         The number assigned to an individual by the Social Security Administration.
         */
        SocialSecurityNumber : 44,

        /**
         Optional on AAMVA version 01.

         Driver "AKA" Social Security Number. FORMAT SAME AS DRIVER SOC SEC NUM. ALTERNATIVE NUMBERS(S) used as SS NUM.
         */
        AKASocialSecurityNumber : 45,

        /**
         Optional on AAMVA 01

         ALTERNATIVE MIDDLE NAME(s) or INITIALS of the individual holding the Driver License or ID.
         Hyphenated names acceptable, spaces between names acceptable, but no other
         use of special symbols
         */
        AKAMiddleName : 46,

        /**
         Optional on AAMVA 01

         ALTERNATIVE PREFIX to Driver Name. Freeform as defined by issuing jurisdiction.
         */
        AKAPrefixName : 47,

        /**
         Optional on AAMVA 01, 06, 07, 08

         Field that indicates that the cardholder is an organ donor = "1".
         */
        OrganDonor : 48,

        /**
         Optional on AAMVA 07, 08

         Field that indicates that the cardholder is a veteran = "1"
         */
        Veteran : 49,

        /**
         Optional on AAMVA 01. (MMDDCCYY format)

         ALTERNATIVE DATES(S) given as date of birth.
         */
        AKADateOfBirth : 50,

        //==============================================================/
        //==========          3. LICENSE DATA KEYS          ============/
        //==============================================================/

        /**
         Mandatory on all AAMVA, Magnetic and Compact barcodes.

         This number uniquely identifies the issuing jurisdiction and can
         be obtained by contacting the ISO Issuing Authority (AAMVA)
         */
        IssuerIdentificationNumber : 51,

        /**
         Mandatory on all AAMVA, Magnetic and Compact barcodes.

         If document is non expiring than "Non expiring" is written in this field.

         Date on which the driving and identification privileges granted by the document are
         no longer valid. (MMDDCCYY format)
         */
        // internal note: Filled by DataExpander
        DocumentExpirationDate : 52,

        /**
         Mandatory on all AAMVA and Compact barcodes.
         Optional on Magnetic barcodes.

         Jurisdiction Version Number: This is a decimal value between 0 and 99 that
         specifies the jurisdiction version level of the PDF417 bar code format.
         Notwithstanding iterations of this standard, jurisdictions implement incremental
         changes to their bar codes, including new jurisdiction-specific data, compression
         algorithms for digitized images, digital signatures, or new truncation
         conventions used for names and addresses. Each change to the bar code format
         within each AAMVA version (above) must be noted, beginning with Jurisdiction
         Version 00.
         */
        JurisdictionVersionNumber : 53,

        /**
         Mandatory on all AAMVA and Magnetic barcodes.

         Jurisdiction-specific vehicle class / group code, designating the type
         of vehicle the cardholder has privilege to drive.
         */
        JurisdictionVehicleClass : 54,

        /**
         Mandatory on all AAMVA barcodes.
         Optional on Magnetic barcodes.

         Jurisdiction-specific codes that represent restrictions to driving
         privileges (such as airbrakes, automatic transmission, daylight only, etc.).
         */
        JurisdictionRestrictionCodes : 55,

        /**
         Mandatory on all AAMVA barcodes.
         Optional on Magnetic barcodes.

         Jurisdiction-specific codes that represent additional privileges
         granted to the cardholder beyond the vehicle class (such as transportation of
         passengers, hazardous materials, operation of motorcycles, etc.).
         */
        JurisdictionEndorsementCodes : 56,

        /**
         Mandatory on all AAMVA and Compact barcodes.

         Date on which the document was issued. (MMDDCCYY format)
         */
        // internal note: Filled by DataExpander
        DocumentIssueDate : 57,

        /**
         Mandatory on AAMVA versions 02 and 03.

         Federally established codes for vehicle categories, endorsements, and restrictions
         that are generally applicable to commercial motor vehicles. If the vehicle is not a
         commercial vehicle, "NONE" is to be entered.
         */
        FederalCommercialVehicleCodes : 58,

        /**
         Optional on all AAMVA barcodes.
         Mandatory on Compact barcodes.

         Jurisdictions may define a subfile to contain jurisdiction-specific information.
         These subfiles are designated with the first character of “Z” and the second
         character is the first letter of the jurisdiction's name. For example, "ZC" would
         be the designator for a California or Colorado jurisdiction-defined subfile, "ZQ"
         would be the designator for a Quebec jurisdiction-defined subfile. In the case of
         a jurisdiction-defined subfile that has a first letter that could be more than
         one jurisdiction (e.g. California, Colorado, Connecticut) then other data, like
         the IIN or address, must be examined to determine the jurisdiction.
         */
        IssuingJurisdiction : 59,

        /**
         Optional on all AAMVA barcodes.
         Mandatory on Compact barcodes.

         Standard vehicle classification code(s) for cardholder. This data element is a
         placeholder for future efforts to standardize vehicle classifications.
         */
        StandardVehicleClassification : 60,

        /**
         Optional on all AAMVA and Magnetic barcodes.

         Name of issuing jurisdiction, for example: Alabama, Alaska ...
         */
        IssuingJurisdictionName : 61,

        /**
         Optional on all AAMVA barcodes.

         Standard endorsement code(s) for cardholder. See codes in D20. This data element is a
         placeholder for future efforts to standardize endorsement codes.

         Code   Description
         H      Hazardous Material - This endorsement is required for the operation of any vehicle
         transporting hazardous materials requiring placarding, as defined by U.S.
         Department of Transportation regulations.
         L      Motorcycles – Including Mopeds/Motorized Bicycles.
         N      Tank - This endorsement is required for the operation of any vehicle transporting,
         as its primary cargo, any liquid or gaseous material within a tank attached to the vehicle.
         O      Other Jurisdiction Specific Endorsement(s) - This code indicates one or more
         additional jurisdiction assigned endorsements.
         P      Passenger - This endorsement is required for the operation of any vehicle used for
         transportation of sixteen or more occupants, including the driver.
         S      School Bus - This endorsement is required for the operation of a school bus. School bus means a
         CMV used to transport pre-primary, primary, or secondary school students from home to school,
         from school to home, or to and from school sponsored events. School bus does not include a
         bus used as common carrier (49 CRF 383.5).
         T      Doubles/Triples - This endorsement is required for the operation of any vehicle that would be
         referred to as a double or triple.
         X      Combined Tank/HAZ-MAT - This endorsement may be issued to any driver who qualifies for
         both the N and H endorsements.
         */
        StandardEndorsementCode : 62,

        /**
         Optional on all AAMVA barcodes

         Standard restriction code(s) for cardholder. See codes in D20. This data element is a placeholder
         for future efforts to standardize restriction codes.

         Code   Description
         B      Corrective Lenses
         C      Mechanical Devices (Special Brakes, Hand Controls, or Other Adaptive Devices)
         D      Prosthetic Aid
         E      Automatic Transmission
         F      Outside Mirror
         G      Limit to Daylight Only
         H      Limit to Employment
         I      Limited Other
         J      Other
         K      CDL Intrastate Only
         L      Vehicles without air brakes
         M      Except Class A bus
         N      Except Class A and Class B bus
         O      Except Tractor-Trailer
         V      Medical Variance Documentation Required
         W      Farm Waiver
         */
        StandardRestrictionCode : 63,

        /**
         Optional on AAMVA 02, 03, 04, 05, 06, 07, 08 and Compact barcodes

         Text that explains the jurisdiction-specific code(s) for classifications
         of vehicles cardholder is authorized to drive.
         */
        JurisdictionVehicleClassificationDescription : 64,

        /**
         Optional on AAMVA 02, 03, 04, 05, 06, 07, 08 and Compact barcodes

         Text that explains the jurisdiction-specific code(s) that indicates additional
         driving privileges granted to the cardholder beyond the vehicle class.
         */
        JurisdictionEndorsmentCodeDescription : 65,

        /**
         Optional on AAMVA 02, 03, 04, 05, 06, 07, 08 and Compact barcodes

         Text describing the jurisdiction-specific restriction code(s) that curtail driving privileges.
         */
        JurisdictionRestrictionCodeDescription : 66,

        /**
         Optional on AAMVA 02, 03, 04, 05, 06, 07, 08

         A string of letters and/or numbers that is affixed to the raw materials (card stock,
         laminate, etc.) used in producing driver licenses and ID cards. (DHS recommended field)
         */
        InventoryControlNumber : 67,

        /**
         Optional on AAMVA 04, 05, 06, 07, 08 and Compact barcodes

         DHS required field that indicates date of the most recent version change or
         modification to the visible format of the DL/ID (MMDDCCYY format)
         */
        CardRevisionDate : 68,

        /**
         Mandatory on AAMVA 02, 03, 04, 05, 06, 07, 08 and Magnetic barcodes.
         Optional and Compact barcodes

         Number must uniquely identify a particular document issued to that customer
         from others that may have been issued in the past. This number may serve multiple
         purposes of document discrimination, audit information number, and/or inventory control.
         */
        DocumentDiscriminator : 69,

        /**
         Optional on AAMVA 04, 05, 06, 07, 08 and Compact barcodes

         DHS required field that indicates that the cardholder has temporary lawful status = "1".
         */
        LimitedDurationDocument : 70,

        /**
         Optional on AAMVA 02, 03, 04, 05, 06, 07, 08 and Compact barcodes

         A string of letters and/or numbers that identifies when, where, and by whom a driver
         license/ID card was made. If audit information is not used on the card or the MRT, it
         must be included in the driver record.
         */
        AuditInformation : 71,

        /**
         Optional on AAMVA 04, 05, 06, 07, 08 and Compact barcodes

         DHS required field that indicates compliance: "M" = materially compliant,
         "F" = fully compliant, and, "N" = non-compliant.
         */
        ComplianceType : 72,

        /**
         Optional on AAMVA version 01.

         Issue Timestamp. A string used by some jurisdictions to validate the document against their data base.
         */
        IssueTimestamp : 73,

        /**
         Optional on AAMVA version 01.

         Driver Permit Expiration Date. MMDDCCYY format. Date permit expires.
         */
        PermitExpirationDate : 74,

        /**
         Optional on AAMVA version 01.

         Type of permit.
         */
        PermitIdentifier : 75,

        /**
         Optional on AAMVA version 01.

         Driver Permit Issue Date. MMDDCCYY format. Date permit was issued.
         */
        PermitIssueDate : 76,

        /**
         Optional on AAMVA version 01.

         Number of duplicate cards issued for a license or ID if any.
         */
        NumberOfDuplicates : 77,

        /**
         Optional on AAMVA 04, 05, 06, 07, 08 and Compact barcodes

         Date on which the hazardous material endorsement granted by the document is
         no longer valid. (MMDDCCYY format)
         */
        HAZMATExpirationDate : 78,

        /**
         Optional on AAMVA version 01.

         Medical Indicator/Codes.
         STATE SPECIFIC. Freeform, Standard "TBD"
         */
        MedicalIndicator : 79,

        /**
         Optional on AAMVA version 01.

         Non-Resident Indicator. "Y". Used by some jurisdictions to indicate holder of the document is a non-resident.
         */
        NonResident : 80,

        /**
         Optional on AAMVA version 01.

         A number or alphanumeric string used by some jurisdictions to identify a "customer" across multiple data bases.
         */
        UniqueCustomerId : 81,

        /**
         Optional on compact barcodes.

         Document discriminator.
         */
        DataDiscriminator : 82,

        /**
         Optional on Magnetic barcodes.

         Month on which the driving and identification privileges granted by the document are
         no longer valid. (MMYY format)
         */
        DocumentExpirationMonth : 83,

        /**
         Optional on Magnetic barcodes.

         Field that indicates that the driving and identification privileges granted by the
         document are nonexpiring = "1".
         */
        DocumentNonexpiring : 84,

        /**
         Optional on Magnetic barcodes.

         Security version beeing used.
         */
        SecurityVersion : 85
    }
);

/**
 * Result object for USDLRecognizer.
 */
function USDLRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** Array of elements that are not part of AAMVA standard and are specific to each US state. */
    this.optionalElements = nativeResult.optionalElements;
    
    /** The raw bytes contained inside 2D barcode. */
    this.rawData = nativeResult.rawData;
    
    /** Raw string inside 2D barcode. */
    this.rawStringData = nativeResult.rawStringData;
    
    /** True if returned result is uncertain, i.e. if scanned barcode was incomplete (i.e. */
    this.uncertain = nativeResult.uncertain;

    /** Fields inside US Driver's licence. Available Keys are listed in BlinkIDScanner.USDLKeys enum. */
    this.fields = nativeResult.fields;
    
}

USDLRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.USDLRecognizerResult = USDLRecognizerResult;

/**
 * Recognizer that scan 2D barcodes from United States Driver License.
 */
function USDLRecognizer() {
    Recognizer.call(this, 'USDLRecognizer');
    
    /** Allow scanning PDF417 barcodes which don't have quiet zone */
    this.nullQuietZoneAllowed = true;
    
    /** Enable decoding of non-standard PDF417 barcodes, but without */
    this.uncertainDecoding = true;
    
    this.createResultFromNative = function (nativeResult) { return new USDLRecognizerResult(nativeResult); }
    
}

USDLRecognizer.prototype = new Recognizer('USDLRecognizer');

BlinkID.prototype.USDLRecognizer = USDLRecognizer;

// RECOGNIZERS

// export BlinkIDScanner
module.exports = new BlinkID();
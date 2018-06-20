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

    // first invalidate old results
    for (var i = 0; i < recognizerCollection.recognizerArray[i].length; ++i ) {
        recognizerCollection.recognizerArray[i].result = null;
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
    /** day in month */
    this.day = nativeDate.day;
    /** month in year */
    this.month = nativeDate.month;
    /** year */
    this.year = nativeDate.year;
}

BlinkID.prototype.Date = Date;

/**
 * Represents a point in image
 */
function Point(nativePoint) {
    /** x coordinate of the point */
    this.x = nativePoint.x;
    /** y coordinate of the point */
    this.y = nativePoint.y;
}

BlinkID.prototype.Point = Point;

/**
 * Represents a quadrilateral location in the image
 */
function Quadrilateral(nativeQuad) {
    /** upper left point of the quadrilateral */
    this.upperLeft = new Point(nativeQuad.upperLeft);
    /** upper right point of the quadrilateral */
    this.upperRight = new Point(nativeQuad.upperRight);
    /** lower left point of the quadrilateral */
    this.lowerLeft = new Point(nativeQuad.lowerLeft);
    /** lower right point of the quadrilateral */
    this.lowerRight = new Point(nativeQuad.lowerRight);
}

BlinkID.prototype.Quadrilateral = Quadrilateral;
/**
 * Possible types of Machine Readable Travel Documents (MRTDs).
 */
BlinkID.prototype.MrtdDocumentType = Object.freeze(
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
function MrzResult(nativeMRZResult) {
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
    this.dateOfBirth = nativeMRZResult.dateOfBirth != null ? new Date(nativeMRZResult.dateOfBirth) : null;
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
    this.dateOfExpiry = nativeMRZResult.dateOfExpiry != null ? new Date(nativeMRZResult.dateOfExpiry) : null;
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
var EudlCountry = Object.freeze(
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
BlinkID.prototype.EudlCountry = EudlCountry;

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

/**
 * Extension factors relative to corresponding dimension of the full image. For example,
 * upFactor and downFactor define extensions relative to image height, e.g.
 * when upFactor is 0.5, upper image boundary will be extended for half of image's full
 * height.
 */
function ImageExtensionFactors() {
    /** image extension factor relative to full image height in UP direction. */
    this.upFactor = 0.0;
    /** image extension factor relative to full image height in RIGHT direction. */
    this.rightFactor = 0.0;
    /** image extension factor relative to full image height in DOWN direction. */
    this.downFactor = 0.0;
    /** image extension factor relative to full image height in LEFT direction. */
    this.leftFactor = 0.0;
}

BlinkID.prototype.ImageExtensionFactors = ImageExtensionFactors;

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
function SuccessFrameGrabberRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    /** Camera frame at the time slave recognizer finished recognition */
    this.successFrame = nativeResult.successFrame;
}

SuccessFrameGrabberRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SuccessFrameGrabberRecognizerResult = SuccessFrameGrabberRecognizerResult;

function SuccessFrameGrabberRecognizer(slaveRecognizer) {
    Recognizer.call(this, 'SuccessFrameGrabberRecognizer');
    /** Slave recognizer that SuccessFrameGrabberRecognizer will watch */
    this.slaveRecognizer = slaveRecognizer;

    if (!this.slaveRecognizer instanceof Recognizer) {
        throw new Error("Slave recognizer must be Recognizer!");
    }

    this.createResultFromNative = (function (nativeResult) { 
        this.slaveRecognizer.result = this.slaveRecognizer.createResultFromNative(nativeResult.slaveRecognizerResult);
        return new SuccessFrameGrabberRecognizerResult(nativeResult) 
    }).bind(this);
}

SuccessFrameGrabberRecognizer.prototype = new Recognizer('SuccessFrameGrabberRecognizer');

BlinkID.prototype.SuccessFrameGrabberRecognizer = SuccessFrameGrabberRecognizer;


/**
 * Result object for AustraliaDlBackRecognizer.
 */
function AustraliaDlBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Australian DL owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The document date of expiry of the Australian DL 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The last name of the Australian DL owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The licence number of the Australian DL owner. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
}

AustraliaDlBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustraliaDlBackRecognizerResult = AustraliaDlBackRecognizerResult;

/**
 * Class for configuring Australia DL Back Recognizer.
 * 
 * Australia DL Back recognizer is used for scanning back side of Australia DL.
 */
function AustraliaDlBackRecognizer() {
    Recognizer.call(this, 'AustraliaDlBackRecognizer');
    
    /** 
     *  Defines if sex of Australian DL owner should be extracted
     * 
     *   
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of expiry should be extracted from Australian DL
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     *  Defines if last name of Australian DL owner should be extracted
     * 
     *   
     */
    this.extractLastName = true;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new AustraliaDlBackRecognizerResult(nativeResult); }

}

AustraliaDlBackRecognizer.prototype = new Recognizer('AustraliaDlBackRecognizer');

BlinkID.prototype.AustraliaDlBackRecognizer = AustraliaDlBackRecognizer;

/**
 * Result object for AustraliaDlFrontRecognizer.
 */
function AustraliaDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Australian DL owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of birth of Australian DL owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The document date of expiry of the Australian DL 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The licence number of the Australian DL owner. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * The licence type of Australian DL. 
     */
    this.licenceType = nativeResult.licenceType;
    
    /** 
     * The first name of the Australian DL owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

AustraliaDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustraliaDlFrontRecognizerResult = AustraliaDlFrontRecognizerResult;

/**
 * Class for configuring Australia DL Front Recognizer.
 * 
 * Australia DL Front recognizer is used for scanning front side of Australia DL.
 */
function AustraliaDlFrontRecognizer() {
    Recognizer.call(this, 'AustraliaDlFrontRecognizer');
    
    /** 
     *  Defines if sex of Australian DL owner should be extracted
     * 
     *   
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of birth of Australian DL owner should be extracted
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from Australian DL
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if citizenship of Australian DL owner should be extracted
     * 
     *  
     */
    this.extractLicenceNumber = true;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new AustraliaDlFrontRecognizerResult(nativeResult); }

}

AustraliaDlFrontRecognizer.prototype = new Recognizer('AustraliaDlFrontRecognizer');

BlinkID.prototype.AustraliaDlFrontRecognizer = AustraliaDlFrontRecognizer;

/**
 * Result object for AustriaCombinedRecognizer.
 */
function AustriaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of Austrian ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Austrian ID 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issuance of the Austrian ID 
     */
    this.dateOfIssuance = nativeResult.dateOfIssuance != null ? new Date(nativeResult.dateOfIssuance) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * The document number of the Austrian ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * The eye eyeColour of Austrian ID owner. 
     */
    this.eyeColour = nativeResult.eyeColour;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * The gien name of the Austrian ID owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * The height of Austrian ID owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * The issuing authority of Austrian ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * Whether check digits in machine readable zone of the Austrian ID are OK. 
     */
    this.mrtdVerified = nativeResult.mrtdVerified;
    
    /** 
     * The nationaliy of the Austrian ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The place of birth of the Austrian ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The principal residence of the Austrian ID owner. 
     */
    this.principalResidence = nativeResult.principalResidence;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Austrian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of the Austrian ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

AustriaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustriaCombinedRecognizerResult = AustriaCombinedRecognizerResult;

/**
 * Austrian ID Combined Recognizer.
 * 
 * Austrian ID Combined recognizer is used for scanning both front and back side of Austrian ID.
 */
function AustriaCombinedRecognizer() {
    Recognizer.call(this, 'AustriaCombinedRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if ownder's date of birth should be extracted
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issuance should be extracted from back side of Austrian ID
     * 
     *  
     */
    this.extractDateOfIssuance = true;
    
    /** 
     * Defines if date of issue should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if owner's given name should be extracted
     * 
     *  
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if owner's height should be extracted
     * 
     *  
     */
    this.extractHeight = true;
    
    /** 
     * Defines if issuing authority should be extracted
     * 
     *  
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if owner's nationality should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractNationality = false;
    
    /** 
     * Defines if passport number should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractPassportNumber = true;
    
    /** 
     * Defines if owner's place of birth should be extracted
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if owner's principal residence should be extracted from back side of Austrian ID
     * 
     *  
     */
    this.extractPrincipalResidence = true;
    
    /** 
     * Defines if owner's sex should be extracted
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if owner's surname should be extracted
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Property for setting DPI for face images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.faceImageDpi = 250;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    /** 
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new AustriaCombinedRecognizerResult(nativeResult); }

}

AustriaCombinedRecognizer.prototype = new Recognizer('AustriaCombinedRecognizer');

BlinkID.prototype.AustriaCombinedRecognizer = AustriaCombinedRecognizer;

/**
 * Result object for AustriaIdBackRecognizer.
 */
function AustriaIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The Date Of Issuance of Austrian ID. 
     */
    this.dateOfIssuance = nativeResult.dateOfIssuance != null ? new Date(nativeResult.dateOfIssuance) : null;
    
    /** 
     * The Document Number of Austrian ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * The Eye Colour of Austrian ID owner. 
     */
    this.eyeColour = nativeResult.eyeColour;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The Height of Austrian ID owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * The Issuing Authority of Austrian ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The mrz on the back side of Austrian ID. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The Place Of Birth of Austrian ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The Principal Residence of Austrian ID owner. 
     */
    this.principalResidence = nativeResult.principalResidence;
    
}

AustriaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustriaIdBackRecognizerResult = AustriaIdBackRecognizerResult;

/**
 * Class for configuring Austrian ID Back Recognizer.
 * 
 * Austrian ID Back recognizer is used for scanning back side of Austrian ID.
 */
function AustriaIdBackRecognizer() {
    Recognizer.call(this, 'AustriaIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of issuance should be extracted from back side of Austrian ID
     * 
     *  
     */
    this.extractDateOfIssuance = true;
    
    /** 
     * Defines if owner's height should be extracted from back side of Austrian ID
     * 
     *  
     */
    this.extractHeight = true;
    
    /** 
     * Defines if issuing authority should be extracted from back side of Austrian ID
     * 
     *  
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if owner's place of birth should be extracted from back side of Austrian ID
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if owner's principal residence should be extracted from back side of Austrian ID
     * 
     *  
     */
    this.extractPrincipalResidence = true;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new AustriaIdBackRecognizerResult(nativeResult); }

}

AustriaIdBackRecognizer.prototype = new Recognizer('AustriaIdBackRecognizer');

BlinkID.prototype.AustriaIdBackRecognizer = AustriaIdBackRecognizer;

/**
 * Result object for AustriaIdFrontRecognizer.
 */
function AustriaIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of the Austrian Id owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The document number of the Austrian Id. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The first name of the Austrian Id owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * The sex of the Austrian Id owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The last name of the Austrian Id owner. 
     */
    this.surname = nativeResult.surname;
    
}

AustriaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustriaIdFrontRecognizerResult = AustriaIdFrontRecognizerResult;

/**
 * Class for configuring Austrian ID Front Recognizer.
 * 
 * Aus ID Front recognizer is used for scanning front side of Austrian Id.
 */
function AustriaIdFrontRecognizer() {
    Recognizer.call(this, 'AustriaIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of birth should be extracted from Austrian ID
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if given name of Austrian Id owner should be extracted
     * 
     *  
     */
    this.extractGivenName = true;
    
    /** 
     *  Defines if sex of Austrian Id owner should be extracted
     * 
     *   
     */
    this.extractSex = true;
    
    /** 
     * Defines if surname of Austrian Id owner should be extracted
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Property for setting DPI for face images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.faceImageDpi = 250;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new AustriaIdFrontRecognizerResult(nativeResult); }

}

AustriaIdFrontRecognizer.prototype = new Recognizer('AustriaIdFrontRecognizer');

BlinkID.prototype.AustriaIdFrontRecognizer = AustriaIdFrontRecognizer;

/**
 * Result object for AustriaPassportRecognizer.
 */
function AustriaPassportRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date Of Birth of the Austrian Passport owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date Of Expiry of the Austrian Passport. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date Of Issue of the Austrian Passport. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The given Name of the Austrian Passport owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * The height of the Austrian Passport owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * The issuing Authority of the Austrian Passport. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The mrz of the back side of Austria Passport. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The nationality of the Austrian Passport owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The passport Number of the Austrian Passport. 
     */
    this.passportNumber = nativeResult.passportNumber;
    
    /** 
     * The place Of Birth of the Austrian Passport owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The sex of the Austrian Passport owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of the Austrian Passport owner. 
     */
    this.surname = nativeResult.surname;
    
}

AustriaPassportRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustriaPassportRecognizerResult = AustriaPassportRecognizerResult;

/**
 * Class for configuring Austrian Passport Recognizer.
 * 
 * Austrian Passport recognizer is used for scanning Austrian Passport.
 */
function AustriaPassportRecognizer() {
    Recognizer.call(this, 'AustriaPassportRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's date of birth should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if owner's given name should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if owner's height should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractHeight = true;
    
    /** 
     * Defines if issuing authority should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if owner's nationality should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractNationality = false;
    
    /** 
     * Defines if passport number should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractPassportNumber = true;
    
    /** 
     * Defines if owner's place of birth should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if owner's sex should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if owner's surname should be extracted from Austrian Passport
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Property for setting DPI for face images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.faceImageDpi = 250;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
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
     * Type of the barcode scanned
     * 
     *  @return Type of the barcode 
     */
    this.barcodeType = nativeResult.barcodeType;
    
    /** 
     * Byte array with result of the scan 
     */
    this.rawData = nativeResult.rawData;
    
    /** 
     * Retrieves string content of scanned data 
     */
    this.stringData = nativeResult.stringData;
    
    /** 
     * Flag indicating uncertain scanning data
     * E.g obtained from damaged barcode. 
     */
    this.uncertain = nativeResult.uncertain;
    
}

BarcodeRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BarcodeRecognizerResult = BarcodeRecognizerResult;

/**
 * BarcodeRecognizer is used for scanning most of 1D barcode formats, and 2D format
 * such as Aztec, DataMatrix and QR code
 */
function BarcodeRecognizer() {
    Recognizer.call(this, 'BarcodeRecognizer');
    
    /** 
     * Allow enabling the autodetection of image scale when scanning barcodes.
     * If set to true, prior reading barcode, image scale will be
     * corrected. This enabled correct reading of barcodes on high
     * resolution images but slows down the recognition process.
     * 
     * falseTE: This setting is applied only for Code39 and Code128 barcode scanning.
     * 
     *  
     */
    this.autoScaleDetection = true;
    
    /** 
     * Set manatee license key and unlock the aztec scanning feature.
     * 
     *  
     */
    this.manateeLicenseKey = '';
    
    /** 
     * Set this to true to scan barcodes which don't have quiet zone (white area) around it
     * 
     * Use only if necessary because it slows down the recognition process
     * 
     *  
     */
    this.nullQuietZoneAllowed = false;
    
    /** 
     * Enable reading code39 barcode contents as extended data. For more information about code39
     * extended data (a.k.a. full ASCII mode), see https://en.wikipedia.org/wiki/Code_39#Full_ASCII_Code_39
     * 
     *  
     */
    this.readCode39AsExtendedData = false;
    
    /** 
     * Set this to true to scan Aztec 2D barcodes
     * 
     *  
     */
    this.scanAztecCode = false;
    
    /** 
     * Set this to true to scan Code 128 1D barcodes
     * 
     *  
     */
    this.scanCode128 = false;
    
    /** 
     * Set this to true to scan Code 39 1D barcodes
     * 
     *  
     */
    this.scanCode39 = false;
    
    /** 
     * Set this to true to scan DataMatrix 2D barcodes
     * 
     *  
     */
    this.scanDataMatrix = false;
    
    /** 
     * Set this to true to scan EAN 13 barcodes
     * 
     *  
     */
    this.scanEan13 = false;
    
    /** 
     * Set this to true to scan EAN8 barcodes
     * 
     *  
     */
    this.scanEan8 = false;
    
    /** 
     * Set this to true to allow scanning barcodes with inverted intensities
     * (i.e. white barcodes on black background)
     * 
     * falseTE: this options doubles the frame processing time
     * 
     *  
     */
    this.scanInverse = false;
    
    /** 
     * Set this to true to scan ITF barcodes
     * 
     *  
     */
    this.scanItf = false;
    
    /** 
     * Set this to true to scan Pdf417 barcodes
     * 
     *  
     */
    this.scanPdf417 = false;
    
    /** 
     * Set this to true to scan QR barcodes
     * 
     *  
     */
    this.scanQrCode = false;
    
    /** 
     * Set this to true to scan even barcode not compliant with standards
     * For example, malformed PDF417 barcodes which were incorrectly encoded
     * 
     * Use only if necessary because it slows down the recognition process
     * 
     *  
     */
    this.scanUncertain = true;
    
    /** 
     * Set this to true to scan UPCA barcodes
     * 
     *  
     */
    this.scanUpca = false;
    
    /** 
     * Set this to true to scan UPCE barcodes
     * 
     *  
     */
    this.scanUpce = false;
    
    /** 
     * Set this to true to allow slower, but better image processing.
     * 
     *  
     */
    this.slowerThoroughScan = true;
    
    this.createResultFromNative = function (nativeResult) { return new BarcodeRecognizerResult(nativeResult); }

}

BarcodeRecognizer.prototype = new Recognizer('BarcodeRecognizer');

BlinkID.prototype.BarcodeRecognizer = BarcodeRecognizer;

/**
 * Result object for ColombiaIdBackRecognizer.
 */
function ColombiaIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The blood group of the Colombian ID owner. 
     */
    this.bloodGroup = nativeResult.bloodGroup;
    
    /** 
     * The date of birth of the Colombian ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The document number of the Colombian ID card. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * The fingerprint of the Colombian ID owner. 
     */
    this.fingerprint = nativeResult.fingerprint;
    
    /** 
     * The first name of the Colombian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * The last name of the Colombian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The sex of the Colombian ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

ColombiaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.ColombiaIdBackRecognizerResult = ColombiaIdBackRecognizerResult;

/**
 * Class for configuring Colombia ID Back Recognizer.
 * 
 * Colombia ID Back recognizer is used for scanning back side of Colombia ID.
 */
function ColombiaIdBackRecognizer() {
    Recognizer.call(this, 'ColombiaIdBackRecognizer');
    
    /** 
     * Set this to true to scan barcodes which don't have quiet zone (white area) around it
     * 
     * Use only if necessary because it slows down the recognition process
     * 
     *  
     */
    this.nullQuietZoneAllowed = true;
    
    /** 
     * Set this to true to scan even barcode not compliant with standards
     * For example, malformed PDF417 barcodes which were incorrectly encoded
     * 
     * Use only if necessary because it slows down the recognition process
     * 
     *  
     */
    this.scanUncertain = true;
    
    this.createResultFromNative = function (nativeResult) { return new ColombiaIdBackRecognizerResult(nativeResult); }

}

ColombiaIdBackRecognizer.prototype = new Recognizer('ColombiaIdBackRecognizer');

BlinkID.prototype.ColombiaIdBackRecognizer = ColombiaIdBackRecognizer;

/**
 * Result object for ColombiaIdFrontRecognizer.
 */
function ColombiaIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The document number of the Colombian ID card. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Colombian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The last name of the Colombian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

ColombiaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.ColombiaIdFrontRecognizerResult = ColombiaIdFrontRecognizerResult;

/**
 * Class for configuring Colombia ID Front Recognizer.
 * 
 * Colombia ID Front recognizer is used for scanning front side of Colombia ID.
 */
function ColombiaIdFrontRecognizer() {
    Recognizer.call(this, 'ColombiaIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's first name should be extracted from Colombian ID
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if owner's last name should be extracted from Colombian ID
     * 
     *  
     */
    this.extractLastName = true;
    
    /** 
     * Property for setting DPI for face images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.faceImageDpi = 250;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new ColombiaIdFrontRecognizerResult(nativeResult); }

}

ColombiaIdFrontRecognizer.prototype = new Recognizer('ColombiaIdFrontRecognizer');

BlinkID.prototype.ColombiaIdFrontRecognizer = ColombiaIdFrontRecognizer;

/**
 * Result object for CroatiaCombinedRecognizer.
 */
function CroatiaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Croatian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The citizenship of the Croatian ID owner. 
     */
    this.citizenship = nativeResult.citizenship;
    
    /** 
     * The date of birth of Croatian ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The document date of expiry of the Croatian ID 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Check if date of expiry is permanent on the Croatian ID. 
     */
    this.dateOfExpiryPermanent = nativeResult.dateOfExpiryPermanent;
    
    /** 
     * The document date of issue of the Croatian ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * true if the document is bilingual 
     */
    this.documentBilingual = nativeResult.documentBilingual;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Croatian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * The identity card number of Croatian ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * The issuing authority of Croatian ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The last name of the Croatian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * true if the person is non Croatian resident 
     */
    this.nonResident = nativeResult.nonResident;
    
    /** 
     * The OIB (PIN) of the Croatian ID owner. 
     */
    this.personalIdentificationNumber = nativeResult.personalIdentificationNumber;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Croatian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

CroatiaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CroatiaCombinedRecognizerResult = CroatiaCombinedRecognizerResult;

/**
 * Croatian ID Combined Recognizer.
 * 
 * Croatian ID Combined recognizer is used for scanning both front and back side of Croatian ID.
 */
function CroatiaCombinedRecognizer() {
    Recognizer.call(this, 'CroatiaCombinedRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new CroatiaCombinedRecognizerResult(nativeResult); }

}

CroatiaCombinedRecognizer.prototype = new Recognizer('CroatiaCombinedRecognizer');

BlinkID.prototype.CroatiaCombinedRecognizer = CroatiaCombinedRecognizer;

/**
 * Result object for CroatiaIdBackRecognizer.
 */
function CroatiaIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Croatian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Check if date of expiry is permanent on the Croatian ID. 
     */
    this.dateOfExpiryPermanent = nativeResult.dateOfExpiryPermanent;
    
    /** 
     * The document date of issue of the Croatian ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * The issuing authority of Croatian ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
}

CroatiaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CroatiaIdBackRecognizerResult = CroatiaIdBackRecognizerResult;

/**
 * Croatian ID Back Recognizer.
 * 
 * Croatian ID Back recognizer is used for scanning back side of Croatian ID. It always extracts
 * MRZ zone and address of ID holder while extracting other elements is optional.
 */
function CroatiaIdBackRecognizer() {
    Recognizer.call(this, 'CroatiaIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of issue of Croatian ID should be extracted
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if issuing authority of Croatian ID should be extracted
     * 
     *  
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new CroatiaIdBackRecognizerResult(nativeResult); }

}

CroatiaIdBackRecognizer.prototype = new Recognizer('CroatiaIdBackRecognizer');

BlinkID.prototype.CroatiaIdBackRecognizer = CroatiaIdBackRecognizer;

/**
 * Result object for CroatiaIdFrontRecognizer.
 */
function CroatiaIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The citizenship of the Croatian ID owner. 
     */
    this.citizenship = nativeResult.citizenship;
    
    /** 
     * The date of birth of Croatian ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The document date of expiry of the Croatian ID 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Check if date of expiry is permanent on the Croatian ID. 
     */
    this.dateOfExpiryPermanent = nativeResult.dateOfExpiryPermanent;
    
    /** 
     * true if the document is bilingual 
     */
    this.documentBilingual = nativeResult.documentBilingual;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Croatian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The identity card number of Croatian ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * The last name of the Croatian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The sex of the Croatian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

CroatiaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CroatiaIdFrontRecognizerResult = CroatiaIdFrontRecognizerResult;

/**
 * Croatian ID Front Recognizer.
 * 
 * Croatian ID Front recognizer is used for scanning front side of Croatian ID. It always extracts
 * identity card number, first and last name of ID holder while extracting other elements is optional.
 */
function CroatiaIdFrontRecognizer() {
    Recognizer.call(this, 'CroatiaIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if citizenship of Croatian ID owner should be extracted
     * 
     *  
     */
    this.extractCitizenship = true;
    
    /** 
     * Defines if date of birth of Croatian ID owner should be extracted
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from Croatian ID
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     *  Defines if sex of Croatian ID owner should be extracted
     * 
     *   
     */
    this.extractSex = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new CroatiaIdFrontRecognizerResult(nativeResult); }

}

CroatiaIdFrontRecognizer.prototype = new Recognizer('CroatiaIdFrontRecognizer');

BlinkID.prototype.CroatiaIdFrontRecognizer = CroatiaIdFrontRecognizer;

/**
 * Result object for CzechiaCombinedRecognizer.
 */
function CzechiaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The full address of the Czech ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of birth of Czech ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Czech ID owner 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Czech ID owner 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Czech ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * The document number of the Czech ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * The issuing authority of Czech ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The last name of the Czech ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The nationality of the Czech ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The personal identification number of the Czech ID owner. 
     */
    this.personalIdentificationNumber = nativeResult.personalIdentificationNumber;
    
    /** 
     * The place of birth of the Czech ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Czech ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

CzechiaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CzechiaCombinedRecognizerResult = CzechiaCombinedRecognizerResult;

/**
 * Czech ID Combined Recognizer.
 * 
 * Czech ID Combined recognizer is used for scanning both front and back side of Czech ID.
 */
function CzechiaCombinedRecognizer() {
    Recognizer.call(this, 'CzechiaCombinedRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new CzechiaCombinedRecognizerResult(nativeResult); }

}

CzechiaCombinedRecognizer.prototype = new Recognizer('CzechiaCombinedRecognizer');

BlinkID.prototype.CzechiaCombinedRecognizer = CzechiaCombinedRecognizer;

/**
 * Result object for CzechiaIdBackRecognizer.
 */
function CzechiaIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The issuing authority of the Czech ID. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * The address of the Czech ID owner. 
     */
    this.permanentStay = nativeResult.permanentStay;
    
    /** 
     * The personal number of the Czech ID owner. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
}

CzechiaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CzechiaIdBackRecognizerResult = CzechiaIdBackRecognizerResult;

/**
 * Class for configuring Cz ID Back Recognizer.
 * 
 * Cz ID Back recognizer is used for scanning back side of Cz ID.
 */
function CzechiaIdBackRecognizer() {
    Recognizer.call(this, 'CzechiaIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if citizenship of Czech ID authority should be extracted
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if address of Czech ID owner should be extracted
     * 
     *  
     */
    this.extractPermanentStay = true;
    
    /** 
     * Defines if personal number should be extracted from Czech ID
     * 
     *  
     */
    this.extractPersonalNumber = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new CzechiaIdBackRecognizerResult(nativeResult); }

}

CzechiaIdBackRecognizer.prototype = new Recognizer('CzechiaIdBackRecognizer');

BlinkID.prototype.CzechiaIdBackRecognizer = CzechiaIdBackRecognizer;

/**
 * Result object for CzechiaIdFrontRecognizer.
 */
function CzechiaIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of the Czech ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Czech ID owner. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of the Czech ID owner. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Czech ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The ID card number of the Czech ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * The last name of the Czech ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The place of birth of the Czech ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The sex of the Czech ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

CzechiaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CzechiaIdFrontRecognizerResult = CzechiaIdFrontRecognizerResult;

/**
 * Class for configuring Cz ID Front Recognizer.
 * 
 * Cz ID Front recognizer is used for scanning front side of Cz ID.
 */
function CzechiaIdFrontRecognizer() {
    Recognizer.call(this, 'CzechiaIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of expiry should be extracted from Czech ID
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from Czech ID
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue should be extracted from Czech ID
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if given names of Czech ID owner should be extracted
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if place of birth should be extracted from Czech ID
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     *  Defines if sex of Czech ID owner should be extracted
     * 
     *   
     */
    this.extractSex = true;
    
    /** 
     * Defines if surname of Czech ID owner should be extracted
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new CzechiaIdFrontRecognizerResult(nativeResult); }

}

CzechiaIdFrontRecognizer.prototype = new Recognizer('CzechiaIdFrontRecognizer');

BlinkID.prototype.CzechiaIdFrontRecognizer = CzechiaIdFrontRecognizer;

/**
 * Result object for DocumentFaceRecognizer.
 */
function DocumentFaceRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Quadrangle represeting corner points of the document within the input image. 
     */
    this.documentLocation = nativeResult.documentLocation != null ? new Quadrilateral(nativeResult.documentLocation) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * Quadrangle represeting corner points of the face image within the input image. 
     */
    this.faceLocation = nativeResult.faceLocation != null ? new Quadrilateral(nativeResult.faceLocation) : null;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
}

DocumentFaceRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.DocumentFaceRecognizerResult = DocumentFaceRecognizerResult;

/**
 * Class for configuring Document Face Recognizer Recognizer.
 * 
 * Document Face Recognizer recognizer is used for scanning documents containing face images.
 */
function DocumentFaceRecognizer() {
    Recognizer.call(this, 'DocumentFaceRecognizer');
    
    /** 
     * Type of docment this recognizer will scan.
     * 
     *  
     */
    this.detectorType = DocumentFaceDetectorType.TD1;
    
    /** 
     * Property for setting DPI for face images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.faceImageDpi = 250;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new DocumentFaceRecognizerResult(nativeResult); }

}

DocumentFaceRecognizer.prototype = new Recognizer('DocumentFaceRecognizer');

BlinkID.prototype.DocumentFaceRecognizer = DocumentFaceRecognizer;

/**
 * Result object for EgyptIdFrontRecognizer.
 */
function EgyptIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The document number of the Egypt ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The National Number of the Egypt ID owner. 
     */
    this.nationalNumber = nativeResult.nationalNumber;
    
}

EgyptIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.EgyptIdFrontRecognizerResult = EgyptIdFrontRecognizerResult;

/**
 * Class for configuring Egypt ID Front Recognizer.
 * 
 * Egypt ID Front recognizer is used for scanning front side of Egypt ID.
 */
function EgyptIdFrontRecognizer() {
    Recognizer.call(this, 'EgyptIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's national number should be extracted from Egypt ID
     * 
     *  
     */
    this.extractNationalNumber = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new EgyptIdFrontRecognizerResult(nativeResult); }

}

EgyptIdFrontRecognizer.prototype = new Recognizer('EgyptIdFrontRecognizer');

BlinkID.prototype.EgyptIdFrontRecognizer = EgyptIdFrontRecognizer;

/**
 * Result object for EudlRecognizer.
 */
function EudlRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the EU Driver License owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The birth Data of the EU Driver License owner. 
     */
    this.birthData = nativeResult.birthData;
    
    /** 
     * The country of the EU Driver License owner. 
     */
    this.country = nativeResult.country;
    
    /** 
     * The driver Number of the EU Driver License owner. 
     */
    this.driverNumber = nativeResult.driverNumber;
    
    /** 
     * The expiry Date of the EU Driver License owner. 
     */
    this.expiryDate = nativeResult.expiryDate != null ? new Date(nativeResult.expiryDate) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first Name of the EU Driver License owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issue Date of the EU Driver License owner. 
     */
    this.issueDate = nativeResult.issueDate != null ? new Date(nativeResult.issueDate) : null;
    
    /** 
     * The issuing Authority of the EU Driver License owner. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The last Name of the EU Driver License owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The personal Number of the EU Driver License owner. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
}

EudlRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.EudlRecognizerResult = EudlRecognizerResult;

/**
 * Class for configuring EU Driver License Recognizer.
 * 
 * EU Driver License recognizer is used for scanning EU Driver License.
 */
function EudlRecognizer() {
    Recognizer.call(this, 'EudlRecognizer');
    
    /** 
     * Country of scanning Eudl. The default value of EudlCountryAny will scan all supported driver's licenses.
     * 
     *  
     */
    this.country = EudlCountry.Automatic;
    
    /** 
     * Defines if owner's address should be extracted from EU Driver License
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if owner's date of expiry should be extracted from EU Driver License
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if owner's date of issue should be extracted from EU Driver License
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if owner's issuing authority should be extracted from EU Driver License
     * 
     *  
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if owner's personal number should be extracted from EU Driver License
     * 
     *  
     */
    this.extractPersonalNumber = true;
    
    /** 
     * Property for setting DPI for face images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.faceImageDpi = 250;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new EudlRecognizerResult(nativeResult); }

}

EudlRecognizer.prototype = new Recognizer('EudlRecognizer');

BlinkID.prototype.EudlRecognizer = EudlRecognizer;

/**
 * Result object for GermanyCombinedRecognizer.
 */
function GermanyCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the German ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The CAN number of German ID. 
     */
    this.canNumber = nativeResult.canNumber;
    
    /** 
     * The date of birth of German ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of German ID owner 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of German ID owner 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * The eye color of German ID owner. 
     */
    this.eyeColor = nativeResult.eyeColor;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the German ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * The height of German ID owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * The identity card number of German ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * The issuing authority of German ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The last name of the German ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The nationality of the German ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The place of birth of the German ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the German ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

GermanyCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyCombinedRecognizerResult = GermanyCombinedRecognizerResult;

/**
 * German ID Combined Recognizer.
 * 
 * German ID Combined recognizer is used for scanning both front and back side of German ID.
 */
function GermanyCombinedRecognizer() {
    Recognizer.call(this, 'GermanyCombinedRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's address should be extracted from German ID
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Image extension factors for full document image.
     * 
     * @see ImageExtensionFactors
     *  
     */
    this.fullDocumentImageExtensionFactors = new ImageExtensionFactors();
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyCombinedRecognizerResult(nativeResult); }

}

GermanyCombinedRecognizer.prototype = new Recognizer('GermanyCombinedRecognizer');

BlinkID.prototype.GermanyCombinedRecognizer = GermanyCombinedRecognizer;

/**
 * Result object for GermanyIdBackRecognizer.
 */
function GermanyIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Full address 
     */
    this.address = nativeResult.address;
    
    /** 
     * City 
     */
    this.addressCity = nativeResult.addressCity;
    
    /** 
     * House number 
     */
    this.addressHouseNumber = nativeResult.addressHouseNumber;
    
    /** 
     * Stret name in single line 
     */
    this.addressStreet = nativeResult.addressStreet;
    
    /** 
     * ZIP code 
     */
    this.addressZipCode = nativeResult.addressZipCode;
    
    /** 
     * Issuing authority of the ID 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Date of issue 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Eye colour 
     */
    this.eyeColour = nativeResult.eyeColour;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Height in cm 
     */
    this.height = nativeResult.height;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
}

GermanyIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyIdBackRecognizerResult = GermanyIdBackRecognizerResult;

/**
 * Class for configuring German ID Back Recognizer.
 * 
 * German ID Back recognizer is used for scanning back side of German ID.
 */
function GermanyIdBackRecognizer() {
    Recognizer.call(this, 'GermanyIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's address should be extracted from German ID
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * If authority should be extracted, set this to true
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * If date of issue should be extracted, set this to true
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * If eye color should be extracted, set this to true
     * 
     *  
     */
    this.extractEyeColour = true;
    
    /** 
     * If height should be extracted, set this to true
     * 
     *  
     */
    this.extractHeight = true;
    
    /** 
     * Image extension factors for full document image.
     * 
     * @see ImageExtensionFactors
     *  
     */
    this.fullDocumentImageExtensionFactors = new ImageExtensionFactors();
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyIdBackRecognizerResult(nativeResult); }

}

GermanyIdBackRecognizer.prototype = new Recognizer('GermanyIdBackRecognizer');

BlinkID.prototype.GermanyIdBackRecognizer = GermanyIdBackRecognizer;

/**
 * Result object for GermanyIdFrontRecognizer.
 */
function GermanyIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The CAN number of the German ID 
     */
    this.canNumber = nativeResult.canNumber;
    
    /** 
     * The date of birth of German ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The document date of expiry of the German ID 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document number of the German ID 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the German ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The last name of the German ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The nationality of the German ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The place of birth of the German ID 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

GermanyIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyIdFrontRecognizerResult = GermanyIdFrontRecognizerResult;

/**
 * Class for configuring German ID Front Recognizer.
 * 
 * German ID Front recognizer is used for scanning front side of German ID.
 */
function GermanyIdFrontRecognizer() {
    Recognizer.call(this, 'GermanyIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if CAN number should be extracted from German ID
     * 
     *  
     */
    this.extractCanNumber = true;
    
    /** 
     * Defines if date of expiry should be extracted from German ID
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if document number should be extracted from German ID
     * 
     *  
     */
    this.extractDocumentNumber = true;
    
    /** 
     * Defines if owner's first names should be extracted from German ID
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if owner's nationality should be extracted from German ID
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if owner's place of birth should be extracted from German ID
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if owner's surname should be extracted from German ID
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Image extension factors for full document image.
     * 
     * @see ImageExtensionFactors
     *  
     */
    this.fullDocumentImageExtensionFactors = new ImageExtensionFactors();
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyIdFrontRecognizerResult(nativeResult); }

}

GermanyIdFrontRecognizer.prototype = new Recognizer('GermanyIdFrontRecognizer');

BlinkID.prototype.GermanyIdFrontRecognizer = GermanyIdFrontRecognizer;

/**
 * Result object for GermanyOldIdRecognizer.
 */
function GermanyOldIdRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * The place of birth on the German ID 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

GermanyOldIdRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyOldIdRecognizerResult = GermanyOldIdRecognizerResult;

/**
 * Class for configuring German Old ID Recognizer.
 * 
 * German Old ID recognizer is used for scanning German Old ID.
 */
function GermanyOldIdRecognizer() {
    Recognizer.call(this, 'GermanyOldIdRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's place of birth should be extracted from German ID
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Image extension factors for full document image.
     * 
     * @see ImageExtensionFactors
     *  
     */
    this.fullDocumentImageExtensionFactors = new ImageExtensionFactors();
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyOldIdRecognizerResult(nativeResult); }

}

GermanyOldIdRecognizer.prototype = new Recognizer('GermanyOldIdRecognizer');

BlinkID.prototype.GermanyOldIdRecognizer = GermanyOldIdRecognizer;

/**
 * Result object for GermanyPassportRecognizer.
 */
function GermanyPassportRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Issuing authority of the Passport 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Date of issue in NSDate object 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The name of the German Passport owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * The place of birth of the German Passport owner 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of the German Passport owner. 
     */
    this.surname = nativeResult.surname;
    
}

GermanyPassportRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyPassportRecognizerResult = GermanyPassportRecognizerResult;

/**
 * Class for configuring German Passport Recognizer.
 * 
 * German Passport recognizer is used for scanning German Passport.
 */
function GermanyPassportRecognizer() {
    Recognizer.call(this, 'GermanyPassportRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if authority should be extracted from German ID
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if date of issue should be extracted from German ID
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if owner's name should be extracted from German ID
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if owner's nationality should be extracted from German ID
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if owner's place of birth should be extracted from German ID
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if owner's surname should be extracted from German ID
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Image extension factors for full document image.
     * 
     * @see ImageExtensionFactors
     *  
     */
    this.fullDocumentImageExtensionFactors = new ImageExtensionFactors();
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyPassportRecognizerResult(nativeResult); }

}

GermanyPassportRecognizer.prototype = new Recognizer('GermanyPassportRecognizer');

BlinkID.prototype.GermanyPassportRecognizer = GermanyPassportRecognizer;

/**
 * Result object for HongKongIdFrontRecognizer.
 */
function HongKongIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The commerical Code of the Hong Kong ID. 
     */
    this.commercialCode = nativeResult.commercialCode;
    
    /** 
     * The date of birth of the Hong Kong ID ownder. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The issue date of the Hong Kong ID owner. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The document number of the Hong Kong card. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The full name of the Hong Kong ID owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The sex of the Hong Kong ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

HongKongIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.HongKongIdFrontRecognizerResult = HongKongIdFrontRecognizerResult;

/**
 * Class for configuring Hong Kong ID Front Recognizer.
 * 
 * Hong Kong ID Front recognizer is used for scanning front side of Hong Kong ID.
 */
function HongKongIdFrontRecognizer() {
    Recognizer.call(this, 'HongKongIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if commercial code should be extracted from Hong Kong ID
     * 
     *  
     */
    this.extractCommercialCode = true;
    
    /** 
     * Defines if owner's date of birth should be extracted from Hong Kong ID
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if card's date of issue should be extracted from Hong Kong ID
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if owner's full name should be extracted from Hong Kong ID
     * 
     *  
     */
    this.extractFullName = true;
    
    /** 
     * Defines if owner's sex should be extracted from Hong Kong ID
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new HongKongIdFrontRecognizerResult(nativeResult); }

}

HongKongIdFrontRecognizer.prototype = new Recognizer('HongKongIdFrontRecognizer');

BlinkID.prototype.HongKongIdFrontRecognizer = HongKongIdFrontRecognizer;

/**
 * Result object for IkadRecognizer.
 */
function IkadRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the iKad owner 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of birth of iKad owner, parsed in NSDate object 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The employer of the iKad owner 
     */
    this.employer = nativeResult.employer;
    
    /** 
     * The expiry date of the iKad, parsed in NSDate object 
     */
    this.expiryDate = nativeResult.expiryDate != null ? new Date(nativeResult.expiryDate) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The faculty address of the iKad owner 
     */
    this.facultyAddress = nativeResult.facultyAddress;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The name of the iKad owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The nationality of the iKad owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The passport number of the iKad owner. 
     */
    this.passportNumber = nativeResult.passportNumber;
    
    /** 
     * The sector of the iKad owner 
     */
    this.sector = nativeResult.sector;
    
    /** 
     * The sex of the iKad owner 
     */
    this.sex = nativeResult.sex;
    
}

IkadRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.IkadRecognizerResult = IkadRecognizerResult;

/**
 * Class for configuring iKad Recognizer.
 * 
 * iKad recognizer is used for scanning iKad.
 */
function IkadRecognizer() {
    Recognizer.call(this, 'IkadRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's address should be extracted from iKad
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if owner's employer should be extracted from iKad
     * 
     *  
     */
    this.extractEmployer = true;
    
    /** 
     * Defines if expiry date should be extracted from iKad
     * 
     *  
     */
    this.extractExpiryDate = true;
    
    /** 
     * Defines if owner's faculty address should be extracted from iKad
     * 
     *  
     */
    this.extractFacultyAddress = true;
    
    /** 
     * Defines if date of expiry should be extracted from iKad
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if owner's passport number should be extracted from iKad
     * 
     *  
     */
    this.extractPassportNumber = true;
    
    /** 
     * Defines if owner's sector should be extracted from iKad
     * 
     *  
     */
    this.extractSector = true;
    
    /** 
     * Defines if owner's sex should be extracted from iKad
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new IkadRecognizerResult(nativeResult); }

}

IkadRecognizer.prototype = new Recognizer('IkadRecognizer');

BlinkID.prototype.IkadRecognizer = IkadRecognizer;

/**
 * Result object for IndonesiaIdFrontRecognizer.
 */
function IndonesiaIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Indonesian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The blood type of the Indonesian ID owner. 
     */
    this.bloodType = nativeResult.bloodType;
    
    /** 
     * The occupation of the Indonesian ID owner. 
     */
    this.citizenship = nativeResult.citizenship;
    
    /** 
     * The city of the Indonesian ID owner. 
     */
    this.city = nativeResult.city;
    
    /** 
     * The date of birth of Indonesian ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The district of the Indonesian ID owner. 
     */
    this.district = nativeResult.district;
    
    /** 
     * The document classifier of Indonesian ID 
     */
    this.documentClassifier = nativeResult.documentClassifier;
    
    /** 
     * The document number of the Indonesian ID owner. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The kel desa of the Indonesian ID owner. 
     */
    this.kelDesa = nativeResult.kelDesa;
    
    /** 
     * The marital status of the Indonesian ID owner. 
     */
    this.maritalStatus = nativeResult.maritalStatus;
    
    /** 
     * The name of the Indonesian ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The occupation of the Indonesian ID owner. 
     */
    this.occupation = nativeResult.occupation;
    
    /** 
     * The place of birth of the Indonesian ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The province of the Indonesian ID owner. 
     */
    this.province = nativeResult.province;
    
    /** 
     * The religion of the Indonesian ID owner. 
     */
    this.religion = nativeResult.religion;
    
    /** 
     * The rt of the Indonesian ID owner. 
     */
    this.rt = nativeResult.rt;
    
    /** 
     * The rw of the Indonesian ID owner. 
     */
    this.rw = nativeResult.rw;
    
    /** 
     * The sex of the Indonesian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The document date of expiry of the Indonesian ID 
     */
    this.validUntil = nativeResult.validUntil != null ? new Date(nativeResult.validUntil) : null;
    
    /** 
     * Check if date of expiry is permanent on the Indonesian ID. 
     */
    this.validUntilPermanent = nativeResult.validUntilPermanent;
    
}

IndonesiaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.IndonesiaIdFrontRecognizerResult = IndonesiaIdFrontRecognizerResult;

/**
 * Class for configuring Indonesian ID Front Recognizer.
 * 
 * Indonesian ID Front recognizer is used for scanning front side of Indonesian ID.
 */
function IndonesiaIdFrontRecognizer() {
    Recognizer.call(this, 'IndonesiaIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if blood type should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractBloodType = true;
    
    /** 
     * Defines if citizenship should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractCitizenship = true;
    
    /** 
     *  Defines if city of Indonesian ID owner should be extracted
     * 
     *   
     */
    this.extractCity = true;
    
    /** 
     * Defines if district should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractDistrict = true;
    
    /** 
     * Defines if keldesa should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractKelDesa = true;
    
    /** 
     * Defines if marital status should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractMaritalStatus = true;
    
    /** 
     * Defines if name of Indonesian ID owner should be extracted
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if occupation should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractOccupation = true;
    
    /** 
     * Defines if place of birth of Indonesian ID owner should be extracted
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if religion should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractReligion = true;
    
    /** 
     * Defines if rt should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractRt = true;
    
    /** 
     * Defines if rw should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractRw = true;
    
    /** 
     * Defines if valid until should be extracted from Indonesian ID
     * 
     *  
     */
    this.extractValidUntil = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new IndonesiaIdFrontRecognizerResult(nativeResult); }

}

IndonesiaIdFrontRecognizer.prototype = new Recognizer('IndonesiaIdFrontRecognizer');

BlinkID.prototype.IndonesiaIdFrontRecognizer = IndonesiaIdFrontRecognizer;

/**
 * Result object for JordanCombinedRecognizer.
 */
function JordanCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The Date Of Birth of the Jordan ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The Date of expiry of the Jordan ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * The Document Number of the Jordan ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * The issuer of the Jordan ID. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The Name of the Jordan ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The Document Number of the Jordan ID. 
     */
    this.nationalNumber = nativeResult.nationalNumber;
    
    /** 
     * The nationality of the Jordan ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The Sex of the Jordan ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

JordanCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.JordanCombinedRecognizerResult = JordanCombinedRecognizerResult;

/**
 * Jordan ID Combined Recognizer.
 * 
 * Jordan ID Combined recognizer is used for scanning both front and back side of Jordan ID.
 */
function JordanCombinedRecognizer() {
    Recognizer.call(this, 'JordanCombinedRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's date of birth should be extracted from Jordan ID
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if owner's name should be extracted from Jordan ID
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if owner's sex should be extracted from Jordan ID
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new JordanCombinedRecognizerResult(nativeResult); }

}

JordanCombinedRecognizer.prototype = new Recognizer('JordanCombinedRecognizer');

BlinkID.prototype.JordanCombinedRecognizer = JordanCombinedRecognizer;

/**
 * Result object for JordanIdBackRecognizer.
 */
function JordanIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
}

JordanIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.JordanIdBackRecognizerResult = JordanIdBackRecognizerResult;

/**
 * Class for configuring Jordan ID Back Recognizer.
 * 
 * Jordan ID Back recognizer is used for scanning back side of Jordan ID.
 */
function JordanIdBackRecognizer() {
    Recognizer.call(this, 'JordanIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new JordanIdBackRecognizerResult(nativeResult); }

}

JordanIdBackRecognizer.prototype = new Recognizer('JordanIdBackRecognizer');

BlinkID.prototype.JordanIdBackRecognizer = JordanIdBackRecognizer;

/**
 * Result object for JordanIdFrontRecognizer.
 */
function JordanIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The Date Of Birth of the Jordan ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The Name of the Jordan ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The National Number of the Jordan ID. 
     */
    this.nationalNumber = nativeResult.nationalNumber;
    
    /** 
     * The Sex of the Jordan ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

JordanIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.JordanIdFrontRecognizerResult = JordanIdFrontRecognizerResult;

/**
 * Class for configuring Jordan ID Front Recognizer.
 * 
 * Jordan ID Front recognizer is used for scanning front side of Jordan ID.
 */
function JordanIdFrontRecognizer() {
    Recognizer.call(this, 'JordanIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's date of birth should be extracted from Jordan ID
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if owner's name should be extracted from Jordan ID
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if owner's sex should be extracted from Jordan ID
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new JordanIdFrontRecognizerResult(nativeResult); }

}

JordanIdFrontRecognizer.prototype = new Recognizer('JordanIdFrontRecognizer');

BlinkID.prototype.JordanIdFrontRecognizer = JordanIdFrontRecognizer;

/**
 * Result object for MalaysiaDlFrontRecognizer.
 */
function MalaysiaDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The City of the Malaysian DL owner. 
     */
    this.city = nativeResult.city;
    
    /** 
     * The Class of the Malaysian DL. 
     */
    this.dlClass = nativeResult.dlClass;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The Full Address of the Malaysian DL owner. 
     */
    this.fullAddress = nativeResult.fullAddress;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The Identity Number of the Malaysian DL owner. 
     */
    this.identityNumber = nativeResult.identityNumber;
    
    /** 
     * The Name of the Malaysian DL owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The Nationality of the Malaysian DL owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The State of the Malaysian DL owner. 
     */
    this.state = nativeResult.state;
    
    /** 
     * The Street of the Malaysian DL owner. 
     */
    this.street = nativeResult.street;
    
    /** 
     * The Valid From date of the Malaysian DL owner. 
     */
    this.validFrom = nativeResult.validFrom != null ? new Date(nativeResult.validFrom) : null;
    
    /** 
     * The Valid Until date of the Malaysian DL owner. 
     */
    this.validUntil = nativeResult.validUntil != null ? new Date(nativeResult.validUntil) : null;
    
    /** 
     * The Zip Code of the Malaysian DL owner. 
     */
    this.zipCode = nativeResult.zipCode;
    
}

MalaysiaDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MalaysiaDlFrontRecognizerResult = MalaysiaDlFrontRecognizerResult;

/**
 * Class for configuring Malaysian DL Front Recognizer.
 * 
 * Malaysian DL Front recognizer is used for scanning front side of Malaysian DL.
 */
function MalaysiaDlFrontRecognizer() {
    Recognizer.call(this, 'MalaysiaDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's license class should be extracted from Malaysian DL
     * 
     *  
     */
    this.extractDlClass = true;
    
    /** 
     * Defines if owner's full address should be extracted from Malaysian DL
     * 
     *  
     */
    this.extractFullAddress = true;
    
    /** 
     * Defines if owner's name should be extracted from Malaysian DL
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if owner's nationality should be extracted from Malaysian DL
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if owner's valid from should be extracted from Malaysian DL
     * 
     *  
     */
    this.extractValidFrom = true;
    
    /** 
     * Defines if owner's valid until should be extracted from Malaysian DL
     * 
     *  
     */
    this.extractValidUntil = true;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new MalaysiaDlFrontRecognizerResult(nativeResult); }

}

MalaysiaDlFrontRecognizer.prototype = new Recognizer('MalaysiaDlFrontRecognizer');

BlinkID.prototype.MalaysiaDlFrontRecognizer = MalaysiaDlFrontRecognizer;

/**
 * Result object for MrtdCombinedRecognizer.
 */
function MrtdCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Alien number. Returns nil or empty string if not available.
     * Exists only on US Green Cards. To see which document was scanned use documentType property. 
     */
    this.alienNumber = nativeResult.alienNumber;
    
    /** 
     * Application receipt number. Returns nil or empty string if not available.
     * Exists only on US Green Cards. To see which document was scanned use documentType property. 
     */
    this.applicationReceiptNumber = nativeResult.applicationReceiptNumber;
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * Returns the MRTD document type of recognized document. 
     */
    this.documentType = nativeResult.documentType;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * Immigrant case number. Returns nil or empty string if not available.
     * Exists only on US Green Cards. To see which document was scanned use documentType property. 
     */
    this.immigrantCaseNumber = nativeResult.immigrantCaseNumber;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * face image from the document if enabled with returnMrzImage property. 
     */
    this.mrzImage = nativeResult.mrzImage;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
}

MrtdCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MrtdCombinedRecognizerResult = MrtdCombinedRecognizerResult;

/**
 * MRTD Combined recognizer
 * 
 * MRTD Combined recognizer is used for scanning both front and back side of generic IDs.
 */
function MrtdCombinedRecognizer() {
    Recognizer.call(this, 'MrtdCombinedRecognizer');
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether MRZ image from ID card should be extracted
     * 
     *  
     */
    this.returnMrzImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new MrtdCombinedRecognizerResult(nativeResult); }

}

MrtdCombinedRecognizer.prototype = new Recognizer('MrtdCombinedRecognizer');

BlinkID.prototype.MrtdCombinedRecognizer = MrtdCombinedRecognizer;

/**
 * Result object for MrtdRecognizer.
 */
function MrtdRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Image of the Machine Readable Zone or nil if not available. 
     */
    this.mrzImage = nativeResult.mrzImage;
    
    /** 
     * Returns the Data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
}

MrtdRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MrtdRecognizerResult = MrtdRecognizerResult;

/**
 * Recognizer that can recognizer Machine Readable Zone (MRZ) of the Machine Readable Travel Document (MRTD)
 */
function MrtdRecognizer() {
    Recognizer.call(this, 'MrtdRecognizer');
    
    /** 
     * Whether returning of unparsed results is allowed
     * 
     *  
     */
    this.allowUnparsedResults = false;
    
    /** 
     * Whether returning of unverified results is allowed
     * Unverified result is result that is parsed, but check digits are incorrect.
     * 
     *  
     */
    this.allowUnverifiedResults = false;
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Whether cropped image of the Machine Readable Zone should be available in result.
     * Note - enabling this feature will degrade performance
     * 
     *  
     */
    this.returnMrzImage = false;
    
    /** 
     * Desired DPI for MRZ and full document images (if saving of those is enabled)
     * 
     *  
     */
    this.saveImageDPI = 250;
    
    this.createResultFromNative = function (nativeResult) { return new MrtdRecognizerResult(nativeResult); }

}

MrtdRecognizer.prototype = new Recognizer('MrtdRecognizer');

BlinkID.prototype.MrtdRecognizer = MrtdRecognizer;

/**
 * Result object for MyKadBackRecognizer.
 */
function MyKadBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The Date Of Birth of the MyKad owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The Extended NRIC of the MyKad owner. 
     */
    this.extendedNric = nativeResult.extendedNric;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The NRIC of the MyKad owner. 
     */
    this.nric = nativeResult.nric;
    
    /** 
     * The Sex of the MyKad owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

MyKadBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MyKadBackRecognizerResult = MyKadBackRecognizerResult;

/**
 * Class for configuring Kad Back Recognizer.
 * 
 * MyKadBack recognizer is used for scanning back side of MyKad.
 */
function MyKadBackRecognizer() {
    Recognizer.call(this, 'MyKadBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
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
     * Owner army number on MyTentera documents 
     */
    this.armyNumber = nativeResult.armyNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * NRIC number (National Registration Identity Card Number)
     * 
     *  @see https://en.wikipedia.org/wiki/Malaysian_identity_card#Structure_of_the_National_Registration_Identity_Card_Number_.28NRIC.29 
     */
    this.nricNumber = nativeResult.nricNumber;
    
    /** 
     * Owner address 
     */
    this.ownerAddress = nativeResult.ownerAddress;
    
    /** 
     * Owner address city. Determined from owner address. 
     */
    this.ownerAddressCity = nativeResult.ownerAddressCity;
    
    /** 
     * Owner address state. Determined from owner address. 
     */
    this.ownerAddressState = nativeResult.ownerAddressState;
    
    /** 
     * Owner street. Determined from owner address. 
     */
    this.ownerAddressStreet = nativeResult.ownerAddressStreet;
    
    /** 
     * Owner address Zip code. Determined from owner address. 
     */
    this.ownerAddressZipCode = nativeResult.ownerAddressZipCode;
    
    /** 
     * Owner birth date converted in NSDate object 
     */
    this.ownerBirthDate = nativeResult.ownerBirthDate != null ? new Date(nativeResult.ownerBirthDate) : null;
    
    /** 
     * Owner full name 
     */
    this.ownerFullName = nativeResult.ownerFullName;
    
    /** 
     * Owner religion if written on MyKad 
     */
    this.ownerReligion = nativeResult.ownerReligion;
    
    /** 
     * Owner sex (M for male, F for female) 
     */
    this.ownerSex = nativeResult.ownerSex;
    
}

MyKadFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MyKadFrontRecognizerResult = MyKadFrontRecognizerResult;

/**
 * Class for configuring My Kad Front Recognizer.
 * 
 * My Kad Front recognizer is used for scanning front side of My Kad.
 */
function MyKadFrontRecognizer() {
    Recognizer.call(this, 'MyKadFrontRecognizer');
    
    /** 
     * Defines if army number should be extracted from MyTentera documents with MyKadRecognizer
     * 
     *  
     */
    this.extractArmyNumber = false;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
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
     * Owner army number 
     */
    this.armyNumber = nativeResult.armyNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * NRIC number (National Registration Identity Card Number)
     * 
     *  @see https://en.wikipedia.org/wiki/Malaysian_identity_card#Structure_of_the_National_Registration_Identity_Card_Number_.28NRIC.29 
     */
    this.nricNumber = nativeResult.nricNumber;
    
    /** 
     * Owner address 
     */
    this.ownerAddress = nativeResult.ownerAddress;
    
    /** 
     * Owner address city. Determined from owner address. 
     */
    this.ownerAddressCity = nativeResult.ownerAddressCity;
    
    /** 
     * Owner address state. Determined from owner address. 
     */
    this.ownerAddressState = nativeResult.ownerAddressState;
    
    /** 
     * Owner street. Determined from owner address. 
     */
    this.ownerAddressStreet = nativeResult.ownerAddressStreet;
    
    /** 
     * Owner address Zip code. Determined from owner address. 
     */
    this.ownerAddressZipCode = nativeResult.ownerAddressZipCode;
    
    /** 
     * Owner birth date converted in NSDate object 
     */
    this.ownerBirthDate = nativeResult.ownerBirthDate != null ? new Date(nativeResult.ownerBirthDate) : null;
    
    /** 
     * Owner full name 
     */
    this.ownerFullName = nativeResult.ownerFullName;
    
    /** 
     * Owner religion if written on MyKad 
     */
    this.ownerReligion = nativeResult.ownerReligion;
    
    /** 
     * Owner sex (M for male, F for female) 
     */
    this.ownerSex = nativeResult.ownerSex;
    
}

MyTenteraRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MyTenteraRecognizerResult = MyTenteraRecognizerResult;

/**
 * Class for configuring My Tentera Recognizer.
 * 
 * My Tentera recognizer is used for scanning My Tentera.
 */
function MyTenteraRecognizer() {
    Recognizer.call(this, 'MyTenteraRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if full name and address should be extracted from MyTentera
     * 
     *  
     */
    this.extractFullNameAndAddress = true;
    
    /** 
     * Defines if religion should be extracted from MyTentera
     * 
     *  
     */
    this.extractReligion = true;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new MyTenteraRecognizerResult(nativeResult); }

}

MyTenteraRecognizer.prototype = new Recognizer('MyTenteraRecognizer');

BlinkID.prototype.MyTenteraRecognizer = MyTenteraRecognizer;

/**
 * Result object for NewZealandDlFrontRecognizer.
 */
function NewZealandDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The last name of the New Zealand Driver License owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The card version of the New Zealand Driver License. 
     */
    this.cardVersion = nativeResult.cardVersion;
    
    /** 
     * The last name of the New Zealand Driver License owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The last name of the New Zealand Driver License owner. 
     */
    this.donorIndicator = nativeResult.donorIndicator;
    
    /** 
     * The last name of the New Zealand Driver License owner. 
     */
    this.expiryDate = nativeResult.expiryDate != null ? new Date(nativeResult.expiryDate) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the New Zealand Driver License owner. 
     */
    this.firstNames = nativeResult.firstNames;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The last name of the New Zealand Driver License owner. 
     */
    this.issueDate = nativeResult.issueDate != null ? new Date(nativeResult.issueDate) : null;
    
    /** 
     * The license number of the New Zealand Driver License. 
     */
    this.licenseNumber = nativeResult.licenseNumber;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The last name of the New Zealand Driver License owner. 
     */
    this.surname = nativeResult.surname;
    
}

NewZealandDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.NewZealandDlFrontRecognizerResult = NewZealandDlFrontRecognizerResult;

/**
 * Class for configuring New Zealand DL Front Recognizer.
 * 
 * New Zealand DL Front recognizer is used for scanning front side of New Zealand DL.
 */
function NewZealandDlFrontRecognizer() {
    Recognizer.call(this, 'NewZealandDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's address should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if owner's date of birth should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if owner's donor indicator should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractDonorIndicator = true;
    
    /** 
     * Defines if card's expiry date should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractExpiryDate = true;
    
    /** 
     * Defines if owner's first name should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractFirstNames = true;
    
    /** 
     * Defines if card's issue date should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractIssueDate = true;
    
    /** 
     * Defines if owner's last name should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new NewZealandDlFrontRecognizerResult(nativeResult); }

}

NewZealandDlFrontRecognizer.prototype = new Recognizer('NewZealandDlFrontRecognizer');

BlinkID.prototype.NewZealandDlFrontRecognizer = NewZealandDlFrontRecognizer;

/**
 * Result object for Pdf417Recognizer.
 */
function Pdf417RecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Type of the barcode scanned
     * 
     *  @return Type of the barcode 
     */
    this.barcodeType = nativeResult.barcodeType;
    
    /** 
     * Byte array with result of the scan 
     */
    this.rawData = nativeResult.rawData;
    
    /** 
     * Retrieves string content of scanned data 
     */
    this.stringData = nativeResult.stringData;
    
    /** 
     * Flag indicating uncertain scanning data
     * E.g obtained from damaged barcode. 
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
     * Set this to true to scan barcodes which don't have quiet zone (white area) around it
     * 
     * Use only if necessary because it slows down the recognition process
     * 
     *  
     */
    this.nullQuietZoneAllowed = false;
    
    /** 
     * Set this to true to allow scanning barcodes with inverted intensities
     * (i.e. white barcodes on black background)
     * 
     * falseTE: this options doubles the frame processing time
     * 
     *  
     */
    this.scanInverse = false;
    
    /** 
     * Set this to true to scan even barcode not compliant with standards
     * For example, malformed PDF417 barcodes which were incorrectly encoded
     * 
     * Use only if necessary because it slows down the recognition process
     * 
     *  
     */
    this.scanUncertain = true;
    
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
     * The date of birth of Polish ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The document date of expiry of the Polish ID 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * The document number on Polish ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The family name of Polish ID owner. 
     */
    this.familyName = nativeResult.familyName;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * The first name of the Polish ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * The issuer of Polish ID. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The nationality of the Polish ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The parents name of Polish ID owner. 
     */
    this.parentsGivenNames = nativeResult.parentsGivenNames;
    
    /** 
     * The personal number of Polish ID. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Polish ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The last name of the Polish ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

PolandCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.PolandCombinedRecognizerResult = PolandCombinedRecognizerResult;

/**
 * Polish ID Combined Recognizer.
 * 
 * Polish ID Combined recognizer is used for scanning both front and back side of Polish ID.
 */
function PolandCombinedRecognizer() {
    Recognizer.call(this, 'PolandCombinedRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of expiry should be extracted from Polish ID
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from Polish ID
     * 
     *  
     */
    this.extractFamilyName = true;
    
    /** 
     * Defines if date of birth of Polish ID owner should be extracted
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if date of expiry should be extracted from Polish ID
     * 
     *  
     */
    this.extractParentsGivenNames = true;
    
    /** 
     *  Defines if sex of Polish ID owner should be extracted
     * 
     *   
     */
    this.extractSex = true;
    
    /** 
     * Defines if citizenship of Polish ID owner should be extracted
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new PolandCombinedRecognizerResult(nativeResult); }

}

PolandCombinedRecognizer.prototype = new Recognizer('PolandCombinedRecognizer');

BlinkID.prototype.PolandCombinedRecognizer = PolandCombinedRecognizer;

/**
 * Result object for PolandIdBackRecognizer.
 */
function PolandIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
}

PolandIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.PolandIdBackRecognizerResult = PolandIdBackRecognizerResult;

/**
 * Class for configuring Polish ID Back Recognizer.
 * 
 * Polish ID Back recognizer is used for scanning back side of Polish ID.
 */
function PolandIdBackRecognizer() {
    Recognizer.call(this, 'PolandIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new PolandIdBackRecognizerResult(nativeResult); }

}

PolandIdBackRecognizer.prototype = new Recognizer('PolandIdBackRecognizer');

BlinkID.prototype.PolandIdBackRecognizer = PolandIdBackRecognizer;

/**
 * Result object for PolandIdFrontRecognizer.
 */
function PolandIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of Polish ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The family name of Polish ID owner. 
     */
    this.familyName = nativeResult.familyName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The first name of the Polish ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * The parents name of Polish ID owner. 
     */
    this.parentsGivenNames = nativeResult.parentsGivenNames;
    
    /** 
     * The sex of the Polish ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The last name of the Polish ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

PolandIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.PolandIdFrontRecognizerResult = PolandIdFrontRecognizerResult;

/**
 * Class for configuring Polish ID Front Recognizer.
 * 
 * Polish ID Front recognizer is used for scanning front side of Polish ID.
 */
function PolandIdFrontRecognizer() {
    Recognizer.call(this, 'PolandIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of expiry should be extracted from Polish ID
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from Polish ID
     * 
     *  
     */
    this.extractFamilyName = true;
    
    /** 
     * Defines if date of birth of Polish ID owner should be extracted
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if date of expiry should be extracted from Polish ID
     * 
     *  
     */
    this.extractParentsGivenNames = true;
    
    /** 
     *  Defines if sex of Polish ID owner should be extracted
     * 
     *   
     */
    this.extractSex = true;
    
    /** 
     * Defines if citizenship of Polish ID owner should be extracted
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new PolandIdFrontRecognizerResult(nativeResult); }

}

PolandIdFrontRecognizer.prototype = new Recognizer('PolandIdFrontRecognizer');

BlinkID.prototype.PolandIdFrontRecognizer = PolandIdFrontRecognizer;

/**
 * Result object for RomaniaIdFrontRecognizer.
 */
function RomaniaIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Address 
     */
    this.address = nativeResult.address;
    
    /** 
     * Card number 
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /** 
     * CNP 
     */
    this.cnp = nativeResult.cnp;
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * First name 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * ID series 
     */
    this.idSeries = nativeResult.idSeries;
    
    /** 
     * Issued by 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Last name 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Nationality - missing if parent names exists 
     */
    this.nonMRZNationality = nativeResult.nonMRZNationality;
    
    /** 
     * Sex 
     */
    this.nonMRZSex = nativeResult.nonMRZSex;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Parent names - missing if nationality exists 
     */
    this.parentNames = nativeResult.parentNames;
    
    /** 
     * Place of birth 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * Valid from 
     */
    this.validFrom = nativeResult.validFrom != null ? new Date(nativeResult.validFrom) : null;
    
    /** 
     * Valid until 
     */
    this.validUntil = nativeResult.validUntil != null ? new Date(nativeResult.validUntil) : null;
    
}

RomaniaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.RomaniaIdFrontRecognizerResult = RomaniaIdFrontRecognizerResult;

/**
 * Class for configuring Romanian ID Front Recognizer.
 * 
 * Romanian ID Front recognizer is used for scanning front side of Romanian ID.
 */
function RomaniaIdFrontRecognizer() {
    Recognizer.call(this, 'RomaniaIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if the owner's address should be extracted from the ID
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if owner's first name should be extracted from the ID
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if the issued ny data should be extracted from the ID
     * 
     *  
     */
    this.extractIssuedBy = true;
    
    /** 
     * Defines if owner's last name should be extracted from the ID
     * 
     *  
     */
    this.extractLastName = true;
    
    /** 
     * Defines if the owner's sex information should be extracted from the ID
     * from non-MRZ part of the ID.
     * 
     *  
     */
    this.extractNonMRZSex = true;
    
    /** 
     * Defines if the place of birth should be extracted from the ID
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if the valid from date should be extracted from the ID
     * 
     *  
     */
    this.extractValidFrom = true;
    
    /** 
     * Defines if the valid until date should be extracted from the ID
     * 
     *  
     */
    this.extractValidUntil = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new RomaniaIdFrontRecognizerResult(nativeResult); }

}

RomaniaIdFrontRecognizer.prototype = new Recognizer('RomaniaIdFrontRecognizer');

BlinkID.prototype.RomaniaIdFrontRecognizer = RomaniaIdFrontRecognizer;

/**
 * Result object for SerbiaCombinedRecognizer.
 */
function SerbiaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of Serbian ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Serbian ID owner 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Serbian ID owner 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Serbian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * The identity card number of Serbian ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * The issuer of Serbian ID. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * The JG of Serbian ID owner. 
     */
    this.jmbg = nativeResult.jmbg;
    
    /** 
     * The last name of the Serbian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The nationality of the Serbian ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Serbian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

SerbiaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SerbiaCombinedRecognizerResult = SerbiaCombinedRecognizerResult;

/**
 * Serbian ID Combined Recognizer.
 * 
 * Serbian ID Combined recognizer is used for scanning both front and back side of Serbian ID.
 */
function SerbiaCombinedRecognizer() {
    Recognizer.call(this, 'SerbiaCombinedRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new SerbiaCombinedRecognizerResult(nativeResult); }

}

SerbiaCombinedRecognizer.prototype = new Recognizer('SerbiaCombinedRecognizer');

BlinkID.prototype.SerbiaCombinedRecognizer = SerbiaCombinedRecognizer;

/**
 * Result object for SerbiaIdBackRecognizer.
 */
function SerbiaIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
}

SerbiaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SerbiaIdBackRecognizerResult = SerbiaIdBackRecognizerResult;

/**
 * Class for configuring Serbian ID Back Recognizer.
 * 
 * Serbian ID Back recognizer is used for scanning back side of Serbian ID.
 */
function SerbiaIdBackRecognizer() {
    Recognizer.call(this, 'SerbiaIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SerbiaIdBackRecognizerResult(nativeResult); }

}

SerbiaIdBackRecognizer.prototype = new Recognizer('SerbiaIdBackRecognizer');

BlinkID.prototype.SerbiaIdBackRecognizer = SerbiaIdBackRecognizer;

/**
 * Result object for SerbiaIdFrontRecognizer.
 */
function SerbiaIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The document number of Serbian ID owner 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issuing date of the Serbian ID. 
     */
    this.issuingDate = nativeResult.issuingDate != null ? new Date(nativeResult.issuingDate) : null;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The valid until date of the Serbian ID. 
     */
    this.validUntil = nativeResult.validUntil != null ? new Date(nativeResult.validUntil) : null;
    
}

SerbiaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SerbiaIdFrontRecognizerResult = SerbiaIdFrontRecognizerResult;

/**
 * Class for configuring Serbian ID Front Recognizer.
 * 
 * Serbian ID Front recognizer is used for scanning front side of Serbian ID.
 */
function SerbiaIdFrontRecognizer() {
    Recognizer.call(this, 'SerbiaIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     *  Defines if issuing date of Serbian ID should be extracted
     * 
     *   
     */
    this.extractIssuingDate = true;
    
    /** 
     *  Defines if valid until date of Serbian ID should be extracted
     * 
     *   
     */
    this.extractValidUntil = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SerbiaIdFrontRecognizerResult(nativeResult); }

}

SerbiaIdFrontRecognizer.prototype = new Recognizer('SerbiaIdFrontRecognizer');

BlinkID.prototype.SerbiaIdFrontRecognizer = SerbiaIdFrontRecognizer;

/**
 * Result object for SimNumberRecognizer.
 */
function SimNumberRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Returns the recognized SIM number from barcode or empty string if recognition failed. 
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
     * The name of the Singapore ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The blood group of the Singapore ID owner. 
     */
    this.bloodGroup = nativeResult.bloodGroup;
    
    /** 
     * The identity card number of Singapore ID. 
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /** 
     * The country of birth of the Singapore ID owner. 
     */
    this.countryOfBirth = nativeResult.countryOfBirth;
    
    /** 
     * The date of birth of Singapore ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of issue of Singapore ID owner 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * The first name of the Singapore ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The race of the Singapore ID owner. 
     */
    this.race = nativeResult.race;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Singapore ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

SingaporeCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SingaporeCombinedRecognizerResult = SingaporeCombinedRecognizerResult;

/**
 * Singapore ID Combined Recognizer.
 * 
 * Singapore ID Combined recognizer is used for scanning both front and back side of Singapore ID.
 */
function SingaporeCombinedRecognizer() {
    Recognizer.call(this, 'SingaporeCombinedRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new SingaporeCombinedRecognizerResult(nativeResult); }

}

SingaporeCombinedRecognizer.prototype = new Recognizer('SingaporeCombinedRecognizer');

BlinkID.prototype.SingaporeCombinedRecognizer = SingaporeCombinedRecognizer;

/**
 * Result object for SingaporeIdBackRecognizer.
 */
function SingaporeIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Singapore ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The blood group of the Singapore ID owner. 
     */
    this.bloodGroup = nativeResult.bloodGroup;
    
    /** 
     * The identity card number of the Singapore ID. 
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /** 
     * The date of issue of the Singapore ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
}

SingaporeIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SingaporeIdBackRecognizerResult = SingaporeIdBackRecognizerResult;

/**
 * Class for configuring Singapore ID Back Recognizer.
 * 
 * Singapore ID Back recognizer is used for scanning back side of Singapore ID.
 */
function SingaporeIdBackRecognizer() {
    Recognizer.call(this, 'SingaporeIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     *  Defines if blood group of Singapore ID owner should be extracted
     * 
     *   
     */
    this.extractBloodGroup = true;
    
    /** 
     *  Defines if date of issue of Singapore ID owner should be extracted
     * 
     *   
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SingaporeIdBackRecognizerResult(nativeResult); }

}

SingaporeIdBackRecognizer.prototype = new Recognizer('SingaporeIdBackRecognizer');

BlinkID.prototype.SingaporeIdBackRecognizer = SingaporeIdBackRecognizer;

/**
 * Result object for SingaporeIdFrontRecognizer.
 */
function SingaporeIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The identity card number of the Singapore ID. 
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /** 
     * The country of birth of the Singapore ID owner. 
     */
    this.countryOfBirth = nativeResult.countryOfBirth;
    
    /** 
     * The date of birth of the Singapore ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The name of the Singapore ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The race of the Singapore ID owner. 
     */
    this.race = nativeResult.race;
    
    /** 
     * The sex of the Singapore ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

SingaporeIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SingaporeIdFrontRecognizerResult = SingaporeIdFrontRecognizerResult;

/**
 * Class for configuring Singapore ID Front Recognizer.
 * 
 * Singapore ID Front recognizer is used for scanning front side of Singapore ID.
 */
function SingaporeIdFrontRecognizer() {
    Recognizer.call(this, 'SingaporeIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     *  Defines if country of birth of Singapore ID owner should be extracted
     * 
     *   
     */
    this.extractCountryOfBirth = true;
    
    /** 
     *  Defines if date of birth of Singapore ID owner should be extracted
     * 
     *   
     */
    this.extractDateOfBirth = true;
    
    /** 
     *  Defines if race of Singapore ID owner should be extracted
     * 
     *   
     */
    this.extractRace = true;
    
    /** 
     *  Defines if sex of Singapore ID owner should be extracted
     * 
     *   
     */
    this.extractSex = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SingaporeIdFrontRecognizerResult(nativeResult); }

}

SingaporeIdFrontRecognizer.prototype = new Recognizer('SingaporeIdFrontRecognizer');

BlinkID.prototype.SingaporeIdFrontRecognizer = SingaporeIdFrontRecognizer;

/**
 * Result object for SlovakiaCombinedRecognizer.
 */
function SlovakiaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Slovak ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of birth of Slovak ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Slovak ID owner 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Slovak ID owner 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * The identity card number of Slovak ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Slovak ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * The issuing authority of Slovak ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The last name of the Slovak ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The nationality of the Slovak ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The PIN of the Slovak ID owner. 
     */
    this.personalIdentificationNumber = nativeResult.personalIdentificationNumber;
    
    /** 
     * The place of birth of the Slovak ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Slovak ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The special remarks of Slovak ID. 
     */
    this.specialRemarks = nativeResult.specialRemarks;
    
    /** 
     * The surname at birth of Slovak ID. 
     */
    this.surnameAtBirth = nativeResult.surnameAtBirth;
    
}

SlovakiaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SlovakiaCombinedRecognizerResult = SlovakiaCombinedRecognizerResult;

/**
 * Slovak ID Combined Recognizer.
 * 
 * Slovak ID Combined recognizer is used for scanning both front and back side of Slovak ID.
 */
function SlovakiaCombinedRecognizer() {
    Recognizer.call(this, 'SlovakiaCombinedRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's date of birth should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if ID's date of expiry should be extracted
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if ID's date of issue should be extracted
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if issuing document number should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractDocumentNumber = true;
    
    /** 
     * Defines if issuing authority should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractIssuedBy = true;
    
    /** 
     * Defines if owner's nationality should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if owner's place of birth should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if owner's sex should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if owner's special remarks should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractSpecialRemarks = true;
    
    /** 
     * Defines if owner's surname at birth should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractSurnameAtBirth = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new SlovakiaCombinedRecognizerResult(nativeResult); }

}

SlovakiaCombinedRecognizer.prototype = new Recognizer('SlovakiaCombinedRecognizer');

BlinkID.prototype.SlovakiaCombinedRecognizer = SlovakiaCombinedRecognizer;

/**
 * Result object for SlovakiaIdBackRecognizer.
 */
function SlovakiaIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Slovakian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * The place of birth of the Slovakian ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The special remarks of the Slovakian ID owner. 
     */
    this.specialRemarks = nativeResult.specialRemarks;
    
    /** 
     * The surname at birth of the Slovakian ID owner. 
     */
    this.surnameAtBirth = nativeResult.surnameAtBirth;
    
}

SlovakiaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SlovakiaIdBackRecognizerResult = SlovakiaIdBackRecognizerResult;

/**
 * Class for configuring Slovak ID Back Recognizer.
 * 
 * Slovak ID Back recognizer is used for scanning back side of Slovak ID.
 */
function SlovakiaIdBackRecognizer() {
    Recognizer.call(this, 'SlovakiaIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's place of birth should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if owner's special remarks should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractSpecialRemarks = true;
    
    /** 
     * Defines if owner's surname at birth should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractSurnameAtBirth = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SlovakiaIdBackRecognizerResult(nativeResult); }

}

SlovakiaIdBackRecognizer.prototype = new Recognizer('SlovakiaIdBackRecognizer');

BlinkID.prototype.SlovakiaIdBackRecognizer = SlovakiaIdBackRecognizer;

/**
 * Result object for SlovakiaIdFrontRecognizer.
 */
function SlovakiaIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of the Slovakian ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Slovakian ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of the Slovakian ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The document number of the Slovakian ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Slovakian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issuing authority of the ID. 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * The last name of the Slovakian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The nationality of the Slovakian ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The personal number of the Slovakian ID owner. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     * The sex of the Slovakian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

SlovakiaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SlovakiaIdFrontRecognizerResult = SlovakiaIdFrontRecognizerResult;

/**
 * Class for configuring Slovak ID Front Recognizer.
 * 
 * Slovak ID Front recognizer is used for scanning front side of Slovak ID.
 */
function SlovakiaIdFrontRecognizer() {
    Recognizer.call(this, 'SlovakiaIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's date of birth should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if ID's date of expiry should be extracted
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if ID's date of issue should be extracted
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if issuing document number should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractDocumentNumber = true;
    
    /** 
     * Defines if issuing authority should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractIssuedBy = true;
    
    /** 
     * Defines if owner's nationality should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if owner's sex should be extracted from Slovakian ID
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SlovakiaIdFrontRecognizerResult(nativeResult); }

}

SlovakiaIdFrontRecognizer.prototype = new Recognizer('SlovakiaIdFrontRecognizer');

BlinkID.prototype.SlovakiaIdFrontRecognizer = SlovakiaIdFrontRecognizer;

/**
 * Result object for SloveniaCombinedRecognizer.
 */
function SloveniaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Slovenian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The nationality of the Slovenian ID owner. 
     */
    this.citizenship = nativeResult.citizenship;
    
    /** 
     * The date of birth of Slovenian ID owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Slovenian ID owner 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Slovenian ID owner 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Slovenian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * The identity card number of Slovenian ID. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * The issuing authority of Slovenian ID. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The last name of the Slovenian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The PIN of the Slovenian ID owner. 
     */
    this.personalIdentificationNumber = nativeResult.personalIdentificationNumber;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Slovenian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

SloveniaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SloveniaCombinedRecognizerResult = SloveniaCombinedRecognizerResult;

/**
 * Slovenian ID Combined Recognizer.
 * 
 * Slovenian ID Combined recognizer is used for scanning both front and back side of Slovenian ID.
 */
function SloveniaCombinedRecognizer() {
    Recognizer.call(this, 'SloveniaCombinedRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new SloveniaCombinedRecognizerResult(nativeResult); }

}

SloveniaCombinedRecognizer.prototype = new Recognizer('SloveniaCombinedRecognizer');

BlinkID.prototype.SloveniaCombinedRecognizer = SloveniaCombinedRecognizer;

/**
 * Result object for SloveniaIdBackRecognizer.
 */
function SloveniaIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Slovenian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The authority of the Slovenian ID. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Date of issue of the Slovenian ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
}

SloveniaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SloveniaIdBackRecognizerResult = SloveniaIdBackRecognizerResult;

/**
 * Class for configuring Slovenian ID Back Recognizer.
 * 
 * Slovenian ID Back recognizer is used for scanning back side of Slovenian ID.
 */
function SloveniaIdBackRecognizer() {
    Recognizer.call(this, 'SloveniaIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     *  Defines if issuing authority of Slovenian ID should be extracted
     * 
     *   
     */
    this.extractAuthority = true;
    
    /** 
     *  Defines if date of issue of Slovenian ID should be extracted
     * 
     *   
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SloveniaIdBackRecognizerResult(nativeResult); }

}

SloveniaIdBackRecognizer.prototype = new Recognizer('SloveniaIdBackRecognizer');

BlinkID.prototype.SloveniaIdBackRecognizer = SloveniaIdBackRecognizer;

/**
 * Result object for SloveniaIdFrontRecognizer.
 */
function SloveniaIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of the Slovenian ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Slovenian ID owner. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Slovenian ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The last name of the Slovenian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The nationality of the Slovenian ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The sex of the Slovenian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

SloveniaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SloveniaIdFrontRecognizerResult = SloveniaIdFrontRecognizerResult;

/**
 * Class for configuring Slovenian ID Front Recognizer.
 * 
 * Slovenian ID Front recognizer is used for scanning front side of Slovenian ID.
 */
function SloveniaIdFrontRecognizer() {
    Recognizer.call(this, 'SloveniaIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     *  Defines if date of birth of Slovenian ID owner should be extracted
     * 
     *   
     */
    this.extractDateOfBirth = true;
    
    /** 
     *  Defines if date of expiry of Slovenian ID should be extracted
     * 
     *   
     */
    this.extractDateOfExpiry = true;
    
    /** 
     *  Defines if nationality of Slovenian ID owner should be extracted
     * 
     *   
     */
    this.extractNationality = true;
    
    /** 
     *  Defines if sex of Slovenian ID owner should be extracted
     * 
     *   
     */
    this.extractSex = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SloveniaIdFrontRecognizerResult(nativeResult); }

}

SloveniaIdFrontRecognizer.prototype = new Recognizer('SloveniaIdFrontRecognizer');

BlinkID.prototype.SloveniaIdFrontRecognizer = SloveniaIdFrontRecognizer;

/**
 * Result object for SwedenDlFrontRecognizer.
 */
function SwedenDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The Date Of Birth of the Sweden DL owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The Date Of Expiry of the Sweden DL. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The Date Of Issue of the Sweden DL. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The Issuing Agency of the Sweden DL. 
     */
    this.issuingAgency = nativeResult.issuingAgency;
    
    /** 
     * The Licence Categories of the Sweden DL. 
     */
    this.licenceCategories = nativeResult.licenceCategories;
    
    /** 
     * The Licence Numer of the Sweden DL. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * The Name of the Sweden DL owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The Reference Number of the Sweden DL. 
     */
    this.referenceNumber = nativeResult.referenceNumber;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The Surname of the Sweden DL owner. 
     */
    this.surname = nativeResult.surname;
    
}

SwedenDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwedenDlFrontRecognizerResult = SwedenDlFrontRecognizerResult;

/**
 * Class for configuring Sweden Dl Front Recognizer.
 * 
 * Sweden Dl Front recognizer is used for scanning front side of Sweden Dl.
 */
function SwedenDlFrontRecognizer() {
    Recognizer.call(this, 'SwedenDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's date of birth should be extracted from Sweden DL
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from Sweden DL
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue should be extracted from Sweden DL
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if issuing agency should be extracted from Sweden DL
     * 
     *  
     */
    this.extractIssuingAgency = true;
    
    /** 
     * Defines iflicence categories should be extracted from Sweden DL
     * 
     *  
     */
    this.extractLicenceCategories = false;
    
    /** 
     * Defines if owner's name should be extracted from Sweden DL
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if reference number should be extracted from Sweden DL
     * 
     *  
     */
    this.extractReferenceNumber = true;
    
    /** 
     * Defines if owner's surname should be extracted from Sweden DL
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SwedenDlFrontRecognizerResult(nativeResult); }

}

SwedenDlFrontRecognizer.prototype = new Recognizer('SwedenDlFrontRecognizer');

BlinkID.prototype.SwedenDlFrontRecognizer = SwedenDlFrontRecognizer;

/**
 * Result object for SwitzerlandIdBackRecognizer.
 */
function SwitzerlandIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The issuing authority of Swiss ID. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document date of issue of the Swiss ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The address of the Swiss ID owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The document date of issue of the Swiss ID. 
     */
    this.nonMrzDateOfExpiry = nativeResult.nonMrzDateOfExpiry != null ? new Date(nativeResult.nonMrzDateOfExpiry) : null;
    
    /** 
     * The address of the Swiss ID owner. 
     */
    this.nonMrzSex = nativeResult.nonMrzSex;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * The address of the Swiss ID owner. 
     */
    this.placeOfOrigin = nativeResult.placeOfOrigin;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
}

SwitzerlandIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwitzerlandIdBackRecognizerResult = SwitzerlandIdBackRecognizerResult;

/**
 * Class for configuring Swiss ID Back Recognizer.
 * 
 * Swiss ID Back recognizer is used for scanning back side of Swiss ID.
 */
function SwitzerlandIdBackRecognizer() {
    Recognizer.call(this, 'SwitzerlandIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if authority of Swiss ID should be extracted
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if date of expiry of Swiss ID should be extracted
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Swiss ID should be extracted
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if height of Swiss ID holder should be extracted
     * 
     *  
     */
    this.extractHeight = true;
    
    /** 
     * Defines if place of origin of Swiss ID holder should be extracted
     * 
     *  
     */
    this.extractPlaceOfOrigin = true;
    
    /** 
     * Defines if sex of Swiss ID folder should be extracted
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SwitzerlandIdBackRecognizerResult(nativeResult); }

}

SwitzerlandIdBackRecognizer.prototype = new Recognizer('SwitzerlandIdBackRecognizer');

BlinkID.prototype.SwitzerlandIdBackRecognizer = SwitzerlandIdBackRecognizer;

/**
 * Result object for SwitzerlandIdFrontRecognizer.
 */
function SwitzerlandIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of the Swiss ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The first name of the Swiss ID owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The last name of the Swiss ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

SwitzerlandIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwitzerlandIdFrontRecognizerResult = SwitzerlandIdFrontRecognizerResult;

/**
 * Class for configuring Swiss ID Front Recognizer.
 * 
 * Swiss ID Front recognizer is used for scanning front side of Swiss ID.
 */
function SwitzerlandIdFrontRecognizer() {
    Recognizer.call(this, 'SwitzerlandIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's first name should be extracted from Swiss ID
     * 
     *  
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if owner's last name should be extracted from Swiss ID
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Sets whether signature image from ID card should be extracted.
     * 
     *  
     */
    this.returnSignatureImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SwitzerlandIdFrontRecognizerResult(nativeResult); }

}

SwitzerlandIdFrontRecognizer.prototype = new Recognizer('SwitzerlandIdFrontRecognizer');

BlinkID.prototype.SwitzerlandIdFrontRecognizer = SwitzerlandIdFrontRecognizer;

/**
 * Result object for SwitzerlandPassportRecognizer.
 */
function SwitzerlandPassportRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Issuing authority of the Passport 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * Holder's date of birth. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Date of issue in NSDate object 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The document code. Document code contains two characters. For MRTD the first character
     * shall be A, C or I. The second character shall be discretion of the issuing State or organization
     * except that V shall not be used, and C shall not be used after A except in the crew member
     * certificate. On machine-readable passports (MRP) first character shall be P to designate an MRP.
     * One additional letter may be used, at the discretion of the issuing State or organization,
     * to designate a particular MRP. If the second character position is not used for this purpose, it
     * shall be filled by the filter character <. 
     */
    this.documentCode = nativeResult.documentCode;
    
    /** 
     * Unique number of the document. Document number contains up to 9 characters.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The name of the Swiss Passport owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * The height of the Swiss Passport owner 
     */
    this.height = nativeResult.height;
    
    /** 
     * Three-letter code which indicate the issuing State.
     * Three-letter codes are based on Alpha-3 codes for entities specified in
     * ISO 3166-1, with extensions for certain States. 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Boolean value which denotes that MRTD result is successfully parsed. When the result is parsed, all
     * properties below are present.
     * 
     * If in the PPMrtdRecognizerSettings you specified allowUnparsedResults = true, then it can happen that
     * MRTDRecognizerResult is not parsed. When this happens, this property will be equal to true.
     * 
     * In that case, you can use rawOcrResult property to obtain the raw result of the OCR process, so you can
     * implement MRTD parsing in your application.
     * 
     *  @return true if MRTD Recognizer result was successfully parsed and all the fields are extracted. false otherwise. 
     */
    this.mrzParsed = nativeResult.mrzParsed;
    
    /** 
     * The entire Machine Readable Zone text from ID. This text is usually used for parsing
     * other elements. 
     */
    this.mrzText = nativeResult.mrzText;
    
    /** 
     * true if all check digits inside MRZ are correct, false otherwise.
     * More specifically, true if MRZ complies with ICAO Document 9303 standard, false otherwise. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * Nationality of the holder represented by a three-letter code. Three-letter codes are based
     * on Alpha-3 codes for entities specified in ISO 3166-1, with extensions for certain States. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * Date of birth, as written on the passport 
     */
    this.nonMrzDateOfBirth = nativeResult.nonMrzDateOfBirth != null ? new Date(nativeResult.nonMrzDateOfBirth) : null;
    
    /** 
     * Date of expiry, as written on the passport 
     */
    this.nonMrzDateOfExpiry = nativeResult.nonMrzDateOfExpiry != null ? new Date(nativeResult.nonMrzDateOfExpiry) : null;
    
    /** 
     * The sex of the Swiss Passport owner 
     */
    this.nonMrzSex = nativeResult.nonMrzSex;
    
    /** 
     * First optional data. Returns nil or empty string if not available.
     * Element does not exist on US Green Card. To see which document was scanned use documentType property. 
     */
    this.opt1 = nativeResult.opt1;
    
    /** 
     * Second optional data. Returns nil or empty string if not available.
     * Element does not exist on Passports and Visas. To see which document was scanned use documentType property. 
     */
    this.opt2 = nativeResult.opt2;
    
    /** 
     * Number of the Passport 
     */
    this.passportNumber = nativeResult.passportNumber;
    
    /** 
     * The place of birth of the Swiss Passport owner 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Returns the primary indentifier. If there is more than one component, they are separated with space.
     * 
     *  @return primary id of a card holder. 
     */
    this.primaryId = nativeResult.primaryId;
    
    /** 
     * Returns the secondary identifier. If there is more than one component, they are separated with space.
     * 
     *  @return secondary id of a card holder 
     */
    this.secondaryId = nativeResult.secondaryId;
    
    /** 
     * Sex of the card holder. Sex is specified by use of the single initial, capital
     * letter F for female, M for male or < for unspecified. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The surname of the Swiss Passport owner. 
     */
    this.surname = nativeResult.surname;
    
}

SwitzerlandPassportRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwitzerlandPassportRecognizerResult = SwitzerlandPassportRecognizerResult;

/**
 * Class for configuring Swiss Passport Recognizer.
 * 
 * Swiss Passport recognizer is used for scanning Swiss Passport.
 */
function SwitzerlandPassportRecognizer() {
    Recognizer.call(this, 'SwitzerlandPassportRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if authority should be extracted from Swiss Passport
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if date of birth should be extracted from Swiss Passport
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from Swiss Passport
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue should be extracted from Swiss Passport
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if owner's name should be extracted from Swiss Passport
     * 
     *  
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if height should be extracted from Swiss Passport
     * 
     *  
     */
    this.extractHeight = true;
    
    /** 
     * Defines if passport number should be extracted from Swiss Passport
     * 
     *  
     */
    this.extractPassportNumber = true;
    
    /** 
     * Defines if owner's place of birth should be extracted from Swiss Passport
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if sex should be extracted from Swiss Passport
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if owner's surname should be extracted from Swiss Passport
     * 
     *  
     */
    this.extractSurname = true;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new SwitzerlandPassportRecognizerResult(nativeResult); }

}

SwitzerlandPassportRecognizer.prototype = new Recognizer('SwitzerlandPassportRecognizer');

BlinkID.prototype.SwitzerlandPassportRecognizer = SwitzerlandPassportRecognizer;

/**
 * Result object for UnitedArabEmiratesIdBackRecognizer.
 */
function UnitedArabEmiratesIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The mrz of the back side of United Arab Emirates ID owner. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
}

UnitedArabEmiratesIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.UnitedArabEmiratesIdBackRecognizerResult = UnitedArabEmiratesIdBackRecognizerResult;

/**
 * Class for configuring United Arab Emirates ID Back Recognizer.
 * 
 * United Arab Emirates ID Back recognizer is used for scanning back side of United Arab Emirates ID.
 */
function UnitedArabEmiratesIdBackRecognizer() {
    Recognizer.call(this, 'UnitedArabEmiratesIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new UnitedArabEmiratesIdBackRecognizerResult(nativeResult); }

}

UnitedArabEmiratesIdBackRecognizer.prototype = new Recognizer('UnitedArabEmiratesIdBackRecognizer');

BlinkID.prototype.UnitedArabEmiratesIdBackRecognizer = UnitedArabEmiratesIdBackRecognizer;

/**
 * Result object for UnitedArabEmiratesIdFrontRecognizer.
 */
function UnitedArabEmiratesIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The id Number of the front side of United Arab Emirates ID owner. 
     */
    this.idNumber = nativeResult.idNumber;
    
    /** 
     * The name of the front side of United Arab Emirates ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The nationality of the front side of United Arab Emirates ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
}

UnitedArabEmiratesIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.UnitedArabEmiratesIdFrontRecognizerResult = UnitedArabEmiratesIdFrontRecognizerResult;

/**
 * Class for configuring United Arab Emirates ID Front Recognizer.
 * 
 * United Arab Emirates ID Front recognizer is used for scanning front side of United Arab Emirates ID.
 */
function UnitedArabEmiratesIdFrontRecognizer() {
    Recognizer.call(this, 'UnitedArabEmiratesIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's name should be extracted from front side of United Arab Emirates ID
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if owner's nationality should be extracted from front side of United Arab Emirates ID
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Property for setting DPI for face images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.faceImageDpi = 250;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new UnitedArabEmiratesIdFrontRecognizerResult(nativeResult); }

}

UnitedArabEmiratesIdFrontRecognizer.prototype = new Recognizer('UnitedArabEmiratesIdFrontRecognizer');

BlinkID.prototype.UnitedArabEmiratesIdFrontRecognizer = UnitedArabEmiratesIdFrontRecognizer;

/**
 * Result object for VinRecognizer.
 */
function VinRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Returns the recognized VIN or empty string if recognition failed. 
     */
    this.vin = nativeResult.vin;
    
}

VinRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.VinRecognizerResult = VinRecognizerResult;

/**
 * Recognizer that can perform recognition of VINs (Vehicle Identification Number).
 */
function VinRecognizer() {
    Recognizer.call(this, 'VinRecognizer');
    
    this.createResultFromNative = function (nativeResult) { return new VinRecognizerResult(nativeResult); }

}

VinRecognizer.prototype = new Recognizer('VinRecognizer');

BlinkID.prototype.VinRecognizer = VinRecognizer;

BlinkID.prototype.UsdlKeys = Object.freeze(
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
 * Result object for UsdlRecognizer.
 */
function UsdlRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** Array of elements that are not part of AAMVA standard and are specific to each US state. */
    this.optionalElements = nativeResult.optionalElements;
    
    /** The raw bytes contained inside 2D barcode. */
    this.rawData = nativeResult.rawData;
    
    /** Raw string inside 2D barcode. */
    this.rawStringData = nativeResult.rawStringData;
    
    /** True if returned result is uncertain, i.e. if scanned barcode was incomplete (i.e. */
    this.uncertain = nativeResult.uncertain;

    /** Fields inside US Driver's licence. Available Keys are listed in BlinkIDScanner.UsdlKeys enum. */
    this.fields = nativeResult.fields;
    
}

UsdlRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.UsdlRecognizerResult = UsdlRecognizerResult;

/**
 * Recognizer that scan 2D barcodes from United States Driver License.
 */
function UsdlRecognizer() {
    Recognizer.call(this, 'UsdlRecognizer');
    
    /** Allow scanning PDF417 barcodes which don't have quiet zone */
    this.nullQuietZoneAllowed = true;
    
    /** Enable decoding of non-standard PDF417 barcodes, but without */
    this.uncertainDecoding = true;
    
    this.createResultFromNative = function (nativeResult) { return new UsdlRecognizerResult(nativeResult); }
    
}

UsdlRecognizer.prototype = new Recognizer('UsdlRecognizer');

BlinkID.prototype.UsdlRecognizer = UsdlRecognizer;

/**
 * Result object for UsdlCombinedRecognizer.
 */
function UsdlCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Digital signature of the recognition result. Available only if enabled with signResult property. 
     */
    this.digitalSignature = nativeResult.digitalSignature;
    
    /** 
     * Version of the digital signature. Available only if enabled with signResult property. 
     */
    this.digitalSignatureVersion = nativeResult.digitalSignatureVersion;
    
    /** 
     * Returns true if data from scanned parts/sides of the document match,
     * false otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return false. Result will
     * be true only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;

    /** Array of elements that are not part of AAMVA standard and are specific to each US state. */
    this.optionalElements = nativeResult.optionalElements;
    
    /** The raw bytes contained inside 2D barcode. */
    this.rawData = nativeResult.rawData;
    
    /** Raw string inside 2D barcode. */
    this.rawStringData = nativeResult.rawStringData;
    
    /** True if returned result is uncertain, i.e. if scanned barcode was incomplete (i.e. */
    this.uncertain = nativeResult.uncertain;

    /** Fields inside US Driver's licence. Available Keys are listed in BlinkIDScanner.UsdlKeys enum. */
    this.fields = nativeResult.fields;
    
}

UsdlCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.UsdlCombinedRecognizerResult = UsdlCombinedRecognizerResult;

/**
 * USDL Combined Recognizer.
 * 
 * USDL Combined recognizer is used for scanning both front and back side of US Driver's License.
 */
function UsdlCombinedRecognizer() {
    Recognizer.call(this, 'UsdlCombinedRecognizer');
    
    /** 
     * Property for setting DPI for face images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.faceImageDpi = 250;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Sets whether face image from ID card should be extracted
     * 
     *  
     */
    this.returnFaceImage = false;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    /** 
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new UsdlCombinedRecognizerResult(nativeResult); }

}

UsdlCombinedRecognizer.prototype = new Recognizer('UsdlCombinedRecognizer');

BlinkID.prototype.UsdlCombinedRecognizer = UsdlCombinedRecognizer;

// RECOGNIZERS

// export BlinkIDScanner
module.exports = new BlinkID();
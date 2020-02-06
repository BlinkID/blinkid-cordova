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
 * licenses: object containing:
 *               - base64 license keys for iOS and Android
 *               - optioanl parameter 'licensee' when license for multiple apps is used
 *               - optional flag 'showTimeLimitedLicenseKeyWarning' which indicates
 *                  whether warning for time limited license key will be shown, in format
 *  {
 *      ios: 'base64iOSLicense',
 *      android: 'base64AndroidLicense',
 *      licensee: String,
 *      showTimeLimitedLicenseKeyWarning: Boolean
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

    /**
    * Sanitized field opt1
    */
    this.sanitizedOpt1 = nativeMRZResult.sanitizedOpt1;

    /**
    * Sanitized field opt2
    */
    this.sanitizedOpt2 = nativeMRZResult.sanitizedOpt2;

    /**
    * Sanitized field nationality
    */
    this.sanitizedNationality = nativeMRZResult.sanitizedNationality;

    /**
    * Sanitized field issuer
    */
    this.sanitizedIssuer = nativeMRZResult.sanitizedIssuer;

    /**
    * Sanitized document code
    */
    this.sanitizedDocumentCode = nativeMRZResult.sanitizedDocumentCode;

    /**
    * Sanitized document number
    */
    this.sanitizedDocumentNumber = nativeMRZResult.sanitizedDocumentNumber;
}

/**
 * Result of the data matching algorithm for scanned parts/sides of the document.
 */
var DataMatchResult = Object.freeze(
    {
        /** Data matching has not been performed. */
        NotPerformed : 1,
        /** Data does not match. */
        Failed : 2,
        /** Data match. */
        Success : 3
    }
);

/**
 * Possible values for Document Data Match Result field.
 */
BlinkID.prototype.DataMatchResult = DataMatchResult

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
 * Possible values for DocumentFaceDetectorType field.
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
    /** 
    * String: splash message that is shown before scanning the first side of the document, while starting camera.
    * If null, default value will be used.
    */
    this.firstSideSplashMessage = null;
    /** 
    * String: splash message that is shown before scanning the second side of the document, while starting camera.
    * If null, default value will be used.
    */
    this.secondSideSplashMessage = null;
    /** 
    * String: splash message that is shown after scanning the document.
    * If null, default value will be used.
    */
    this.scanningDoneSplashMessage = null;
    /** 
    * String: user instructions that are shown above camera preview while the first side of the
    * document is being scanned.
    * If null, default value will be used.
    */
    this.firstSideInstructions = null;
    /** 
    * String: user instructions that are shown above camera preview while the second side of the
    * document is being scanned.
    * If null, default value will be used.
    */
    this.secondSideInstructions = null;
    /**
    * String: glare message that is shown if glare was detected while scanning document.
    * If null, default value will be used.
    */
    this.glareMessage = null;
}
DocumentVerificationOverlaySettings.prototype = new OverlaySettings();

BlinkID.prototype.DocumentVerificationOverlaySettings = DocumentVerificationOverlaySettings;

/**
 * Class for setting up BlinkId overlay.
 * BlinkId overlay is best suited for recognizers that perform ID document scanning.
 */
function BlinkIdOverlaySettings() {
    OverlaySettings.call(this, 'BlinkIdOverlaySettings');
}
BlinkIdOverlaySettings.prototype = new OverlaySettings();

BlinkID.prototype.BlinkIdOverlaySettings = BlinkIdOverlaySettings;
// OVERLAY SETTINGS

// RECOGNIZERS
/**
 * Result object for SuccessFrameGrabberRecognizer.
 */
function SuccessFrameGrabberRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    /** Camera frame at the time slave recognizer finished recognition */
    this.successFrame = nativeResult.successFrame;
}

SuccessFrameGrabberRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SuccessFrameGrabberRecognizerResult = SuccessFrameGrabberRecognizerResult;

/**
 * SuccessFrameGrabberRecognizer can wrap any other recognizer and obtain camera
 * frame on which the other recognizer finished recognition.
 */
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
 * Result object for BlinkIdCombinedRecognizer.
 */
function BlinkIdCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The additional address information of the document owner. 
     */
    this.additionalAddressInformation = nativeResult.additionalAddressInformation;
    
    /** 
     * The additional name information of the document owner. 
     */
    this.additionalNameInformation = nativeResult.additionalNameInformation;
    
    /** 
     * The address of the document owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The driver license conditions. 
     */
    this.conditions = nativeResult.conditions;
    
    /** 
     * The date of birth of the document owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of the document. 
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
     * The additional number of the document. 
     */
    this.documentAdditionalNumber = nativeResult.documentAdditionalNumber;
    
    /** 
     * Returns DataMatchResultSuccess if data from scanned parts/sides of the document match,
     * DataMatchResultFailed otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return DataMatchResultFailed. Result will
     * be DataMatchResultSuccess only if scanned values for all fields that are compared are the same. 
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * The document number. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * The driver license detailed info. 
     */
    this.driverLicenseDetailedInfo = nativeResult.driverLicenseDetailedInfo;
    
    /** 
     * The employer of the document owner. 
     */
    this.employer = nativeResult.employer;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the document owner. 
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
     * The full name of the document owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The issuing authority of the document. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The last name of the document owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The localized name of the document owner. 
     */
    this.localizedName = nativeResult.localizedName;
    
    /** 
     * The marital status of the document owner. 
     */
    this.maritalStatus = nativeResult.maritalStatus;
    
    /** 
     * The data extracted from the machine readable zone 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The nationality of the documet owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The personal identification number. 
     */
    this.personalIdNumber = nativeResult.personalIdNumber;
    
    /** 
     * The place of birth of the document owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The profession of the document owner. 
     */
    this.profession = nativeResult.profession;
    
    /** 
     * The race of the document owner. 
     */
    this.race = nativeResult.race;
    
    /** 
     * The religion of the document owner. 
     */
    this.religion = nativeResult.religion;
    
    /** 
     * The residential stauts of the document owner. 
     */
    this.residentialStatus = nativeResult.residentialStatus;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the document owner. 
     */
    this.sex = nativeResult.sex;
    
}

BlinkIdCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BlinkIdCombinedRecognizerResult = BlinkIdCombinedRecognizerResult;

/**
 * Recognizer which can scan front and back side of the United States driver license.
 */
function BlinkIdCombinedRecognizer() {
    Recognizer.call(this, 'BlinkIdCombinedRecognizer');
    
    /** 
     * Defines whether blured frames filtering is allowed
     * 
     *  
     */
    this.allowBlurFilter = true;
    
    /** 
     * Document not supported classifier delegate 
     */
    this.classifierDelegate = null;
    
    /** 
     * Full document dewarped imagedelegate 
     */
    this.dewarpedImageDelegate = null;
    
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
     * Whether or not recognition result should be signed.
     * 
     *  
     */
    this.signResult = false;
    
    this.createResultFromNative = function (nativeResult) { return new BlinkIdCombinedRecognizerResult(nativeResult); }

}

BlinkIdCombinedRecognizer.prototype = new Recognizer('BlinkIdCombinedRecognizer');

BlinkID.prototype.BlinkIdCombinedRecognizer = BlinkIdCombinedRecognizer;

/**
 * Result object for BlinkIdRecognizer.
 */
function BlinkIdRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The additional address information of the document owner. 
     */
    this.additionalAddressInformation = nativeResult.additionalAddressInformation;
    
    /** 
     * The additional name information of the document owner. 
     */
    this.additionalNameInformation = nativeResult.additionalNameInformation;
    
    /** 
     * The address of the document owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The driver license conditions. 
     */
    this.conditions = nativeResult.conditions;
    
    /** 
     * The date of birth of the document owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the document. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of the document. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The additional number of the document. 
     */
    this.documentAdditionalNumber = nativeResult.documentAdditionalNumber;
    
    /** 
     * The document number. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * The driver license detailed info. 
     */
    this.driverLicenseDetailedInfo = nativeResult.driverLicenseDetailedInfo;
    
    /** 
     * The employer of the document owner. 
     */
    this.employer = nativeResult.employer;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the document owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The full name of the document owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The issuing authority of the document. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The last name of the document owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The localized name of the document owner. 
     */
    this.localizedName = nativeResult.localizedName;
    
    /** 
     * The marital status of the document owner. 
     */
    this.maritalStatus = nativeResult.maritalStatus;
    
    /** 
     * The data extracted from the machine readable zone 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The nationality of the documet owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The personal identification number. 
     */
    this.personalIdNumber = nativeResult.personalIdNumber;
    
    /** 
     * The place of birth of the document owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The profession of the document owner. 
     */
    this.profession = nativeResult.profession;
    
    /** 
     * The race of the document owner. 
     */
    this.race = nativeResult.race;
    
    /** 
     * The religion of the document owner. 
     */
    this.religion = nativeResult.religion;
    
    /** 
     * The residential stauts of the document owner. 
     */
    this.residentialStatus = nativeResult.residentialStatus;
    
    /** 
     * The sex of the document owner. 
     */
    this.sex = nativeResult.sex;
    
}

BlinkIdRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BlinkIdRecognizerResult = BlinkIdRecognizerResult;

/**
 * The Blink ID Recognizer is used for scanning Blink ID.
 */
function BlinkIdRecognizer() {
    Recognizer.call(this, 'BlinkIdRecognizer');
    
    /** 
     * Defines whether blured frames filtering is allowed
     * 
     *  
     */
    this.allowBlurFilter = true;
    
    /** 
     * Document not supported classifier delegate 
     */
    this.classifierDelegate = null;
    
    /** 
     * Full document dewarped imagedelegate 
     */
    this.dewarpedImageDelegate = null;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new BlinkIdRecognizerResult(nativeResult); }

}

BlinkIdRecognizer.prototype = new Recognizer('BlinkIdRecognizer');

BlinkID.prototype.BlinkIdRecognizer = BlinkIdRecognizer;

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
     * Image extension factors for full document image.
     * 
     * @see ImageExtensionFactors
     *  
     */
    this.fullDocumentImageExtensionFactors = new ImageExtensionFactors();
    
    /** 
     * Defines how many times the same document should be detected before the detector
     * returns this document as a result of the deteciton
     * 
     * Higher number means more reliable detection, but slower processing
     * 
     *  
     */
    this.numStableDetectionsThreshold = 6;
    
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
 * Result object for MrtdCombinedRecognizer.
 */
function MrtdCombinedRecognizerResult(nativeResult) {
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
     * Returns DataMatchResultSuccess if data from scanned parts/sides of the document match,
     * DataMatchResultFailed otherwise. For example if date of expiry is scanned from the front and back side
     * of the document and values do not match, this method will return DataMatchResultFailed. Result will
     * be DataMatchResultSuccess only if scanned values for all fields that are compared are the same. 
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
     * Returns the Data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
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
     * Whether special characters are allowed
     * 
     *  
     */
    this.allowSpecialCharacters = false;
    
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
     * Type of document this recognizer will scan.
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
     * Image extension factors for full document image.
     * 
     * @see ImageExtensionFactors
     *  
     */
    this.fullDocumentImageExtensionFactors = new ImageExtensionFactors();
    
    /** 
     * Filter for MRTDs (Machine Readable Travel Documents) that is used to determine which documents
     * will be processed. If document is filtered out by this filter, its data cannot be returned as recognition result. 
     */
    this.mrzCombinedFilterDelegate = null;
    
    /** 
     * Defines how many times the same document should be detected before the detector
     * returns this document as a result of the deteciton
     * 
     * Higher number means more reliable detection, but slower processing
     * 
     *  
     */
    this.numStableDetectionsThreshold = 6;
    
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
     * Whether special characters are allowed
     * 
     *  
     */
    this.allowSpecialCharacters = false;
    
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
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.fullDocumentImageDpi = 250;
    
    /** 
     * Image extension factors for full document image.
     * 
     * @see ImageExtensionFactors
     *  
     */
    this.fullDocumentImageExtensionFactors = new ImageExtensionFactors();
    
    /** 
     * Filter for MRTDs (Machine Readable Travel Documents) that is used to determine which documents
     * will be processed. If document is filtered out by this filter, its data cannot be returned as recognition result. 
     */
    this.mrzFilterDelegate = null;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new MrtdRecognizerResult(nativeResult); }

}

MrtdRecognizer.prototype = new Recognizer('MrtdRecognizer');

BlinkID.prototype.MrtdRecognizer = MrtdRecognizer;

/**
 * Result object for PassportRecognizer.
 */
function PassportRecognizerResult(nativeResult) {
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
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
}

PassportRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.PassportRecognizerResult = PassportRecognizerResult;

/**
 * Recognizer which can scan all passports with MRZ.
 */
function PassportRecognizer() {
    Recognizer.call(this, 'PassportRecognizer');
    
    /** 
     * Defines whether to anonymize Netherlands MRZ
     * 
     *  
     */
    this.anonymizeNetherlandsMrz = true;
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new PassportRecognizerResult(nativeResult); }

}

PassportRecognizer.prototype = new Recognizer('PassportRecognizer');

BlinkID.prototype.PassportRecognizer = PassportRecognizer;

/**
 * Result object for VisaRecognizer.
 */
function VisaRecognizerResult(nativeResult) {
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
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
}

VisaRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.VisaRecognizerResult = VisaRecognizerResult;

/**
 * Recognizer which can scan all visas with MRZ.
 */
function VisaRecognizer() {
    Recognizer.call(this, 'VisaRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new VisaRecognizerResult(nativeResult); }

}

VisaRecognizer.prototype = new Recognizer('VisaRecognizer');

BlinkID.prototype.VisaRecognizer = VisaRecognizer;

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

    /** The first name of the United States driver license owner. */
    this.firstName = nativeResult.firstName;

    /** The last name of the United States driver license owner. */
    this.lastName = nativeResult.lastName;

    /** The full name of the United States driver license owner. */
    this.fullName = nativeResult.fullName;

    /** The full address of the United States driver license owner. */
    this.address = nativeResult.address;

    /** The document number of the United States driver license. */
    this.documentNumber = nativeResult.documentNumber;

    /** The sex of the United States driver license owner. */
    this.sex = nativeResult.sex;

    /** The restrictions to driving privileges for the United States driver license owner. */
    this.restrictions = nativeResult.restrictions;

    /** The additional privileges granted to the United States driver license owner. */
    this.endorsements = nativeResult.endorsements;

    /** The type of vehicle the driver license owner has privilege to drive. */
    this.vehicleClass = nativeResult.vehicleClass;

    /** The date of birth of the United States driver license owner. */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;

    /** The date of issue of the United States driver license. */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;

    /** The date of expiry of the United States driver license. */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
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
     * Returns the result of the data matching algorithm for scanned parts/sides of the document.
     */
    this.documentDataMatch = nativeResult.documentDataMatch;
    
    /** 
     * Face image from the document if enabled with returnFaceImage property.
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * Full document image if enabled with returnFullDocumentImage property.
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

    /** The first name of the United States driver license owner. */
    this.firstName = nativeResult.firstName;

    /** The last name of the United States driver license owner. */
    this.lastName = nativeResult.lastName;

    /** The full name of the United States driver license owner. */
    this.fullName = nativeResult.fullName;

    /** The full address of the United States driver license owner. */
    this.address = nativeResult.address;

    /** The document number of the United States driver license. */
    this.documentNumber = nativeResult.documentNumber;

    /** The sex of the United States driver license owner. */
    this.sex = nativeResult.sex;

    /** The restrictions to driving privileges for the United States driver license owner. */
    this.restrictions = nativeResult.restrictions;

    /** The additional privileges granted to the United States driver license owner. */
    this.endorsements = nativeResult.endorsements;

    /** The type of vehicle the driver license owner has privilege to drive. */
    this.vehicleClass = nativeResult.vehicleClass;

    /** The date of birth of the United States driver license owner. */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;

    /** The date of issue of the United States driver license. */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;

    /** The date of expiry of the United States driver license. */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
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
     */
    this.faceImageDpi = 250;
    
    /** 
     * Property for setting DPI for full document images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
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
     */
    this.returnFullDocumentImage = false;

    /** 
     * The extension factors for full document image. 
     */
    this.fullDocumentImageExtensionFactors = new ImageExtensionFactors();
        
    /** 
     * Minimum number of stable detections required for detection to be successful. 
     */
    this.numStableDetectionsThreshold = 6;
    
    /** 
     * Whether or not recognition result should be signed.
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
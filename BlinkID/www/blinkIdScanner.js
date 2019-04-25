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
 * Represents the type of scanned barcode
 */
BlinkID.prototype.BarcodeType = Object.freeze(
    {
        /** No barcode was scanned */
        None: 1,
        /** QR code was scanned */
        QRCode: 2,
        /** Data Matrix 2D barcode was scanned */
        DataMatrix: 3,
        /** UPC E barcode was scanned */
        UPCE: 4,
        /** UPC A barcode was scanned */
        UPCA: 5,
        /** EAN 8 barcode was scanned */
        EAN8: 6,
        /** EAN 13 barcode was scanned */
        EAN13: 7,
        /** Code 128 barcode was scanned */
        Code128: 8,
        /** Code 39 barcode was scanned */
        Code39: 9,
        /** ITF barcode was scanned */
        ITF: 10,
        /** Aztec 2D barcode was scanned */
        Aztec: 11,
        /** PDF417 2D barcode was scanned */
        PDF417: 12
    }
);
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
 * Supported BlinkCard card issuer values.
 */
BlinkID.prototype.CardIssuer = Object.freeze(
    {
        /** Unidentified Card */
        Other: 1,
        /** The American Express Company Card */
        AmericanExpress: 2,
        /** The Bank of Montreal ABM Card */
        BmoAbm: 3,
        /** China T-Union Transportation Card */
        ChinaTUnion: 4,
        /** China UnionPay Card */
        ChinaUnionPay: 5,
        /** Canadian Imperial Bank of Commerce Advantage Debit Card */
        CibcAdvantageDebit: 6,
        /** CISS Card */
        Ciss: 7,
        /** Diners Club International Card */
        DinersClubInternational: 8,
        /** Diners Club United States & Canada Card */
        DinersClubUsCanada: 9,
        /** Discover Card */
        DiscoverCard: 10,
        /** HSBC Bank Canada Card */
        Hsbc: 11,
        /** RuPay Card */
        RuPay: 12,
        /** InterPayment Card */
        InterPayment: 13,
        /** InstaPayment Card */
        InstaPayment: 14,
        /** The JCB Company Card */
        Jcb: 15,
        /** Laser Debit Card (deprecated) */
        Laser: 16,
        /** Maestro Debit Card */
        Maestro: 17,
        /** Dankort Card */
        Dankort: 18,
        /** MIR Card */
        Mir: 19,
        /** MasterCard Inc. Card */
        MasterCard: 20,
        /** The Royal Bank of Canada Client Card */
        RbcClient: 21,
        /** ScotiaBank Scotia Card */
        ScotiaBank: 22,
        /** TD Canada Trust Access Card */
        TdCtAccess: 23,
        /** Troy Card */
        Troy: 24,
        /** Visa Inc. Card */
        Visa: 25,
        /** Universal Air Travel Plan Inc. Card */
        Uatp: 26,
        /** Interswitch Verve Card */
        Verve: 27
    }
);

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
 * Class for setting up BlinkCard overlay.
 * BlinkCard overlay is best suited for scanning payment cards.
 */
function BlinkCardOverlaySettings() {
    OverlaySettings.call(this, 'BlinkCardOverlaySettings');
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
}
BlinkCardOverlaySettings.prototype = new OverlaySettings();

BlinkID.prototype.BlinkCardOverlaySettings = BlinkCardOverlaySettings;

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
 * Result object for AustraliaDlBackRecognizer.
 */
function AustraliaDlBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Australia DL owner 
     */
    this.address = nativeResult.address;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The last name of the Australia DL owner 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The date of expiry of the Australia DL 
     */
    this.licenceExpiry = nativeResult.licenceExpiry != null ? new Date(nativeResult.licenceExpiry) : null;
    
    /** 
     * The licence number of the Australia DL 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
}

AustraliaDlBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustraliaDlBackRecognizerResult = AustraliaDlBackRecognizerResult;

/**
 * Recognizer which can scan the back side of Australian driver's licences
 */
function AustraliaDlBackRecognizer() {
    Recognizer.call(this, 'AustraliaDlBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address of the Australia DL owner should be extracted
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if last name of the Australia DL owner should be extracted
     * 
     *  
     */
    this.extractLastName = true;
    
    /** 
     * Defines if the licence number of the Australia DL should be extracted
     * 
     *  
     */
    this.extractLicenceNumber = true;
    
    /** 
     * Defines if date of expiry of the Australia DL should be extracted
     * 
     *  
     */
    this.extractLicenseExpiry = true;
    
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
     * The address of the Australian DL owner 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of birth of the Australian DL owner 
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
     * The full name of the Australian DL owner 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The date of expiry of the Australian DL 
     */
    this.licenceExpiry = nativeResult.licenceExpiry != null ? new Date(nativeResult.licenceExpiry) : null;
    
    /** 
     * The licence number of the Australian DL 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * The licence type of the Australian DL 
     */
    this.licenceType = nativeResult.licenceType;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

AustraliaDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustraliaDlFrontRecognizerResult = AustraliaDlFrontRecognizerResult;

/**
 * Recognizer which can scan the front side of Australian driver's licences.
 */
function AustraliaDlFrontRecognizer() {
    Recognizer.call(this, 'AustraliaDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address of Australian DL owner should be extracted
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
     * Defines if full name of Australian DL owner should be extracted
     * 
     *  
     */
    this.extractFullName = true;
    
    /** 
     * Defines if date of expiry of Australian DL should be extracted
     * 
     *  
     */
    this.extractLicenseExpiry = true;
    
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
 * Result object for AustriaDlFrontRecognizer.
 */
function AustriaDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date Of Birth of the front side of the Austria Dl owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date Of Expiry of the front side of the Austria Dl owner. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date Of Issue of the front side of the Austria Dl owner. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first Name of the front side of the Austria Dl owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issuing Authority of the front side of the Austria Dl owner. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The licence Number of the front side of the Austria Dl owner. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * The name of the front side of the Austria Dl owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The place Of Birth of the front side of the Austria Dl owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The vehicle Categories of the front side of the Austria Dl owner. 
     */
    this.vehicleCategories = nativeResult.vehicleCategories;
    
}

AustriaDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.AustriaDlFrontRecognizerResult = AustriaDlFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Austrian national DL cards.
 */
function AustriaDlFrontRecognizer() {
    Recognizer.call(this, 'AustriaDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of birth of Austrian DL owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry of Austrian DL should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Austrian DL should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if first name of Austrian DL owner should be extracted.
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if issuing authority of Austrian DL should be extracted.
     * 
     *  
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if name of Austrian DL owner should be extracted.
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if place of birth of Austrian DL owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if vehicle categories of Austrian DL should be extracted.
     * 
     *  
     */
    this.extractVehicleCategories = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new AustriaDlFrontRecognizerResult(nativeResult); }

}

AustriaDlFrontRecognizer.prototype = new Recognizer('AustriaDlFrontRecognizer');

BlinkID.prototype.AustriaDlFrontRecognizer = AustriaDlFrontRecognizer;

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
 * Result object for BlinkCardEliteRecognizer.
 */
function BlinkCardEliteRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The payment card number. 
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /** 
     *  Payment card's security code/value 
     */
    this.cvv = nativeResult.cvv;
    
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
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * Payment card's inventory number. 
     */
    this.inventoryNumber = nativeResult.inventoryNumber;
    
    /** 
     * Information about the payment card owner (name, company, etc.). 
     */
    this.owner = nativeResult.owner;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The payment card's last month of validity. 
     */
    this.validThru = nativeResult.validThru != null ? new Date(nativeResult.validThru) : null;
    
}

BlinkCardEliteRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BlinkCardEliteRecognizerResult = BlinkCardEliteRecognizerResult;

/**
 * Recognizer used for scanning the front side of elite credit/debit cards.
 */
function BlinkCardEliteRecognizer() {
    Recognizer.call(this, 'BlinkCardEliteRecognizer');
    
    /** 
     * Should anonymize the card number area (redact image pixels) on the document image result
     * 
     *  
     */
    this.anonymizeCardNumber = false;
    
    /** 
     * Should anonymize the CVV on the document image result
     * 
     *  
     */
    this.anonymizeCvv = false;
    
    /** 
     * Should anonymize the owner area (redact image pixels) on the document image result
     * 
     *  
     */
    this.anonymizeOwner = false;
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Should extract the card's inventory number
     * 
     *  
     */
    this.extractInventoryNumber = true;
    
    /** 
     * Should extract the card owner information
     * 
     *  
     */
    this.extractOwner = true;
    
    /** 
     * Should extract the payment card's month of expiry
     * 
     *  
     */
    this.extractValidThru = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new BlinkCardEliteRecognizerResult(nativeResult); }

}

BlinkCardEliteRecognizer.prototype = new Recognizer('BlinkCardEliteRecognizer');

BlinkID.prototype.BlinkCardEliteRecognizer = BlinkCardEliteRecognizer;

/**
 * Result object for BlinkCardRecognizer.
 */
function BlinkCardRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The payment card number. 
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /** 
     *  Payment card's security code/value 
     */
    this.cvv = nativeResult.cvv;
    
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
     * back side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentBackImage = nativeResult.fullDocumentBackImage;
    
    /** 
     * front side image of the document if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentFrontImage = nativeResult.fullDocumentFrontImage;
    
    /** 
     * Payment card's inventory number. 
     */
    this.inventoryNumber = nativeResult.inventoryNumber;
    
    /** 
     * Payment card's issuing networ 
     */
    this.issuer = nativeResult.issuer;
    
    /** 
     * Information about the payment card owner (name, company, etc.). 
     */
    this.owner = nativeResult.owner;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The payment card's last month of validity. 
     */
    this.validThru = nativeResult.validThru != null ? new Date(nativeResult.validThru) : null;
    
}

BlinkCardRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BlinkCardRecognizerResult = BlinkCardRecognizerResult;

/**
 * Recognizer used for scanning the front side of credit/debit cards.
 */
function BlinkCardRecognizer() {
    Recognizer.call(this, 'BlinkCardRecognizer');
    
    /** 
     * Should anonymize the card number area (redact image pixels) on the document image result
     * 
     *  
     */
    this.anonymizeCardNumber = false;
    
    /** 
     * Should anonymize the CVV on the document image result
     * 
     *  
     */
    this.anonymizeCvv = false;
    
    /** 
     * Should anonymize the owner area (redact image pixels) on the document image result
     * 
     *  
     */
    this.anonymizeOwner = false;
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Should extract CVV
     * 
     *  
     */
    this.extractCvv = true;
    
    /** 
     * Should extract the card's inventory number
     * 
     *  
     */
    this.extractInventoryNumber = true;
    
    /** 
     * Should extract the card owner information
     * 
     *  
     */
    this.extractOwner = false;
    
    /** 
     * Should extract the payment card's month of expiry
     * 
     *  
     */
    this.extractValidThru = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new BlinkCardRecognizerResult(nativeResult); }

}

BlinkCardRecognizer.prototype = new Recognizer('BlinkCardRecognizer');

BlinkID.prototype.BlinkCardRecognizer = BlinkCardRecognizer;

/**
 * Result object for BruneiIdBackRecognizer.
 */
function BruneiIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of Brunei ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of issue of Brunei ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The race of Brunei ID owner. 
     */
    this.race = nativeResult.race;
    
}

BruneiIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BruneiIdBackRecognizerResult = BruneiIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of Brunei national ID cards.
 */
function BruneiIdBackRecognizer() {
    Recognizer.call(this, 'BruneiIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address of Brunei ID owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of issue of Brunei ID should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if the race of Brunei ID owner should be extracted.
     * 
     *  
     */
    this.extractRace = true;
    
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
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new BruneiIdBackRecognizerResult(nativeResult); }

}

BruneiIdBackRecognizer.prototype = new Recognizer('BruneiIdBackRecognizer');

BlinkID.prototype.BruneiIdBackRecognizer = BruneiIdBackRecognizer;

/**
 * Result object for BruneiIdFrontRecognizer.
 */
function BruneiIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of Brunei ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The document number of Brunei ID. 
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
     * The full name of Brunei ID owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The place of birth of Brunei ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The sex of Brunei ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

BruneiIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BruneiIdFrontRecognizerResult = BruneiIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of yellow version of Brunei ID.
 */
function BruneiIdFrontRecognizer() {
    Recognizer.call(this, 'BruneiIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of birth of Brunei ID owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if full name of Brunei ID owner should be extracted.
     * 
     *  
     */
    this.extractFullName = true;
    
    /** 
     * Defines if place of birth of Brunei ID owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if sex of Brunei ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new BruneiIdFrontRecognizerResult(nativeResult); }

}

BruneiIdFrontRecognizer.prototype = new Recognizer('BruneiIdFrontRecognizer');

BlinkID.prototype.BruneiIdFrontRecognizer = BruneiIdFrontRecognizer;

/**
 * Result object for BruneiMilitaryIdBackRecognizer.
 */
function BruneiMilitaryIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The army number of Brunei Military ID owner. 
     */
    this.armyNumber = nativeResult.armyNumber;
    
    /** 
     * The date of expiry of Brunei Military ID card. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Brunei Military ID card. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

BruneiMilitaryIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BruneiMilitaryIdBackRecognizerResult = BruneiMilitaryIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of Brunei Military ID card.
 */
function BruneiMilitaryIdBackRecognizer() {
    Recognizer.call(this, 'BruneiMilitaryIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of expiry of Brunei Military ID card should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Brunei Military ID card should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new BruneiMilitaryIdBackRecognizerResult(nativeResult); }

}

BruneiMilitaryIdBackRecognizer.prototype = new Recognizer('BruneiMilitaryIdBackRecognizer');

BlinkID.prototype.BruneiMilitaryIdBackRecognizer = BruneiMilitaryIdBackRecognizer;

/**
 * Result object for BruneiMilitaryIdFrontRecognizer.
 */
function BruneiMilitaryIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of Brunei Military ID owner. 
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
     * The full name of Brunei Military ID owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The military rank of Brunei Military ID owner. 
     */
    this.rank = nativeResult.rank;
    
}

BruneiMilitaryIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BruneiMilitaryIdFrontRecognizerResult = BruneiMilitaryIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Brunei Military ID card.
 */
function BruneiMilitaryIdFrontRecognizer() {
    Recognizer.call(this, 'BruneiMilitaryIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if full name of Brunei Military ID owner should be extracted.
     * 
     *  
     */
    this.extractFullName = true;
    
    /** 
     * Defines if military rank of Brunei Military ID owner should be extracted.
     * 
     *  
     */
    this.extractRank = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new BruneiMilitaryIdFrontRecognizerResult(nativeResult); }

}

BruneiMilitaryIdFrontRecognizer.prototype = new Recognizer('BruneiMilitaryIdFrontRecognizer');

BlinkID.prototype.BruneiMilitaryIdFrontRecognizer = BruneiMilitaryIdFrontRecognizer;

/**
 * Result object for BruneiResidencePermitBackRecognizer.
 */
function BruneiResidencePermitBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of Brunei Residence Permit card owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of issue of Brunei Residence Permit card. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The race of Brunei Residence Permit card owner. 
     */
    this.race = nativeResult.race;
    
}

BruneiResidencePermitBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BruneiResidencePermitBackRecognizerResult = BruneiResidencePermitBackRecognizerResult;

/**
 * Recognizer which can scan back side of Brunei national Residence Permit cards.
 */
function BruneiResidencePermitBackRecognizer() {
    Recognizer.call(this, 'BruneiResidencePermitBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address of Brunei Residence Permit card owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of issue of Brunei Residence Permit card should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if the race of Brunei Residence Permit card owner should be extracted.
     * 
     *  
     */
    this.extractRace = true;
    
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
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new BruneiResidencePermitBackRecognizerResult(nativeResult); }

}

BruneiResidencePermitBackRecognizer.prototype = new Recognizer('BruneiResidencePermitBackRecognizer');

BlinkID.prototype.BruneiResidencePermitBackRecognizer = BruneiResidencePermitBackRecognizer;

/**
 * Result object for BruneiResidencePermitFrontRecognizer.
 */
function BruneiResidencePermitFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of Brunei residence permit owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The document number of Brunei residence permit. 
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
     * The full name of Brunei residence permit owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The place of birth of Brunei residence permit owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The sex of Brunei residence permit owner. 
     */
    this.sex = nativeResult.sex;
    
}

BruneiResidencePermitFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BruneiResidencePermitFrontRecognizerResult = BruneiResidencePermitFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Brunei residence permits.
 */
function BruneiResidencePermitFrontRecognizer() {
    Recognizer.call(this, 'BruneiResidencePermitFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of birth of Brunei residence permit owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if full name of Brunei residence permit owner should be extracted.
     * 
     *  
     */
    this.extractFullName = true;
    
    /** 
     * Defines if place of birth of Brunei residence permit owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if sex of Brunei residence permit owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new BruneiResidencePermitFrontRecognizerResult(nativeResult); }

}

BruneiResidencePermitFrontRecognizer.prototype = new Recognizer('BruneiResidencePermitFrontRecognizer');

BlinkID.prototype.BruneiResidencePermitFrontRecognizer = BruneiResidencePermitFrontRecognizer;

/**
 * Result object for BruneiTemporaryResidencePermitBackRecognizer.
 */
function BruneiTemporaryResidencePermitBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of Brunei temporary residence permit owner's employer. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of issue of Brunei temporary residence permit. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The passport number of Brunei temporary residence permit owner. 
     */
    this.passportNumber = nativeResult.passportNumber;
    
}

BruneiTemporaryResidencePermitBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BruneiTemporaryResidencePermitBackRecognizerResult = BruneiTemporaryResidencePermitBackRecognizerResult;

/**
 * Recognizer which can scan back side of Brunei temporary residence permit cards.
 */
function BruneiTemporaryResidencePermitBackRecognizer() {
    Recognizer.call(this, 'BruneiTemporaryResidencePermitBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address of Brunei temporary residence permit owner's employer should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of issue of Brunei temporary residence permit should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if the passport number of Brunei temporary residence permit owner should be extracted.
     * 
     *  
     */
    this.extractPassportNumber = true;
    
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
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new BruneiTemporaryResidencePermitBackRecognizerResult(nativeResult); }

}

BruneiTemporaryResidencePermitBackRecognizer.prototype = new Recognizer('BruneiTemporaryResidencePermitBackRecognizer');

BlinkID.prototype.BruneiTemporaryResidencePermitBackRecognizer = BruneiTemporaryResidencePermitBackRecognizer;

/**
 * Result object for BruneiTemporaryResidencePermitFrontRecognizer.
 */
function BruneiTemporaryResidencePermitFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of Brunei Temporary Residence Permit owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of birth of Brunei Temporary Residence Permit owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The document number of Brunei Temporary Residence Permit. 
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
     * The full name of Brunei Temporary Residence Permit owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The place of birth of Brunei Temporary Residence Permit owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The sex of Brunei Temporary Residence Permit owner. 
     */
    this.sex = nativeResult.sex;
    
}

BruneiTemporaryResidencePermitFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.BruneiTemporaryResidencePermitFrontRecognizerResult = BruneiTemporaryResidencePermitFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Brunei Temporary Residence Permit.
 */
function BruneiTemporaryResidencePermitFrontRecognizer() {
    Recognizer.call(this, 'BruneiTemporaryResidencePermitFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address of Brunei Temporary Residence Permit owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of birth of Brunei Temporary Residence Permit owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if full name of Brunei Temporary Residence Permit owner should be extracted.
     * 
     *  
     */
    this.extractFullName = true;
    
    /** 
     * Defines if place of birth of Brunei Temporary Residence Permit owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if sex of Brunei Temporary Residence Permit owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new BruneiTemporaryResidencePermitFrontRecognizerResult(nativeResult); }

}

BruneiTemporaryResidencePermitFrontRecognizer.prototype = new Recognizer('BruneiTemporaryResidencePermitFrontRecognizer');

BlinkID.prototype.BruneiTemporaryResidencePermitFrontRecognizer = BruneiTemporaryResidencePermitFrontRecognizer;

/**
 * Result object for ColombiaDlFrontRecognizer.
 */
function ColombiaDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date Of Birth of the front side of the Colombia Dl owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date Of Issue of the front side of the Colombia Dl owner. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The driver Restrictions of the front side of the Colombia Dl owner. 
     */
    this.driverRestrictions = nativeResult.driverRestrictions;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issuing Agency of the front side of the Colombia Dl owner. 
     */
    this.issuingAgency = nativeResult.issuingAgency;
    
    /** 
     * The licence Number of the front side of the Colombia Dl owner. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * The name of the front side of the Colombia Dl owner. 
     */
    this.name = nativeResult.name;
    
}

ColombiaDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.ColombiaDlFrontRecognizerResult = ColombiaDlFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Colombia drivers licence.
 */
function ColombiaDlFrontRecognizer() {
    Recognizer.call(this, 'ColombiaDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if the date of birth of the Colombia Dl owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if the driver restrictions of the Colombia Dl owner should be extracted.
     * 
     *  
     */
    this.extractDriverRestrictions = true;
    
    /** 
     * Defines if the issuing agency of the Colombia Dl card should be extracted.
     * 
     *  
     */
    this.extractIssuingAgency = true;
    
    /** 
     * Defines if the name of the Colombia Dl owner should be extracted.
     * 
     *  
     */
    this.extractName = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new ColombiaDlFrontRecognizerResult(nativeResult); }

}

ColombiaDlFrontRecognizer.prototype = new Recognizer('ColombiaDlFrontRecognizer');

BlinkID.prototype.ColombiaDlFrontRecognizer = ColombiaDlFrontRecognizer;

/**
 * Result object for ColombiaIdBackRecognizer.
 */
function ColombiaIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The birth Date of the Colombia Id owner. 
     */
    this.birthDate = nativeResult.birthDate != null ? new Date(nativeResult.birthDate) : null;
    
    /** 
     * The blood Group of the Colombia Id owner. 
     */
    this.bloodGroup = nativeResult.bloodGroup;
    
    /** 
     * The document Number Colombia Id owner. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * The fingerprint of the Colombian ID owner. 
     */
    this.fingerprint = nativeResult.fingerprint;
    
    /** 
     * The first Name of the Colombia Id owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The last Name of the Colombia Id owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The sex of the Colombia Id owner. 
     */
    this.sex = nativeResult.sex;
    
}

ColombiaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.ColombiaIdBackRecognizerResult = ColombiaIdBackRecognizerResult;

/**
 * Class for configuring Colombia Id Back Recognizer.
 * 
 * Colombia Id Back recognizer is used for scanning back side of the Colombia Id.
 */
function ColombiaIdBackRecognizer() {
    Recognizer.call(this, 'ColombiaIdBackRecognizer');
    
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
     * Set this to true to scan barcodes which don't have quiet zone (white area) around it
     * 
     * Use only if necessary because it slows down the recognition process
     * 
     *  
     */
    this.nullQuietZoneAllowed = true;
    
    /** 
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
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
     * The document Number of the Colombia Id. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first Name of the Colombia Id owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The last Name of the Colombia Id owner. 
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
 * Class for configuring Colombia Id Front Recognizer.
 * 
 * Colombia Id Front recognizer is used for scanning front side of the Colombia Id.
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
     * Defines if owner's first name should be extracted from front side of the Colombia Id
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if owner's last name should be extracted from front side of the Colombia Id
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
     * The citizenship of the Croatian ID owner. 
     */
    this.citizenship = nativeResult.citizenship;
    
    /** 
     * The date of birth of the Croatian ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Croatian ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Determines if date of expiry of the Croatian ID is permanent. 
     */
    this.dateOfExpiryPermanent = nativeResult.dateOfExpiryPermanent;
    
    /** 
     * The date of issue of Croatian ID. 
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
     * Determines if Croatian ID is bilingual. 
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
     * Determines if Croatian ID is issued for non resident. 
     */
    this.documentForNonResident = nativeResult.documentForNonResident;
    
    /** 
     * The document number of the Croatian ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
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
     * The issuer of Croatian ID. 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * The last name of the Croatian ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * Determines if all check digits inside MRZ are correct. 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The OIB of Croatian ID owner. 
     */
    this.oib = nativeResult.oib;
    
    /** 
     * The residence of Croatian ID owner. 
     */
    this.residence = nativeResult.residence;
    
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
 * Recognizer which can front and back side of Croatian national ID cards.
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
     * Defines if date of expiry of Croatian ID document should be extracted
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Croatian ID should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if first name of Croatian ID owner should be extracted
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if issuer of Croatian ID should be extracted.
     * 
     *  
     */
    this.extractIssuedBy = true;
    
    /** 
     * Defines if last name of Croatian ID owner should be extracted
     * 
     *  
     */
    this.extractLastName = true;
    
    /** 
     * Defines if residence of Croatian ID owner should be extracted.
     * 
     *  
     */
    this.extractResidence = true;
    
    /** 
     * Defines if sex of Croatian ID owner should be extracted
     * 
     *  
     */
    this.extractSex = true;
    
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
     * Determines if date of expiry of Croatian ID is permanent 
     */
    this.dateOfExpiryPermanent = nativeResult.dateOfExpiryPermanent;
    
    /** 
     * The date of issue of Croatian ID 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * Determines if Croatian ID is issued for non resident 
     */
    this.documentForNonResident = nativeResult.documentForNonResident;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issuer of Croatian ID 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * The data extracted from the machine readable zone 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The residence of Croatian ID owner 
     */
    this.residence = nativeResult.residence;
    
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
     * Defines if issuer of Croatian ID should be extracted
     * 
     *  
     */
    this.extractIssuedBy = true;
    
    /** 
     * Defines if residence of Croatian ID owner should be extracted
     * 
     *  
     */
    this.extractResidence = true;
    
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
     * The document number of the Croatian ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
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
     *  Defines if first name of Croatian ID owner should be extracted
     * 
     *   
     */
    this.extractFirstName = true;
    
    /** 
     *  Defines if last name of Croatian ID owner should be extracted
     * 
     *   
     */
    this.extractLastName = true;
    
    /** 
     *  Defines if sex of Croatian ID owner should be extracted
     * 
     *   
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new CroatiaIdFrontRecognizerResult(nativeResult); }

}

CroatiaIdFrontRecognizer.prototype = new Recognizer('CroatiaIdFrontRecognizer');

BlinkID.prototype.CroatiaIdFrontRecognizer = CroatiaIdFrontRecognizer;

/**
 * Result object for CyprusIdBackRecognizer.
 */
function CyprusIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
}

CyprusIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CyprusIdBackRecognizerResult = CyprusIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of Cyprus ID cards.
 */
function CyprusIdBackRecognizer() {
    Recognizer.call(this, 'CyprusIdBackRecognizer');
    
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
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new CyprusIdBackRecognizerResult(nativeResult); }

}

CyprusIdBackRecognizer.prototype = new Recognizer('CyprusIdBackRecognizer');

BlinkID.prototype.CyprusIdBackRecognizer = CyprusIdBackRecognizer;

/**
 * Result object for CyprusIdFrontRecognizer.
 */
function CyprusIdFrontRecognizerResult(nativeResult) {
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
     * The ID number of Cyprus ID card. 
     */
    this.idNumber = nativeResult.idNumber;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

CyprusIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CyprusIdFrontRecognizerResult = CyprusIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Cyprus national ID cards.
 */
function CyprusIdFrontRecognizer() {
    Recognizer.call(this, 'CyprusIdFrontRecognizer');
    
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
    
    this.createResultFromNative = function (nativeResult) { return new CyprusIdFrontRecognizerResult(nativeResult); }

}

CyprusIdFrontRecognizer.prototype = new Recognizer('CyprusIdFrontRecognizer');

BlinkID.prototype.CyprusIdFrontRecognizer = CyprusIdFrontRecognizer;

/**
 * Result object for CyprusOldIdBackRecognizer.
 */
function CyprusOldIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of the old Cyprus ID card owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The expiry date of old Cyprus ID card. 
     */
    this.expiresOn = nativeResult.expiresOn != null ? new Date(nativeResult.expiresOn) : null;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The sex of the old Cyprus ID card owner. 
     */
    this.sex = nativeResult.sex;
    
}

CyprusOldIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CyprusOldIdBackRecognizerResult = CyprusOldIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of old Cyprus national ID cards.
 */
function CyprusOldIdBackRecognizer() {
    Recognizer.call(this, 'CyprusOldIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if the expiry date of old Cryprus ID card should be extracted.
     * 
     *  
     */
    this.extractExpiresOn = true;
    
    /** 
     * Defines if the sex of old Cyprus ID card owner should be extracted.
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
    
    this.createResultFromNative = function (nativeResult) { return new CyprusOldIdBackRecognizerResult(nativeResult); }

}

CyprusOldIdBackRecognizer.prototype = new Recognizer('CyprusOldIdBackRecognizer');

BlinkID.prototype.CyprusOldIdBackRecognizer = CyprusOldIdBackRecognizer;

/**
 * Result object for CyprusOldIdFrontRecognizer.
 */
function CyprusOldIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The document number of old Cyprus ID card. 
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
     * The ID number of the old Cyprus ID card. 
     */
    this.idNumber = nativeResult.idNumber;
    
    /** 
     * The name of old Cyprus ID card owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The surname of old Cyprus ID card owner. 
     */
    this.surname = nativeResult.surname;
    
}

CyprusOldIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CyprusOldIdFrontRecognizerResult = CyprusOldIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of old Cyprus national ID cards.
 */
function CyprusOldIdFrontRecognizer() {
    Recognizer.call(this, 'CyprusOldIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if document number of old Cyprus ID card should be extracted.
     * 
     *  
     */
    this.extractDocumentNumber = true;
    
    /** 
     * Defines if name of old Cyprus ID card owner should be extracted.
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if surname of old Cyprus ID card owner should be extracted.
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
    
    this.createResultFromNative = function (nativeResult) { return new CyprusOldIdFrontRecognizerResult(nativeResult); }

}

CyprusOldIdFrontRecognizer.prototype = new Recognizer('CyprusOldIdFrontRecognizer');

BlinkID.prototype.CyprusOldIdFrontRecognizer = CyprusOldIdFrontRecognizer;

/**
 * Result object for CzechiaCombinedRecognizer.
 */
function CzechiaCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The issuing authority of the Czechia ID card. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * The date of birth of the Czechia ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Czechia ID card. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of the Czechia ID card. 
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
     * The document number of the Czechia ID card. 
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
     * The given names of the Czechia ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * Determines if all check digits inside MRZ are correct 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The nationality of the Czechia ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The permanent stay address of the Czechia ID owner. 
     */
    this.permanentStay = nativeResult.permanentStay;
    
    /** 
     * The personal number of the Czechia ID owner. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     * The place of birth of the Czechia ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Czechia ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of the Czechia ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

CzechiaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CzechiaCombinedRecognizerResult = CzechiaCombinedRecognizerResult;

/**
 * Recognizer which can scan front and back side of Czechia national ID cards.
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
     * Defines if Czech ID's issuing authority should be extracted.
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if Czech ID owner's date of birth should be extracted
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if Czech ID's date of expiry should be extracted
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if Czech ID's date of issue should be extracted
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if Czech ID owner's given names should be extracted
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if Czech ID owner's permanent address should be extracted.
     * 
     *  
     */
    this.extractPermanentStay = true;
    
    /** 
     * Defines if Czech ID owner's personal number should be extracted.
     * 
     *  
     */
    this.extractPersonalNumber = true;
    
    /** 
     * Defines if Czech ID owner's place of birth should be extracted
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if Czech ID owner's sex should be extracted
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if Czech ID owner's surname should be extracted
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
    
    /** 
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
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
     * The Czech ID's issuing authority. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The data extracted from Czech ID's machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The Czech ID owner's permanent address. 
     */
    this.permanentStay = nativeResult.permanentStay;
    
    /** 
     * The Czech ID owner's personal number. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
}

CzechiaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CzechiaIdBackRecognizerResult = CzechiaIdBackRecognizerResult;

/**
 * Recognizer which can scan the back side of Czech IDs.
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
     * Defines if Czech ID's issuing authority should be extracted.
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if Czech ID owner's permanent address should be extracted.
     * 
     *  
     */
    this.extractPermanentStay = true;
    
    /** 
     * Defines if Czech ID owner's personal number should be extracted.
     * 
     *  
     */
    this.extractPersonalNumber = true;
    
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
     * The date of birth of Czech ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Czech ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Czech ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The document number of Czech ID. 
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
     * The given names of Czech ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * The place of birth of Czech ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The sex of Czech ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of Czech ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

CzechiaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.CzechiaIdFrontRecognizerResult = CzechiaIdFrontRecognizerResult;

/**
 * Recognizer which can scan the front side of Czech IDs.
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
     * Defines if Czech ID owner's date of birth should be extracted
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if Czech ID's date of expiry should be extracted
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if Czech ID's date of issue should be extracted
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if Czech ID owner's given names should be extracted
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if Czech ID owner's place of birth should be extracted
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if Czech ID owner's sex should be extracted
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if Czech ID owner's surname should be extracted
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
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
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
    
    /** 
     * Setting for control over FaceImageCropProcessor's tryBothOrientations option
     * 
     *  
     */
    this.tryBothOrientations = false;
    
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
     * The document number of Egypt ID. 
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
     * The national number of Egypt ID. 
     */
    this.nationalNumber = nativeResult.nationalNumber;
    
}

EgyptIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.EgyptIdFrontRecognizerResult = EgyptIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Egypt ID.
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
     * Defines if national number of Egypt ID should be extracted.
     * 
     *  
     */
    this.extractNationalNumber = true;
    
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
     * The address of the Germany ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The issuing authority of the Germany ID card. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * The CAN number of the Germany ID card. 
     */
    this.canNumber = nativeResult.canNumber;
    
    /** 
     * The colour of eyes of the Germany ID owner. 
     */
    this.colourOfEyes = nativeResult.colourOfEyes;
    
    /** 
     * The date of birth of the Germany ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Germany ID card. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of the Germany ID card. 
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
     * The document number of the Germany ID card. 
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
     * The given names of the Germany ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * The height of the Germany ID owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * Determines if all check digits inside MRZ are correct 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The nationality of the Germany ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The place of birth of the Germany ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The full mrz string result. 
     */
    this.rawMrzString = nativeResult.rawMrzString;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Germany ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of the Germany ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

GermanyCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyCombinedRecognizerResult = GermanyCombinedRecognizerResult;

/**
 * Recognizer which can scan front and back side of German national ID cards,
 *  front side of German old ID card and front side of German Passport.
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
     * Defines if address of German ID owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if issuing authority of German ID should be extracted.
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if CAN number of Germany ID should be extracted.
     * 
     *  
     */
    this.extractCanNumber = true;
    
    /** 
     * Defines if colour of eyes of German ID owner should be extracted.
     * 
     *  
     */
    this.extractColourOfEyes = true;
    
    /** 
     * Defines if date of expiry of Germany ID should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of German ID should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if document number of Germany ID should be extracted.
     * 
     *  
     */
    this.extractDocumentNumber = true;
    
    /** 
     * Defines if given name of German passport owner should be extracted.
     * 
     *  
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if given names of Germany ID owner should be extracted.
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if height of German ID owner should be extracted.
     * 
     *  
     */
    this.extractHeight = true;
    
    /** 
     * Defines if nationality  of Germany ID owner should be extracted.
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if place of birth of Germany ID owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if surname of Germany ID owner should be extracted.
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
    
    /** 
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyCombinedRecognizerResult(nativeResult); }

}

GermanyCombinedRecognizer.prototype = new Recognizer('GermanyCombinedRecognizer');

BlinkID.prototype.GermanyCombinedRecognizer = GermanyCombinedRecognizer;

/**
 * Result object for GermanyDlBackRecognizer.
 */
function GermanyDlBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of issue for B category of German DL card. 
     */
    this.dateOfIssueB10 = nativeResult.dateOfIssueB10 != null ? new Date(nativeResult.dateOfIssueB10) : null;
    
    /** 
     * The date of issue for B category of German DL card is not specified. 
     */
    this.dateOfIssueB10NotSpecified = nativeResult.dateOfIssueB10NotSpecified;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
}

GermanyDlBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyDlBackRecognizerResult = GermanyDlBackRecognizerResult;

/**
 * Recognizer which can scan back side of German DL cards.
 */
function GermanyDlBackRecognizer() {
    Recognizer.call(this, 'GermanyDlBackRecognizer');
    
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
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyDlBackRecognizerResult(nativeResult); }

}

GermanyDlBackRecognizer.prototype = new Recognizer('GermanyDlBackRecognizer');

BlinkID.prototype.GermanyDlBackRecognizer = GermanyDlBackRecognizer;

/**
 * Result object for GermanyDlFrontRecognizer.
 */
function GermanyDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of Germany DL owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Germany DL. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Germany DL. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Germany DL owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issuing authority of the Germany DL. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The last name of the Germany DL owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The licence categories of the Germany DL. 
     */
    this.licenceCategories = nativeResult.licenceCategories;
    
    /** 
     * The licence number of the Germany DL. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * The place of birth of Germany DL owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

GermanyDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyDlFrontRecognizerResult = GermanyDlFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Germany national DL cards
 */
function GermanyDlFrontRecognizer() {
    Recognizer.call(this, 'GermanyDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of birth of Germany DL owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry of Germany DL should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Germany DL should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if first name of Germany DL owner should be extracted.
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if issuing authority of Germany DL should be extracted.
     * 
     *  
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if last name of Germany DL owner should be extracted.
     * 
     *  
     */
    this.extractLastName = true;
    
    /** 
     * Defines if licence categories of Germany DL should be extracted.
     * 
     *  
     */
    this.extractLicenceCategories = true;
    
    /** 
     * Defines if place of birth of Germany DL owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new GermanyDlFrontRecognizerResult(nativeResult); }

}

GermanyDlFrontRecognizer.prototype = new Recognizer('GermanyDlFrontRecognizer');

BlinkID.prototype.GermanyDlFrontRecognizer = GermanyDlFrontRecognizer;

/**
 * Result object for GermanyIdBackRecognizer.
 */
function GermanyIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The city of German ID owner. 
     */
    this.addressCity = nativeResult.addressCity;
    
    /** 
     * The house number of German ID owner. 
     */
    this.addressHouseNumber = nativeResult.addressHouseNumber;
    
    /** 
     * The street of German ID owner. 
     */
    this.addressStreet = nativeResult.addressStreet;
    
    /** 
     * The zip code of German ID owner. 
     */
    this.addressZipCode = nativeResult.addressZipCode;
    
    /** 
     * The issuing authority of German ID. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * The colour of eyes of German ID owner. 
     */
    this.colourOfEyes = nativeResult.colourOfEyes;
    
    /** 
     * The date of issue of German ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The full address of German ID owner. 
     */
    this.fullAddress = nativeResult.fullAddress;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The height of German ID owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
}

GermanyIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyIdBackRecognizerResult = GermanyIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of German ID.
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
     * Defines if address of German ID owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if issuing authority of German ID should be extracted.
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if colour of eyes of German ID owner should be extracted.
     * 
     *  
     */
    this.extractColourOfEyes = true;
    
    /** 
     * Defines if date of issue of German ID should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if height of German ID owner should be extracted.
     * 
     *  
     */
    this.extractHeight = true;
    
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
     * The CAN number of Germany ID. 
     */
    this.canNumber = nativeResult.canNumber;
    
    /** 
     * The date of birth of Germany ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Germany ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document number of Germany ID. 
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
     * The given names of Germany ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * The nationality of Germany ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The place of birth of Germany ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of Germany ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

GermanyIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyIdFrontRecognizerResult = GermanyIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Germany national ID cards.
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
     * Defines if CAN number of Germany ID should be extracted.
     * 
     *  
     */
    this.extractCanNumber = true;
    
    /** 
     * Defines if date of expiry of Germany ID should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if document number of Germany ID should be extracted.
     * 
     *  
     */
    this.extractDocumentNumber = true;
    
    /** 
     * Defines if given names of Germany ID owner should be extracted.
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if nationality  of Germany ID owner should be extracted.
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if place of birth of Germany ID owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if surname of Germany ID owner should be extracted.
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
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new GermanyIdFrontRecognizerResult(nativeResult); }

}

GermanyIdFrontRecognizer.prototype = new Recognizer('GermanyIdFrontRecognizer');

BlinkID.prototype.GermanyIdFrontRecognizer = GermanyIdFrontRecognizer;

/**
 * Result object for GermanyIdOldRecognizer.
 */
function GermanyIdOldRecognizerResult(nativeResult) {
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
    
    /** 
     * The place of birth of old German ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

GermanyIdOldRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyIdOldRecognizerResult = GermanyIdOldRecognizerResult;

/**
 * Recognizer which can scan old German ID.
 */
function GermanyIdOldRecognizer() {
    Recognizer.call(this, 'GermanyIdOldRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if place of birth of old German ID owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new GermanyIdOldRecognizerResult(nativeResult); }

}

GermanyIdOldRecognizer.prototype = new Recognizer('GermanyIdOldRecognizer');

BlinkID.prototype.GermanyIdOldRecognizer = GermanyIdOldRecognizer;

/**
 * Result object for GermanyPassportRecognizer.
 */
function GermanyPassportRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The issuing authority of German passport. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * The date of issue of German passport. 
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
     * The given name of German passport owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The nationality of German passport owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The place of birth of German passport owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of German passport owner. 
     */
    this.surname = nativeResult.surname;
    
}

GermanyPassportRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.GermanyPassportRecognizerResult = GermanyPassportRecognizerResult;

/**
 * Recognizer which can scan German passport.
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
     * Defines if issuing authority of German passport should be extracted.
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if date of issue of German passport should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if given name of German passport owner should be extracted.
     * 
     *  
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if nationality of German passport owner should be extracted.
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if place of birth of German passport owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if surname of German passport owner should be extracted.
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
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
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
     * The residential status of the Hong Kong ID. 
     */
    this.residentialStatus = nativeResult.residentialStatus;
    
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
     * Defines if card's residential status should be extracted from Hong Kong ID
     * 
     *  
     */
    this.extractResidentialStatus = true;
    
    /** 
     * Defines if owner's sex should be extracted from Hong Kong ID
     * 
     *  
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new HongKongIdFrontRecognizerResult(nativeResult); }

}

HongKongIdFrontRecognizer.prototype = new Recognizer('HongKongIdFrontRecognizer');

BlinkID.prototype.HongKongIdFrontRecognizer = HongKongIdFrontRecognizer;

/**
 * Result object for IndonesiaIdFrontRecognizer.
 */
function IndonesiaIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the front side of the Indonesia Id owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The blood Type of the front side of the Indonesia Id owner. 
     */
    this.bloodType = nativeResult.bloodType;
    
    /** 
     * The citizenship of the front side of the Indonesia Id owner. 
     */
    this.citizenship = nativeResult.citizenship;
    
    /** 
     * The city of the front side of the Indonesia Id owner. 
     */
    this.city = nativeResult.city;
    
    /** 
     * The date Of Birth of the front side of the Indonesia Id owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date Of Expiry of the front side of the Indonesia Id owner. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date Of Expiry Permanent of the front side of the Indonesia Id owner. 
     */
    this.dateOfExpiryPermanent = nativeResult.dateOfExpiryPermanent;
    
    /** 
     * The district of the front side of the Indonesia Id owner. 
     */
    this.district = nativeResult.district;
    
    /** 
     * The document Number of the front side of the Indonesia Id owner. 
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
     * The kel Desa of the front side of the Indonesia Id owner. 
     */
    this.kelDesa = nativeResult.kelDesa;
    
    /** 
     * The marital Status of the front side of the Indonesia Id owner. 
     */
    this.maritalStatus = nativeResult.maritalStatus;
    
    /** 
     * The name of the front side of the Indonesia Id owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The occupation of the front side of the Indonesia Id owner. 
     */
    this.occupation = nativeResult.occupation;
    
    /** 
     * The place Of Birth of the front side of the Indonesia Id owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The province of the front side of the Indonesia Id owner. 
     */
    this.province = nativeResult.province;
    
    /** 
     * The religion of the front side of the Indonesia Id owner. 
     */
    this.religion = nativeResult.religion;
    
    /** 
     * The rt of the front side of the Indonesia Id owner. 
     */
    this.rt = nativeResult.rt;
    
    /** 
     * The rw of the front side of the Indonesia Id owner. 
     */
    this.rw = nativeResult.rw;
    
    /** 
     * The sex of the front side of the Indonesia Id owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

IndonesiaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.IndonesiaIdFrontRecognizerResult = IndonesiaIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Indonesian national ID cards.
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
     * Defines if address of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if blood type of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractBloodType = true;
    
    /** 
     * Defines if citizenship of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractCitizenship = true;
    
    /** 
     * Defines if city of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractCity = true;
    
    /** 
     * Defines if date of expiry of Indonesian ID card should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if district of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractDistrict = true;
    
    /** 
     * Defines if Kel/Desa of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractKelDesa = true;
    
    /** 
     * Defines if marital status of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractMaritalStatus = true;
    
    /** 
     * Defines if name of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if occupation of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractOccupation = true;
    
    /** 
     * Defines if place of birth of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if religion of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractReligion = true;
    
    /** 
     * Defines if RT number of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractRt = true;
    
    /** 
     * Defines if RW number of Indonesian ID owner should be extracted.
     * 
     *  
     */
    this.extractRw = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new IndonesiaIdFrontRecognizerResult(nativeResult); }

}

IndonesiaIdFrontRecognizer.prototype = new Recognizer('IndonesiaIdFrontRecognizer');

BlinkID.prototype.IndonesiaIdFrontRecognizer = IndonesiaIdFrontRecognizer;

/**
 * Result object for IrelandDlFrontRecognizer.
 */
function IrelandDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the front side of the Ireland Dl owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date Of Birth of the front side of the Ireland Dl owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date Of Expiry of the front side of the Ireland Dl owner. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date Of Issue of the front side of the Ireland Dl owner. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The driver Number of the front side of the Ireland Dl owner. 
     */
    this.driverNumber = nativeResult.driverNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first Name of the front side of the Ireland Dl owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issued By of the front side of the Ireland Dl owner. 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * The licence Categories of the front side of the Ireland Dl owner. 
     */
    this.licenceCategories = nativeResult.licenceCategories;
    
    /** 
     * The licence Number of the front side of the Ireland Dl owner. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * The place Of Birth of the front side of the Ireland Dl owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of the front side of the Ireland Dl owner. 
     */
    this.surname = nativeResult.surname;
    
}

IrelandDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.IrelandDlFrontRecognizerResult = IrelandDlFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Ireland drivers license.
 */
function IrelandDlFrontRecognizer() {
    Recognizer.call(this, 'IrelandDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address of Ireland DL owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of birth of Ireland DL owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry of Ireland DL should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Ireland DL should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if first name of Ireland DL owner should be extracted.
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if issuing authority of Ireland DL should be extracted.
     * 
     *  
     */
    this.extractIssuedBy = true;
    
    /** 
     * Defines if licence categories of Ireland DL should be extracted.
     * 
     *  
     */
    this.extractLicenceCategories = true;
    
    /** 
     * Defines if licence number of Ireland DL should be extracted.
     * 
     *  
     */
    this.extractLicenceNumber = true;
    
    /** 
     * Defines if place of birth of Ireland DL owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if surname of Ireland DL owner should be extracted.
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
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new IrelandDlFrontRecognizerResult(nativeResult); }

}

IrelandDlFrontRecognizer.prototype = new Recognizer('IrelandDlFrontRecognizer');

BlinkID.prototype.IrelandDlFrontRecognizer = IrelandDlFrontRecognizer;

/**
 * Result object for ItalyDlFrontRecognizer.
 */
function ItalyDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the front side of the Italy Dl owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date Of Birth of the front side of the Italy Dl owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date Of Expiry of the front side of the Italy Dl owner. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date Of Issue of the front side of the Italy Dl owner. 
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
     * The given Name of the front side of the Italy Dl owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * The issuing Authority of the front side of the Italy Dl owner. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The licence Categories of the front side of the Italy Dl owner. 
     */
    this.licenceCategories = nativeResult.licenceCategories;
    
    /** 
     * The licence Number of the front side of the Italy Dl owner. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * The place Of Birth of the front side of the Italy Dl owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of the front side of the Italy Dl owner. 
     */
    this.surname = nativeResult.surname;
    
}

ItalyDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.ItalyDlFrontRecognizerResult = ItalyDlFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Italian driver licence.
 */
function ItalyDlFrontRecognizer() {
    Recognizer.call(this, 'ItalyDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address of Italian DL owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of birth of Italian DL owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry of Italian DL card should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Italian DL card should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if given name of Italian DL owner should be extracted.
     * 
     *  
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if issuing authority of Italian DL card should be extracted.
     * 
     *  
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if licence categories of Italian DL owner should be extracted.
     * 
     *  
     */
    this.extractLicenceCategories = true;
    
    /** 
     * Defines if place of birth of Italian DL owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if surname of Italian DL owner should be extracted.
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
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new ItalyDlFrontRecognizerResult(nativeResult); }

}

ItalyDlFrontRecognizer.prototype = new Recognizer('ItalyDlFrontRecognizer');

BlinkID.prototype.ItalyDlFrontRecognizer = ItalyDlFrontRecognizer;

/**
 * Result object for JordanCombinedRecognizer.
 */
function JordanCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of the Jordan ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Jordan ID card. 
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
     * The document number of the Jordan ID card. 
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
     * The issuing authority of the Jordan ID card. 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * Determines if all check digits inside MRZ are correct 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The name of the Jordan ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The national number of the Jordan ID card. 
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
     * The sex of the Jordan ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

JordanCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.JordanCombinedRecognizerResult = JordanCombinedRecognizerResult;

/**
 * Recognizer which can scan front and back side of Jordan national ID cards.
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
     * Defines if date of birth of Jordan ID owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if full name of the Jordan ID owner should be extracted.
     * 
     *  
     */
    this.extractFullName = true;
    
    /** 
     * Defines if name of Jordan ID owner should be extracted.
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if sex of Jordan ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
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
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The full name of the Jordan ID owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
}

JordanIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.JordanIdBackRecognizerResult = JordanIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of Jordan ID cards.
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
     * Defines if full name of the Jordan ID owner should be extracted.
     * 
     *  
     */
    this.extractFullName = true;
    
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
     * The date of birth of the Jordan ID owner. 
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
     * The name of the Jordan ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The national number of the Jordan ID. 
     */
    this.nationalNumber = nativeResult.nationalNumber;
    
    /** 
     * The sex of the Jordan ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

JordanIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.JordanIdFrontRecognizerResult = JordanIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Jordan national ID cards.
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
     * Defines if date of birth of Jordan ID owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if name of Jordan ID owner should be extracted.
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if sex of Jordan ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new JordanIdFrontRecognizerResult(nativeResult); }

}

JordanIdFrontRecognizer.prototype = new Recognizer('JordanIdFrontRecognizer');

BlinkID.prototype.JordanIdFrontRecognizer = JordanIdFrontRecognizer;

/**
 * Result object for KuwaitIdBackRecognizer.
 */
function KuwaitIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The data extracted from the machine readable zone 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The serial number of Kuwait ID 
     */
    this.serialNo = nativeResult.serialNo;
    
}

KuwaitIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.KuwaitIdBackRecognizerResult = KuwaitIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of Kuwait national ID cards.
 */
function KuwaitIdBackRecognizer() {
    Recognizer.call(this, 'KuwaitIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if serial number of Kuwait ID should be extracted
     * 
     *  
     */
    this.extractSerialNo = true;
    
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
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new KuwaitIdBackRecognizerResult(nativeResult); }

}

KuwaitIdBackRecognizer.prototype = new Recognizer('KuwaitIdBackRecognizer');

BlinkID.prototype.KuwaitIdBackRecognizer = KuwaitIdBackRecognizer;

/**
 * Result object for KuwaitIdFrontRecognizer.
 */
function KuwaitIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The birth Date of the front side of the Kuroom wait Id owner. 
     */
    this.birthDate = nativeResult.birthDate != null ? new Date(nativeResult.birthDate) : null;
    
    /** 
     * The civil Id Number of the front side of the Kuwait Id owner. 
     */
    this.civilIdNumber = nativeResult.civilIdNumber;
    
    /** 
     * The expiry Date of the front side of the Kuwait Id owner. 
     */
    this.expiryDate = nativeResult.expiryDate != null ? new Date(nativeResult.expiryDate) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The name of the front side of the Kuwait Id owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The nationality of the front side of the Kuwait Id owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The sex of the front side of the Kuwait Id owner. 
     */
    this.sex = nativeResult.sex;
    
}

KuwaitIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.KuwaitIdFrontRecognizerResult = KuwaitIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Kuwait national ID cards.
 */
function KuwaitIdFrontRecognizer() {
    Recognizer.call(this, 'KuwaitIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of birth of Kuwait ID owner should be extracted.
     * 
     *  
     */
    this.extractBirthDate = true;
    
    /** 
     * Defines if name of Kuwait ID owner should be extracted.
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if nationality of Kuwait ID owner should be extracted.
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if sex of Kuwait ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new KuwaitIdFrontRecognizerResult(nativeResult); }

}

KuwaitIdFrontRecognizer.prototype = new Recognizer('KuwaitIdFrontRecognizer');

BlinkID.prototype.KuwaitIdFrontRecognizer = KuwaitIdFrontRecognizer;

/**
 * Result object for MalaysiaDlFrontRecognizer.
 */
function MalaysiaDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The city of the front side of the Malaysia Dl owner. 
     */
    this.city = nativeResult.city;
    
    /** 
     * The dl Class of the front side of the Malaysia Dl owner. 
     */
    this.dlClass = nativeResult.dlClass;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The full Address of the front side of the Malaysia Dl owner. 
     */
    this.fullAddress = nativeResult.fullAddress;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The identity Number of the front side of the Malaysia Dl owner. 
     */
    this.identityNumber = nativeResult.identityNumber;
    
    /** 
     * The name of the front side of the Malaysia Dl owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The nationality of the front side of the Malaysia Dl owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The owner State of the front side of the Malaysia Dl owner. 
     */
    this.ownerState = nativeResult.ownerState;
    
    /** 
     * The street of the front side of the Malaysia Dl owner. 
     */
    this.street = nativeResult.street;
    
    /** 
     * The valid From of the front side of the Malaysia Dl owner. 
     */
    this.validFrom = nativeResult.validFrom != null ? new Date(nativeResult.validFrom) : null;
    
    /** 
     * The valid Until of the front side of the Malaysia Dl owner. 
     */
    this.validUntil = nativeResult.validUntil != null ? new Date(nativeResult.validUntil) : null;
    
    /** 
     * The zipcode of the front side of the Malaysia Dl owner. 
     */
    this.zipcode = nativeResult.zipcode;
    
}

MalaysiaDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MalaysiaDlFrontRecognizerResult = MalaysiaDlFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Malaysian DL cards.
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
     * Defines if address of Malaysian DL owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if vehicle classes of Malaysian DL should be extracted.
     * 
     *  
     */
    this.extractClass = true;
    
    /** 
     * Defines if name of Malaysian DL owner should be extracted.
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if nationality of Malaysian DL owner should be extracted.
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if date of issue of Malaysian DL should be extracted.
     * 
     *  
     */
    this.extractValidFrom = true;
    
    /** 
     * Defines if date of expiry of Malaysian DL should be extracted.
     * 
     *  
     */
    this.extractValidUntil = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new MalaysiaDlFrontRecognizerResult(nativeResult); }

}

MalaysiaDlFrontRecognizer.prototype = new Recognizer('MalaysiaDlFrontRecognizer');

BlinkID.prototype.MalaysiaDlFrontRecognizer = MalaysiaDlFrontRecognizer;

/**
 * Result object for MalaysiaIkadFrontRecognizer.
 */
function MalaysiaIkadFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * Address of Malaysian iKad owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of birth of Malaysian iKad owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * Date of expiry of Malaysian iKad card. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * Employer of Malaysian iKad owner. 
     */
    this.employer = nativeResult.employer;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * Faculty address in which Malaysian iKad owner currently studies. 
     */
    this.facultyAddress = nativeResult.facultyAddress;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * Gender of Malaysian iKad owner. 
     */
    this.gender = nativeResult.gender;
    
    /** 
     * The name of Malaysian iKad owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * Nationality of Malaysian iKad owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The passport number of Malaysian iKad owners passport. 
     */
    this.passportNumber = nativeResult.passportNumber;
    
    /** 
     * Sector in which Malaysian iKad owner works. 
     */
    this.sector = nativeResult.sector;
    
}

MalaysiaIkadFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MalaysiaIkadFrontRecognizerResult = MalaysiaIkadFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Malaysia iKad card.
 */
function MalaysiaIkadFrontRecognizer() {
    Recognizer.call(this, 'MalaysiaIkadFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address of Malaysian iKad owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of expiry of Malaysian iKad card should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if employer of Malaysian iKad owner should be extracted.
     * 
     *  
     */
    this.extractEmployer = true;
    
    /** 
     * Defines if address of faculty, in which Malaysian iKad owner currently studies, should be extracted.
     * 
     *  
     */
    this.extractFacultyAddress = true;
    
    /** 
     * Defines if gender of Malaysian iKad owner should be extracted.
     * 
     *  
     */
    this.extractGender = true;
    
    /** 
     * Defines if (full) name of Malaysian iKad owner should be extracted.
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if nationality of Malaysian iKad owner should be extracted.
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if passport number of Malaysian iKad owners passport should be extracted.
     * 
     *  
     */
    this.extractPassportNumber = true;
    
    /** 
     * Defines if sector in which  Malaysian iKad owner works should be extracted.
     * 
     *  
     */
    this.extractSector = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new MalaysiaIkadFrontRecognizerResult(nativeResult); }

}

MalaysiaIkadFrontRecognizer.prototype = new Recognizer('MalaysiaIkadFrontRecognizer');

BlinkID.prototype.MalaysiaIkadFrontRecognizer = MalaysiaIkadFrontRecognizer;

/**
 * Result object for MalaysiaMyKadBackRecognizer.
 */
function MalaysiaMyKadBackRecognizerResult(nativeResult) {
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
     * The old NRIC of the MyKad owner. 
     */
    this.oldNric = nativeResult.oldNric;
    
}

MalaysiaMyKadBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MalaysiaMyKadBackRecognizerResult = MalaysiaMyKadBackRecognizerResult;

/**
 * Class for configuring Kad Back Recognizer.
 * 
 * MyKadBack recognizer is used for scanning back side of MyKad.
 */
function MalaysiaMyKadBackRecognizer() {
    Recognizer.call(this, 'MalaysiaMyKadBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if old NRIC should be extracted from back side of the MyKad
     * 
     *  
     */
    this.extractOldNric = true;
    
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
     * Sets whether full document image of ID card should be extracted.
     * 
     *  
     */
    this.returnFullDocumentImage = false;
    
    this.createResultFromNative = function (nativeResult) { return new MalaysiaMyKadBackRecognizerResult(nativeResult); }

}

MalaysiaMyKadBackRecognizer.prototype = new Recognizer('MalaysiaMyKadBackRecognizer');

BlinkID.prototype.MalaysiaMyKadBackRecognizer = MalaysiaMyKadBackRecognizer;

/**
 * Result object for MalaysiaMyKadFrontRecognizer.
 */
function MalaysiaMyKadFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The birth date of Malaysian MyKad owner. 
     */
    this.birthDate = nativeResult.birthDate != null ? new Date(nativeResult.birthDate) : null;
    
    /** 
     * The city of Malaysian MyKad owner. 
     */
    this.city = nativeResult.city;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The address of Malaysian MyKad owner. 
     */
    this.fullAddress = nativeResult.fullAddress;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The full name of Malaysian MyKad owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The nric of Malaysian IDMyKad 
     */
    this.nric = nativeResult.nric;
    
    /** 
     * The state of Malaysian MyKad owner. 
     */
    this.ownerState = nativeResult.ownerState;
    
    /** 
     * The religion of Malaysian MyKad owner. 
     */
    this.religion = nativeResult.religion;
    
    /** 
     * The sex of Malaysian MyKad owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The street of Malaysian MyKad owner. 
     */
    this.street = nativeResult.street;
    
    /** 
     * The zipcode of Malaysian MyKad owner. 
     */
    this.zipcode = nativeResult.zipcode;
    
}

MalaysiaMyKadFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MalaysiaMyKadFrontRecognizerResult = MalaysiaMyKadFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Malaysian MyKad cards.
 */
function MalaysiaMyKadFrontRecognizer() {
    Recognizer.call(this, 'MalaysiaMyKadFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if full name and address of Malaysian MyKad owner should be extracted.
     * 
     *  
     */
    this.extractFullNameAndAddress = true;
    
    /** 
     * Defines if religion of Malaysian MyKad owner should be extracted.
     * 
     *  
     */
    this.extractReligion = true;
    
    /** 
     * Defines if sex of Malaysian MyKad owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new MalaysiaMyKadFrontRecognizerResult(nativeResult); }

}

MalaysiaMyKadFrontRecognizer.prototype = new Recognizer('MalaysiaMyKadFrontRecognizer');

BlinkID.prototype.MalaysiaMyKadFrontRecognizer = MalaysiaMyKadFrontRecognizer;

/**
 * Result object for MalaysiaMyKasFrontRecognizer.
 */
function MalaysiaMyKasFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The birth date of Malaysian MyKAS owner. 
     */
    this.birthDate = nativeResult.birthDate != null ? new Date(nativeResult.birthDate) : null;
    
    /** 
     * The city of Malaysian MyKAS owner. 
     */
    this.city = nativeResult.city;
    
    /** 
     * The date of expiry of Malaysian MyKAS. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The address of Malaysian MyKAS owner. 
     */
    this.fullAddress = nativeResult.fullAddress;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The full name of Malaysian MyKAS owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The nric of Malaysian MyKAS. 
     */
    this.nric = nativeResult.nric;
    
    /** 
     * The state of Malaysian MyKAS owner. 
     */
    this.ownerState = nativeResult.ownerState;
    
    /** 
     * The religion of Malaysian MyKAS owner. 
     */
    this.religion = nativeResult.religion;
    
    /** 
     * The sex of Malaysian MyKAS owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The street of Malaysian MyKAS owner. 
     */
    this.street = nativeResult.street;
    
    /** 
     * The zipcode of Malaysian MyKAS owner. 
     */
    this.zipcode = nativeResult.zipcode;
    
}

MalaysiaMyKasFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MalaysiaMyKasFrontRecognizerResult = MalaysiaMyKasFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Malaysian MyKAS cards.
 */
function MalaysiaMyKasFrontRecognizer() {
    Recognizer.call(this, 'MalaysiaMyKasFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if full name and address of Malaysian MyKAS owner should be extracted.
     * 
     *  
     */
    this.extractFullNameAndAddress = true;
    
    /** 
     * Defines if religion of Malaysian MyKAS owner should be extracted.
     * 
     *  
     */
    this.extractReligion = true;
    
    /** 
     * Defines if sex of Malaysian MyKAS owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new MalaysiaMyKasFrontRecognizerResult(nativeResult); }

}

MalaysiaMyKasFrontRecognizer.prototype = new Recognizer('MalaysiaMyKasFrontRecognizer');

BlinkID.prototype.MalaysiaMyKasFrontRecognizer = MalaysiaMyKasFrontRecognizer;

/**
 * Result object for MalaysiaMyPrFrontRecognizer.
 */
function MalaysiaMyPrFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The birth date of Malaysian MyPR owner. 
     */
    this.birthDate = nativeResult.birthDate != null ? new Date(nativeResult.birthDate) : null;
    
    /** 
     * The city of Malaysian MyPR owner. 
     */
    this.city = nativeResult.city;
    
    /** 
     * The country code of Malaysian MyPR owner. 
     */
    this.countryCode = nativeResult.countryCode;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The address of Malaysian MyPR owner. 
     */
    this.fullAddress = nativeResult.fullAddress;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The full name of Malaysian MyPR owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The nric of Malaysian MyPR. 
     */
    this.nric = nativeResult.nric;
    
    /** 
     * The state of Malaysian MyPR owner. 
     */
    this.ownerState = nativeResult.ownerState;
    
    /** 
     * The religion of Malaysian MyPR owner. 
     */
    this.religion = nativeResult.religion;
    
    /** 
     * The sex of Malaysian MyPR owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The street of Malaysian MyPR owner. 
     */
    this.street = nativeResult.street;
    
    /** 
     * The zipcode of Malaysian MyPR owner. 
     */
    this.zipcode = nativeResult.zipcode;
    
}

MalaysiaMyPrFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MalaysiaMyPrFrontRecognizerResult = MalaysiaMyPrFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Malaysian MyPR cards.
 */
function MalaysiaMyPrFrontRecognizer() {
    Recognizer.call(this, 'MalaysiaMyPrFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if full name and address of Malaysian MyPR owner should be extracted.
     * 
     *  
     */
    this.extractFullNameAndAddress = true;
    
    /** 
     * Defines if religion of Malaysian MyPR owner should be extracted.
     * 
     *  
     */
    this.extractReligion = true;
    
    /** 
     * Defines if sex of Malaysian MyPR owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new MalaysiaMyPrFrontRecognizerResult(nativeResult); }

}

MalaysiaMyPrFrontRecognizer.prototype = new Recognizer('MalaysiaMyPrFrontRecognizer');

BlinkID.prototype.MalaysiaMyPrFrontRecognizer = MalaysiaMyPrFrontRecognizer;

/**
 * Result object for MalaysiaMyTenteraFrontRecognizer.
 */
function MalaysiaMyTenteraFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The army number of Malaysian MyTentera owner. 
     */
    this.armyNumber = nativeResult.armyNumber;
    
    /** 
     * The birth date of Malaysian MyTentera owner. 
     */
    this.birthDate = nativeResult.birthDate != null ? new Date(nativeResult.birthDate) : null;
    
    /** 
     * The city of Malaysian MyTentera owner. 
     */
    this.city = nativeResult.city;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The address of Malaysian MyTentera owner. 
     */
    this.fullAddress = nativeResult.fullAddress;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The full name of Malaysian MyTentera owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The nric of Malaysian MyTentera. 
     */
    this.nric = nativeResult.nric;
    
    /** 
     * The state of Malaysian MyTentera owner. 
     */
    this.ownerState = nativeResult.ownerState;
    
    /** 
     * The religion of Malaysian MyTentera owner. 
     */
    this.religion = nativeResult.religion;
    
    /** 
     * The sex of Malaysian MyTentera owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The street of Malaysian MyTentera owner. 
     */
    this.street = nativeResult.street;
    
    /** 
     * The zipcode of Malaysian MyTentera owner. 
     */
    this.zipcode = nativeResult.zipcode;
    
}

MalaysiaMyTenteraFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MalaysiaMyTenteraFrontRecognizerResult = MalaysiaMyTenteraFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Malaysian MyTentera cards.
 */
function MalaysiaMyTenteraFrontRecognizer() {
    Recognizer.call(this, 'MalaysiaMyTenteraFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if full name and address of Malaysian MyTentera owner should be extracted.
     * 
     *  
     */
    this.extractFullNameAndAddress = true;
    
    /** 
     * Defines if religion of Malaysian MyTentera owner should be extracted.
     * 
     *  
     */
    this.extractReligion = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new MalaysiaMyTenteraFrontRecognizerResult(nativeResult); }

}

MalaysiaMyTenteraFrontRecognizer.prototype = new Recognizer('MalaysiaMyTenteraFrontRecognizer');

BlinkID.prototype.MalaysiaMyTenteraFrontRecognizer = MalaysiaMyTenteraFrontRecognizer;

/**
 * Result object for MexicoVoterIdFrontRecognizer.
 */
function MexicoVoterIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of Mexico Voter ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The CURP of Mexico Voter ID owner. 
     */
    this.curp = nativeResult.curp;
    
    /** 
     * The date of birth of Mexico Voter ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The elector key of Mexico Voter ID owner. 
     */
    this.electorKey = nativeResult.electorKey;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The full name of Mexico Voter ID owner. 
     */
    this.fullName = nativeResult.fullName;
    
    /** 
     * The sex of Mexico Voter ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
}

MexicoVoterIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MexicoVoterIdFrontRecognizerResult = MexicoVoterIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Mexican voter id.
 */
function MexicoVoterIdFrontRecognizer() {
    Recognizer.call(this, 'MexicoVoterIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if address of Mexico Voter ID owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if CURP of Mexico Voter ID owner should be extracted.
     * 
     *  
     */
    this.extractCurp = true;
    
    /** 
     * Defines if full name of Mexico Voter ID owner should be extracted.
     * 
     *  
     */
    this.extractFullName = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new MexicoVoterIdFrontRecognizerResult(nativeResult); }

}

MexicoVoterIdFrontRecognizer.prototype = new Recognizer('MexicoVoterIdFrontRecognizer');

BlinkID.prototype.MexicoVoterIdFrontRecognizer = MexicoVoterIdFrontRecognizer;

/**
 * Result object for MoroccoIdBackRecognizer.
 */
function MoroccoIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the Morocco ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The civil status number of the Morocco ID owner. 
     */
    this.civilStatusNumber = nativeResult.civilStatusNumber;
    
    /** 
     * The date of expiry of the Morocco ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document number of the Morocco ID. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * The father's name of the Morocco ID owner. 
     */
    this.fathersName = nativeResult.fathersName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The mother's name of the Morocco ID owner. 
     */
    this.mothersName = nativeResult.mothersName;
    
    /** 
     * The sex of the Morocco ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

MoroccoIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MoroccoIdBackRecognizerResult = MoroccoIdBackRecognizerResult;

/**
 * Class for configuring Morocco ID Back Recognizer.
 * 
 * Morocco ID Back recognizer is used for scanning Back side of the Morocco ID.
 */
function MoroccoIdBackRecognizer() {
    Recognizer.call(this, 'MoroccoIdBackRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's address should be extracted from Back side of the Morocco ID
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if owner's civil status number should be extracted from Back side of the Morocco ID
     * 
     *  
     */
    this.extractCivilStatusNumber = true;
    
    /** 
     * Defines if date of expiry should be extracted from Back side of the Morocco ID
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if father's name should be extracted from Back side of the Morocco ID
     * 
     *  
     */
    this.extractFathersName = true;
    
    /** 
     * Defines if mother's name should be extracted from Back side of the Morocco ID
     * 
     *  
     */
    this.extractMothersName = true;
    
    /** 
     * Defines if owner's sex should be extracted from Back side of the Morocco ID
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
    
    this.createResultFromNative = function (nativeResult) { return new MoroccoIdBackRecognizerResult(nativeResult); }

}

MoroccoIdBackRecognizer.prototype = new Recognizer('MoroccoIdBackRecognizer');

BlinkID.prototype.MoroccoIdBackRecognizer = MoroccoIdBackRecognizer;

/**
 * Result object for MoroccoIdFrontRecognizer.
 */
function MoroccoIdFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of the Morocco ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Morocco ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document number of the Morocco ID. 
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
     * The name of the Morocco ID owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The place of birth of the Morocco ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The sex of the Morocco ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of the Morocco ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

MoroccoIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.MoroccoIdFrontRecognizerResult = MoroccoIdFrontRecognizerResult;

/**
 * Class for configuring Morocco ID Front Recognizer.
 * 
 * Morocco ID Front recognizer is used for scanning front side of the Morocco ID.
 */
function MoroccoIdFrontRecognizer() {
    Recognizer.call(this, 'MoroccoIdFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's date of birth should be extracted from front side of the Morocco ID
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from front side of the Morocco ID
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if owner's name should be extracted from front side of the Morocco ID
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if owner's place of birth should be extracted from front side of the Morocco ID
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if owner's sex should be extracted from front side of the Morocco ID
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if owner's surname should be extracted from front side of the Morocco ID
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
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new MoroccoIdFrontRecognizerResult(nativeResult); }

}

MoroccoIdFrontRecognizer.prototype = new Recognizer('MoroccoIdFrontRecognizer');

BlinkID.prototype.MoroccoIdFrontRecognizer = MoroccoIdFrontRecognizer;

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
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The last name of the New Zealand Driver License owner. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The last name of the New Zealand Driver License owner. 
     */
    this.donorIndicator = nativeResult.donorIndicator;
    
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
     * Defines if card's expiry date should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if card's issue date should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if owner's donor indicator should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractDonorIndicator = true;
    
    /** 
     * Defines if owner's first name should be extracted from New Zealand Driver License
     * 
     *  
     */
    this.extractFirstNames = true;
    
    /** 
     * Defines if owner's last name should be extracted from New Zealand Driver License
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
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new NewZealandDlFrontRecognizerResult(nativeResult); }

}

NewZealandDlFrontRecognizer.prototype = new Recognizer('NewZealandDlFrontRecognizer');

BlinkID.prototype.NewZealandDlFrontRecognizer = NewZealandDlFrontRecognizer;

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
     * The date of birth of the Poland ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Poland ID card. 
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
     * The document number of the Poland ID card. 
     */
    this.documentNumber = nativeResult.documentNumber;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The family name of the Poland ID owner. 
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
     * The given names of the Poland ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * The issuing authority of the Poland ID card. 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * Determines if all check digits inside MRZ are correct 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The nationality of the Poland ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The parents given names of the Poland ID owner. 
     */
    this.parentsGivenNames = nativeResult.parentsGivenNames;
    
    /** 
     * The personal number of the Poland ID owner. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Poland ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The surname of the Poland ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

PolandCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.PolandCombinedRecognizerResult = PolandCombinedRecognizerResult;

/**
 * Recognizer which can scan front and back side of Poland national ID cards.
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
     * Defines if date of birth of Poland ID owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if family name of Poland ID owner should be extracted.
     * 
     *  
     */
    this.extractFamilyName = false;
    
    /** 
     * Defines if given names of Poland ID owner should be extracted.
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if parents given names of Poland ID owner should be extracted.
     * 
     *  
     */
    this.extractParentsGivenNames = false;
    
    /** 
     * Defines if sex of Poland ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if surname of Poland ID owner should be extracted.
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
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
}

PolandIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.PolandIdBackRecognizerResult = PolandIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of Poland ID cards.
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
     * The date of birth of the Poland ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The family name of the Poland ID owner. 
     */
    this.familyName = nativeResult.familyName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The given names of the Poland ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * The parents given names of the Poland ID owner. 
     */
    this.parentsGivenNames = nativeResult.parentsGivenNames;
    
    /** 
     * The sex of the Poland ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The surname of the Poland ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

PolandIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.PolandIdFrontRecognizerResult = PolandIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Poland ID cards.
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
     * Defines if date of birth of Poland ID owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if family name of Poland ID owner should be extracted.
     * 
     *  
     */
    this.extractFamilyName = false;
    
    /** 
     * Defines if given names of Poland ID owner should be extracted.
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if parents given names of Poland ID owner should be extracted.
     * 
     *  
     */
    this.extractParentsGivenNames = false;
    
    /** 
     * Defines if sex of Poland ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if surname of Poland ID owner should be extracted.
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
     * The address of Romania ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The date of expiry of Romania ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Romania ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of Romania ID owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issuing authority of Romania ID. 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The nationality of Romania ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The parent name of Romania ID owner. 
     */
    this.parentName = nativeResult.parentName;
    
    /** 
     * The place of birth of Romania ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The sex of Romania ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The surname of Romania ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

RomaniaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.RomaniaIdFrontRecognizerResult = RomaniaIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Romania ID.
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
     * Defines if address of Romania ID owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of expiry of Romania ID should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Romania ID should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if first name of Romania ID owner should be extracted.
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if issuing authority of Romania ID should be extracted.
     * 
     *  
     */
    this.extractIssuedBy = true;
    
    /** 
     * Defines if place of birth of Romania ID owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if sex of Romania ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if surname of Romania ID owner should be extracted.
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
    
    this.createResultFromNative = function (nativeResult) { return new RomaniaIdFrontRecognizerResult(nativeResult); }

}

RomaniaIdFrontRecognizer.prototype = new Recognizer('RomaniaIdFrontRecognizer');

BlinkID.prototype.RomaniaIdFrontRecognizer = RomaniaIdFrontRecognizer;

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
 * Result object for SingaporeChangiEmployeeIdRecognizer.
 */
function SingaporeChangiEmployeeIdRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * TThe company name of the Singapore Changi employee ID owner. 
     */
    this.companyName = nativeResult.companyName;
    
    /** 
     * The date of expiry of Singapore Changi employee ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The document number of the Singapore Changi employee ID. 
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
     * The name of the Singapore Changi employee ID owner. 
     */
    this.name = nativeResult.name;
    
}

SingaporeChangiEmployeeIdRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SingaporeChangiEmployeeIdRecognizerResult = SingaporeChangiEmployeeIdRecognizerResult;

/**
 * Class for configuring Singapore Changi Employee Id Recognizer.
 * 
 * Singapore Changi Employee Id recognizer is used for scanning front side of the Singapore Driver's license..
 */
function SingaporeChangiEmployeeIdRecognizer() {
    Recognizer.call(this, 'SingaporeChangiEmployeeIdRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if company name should be extracted from the Singapore Changi Employee Id
     * 
     *  
     */
    this.extractCompanyName = true;
    
    /** 
     * Defines if birth of expiry should be extracted from the Singapore Changi Employee Id
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if owner's name should be extracted from the Singapore Changi Employee Id
     * 
     *  
     */
    this.extractName = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new SingaporeChangiEmployeeIdRecognizerResult(nativeResult); }

}

SingaporeChangiEmployeeIdRecognizer.prototype = new Recognizer('SingaporeChangiEmployeeIdRecognizer');

BlinkID.prototype.SingaporeChangiEmployeeIdRecognizer = SingaporeChangiEmployeeIdRecognizer;

/**
 * Result object for SingaporeCombinedRecognizer.
 */
function SingaporeCombinedRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the back side of the Singapore Id owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The address Change Date of the back side of the Singapore Id owner. 
     */
    this.addressChangeDate = nativeResult.addressChangeDate != null ? new Date(nativeResult.addressChangeDate) : null;
    
    /** 
     * The blood Type of the back side of the Singapore Id owner. 
     */
    this.bloodGroup = nativeResult.bloodGroup;
    
    /** 
     * The country/place of birth of the Singaporean ID card owner. 
     */
    this.countryOfBirth = nativeResult.countryOfBirth;
    
    /** 
     * The date of birth of the Singaporean ID card owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date Of Issue of the back side of the Singapore Id owner. 
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
     * The identity card number of the Singaporean ID card. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * The name of the Singaporean ID card owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The race of the Singaporean ID card owner. 
     */
    this.race = nativeResult.race;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Singaporean ID card owner. 
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
     * Defines if owner's address should be extracted from back side of the Singapore Id
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if owner's address change date should be extracted from back side of the Singapore Id
     * 
     *  
     */
    this.extractAddressChangeDate = false;
    
    /** 
     * Defines if owner's blood type should be extracted from back side of the Singapore Id
     * 
     *  
     */
    this.extractBloodGroup = true;
    
    /** 
     *  Defines if country/place of birth of Singaporean ID card owner should be extracted
     * 
     *   
     */
    this.extractCountryOfBirth = true;
    
    /** 
     *  Defines if date of birth of Singaporean ID card owner should be extracted
     * 
     *   
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if owner's date of issue should be extracted from back side of the Singapore Id
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     *  Defines if name of Singaporean ID card owner should be extracted
     * 
     *   
     */
    this.extractName = true;
    
    /** 
     *  Defines if race of Singaporean ID card owner should be extracted
     * 
     *   
     */
    this.extractRace = true;
    
    /** 
     *  Defines if sex of Singaporean ID card owner should be extracted
     * 
     *   
     */
    this.extractSex = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new SingaporeCombinedRecognizerResult(nativeResult); }

}

SingaporeCombinedRecognizer.prototype = new Recognizer('SingaporeCombinedRecognizer');

BlinkID.prototype.SingaporeCombinedRecognizer = SingaporeCombinedRecognizer;

/**
 * Result object for SingaporeDlFrontRecognizer.
 */
function SingaporeDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The birth Date of the Singapore DL owner. 
     */
    this.birthDate = nativeResult.birthDate != null ? new Date(nativeResult.birthDate) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issue date of the Singapore DL. 
     */
    this.issueDate = nativeResult.issueDate != null ? new Date(nativeResult.issueDate) : null;
    
    /** 
     * The licence Number of the Singapore DL. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * The name of the Singapore DL owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The valid till of the Singapore DL. 
     */
    this.validTill = nativeResult.validTill != null ? new Date(nativeResult.validTill) : null;
    
}

SingaporeDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SingaporeDlFrontRecognizerResult = SingaporeDlFrontRecognizerResult;

/**
 * Class for configuring Singapore Dl Front Recognizer.
 * 
 * Singapore Dl Front recognizer is used for scanning front side of the Singapore Driver's license..
 */
function SingaporeDlFrontRecognizer() {
    Recognizer.call(this, 'SingaporeDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's birth date should be extracted from front side of the Singapore DL
     * 
     *  
     */
    this.extractBirthDate = true;
    
    /** 
     * Defines if the issue date should be extracted from front side of the Singapore DL
     * 
     *  
     */
    this.extractIssueDate = true;
    
    /** 
     * Defines if owner's name should be extracted from front side of the Singapore DL
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if valid till should be extracted from front side of the Singapore DL
     * 
     *  
     */
    this.extractValidTill = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new SingaporeDlFrontRecognizerResult(nativeResult); }

}

SingaporeDlFrontRecognizer.prototype = new Recognizer('SingaporeDlFrontRecognizer');

BlinkID.prototype.SingaporeDlFrontRecognizer = SingaporeDlFrontRecognizer;

/**
 * Result object for SingaporeIdBackRecognizer.
 */
function SingaporeIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The address of the back side of the Singapore Id owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The address Change Date of the back side of the Singapore Id owner. 
     */
    this.addressChangeDate = nativeResult.addressChangeDate != null ? new Date(nativeResult.addressChangeDate) : null;
    
    /** 
     * The blood Type of the back side of the Singapore Id owner. 
     */
    this.bloodGroup = nativeResult.bloodGroup;
    
    /** 
     * The card Number of the back side of the Singapore Id owner. 
     */
    this.cardNumber = nativeResult.cardNumber;
    
    /** 
     * The date Of Issue of the back side of the Singapore Id owner. 
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
 * Class for configuring Singapore Id Back Recognizer.
 * 
 * Singapore Id Back recognizer is used for scanning back side of the Singapore Id.
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
     * Defines if owner's address should be extracted from back side of the Singapore Id
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if owner's address change date should be extracted from back side of the Singapore Id
     * 
     *  
     */
    this.extractAddressChangeDate = false;
    
    /** 
     * Defines if owner's blood type should be extracted from back side of the Singapore Id
     * 
     *  
     */
    this.extractBloodGroup = true;
    
    /** 
     * Defines if owner's date of issue should be extracted from back side of the Singapore Id
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
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
     * The country/place of birth of the Singaporean ID card owner. 
     */
    this.countryOfBirth = nativeResult.countryOfBirth;
    
    /** 
     * The date of birth of the Singaporean ID card owner. 
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
     * The identity card number of the Singaporean ID card. 
     */
    this.identityCardNumber = nativeResult.identityCardNumber;
    
    /** 
     * The name of the Singaporean ID card owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The race of the Singaporean ID card owner. 
     */
    this.race = nativeResult.race;
    
    /** 
     * The sex of the Singaporean ID card owner. 
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
     *  Defines if country/place of birth of Singaporean ID card owner should be extracted
     * 
     *   
     */
    this.extractCountryOfBirth = true;
    
    /** 
     *  Defines if date of birth of Singaporean ID card owner should be extracted
     * 
     *   
     */
    this.extractDateOfBirth = true;
    
    /** 
     *  Defines if name of Singaporean ID card owner should be extracted
     * 
     *   
     */
    this.extractName = true;
    
    /** 
     *  Defines if race of Singaporean ID card owner should be extracted
     * 
     *   
     */
    this.extractRace = true;
    
    /** 
     *  Defines if sex of Singaporean ID card owner should be extracted
     * 
     *   
     */
    this.extractSex = true;
    
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
     * The date of birth of the Slovak ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Slovak ID card. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of the Slovak ID card. 
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
     * The document number of the Slovak ID card. 
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
     * The issuing authority of the Slovak ID card. 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * The last name of the Slovak ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * Determines if all check digits inside MRZ are correct 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The nationality of the Slovak ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The personal number of the Slovak ID owner. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
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
     * The special remarks of the Slovak ID owner. 
     */
    this.specialRemarks = nativeResult.specialRemarks;
    
    /** 
     * The surname at birth of the Slovak ID owner. 
     */
    this.surnameAtBirth = nativeResult.surnameAtBirth;
    
}

SlovakiaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SlovakiaCombinedRecognizerResult = SlovakiaCombinedRecognizerResult;

/**
 * Recognizer which can scan front and back side of Slovakia national ID cards.
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
     * Defines if address of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if date of birth of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry of Slovak ID should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Slovak ID should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if document number of Slovak ID should be extracted.
     * 
     *  
     */
    this.extractDocumentNumber = true;
    
    /** 
     * Defines if first name of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if issuing authority of Slovak ID should be extracted.
     * 
     *  
     */
    this.extractIssuedBy = true;
    
    /** 
     * Defines if last name of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractLastName = true;
    
    /** 
     * Defines if nationality of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if place of birth of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if sex of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if special remarks of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractSpecialRemarks = true;
    
    /** 
     * Defines if surname at birth of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractSurnameAtBirth = true;
    
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
     * The address of Slovak ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The place of birth of Slovak ID owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * The special remarks of Slovak ID owner. 
     */
    this.specialRemarks = nativeResult.specialRemarks;
    
    /** 
     * The surname at birth of Slovak ID owner. 
     */
    this.surnameAtBirth = nativeResult.surnameAtBirth;
    
}

SlovakiaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SlovakiaIdBackRecognizerResult = SlovakiaIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of Slovak ID cards.
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
     * Defines if address of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if place of birth of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if special remarks of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractSpecialRemarks = true;
    
    /** 
     * Defines if surname at birth of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractSurnameAtBirth = true;
    
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
     * The date of birth of the Slovak ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Slovak ID card. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of the Slovak ID card. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * The document number of the Slovak ID card. 
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
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issuing authority of the Slovak ID card. 
     */
    this.issuedBy = nativeResult.issuedBy;
    
    /** 
     * The last name of the Slovak ID owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The nationality of the Slovak ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The personal number of the Slovak ID owner. 
     */
    this.personalNumber = nativeResult.personalNumber;
    
    /** 
     * The sex of the Slovak ID owner. 
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
 * Recognizer which can scan front side of Slovak national ID cards.
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
     * Defines if date of birth of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry of Slovak ID should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Slovak ID should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if document number of Slovak ID should be extracted.
     * 
     *  
     */
    this.extractDocumentNumber = true;
    
    /** 
     * Defines if first name of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if issuing authority of Slovak ID should be extracted.
     * 
     *  
     */
    this.extractIssuedBy = true;
    
    /** 
     * Defines if last name of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractLastName = true;
    
    /** 
     * Defines if nationality of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if sex of Slovak ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
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
     * The address of the Slovenia ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The administrative unit of the Slovenia ID card. 
     */
    this.administrativeUnit = nativeResult.administrativeUnit;
    
    /** 
     * The date of birth of the Slovenia ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of the Slovenia ID card. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of the Slovenia ID card. 
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
     * The document number of the Slovenia ID card. 
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
     * The given names of the Slovenia ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * Determines if all check digits inside MRZ are correct 
     */
    this.mrzVerified = nativeResult.mrzVerified;
    
    /** 
     * The nationality of the Slovenia ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The pin of the Slovenia ID owner. 
     */
    this.pin = nativeResult.pin;
    
    /** 
     * Returns true if recognizer has finished scanning first side and is now scanning back side,
     * false if it's still scanning first side. 
     */
    this.scanningFirstSideDone = nativeResult.scanningFirstSideDone;
    
    /** 
     * The sex of the Slovenia ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of the Slovenia ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

SloveniaCombinedRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SloveniaCombinedRecognizerResult = SloveniaCombinedRecognizerResult;

/**
 * Recognizer which can scan front and back side of Slovenia national ID cards.
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
     * Defines if address of Slovenian ID owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if issuing administrative unit of Slovenian ID should be extracted.
     * 
     *  
     */
    this.extractAdministrativeUnit = true;
    
    /** 
     * Defines if date of expiry of Slovenian ID card should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Slovenian ID should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if given names of Slovenian ID owner should be extracted.
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if nationality of Slovenian ID owner should be extracted.
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if sex of Slovenian ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if surname of Slovenian ID owner should be extracted.
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
    
    /** 
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
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
     * The address of Slovenian ID owner. 
     */
    this.address = nativeResult.address;
    
    /** 
     * The issuing administrative unit of Slovenian ID. 
     */
    this.administrativeUnit = nativeResult.administrativeUnit;
    
    /** 
     * The date of issue of Slovenian ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
}

SloveniaIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SloveniaIdBackRecognizerResult = SloveniaIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of Slovenia ID.
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
     * Defines if address of Slovenian ID owner should be extracted.
     * 
     *  
     */
    this.extractAddress = true;
    
    /** 
     * Defines if issuing administrative unit of Slovenian ID should be extracted.
     * 
     *  
     */
    this.extractAdministrativeUnit = true;
    
    /** 
     * Defines if date of issue of Slovenian ID should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
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
     * The date of birth of Slovenian ID owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Slovenian ID card. 
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
     * The given names of Slovenian ID owner. 
     */
    this.givenNames = nativeResult.givenNames;
    
    /** 
     * The nationality of Slovenian ID owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The sex of Slovenian ID owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of Slovenian ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

SloveniaIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SloveniaIdFrontRecognizerResult = SloveniaIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Slovenia ID.
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
     * Defines if date of expiry of Slovenian ID card should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if given names of Slovenian ID owner should be extracted.
     * 
     *  
     */
    this.extractGivenNames = true;
    
    /** 
     * Defines if nationality of Slovenian ID owner should be extracted.
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if sex of Slovenian ID owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if surname of Slovenian ID owner should be extracted.
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
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new SloveniaIdFrontRecognizerResult(nativeResult); }

}

SloveniaIdFrontRecognizer.prototype = new Recognizer('SloveniaIdFrontRecognizer');

BlinkID.prototype.SloveniaIdFrontRecognizer = SloveniaIdFrontRecognizer;

/**
 * Result object for SpainDlFrontRecognizer.
 */
function SpainDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of Spain DL owner 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Spain DL owner 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issuing authority of the Spain DL 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The licence categories of the Spain DL 
     */
    this.licenceCategories = nativeResult.licenceCategories;
    
    /** 
     * The licence number of the Spain DL 
     */
    this.number = nativeResult.number;
    
    /** 
     * The place of birth of Spain DL owner 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of the Spain DL owner 
     */
    this.surname = nativeResult.surname;
    
    /** 
     * The date of issue of Spain DL 
     */
    this.validFrom = nativeResult.validFrom != null ? new Date(nativeResult.validFrom) : null;
    
    /** 
     * The date of expiry of Spain DL 
     */
    this.validUntil = nativeResult.validUntil != null ? new Date(nativeResult.validUntil) : null;
    
}

SpainDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SpainDlFrontRecognizerResult = SpainDlFrontRecognizerResult;

/**
 * Spain Driver's License Front Recognizer.
 * 
 * Recognizer which can scan front side of Spain national DL cards
 */
function SpainDlFrontRecognizer() {
    Recognizer.call(this, 'SpainDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     *  Defines if date of birth of Spain DL owner should be extracted
     * 
     *   
     */
    this.extractDateOfBirth = true;
    
    /** 
     *  Defines if first name of Spain DL owner should be extracted
     * 
     *   
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if issuing authority of Spain DL should be extracted
     * 
     *  
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if licence categories of Spain DL should be extracted
     * 
     *  
     */
    this.extractLicenceCategories = true;
    
    /** 
     *  Defines if place of birth of Spain DL owner should be extracted
     * 
     *   
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     *  Defines if surname of Spain DL owner should be extracted
     * 
     *   
     */
    this.extractSurname = true;
    
    /** 
     * Defines if date of issue of Spain DL should be extracted
     * 
     *  
     */
    this.extractValidFrom = true;
    
    /** 
     * Defines if date of expiry of Spain DL should be extracted
     * 
     *  
     */
    this.extractValidUntil = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new SpainDlFrontRecognizerResult(nativeResult); }

}

SpainDlFrontRecognizer.prototype = new Recognizer('SpainDlFrontRecognizer');

BlinkID.prototype.SpainDlFrontRecognizer = SpainDlFrontRecognizer;

/**
 * Result object for SwedenDlFrontRecognizer.
 */
function SwedenDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of Sweden DL owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Sweden DL. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Sweden DL. 
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
     * The issuing agency of Sweden DL. 
     */
    this.issuingAgency = nativeResult.issuingAgency;
    
    /** 
     * The licence categories of Sweden DL. 
     */
    this.licenceCategories = nativeResult.licenceCategories;
    
    /** 
     * The licence number of Sweden DL. 
     */
    this.licenceNumber = nativeResult.licenceNumber;
    
    /** 
     * The name of Sweden DL owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The reference number of Sweden DL. 
     */
    this.referenceNumber = nativeResult.referenceNumber;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of Sweden DL owner. 
     */
    this.surname = nativeResult.surname;
    
}

SwedenDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwedenDlFrontRecognizerResult = SwedenDlFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Sweden DL.
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
     * Defines if date of birth of Sweden DL owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry of Sweden DL should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Sweden DL should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if issuing agency of Sweden DL should be extracted.
     * 
     *  
     */
    this.extractIssuingAgency = true;
    
    /** 
     * Defines if licence categories of Sweden DL should be extracted.
     * 
     *  
     */
    this.extractLicenceCategories = true;
    
    /** 
     * Defines if name of Sweden DL owner should be extracted.
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if reference number of Sweden DL should be extracted.
     * 
     *  
     */
    this.extractReferenceNumber = true;
    
    /** 
     * Defines if surname of Sweden DL owner should be extracted.
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
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
    this.createResultFromNative = function (nativeResult) { return new SwedenDlFrontRecognizerResult(nativeResult); }

}

SwedenDlFrontRecognizer.prototype = new Recognizer('SwedenDlFrontRecognizer');

BlinkID.prototype.SwedenDlFrontRecognizer = SwedenDlFrontRecognizer;

/**
 * Result object for SwitzerlandDlFrontRecognizer.
 */
function SwitzerlandDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date of birth of the Switzerland DL owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of rxpiry of the Switzerland DL. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of the Switzerland DL. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * If true, then this Switzerland DL will never expire. 
     */
    this.expiryDatePermanent = nativeResult.expiryDatePermanent;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * The first name of the Switzerland DL owner. 
     */
    this.firstName = nativeResult.firstName;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issuing authority of the Switzerland DL. 
     */
    this.issuingAuthority = nativeResult.issuingAuthority;
    
    /** 
     * The last name of the Switzerland DL owner. 
     */
    this.lastName = nativeResult.lastName;
    
    /** 
     * The license number of the Switzerland DL. 
     */
    this.licenseNumber = nativeResult.licenseNumber;
    
    /** 
     * The place of birth of the Switzerland DL owner. 
     */
    this.placeOfBirth = nativeResult.placeOfBirth;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The vehicle categories of the Switzerland DL. 
     */
    this.vehicleCategories = nativeResult.vehicleCategories;
    
}

SwitzerlandDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwitzerlandDlFrontRecognizerResult = SwitzerlandDlFrontRecognizerResult;

/**
 * Class for configuring Switzerland DL Front Recognizer.
 * 
 * Switzerland DL Front recognizer is used for scanning front side of the Switzerland DL.
 */
function SwitzerlandDlFrontRecognizer() {
    Recognizer.call(this, 'SwitzerlandDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if owner's date of birth should be extracted from front side of the Switzerland DL
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry should be extracted from front side of the Switzerland DL
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue should be extracted from front side of the Switzerland DL
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if owner's first name should be extracted from front side of the Switzerland DL
     * 
     *  
     */
    this.extractFirstName = true;
    
    /** 
     * Defines if issuing authority should be extracted from front side of the Switzerland DL
     * 
     *  
     */
    this.extractIssuingAuthority = true;
    
    /** 
     * Defines if owner's last name should be extracted from front side of the Switzerland DL
     * 
     *  
     */
    this.extractLastName = true;
    
    /** 
     * Defines if owner's place of birth should be extracted from front side of the Switzerland DL
     * 
     *  
     */
    this.extractPlaceOfBirth = true;
    
    /** 
     * Defines if vehicle categories should be extracted from front side of the Switzerland DL
     * 
     *  
     */
    this.extractVehicleCategories = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new SwitzerlandDlFrontRecognizerResult(nativeResult); }

}

SwitzerlandDlFrontRecognizer.prototype = new Recognizer('SwitzerlandDlFrontRecognizer');

BlinkID.prototype.SwitzerlandDlFrontRecognizer = SwitzerlandDlFrontRecognizer;

/**
 * Result object for SwitzerlandIdBackRecognizer.
 */
function SwitzerlandIdBackRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The issuing authority of Switzerland ID. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * The date of expiry of Switzerland ID. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Switzerland ID. 
     */
    this.dateOfIssue = nativeResult.dateOfIssue != null ? new Date(nativeResult.dateOfIssue) : null;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The height of Switzerland ID owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The place of origin of Switzerland ID owner. 
     */
    this.placeOfOrigin = nativeResult.placeOfOrigin;
    
    /** 
     * The sex of Switzerland ID owner. 
     */
    this.sex = nativeResult.sex;
    
}

SwitzerlandIdBackRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwitzerlandIdBackRecognizerResult = SwitzerlandIdBackRecognizerResult;

/**
 * Recognizer which can scan back side of Switzerland ID.
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
     * Defines if issuing authority of Switzerland ID should be extracted.
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if date of expiry of Switzerland ID should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Switzerland ID should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if height of Switzerland ID owner should be extracted.
     * 
     *  
     */
    this.extractHeight = true;
    
    /** 
     * Defines if place of origin of Switzerland ID owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfOrigin = true;
    
    /** 
     * Defines if sex of Switzerland ID owner should be extracted.
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
     * The date of birth of Switzerland ID owner. 
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
     * The given name of Switzerland ID owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * image of the signature if enabled with returnSignatureImage property. 
     */
    this.signatureImage = nativeResult.signatureImage;
    
    /** 
     * The surname of Switzerland ID owner. 
     */
    this.surname = nativeResult.surname;
    
}

SwitzerlandIdFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwitzerlandIdFrontRecognizerResult = SwitzerlandIdFrontRecognizerResult;

/**
 * Recognizer which can scan front side of Switzerland ID.
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
     * Defines if given name of Switzerland ID owner should be extracted.
     * 
     *  
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if surname of Switzerland ID owner should be extracted.
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
     * Property for setting DPI for signature images
     * Valid ranges are [100,400]. Setting DPI out of valid ranges throws an exception
     * 
     *  
     */
    this.signatureImageDpi = 250;
    
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
     * The issuing authority of Switzerland passport. 
     */
    this.authority = nativeResult.authority;
    
    /** 
     * The date of birth of Switzerland passport owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The date of expiry of Switzerland passport. 
     */
    this.dateOfExpiry = nativeResult.dateOfExpiry != null ? new Date(nativeResult.dateOfExpiry) : null;
    
    /** 
     * The date of issue of Switzerland passport. 
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
     * The given name of Switzerland passport owner. 
     */
    this.givenName = nativeResult.givenName;
    
    /** 
     * The height of Switzerland passport owner. 
     */
    this.height = nativeResult.height;
    
    /** 
     * The data extracted from the machine readable zone. 
     */
    this.mrzResult = nativeResult.mrzResult != null ? new MrzResult(nativeResult.mrzResult) : null;
    
    /** 
     * The passport number of Switzerland passport. 
     */
    this.passportNumber = nativeResult.passportNumber;
    
    /** 
     * The place of origin of Switzerland passport owner. 
     */
    this.placeOfOrigin = nativeResult.placeOfOrigin;
    
    /** 
     * The sex of Switzerland passport owner. 
     */
    this.sex = nativeResult.sex;
    
    /** 
     * The surname of Switzerland passport owner. 
     */
    this.surname = nativeResult.surname;
    
}

SwitzerlandPassportRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.SwitzerlandPassportRecognizerResult = SwitzerlandPassportRecognizerResult;

/**
 * Recognizer which can scan Switzerland passport.
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
     * Defines if issuing authority of Switzerland passport should be extracted.
     * 
     *  
     */
    this.extractAuthority = true;
    
    /** 
     * Defines if date of birth of Switzerland passport owner should be extracted.
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if date of expiry of Switzerland passport should be extracted.
     * 
     *  
     */
    this.extractDateOfExpiry = true;
    
    /** 
     * Defines if date of issue of Switzerland passport should be extracted.
     * 
     *  
     */
    this.extractDateOfIssue = true;
    
    /** 
     * Defines if given name of Switzerland passport owner should be extracted.
     * 
     *  
     */
    this.extractGivenName = true;
    
    /** 
     * Defines if height of Switzerland passport owner should be extracted.
     * 
     *  
     */
    this.extractHeight = true;
    
    /** 
     * Defines if passport number of Switzerland passport should be extracted.
     * 
     *  
     */
    this.extractPassportNumber = true;
    
    /** 
     * Defines if place of origin of Switzerland passport owner should be extracted.
     * 
     *  
     */
    this.extractPlaceOfOrigin = true;
    
    /** 
     * Defines if sex of Switzerland passport owner should be extracted.
     * 
     *  
     */
    this.extractSex = true;
    
    /** 
     * Defines if surname of Switzerland passport owner should be extracted.
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
    
    this.createResultFromNative = function (nativeResult) { return new SwitzerlandPassportRecognizerResult(nativeResult); }

}

SwitzerlandPassportRecognizer.prototype = new Recognizer('SwitzerlandPassportRecognizer');

BlinkID.prototype.SwitzerlandPassportRecognizer = SwitzerlandPassportRecognizer;

/**
 * Result object for UnitedArabEmiratesDlFrontRecognizer.
 */
function UnitedArabEmiratesDlFrontRecognizerResult(nativeResult) {
    RecognizerResult.call(this, nativeResult.resultState);
    
    /** 
     * The date Of Birth of the front side of the United Arab Emirates Dl owner. 
     */
    this.dateOfBirth = nativeResult.dateOfBirth != null ? new Date(nativeResult.dateOfBirth) : null;
    
    /** 
     * The expiry Date of the front side of the United Arab Emirates Dl owner. 
     */
    this.expiryDate = nativeResult.expiryDate != null ? new Date(nativeResult.expiryDate) : null;
    
    /** 
     * face image from the document if enabled with returnFaceImage property. 
     */
    this.faceImage = nativeResult.faceImage;
    
    /** 
     * full document image if enabled with returnFullDocumentImage property. 
     */
    this.fullDocumentImage = nativeResult.fullDocumentImage;
    
    /** 
     * The issue Date of the front side of the United Arab Emirates Dl owner. 
     */
    this.issueDate = nativeResult.issueDate != null ? new Date(nativeResult.issueDate) : null;
    
    /** 
     * The license Number of the front side of the United Arab Emirates Dl owner. 
     */
    this.licenseNumber = nativeResult.licenseNumber;
    
    /** 
     * The licensing Authority of the front side of the United Arab Emirates Dl owner. 
     */
    this.licensingAuthority = nativeResult.licensingAuthority;
    
    /** 
     * The name of the front side of the United Arab Emirates Dl owner. 
     */
    this.name = nativeResult.name;
    
    /** 
     * The nationality of the front side of the United Arab Emirates Dl owner. 
     */
    this.nationality = nativeResult.nationality;
    
    /** 
     * The place Of Issue of the front side of the United Arab Emirates Dl owner. 
     */
    this.placeOfIssue = nativeResult.placeOfIssue;
    
}

UnitedArabEmiratesDlFrontRecognizerResult.prototype = new RecognizerResult(RecognizerResultState.empty);

BlinkID.prototype.UnitedArabEmiratesDlFrontRecognizerResult = UnitedArabEmiratesDlFrontRecognizerResult;

/**
 * Recognizer which can scan front side of UAE drivers license.
 */
function UnitedArabEmiratesDlFrontRecognizer() {
    Recognizer.call(this, 'UnitedArabEmiratesDlFrontRecognizer');
    
    /** 
     * Defines if glare detection should be turned on/off.
     * 
     *  
     */
    this.detectGlare = true;
    
    /** 
     * Defines if date of birth of UAE DL owner should be extracted
     * 
     *  
     */
    this.extractDateOfBirth = true;
    
    /** 
     * Defines if issue date of UAE DL should be extracted
     * 
     *  
     */
    this.extractIssueDate = true;
    
    /** 
     * Defines if license number of UAE DL should be extracted
     * 
     *  
     */
    this.extractLicenseNumber = true;
    
    /** 
     * Defines if licensing authority code of UAE DL should be extracted
     * 
     *  
     */
    this.extractLicensingAuthority = true;
    
    /** 
     * Defines if name of UAE DL owner should be extracted
     * 
     *  
     */
    this.extractName = true;
    
    /** 
     * Defines if nationality of UAE DL owner should be extracted
     * 
     *  
     */
    this.extractNationality = true;
    
    /** 
     * Defines if place of issue of UAE DL should be extracted
     * 
     *  
     */
    this.extractPlaceOfIssue = true;
    
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
    
    this.createResultFromNative = function (nativeResult) { return new UnitedArabEmiratesDlFrontRecognizerResult(nativeResult); }

}

UnitedArabEmiratesDlFrontRecognizer.prototype = new Recognizer('UnitedArabEmiratesDlFrontRecognizer');

BlinkID.prototype.UnitedArabEmiratesDlFrontRecognizer = UnitedArabEmiratesDlFrontRecognizer;

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
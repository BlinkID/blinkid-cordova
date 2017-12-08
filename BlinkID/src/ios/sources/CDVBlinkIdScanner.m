//
//  pdf417Plugin.m
//  CDVpdf417
//
//  Created by Jurica Cerovec, Marko Mihovilic on 10/01/13.
//  Copyright (c) 2013 Racuni.hr. All rights reserved.
//

/**
 * Copyright (c)2013 Racuni.hr d.o.o. All rights reserved.
 *
 * ANY UNAUTHORIZED USE OR SALE, DUPLICATION, OR DISTRIBUTION
 * OF THIS PROGRAM OR ANY OF ITS PARTS, IN SOURCE OR BINARY FORMS,
 * WITH OR WITHOUT MODIFICATION, WITH THE PURPOSE OF ACQUIRING
 * UNLAWFUL MATERIAL OR ANY OTHER BENEFIT IS PROHIBITED!
 * THIS PROGRAM IS PROTECTED BY COPYRIGHT LAWS AND YOU MAY NOT
 * REVERSE ENGINEER, DECOMPILE, OR DISASSEMBLE IT.
 */

#import "CDVBlinkIdScanner.h"

#import <MicroBlink/MicroBlink.h>

// keys for recognizer types
const NSString *PDF417_TYPE = @"PDF417";
const NSString *BARCODE_TYPE = @"Barcode";
const NSString *USDL_TYPE = @"USDL";
const NSString *MRTD_TYPE = @"MRTD";
const NSString *UKDL_TYPE = @"UKDL";
const NSString *DEDL_TYPE = @"DEDL";
const NSString *EUDL_TYPE = @"EUDL";
const NSString *MYKAD_TYPE = @"MyKad";
const NSString *DOCUMENTFACE_TYPE = @"DocumentFace";

const NSString *RESULT_LIST = @"resultList";
const NSString *RESULT_TYPE = @"resultType";
const NSString *TYPE = @"type";
const NSString *DATA = @"data";
const NSString *FIELDS = @"fields";
const NSString *RAW_DATA = @"raw";

NSString *RESULT_FACE_IMAGE = @"resultFaceImage";
NSString *RESULT_DOCUMENT_IMAGE = @"resultDocumentImage";
NSString *RESULT_SUCCESSFUL_IMAGE = @"resultSuccessfulImage";

NSString *PDF417_RESULT_TYPE = @"Barcode result";
NSString *USDL_RESULT_TYPE = @"USDL result";
NSString *BARDECODER_RESULT_TYPE = @"Barcode result";
NSString *ZXING_RESULT_TYPE = @"Barcode result";
NSString *MRTD_RESULT_TYPE = @"MRTD result";
NSString *UKDL_RESULT_TYPE = @"UKDL result";
NSString *DEDL_RESULT_TYPE = @"DEDL result";
NSString *EUDL_RESULT_TYPE = @"EUDL result";
NSString *MYKAD_RESULT_TYPE = @"MyKad result";
NSString *BARCODE_RESULT_TYPE = @"Barcode result";
NSString *DOCUMENTFACE_RESULT_TYPE = @"DocumentFace result";

const NSString *SCAN = @"scan";
const NSString *CANCELLED = @"cancelled";

const int COMPRESSED_IMAGE_QUALITY = 90;

NSString *IMAGE_SUCCESSFUL_STR = @"IMAGE_SUCCESSFUL_SCAN";
NSString *IMAGE_DOCUMENT_STR = @"IMAGE_DOCUMENT";
NSString *IMAGE_FACE_STR = @"IMAGE_FACE";

@interface CDVPlugin () <PPScanningDelegate>

@property (nonatomic, retain) CDVInvokedUrlCommand *lastCommand;

@end

typedef NS_ENUM(NSUInteger, PPImageType) {
    PPImageTypeFace,
    PPImageTypeDocument,
    PPImageTypeSuccessful,
};

@interface CDVBlinkIdScanner ()

@property (nonatomic) NSMutableDictionary<NSString *, NSMutableDictionary *> *imageMetadatas;

@property (nonatomic) BOOL shouldReturnFaceImage;
@property (nonatomic) BOOL shouldReturnDocumentImage;
@property (nonatomic) BOOL shouldReturnSuccessfulImage;

@property (nonatomic) PPImageMetadata *successfulImageMetadata;

@end

@implementation CDVBlinkIdScanner

@synthesize lastCommand;

#pragma mark - Settings Initializers

- (PPPdf417RecognizerSettings *)pdf417RecognizerSettings {
    
    PPPdf417RecognizerSettings *pdf417RecognizerSettings = [[PPPdf417RecognizerSettings alloc] init];
    
    /********* All recognizer settings are set to their default values. Change accordingly. *********/
    
    /**
     * Set this to YES to scan even barcode not compliant with standards
     * For example, malformed PDF417 barcodes which were incorrectly encoded
     * Use only if necessary because it slows down the recognition process
     */
    pdf417RecognizerSettings.scanUncertain = NO;
    
    /**
     * Set this to YES to scan barcodes which don't have quiet zone (white area) around it
     * Use only if necessary because it slows down the recognition process
     */
    pdf417RecognizerSettings.allowNullQuietZone = YES;
    
    /**
     * Set this to YES to allow scanning barcodes with inverted intensities
     * (i.e. white barcodes on black background)
     */
    pdf417RecognizerSettings.scanInverse = NO;
    
    return pdf417RecognizerSettings;
}

- (PPUsdlRecognizerSettings *)usdlRecognizerSettings {
    
    PPUsdlRecognizerSettings *usdlRecognizerSettings = [[PPUsdlRecognizerSettings alloc] init];
    
    /********* All recognizer settings are set to their default values. Change accordingly. *********/
    
    /**
     * Set this to YES to scan even barcode not compliant with standards
     * For example, malformed PDF417 barcodes which were incorrectly encoded
     * Use only if necessary because it slows down the recognition process
     */
    usdlRecognizerSettings.scanUncertain = NO;
    
    /**
     * Set this to YES to scan barcodes which don't have quiet zone (white area) around it
     * Disable if you need a slight speed boost
     */
    usdlRecognizerSettings.allowNullQuietZone = YES;
    
    return usdlRecognizerSettings;
}

- (PPBarcodeRecognizerSettings *)barcodeRecognizerSettings {
    
    PPBarcodeRecognizerSettings *barcodeRecognizerSettings = [[PPBarcodeRecognizerSettings alloc] init];
    
    /********* All recognizer settings are set to their default values. To use Barcode Recognizer you must set atleast 1 standard which will
     * be used to true. *********/
    
    /**
     * Set this to YES to scan Aztec 2D barcodes
     */
    barcodeRecognizerSettings.scanAztec = NO;
    
    /**
     * Set this to YES to scan Code 128 1D barcodes
     */
    barcodeRecognizerSettings.scanCode128 = YES;
    
    /**
     * Set this to YES to scan Code 39 1D barcodes
     */
    barcodeRecognizerSettings.scanCode39 = YES;
    
    /**
     * Set this to YES to scan DataMatrix 2D barcodes
     */
    barcodeRecognizerSettings.scanDataMatrix = NO;
    
    /**
     * Set this to YES to scan EAN 13 barcodes
     */
    barcodeRecognizerSettings.scanEAN13 = YES;
    
    /**
     * Set this to YES to scan EAN8 barcodes
     */
    barcodeRecognizerSettings.scanEAN8 = YES;
    
    /**
     * Set this to YES to scan ITF barcodes
     */
    barcodeRecognizerSettings.scanITF = NO;
    
    /**
     * Set this to YES to scan QR barcodes
     */
    barcodeRecognizerSettings.scanQR = YES;
    
    /**
     * Set this to YES to scan UPCA barcodes
     */
    barcodeRecognizerSettings.scanUPCA = YES;
    
    /**
     * Set this to YES to scan UPCE barcodes
     */
    barcodeRecognizerSettings.scanUPCE = YES;
    
    /**
     * Set this to YES to allow scanning barcodes with inverted intensities
     * (i.e. white barcodes on black background)
     * @Warning: this option doubles frame processing time
     */
    barcodeRecognizerSettings.scanInverse = NO;

    /**
     * Use this method to enable slower, but more thorough scan procedure when scanning barcodes.
     * By default, this option is turned on.
     */
    barcodeRecognizerSettings.useSlowerThoroughScan = YES;
    
    return barcodeRecognizerSettings;
}

- (PPMrtdRecognizerSettings *)mrtdRecognizerSettings {
    
    PPMrtdRecognizerSettings *mrtdRecognizerSettings = [[PPMrtdRecognizerSettings alloc] init];
    
    /********* All recognizer settings are set to their default values. Change accordingly. *********/
    
    // Setting this will give you the chance to parse MRZ result, if Mrtd recognizer wasn't
    // successful in parsing (this can happen since MRZ isn't always formatted accoring to ICAO Document 9303 standard.
    // @see http://www.icao.int/Security/mrtd/pages/Document9303.aspx
    mrtdRecognizerSettings.allowUnparsedResults = NO;
    
    // Setup returning document image

    if ([self shouldReturnDocumentImage]) {
        mrtdRecognizerSettings.dewarpFullDocument = YES;

        NSMutableDictionary *dict = [self getInitializedImagesDictionaryForClass:[PPMrtdRecognizerResult class]];
        [dict setObject:[NSNull null] forKey:@(PPImageTypeDocument)];
    }

    return mrtdRecognizerSettings;
}

- (PPEudlRecognizerSettings *)eudlRecognizerSettingsWithCountry:(PPEudlCountry)country {
    
    PPEudlRecognizerSettings *eudlRecognizerSettings = [[PPEudlRecognizerSettings alloc] initWithEudlCountry:country];
    
    /********* All recognizer settings are set to their default values. Change accordingly. *********/
    
    /**
     * If YES, document issue date will be extracted
     * Set this to NO if youre not interested in this data to speed up the scanning process!
     */
    eudlRecognizerSettings.extractIssueDate = YES;
    
    /**
     * If YES, document expiry date will be extracted
     * Set this to NO if youre not interested in this data to speed up the scanning process!
     */
    eudlRecognizerSettings.extractExpiryDate = YES;
    
    /**
     * If YES, owner's address will be extracted
     * Set this to NO if youre not interested in this data to speed up the scanning process!
     */
    eudlRecognizerSettings.extractAddress = YES;
    
    // Setup returning document image

    if ([self shouldReturnDocumentImage]) {
        eudlRecognizerSettings.showFullDocument = YES;

        NSMutableDictionary *dict = [self getInitializedImagesDictionaryForClass:[PPEudlRecognizerResult class]];
        [dict setObject:[NSNull null] forKey:@(PPImageTypeDocument)];
    }
    
    return eudlRecognizerSettings;
}

- (PPDocumentFaceRecognizerSettings *)documentFaceRecognizerSettings {
    
    PPDocumentFaceRecognizerSettings *documentFaceReconizerSettings = [[PPDocumentFaceRecognizerSettings alloc] init];
    
    // This property is useful if you're at the same time obtaining Dewarped image metadata, since it allows you to obtain dewarped and
    // cropped
    // images of MRTD documents. Dewarped images are returned to scanningViewController:didOutputMetadata: callback,
    // as PPImageMetadata objects with name @"MRTD"

    // Setup returning document image

    if ([self shouldReturnDocumentImage]) {
        documentFaceReconizerSettings.returnFullDocument = YES;

        NSMutableDictionary *dict = [self getInitializedImagesDictionaryForClass:[PPDocumentFaceRecognizerResult class]];
        [dict setObject:[NSNull null] forKey:@(PPImageTypeDocument)];
    }

    // Setup returning face image

    if ([self shouldReturnFaceImage]) {
        documentFaceReconizerSettings.returnFaceImage = YES;

        NSMutableDictionary *dict = [self getInitializedImagesDictionaryForClass:[PPDocumentFaceRecognizerResult class]];
        [dict setObject:[NSNull null] forKey:@(PPImageTypeFace)];
    }
    
    return documentFaceReconizerSettings;
}

- (PPMyKadRecognizerSettings *)myKadRecognizerSettings {
    
    PPMyKadRecognizerSettings *myKadRecognizerSettings = [[PPMyKadRecognizerSettings alloc] init];

    // Setup returning document image

    if ([self shouldReturnDocumentImage]) {
        myKadRecognizerSettings.showFullDocument = YES;

        NSMutableDictionary *dict = [self getInitializedImagesDictionaryForClass:[PPMyKadRecognizerResult class]];
        [dict setObject:[NSNull null] forKey:@(PPImageTypeDocument)];
    }

    // Setup returning face image

    if ([self shouldReturnFaceImage]) {
        myKadRecognizerSettings.showFaceImage = YES;

        NSMutableDictionary *dict = [self getInitializedImagesDictionaryForClass:[PPMyKadRecognizerResult class]];
        [dict setObject:[NSNull null] forKey:@(PPImageTypeFace)];
    }
    
    return myKadRecognizerSettings;
}

- (NSMutableDictionary *)getInitializedImagesDictionaryForClass:(Class)class {

    NSMutableDictionary *dict = [self.imageMetadatas objectForKey:NSStringFromClass(class)];
    if (dict != nil) {
        return dict;
    }

    NSMutableDictionary *newDict = [[NSMutableDictionary alloc] init];
    [self.imageMetadatas setObject:newDict forKey:NSStringFromClass(class)];
    return newDict;
}


#pragma mark - Used Recognizers

- (BOOL)shouldUsePdf417RecognizerForTypes:(NSArray *)types {
    return [types containsObject:PDF417_TYPE];
}

- (BOOL)shouldUseBarcodeRecognizerForTypes:(NSArray *)types {
    return [types containsObject:BARCODE_TYPE];
}

- (BOOL)shouldUseUsdlRecognizerForTypes:(NSArray *)types {
    return [types containsObject:USDL_TYPE];
}

- (BOOL)shouldUseMrtdRecognizerForTypes:(NSArray *)types {
    return [types containsObject:MRTD_TYPE];
}

- (BOOL)shouldUseEudlRecognizerForTypes:(NSArray *)types {
    return [types containsObject:EUDL_TYPE];
}

- (BOOL)shouldUseUkdlRecognizerForTypes:(NSArray *)types {
    return [types containsObject:UKDL_TYPE];
}

- (BOOL)shouldUseDedlRecognizerForTypes:(NSArray *)types {
    return [types containsObject:DEDL_TYPE];
}

- (BOOL)shouldUseDocumentFaceRecognizerForTypes:(NSArray *)types {
    return [types containsObject:DOCUMENTFACE_TYPE];
}

- (BOOL)shouldUseMyKadRecognizerForTypes:(NSArray *)types {
    return [types containsObject:MYKAD_TYPE];
}

#pragma mark - Main

- (PPCameraCoordinator *)coordinatorWithError:(NSError **)error {
    
    /** 0. Check if scanning is supported */
    
    if ([PPCameraCoordinator isScanningUnsupportedForCameraType:PPCameraTypeBack error:error]) {
        return nil;
    }
    
    NSArray *types = [self.lastCommand argumentAtIndex:0];
    
    /** 1. Initialize the Scanning settings */
    
    // Initialize the scanner settings object. This initialize settings with all default values.
    PPSettings *settings = [[PPSettings alloc] init];

    self.imageMetadatas = [[NSMutableDictionary alloc] init];
    self.successfulImageMetadata = nil;
    
    NSArray *imageTypes = [self.lastCommand argumentAtIndex:1];
    if ([imageTypes containsObject:IMAGE_FACE_STR]) {
        settings.metadataSettings.dewarpedImage = YES;
        self.shouldReturnFaceImage = YES;
    }
    if ([imageTypes containsObject:IMAGE_SUCCESSFUL_STR]) {
        settings.metadataSettings.successfulFrame = YES;
        self.shouldReturnSuccessfulImage = YES;
    }
    if ([imageTypes containsObject:IMAGE_DOCUMENT_STR]) {
        settings.metadataSettings.dewarpedImage = YES;
        self.shouldReturnDocumentImage = YES;
    };
    
    // Set PPCameraPresetOptimal for very dense or lower quality barcodes
    settings.cameraSettings.cameraPreset = PPCameraPresetOptimal;
    
    /** 2. Setup the license key */
    
    // Visit www.microblink.com to get the license key for your app
    settings.licenseSettings.licenseKey = [self.lastCommand argumentAtIndex:2];
    
    // Do not timeout
    settings.scanSettings.partialRecognitionTimeout = 0.0f;
    
    /**
     * 3. Set up what is being scanned. See detailed guides for specific use cases.
     * Here's an example for initializing PDF417 scanning
     */
    
    // Add PDF417 Recognizer setting to a list of used recognizer settings
    if ([self shouldUsePdf417RecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self pdf417RecognizerSettings]];
    }

    if ([self shouldUseBarcodeRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self barcodeRecognizerSettings]];
    }

    if ([self shouldUseUsdlRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self usdlRecognizerSettings]];
    }
    
    if ([self shouldUseMrtdRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self mrtdRecognizerSettings]];
    }
    
    if ([self shouldUseEudlRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self eudlRecognizerSettingsWithCountry:PPEudlCountryAny]];
    }
    
    if ([self shouldUseUkdlRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self eudlRecognizerSettingsWithCountry:PPEudlCountryUnitedKingdom]];
    }
    
    if ([self shouldUseDedlRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self eudlRecognizerSettingsWithCountry:PPEudlCountryGermany]];
    }
    
    if ([self shouldUseDocumentFaceRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self documentFaceRecognizerSettings]];
    }
    
    if ([self shouldUseMyKadRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self myKadRecognizerSettings]];
    }
    
    /** 4. Initialize the Scanning Coordinator object */
    
    PPCameraCoordinator *coordinator = [[PPCameraCoordinator alloc] initWithSettings:settings];
    
    return coordinator;
}

- (void)scan:(CDVInvokedUrlCommand *)command {
    
    [self setLastCommand:command];
    
    /** Instantiate the scanning coordinator */
    NSError *error;
    PPCameraCoordinator *coordinator = [self coordinatorWithError:&error];
    
    /** If scanning isn't supported, present an error */
    if (coordinator == nil) {
        NSString *messageString = [error localizedDescription];
        [[[UIAlertView alloc] initWithTitle:@"Warning"
                                    message:messageString
                                   delegate:nil
                          cancelButtonTitle:@"OK"
                          otherButtonTitles:nil, nil] show];
        
        return;
    }
    
    /** Allocate and present the scanning view controller */
    UIViewController<PPScanningViewController> *scanningViewController =
        [PPViewControllerFactory cameraViewControllerWithDelegate:self coordinator:coordinator error:nil];
    
    scanningViewController.autorotate = YES;
    
    /** You can use other presentation methods as well */
    [[self viewController] presentViewController:scanningViewController animated:YES completion:nil];
}

#pragma mark - Result Processing

- (void)setDictionary:(NSMutableDictionary *)dict withPdf417RecognizerResult:(PPPdf417RecognizerResult *)data {
    [dict setObject:PDF417_RESULT_TYPE forKey:RESULT_TYPE];
    [dict setObject:@"PDF417" forKey:TYPE];
    if ([data stringUsingGuessedEncoding]) {
        [dict setObject:[data stringUsingGuessedEncoding] forKey:DATA];
    }
    [dict setObject:[PPRecognizerResult urlStringFromData:[data data]] forKey:RAW_DATA];
}

- (void)setDictionary:(NSMutableDictionary *)dict withBarcodeRecognizerResult:(PPBarcodeRecognizerResult *)data {
    if ([data stringUsingGuessedEncoding]) {
        [dict setObject:[data stringUsingGuessedEncoding] forKey:DATA];
    }
    [dict setObject:[PPRecognizerResult urlStringFromData:[data data]] forKey:RAW_DATA];
    [dict setObject:[CDVBlinkIdScanner nameForBarcodeType:data.barcodeType] forKey:TYPE];
    [dict setObject:BARCODE_RESULT_TYPE forKey:RESULT_TYPE];
}

- (void)setDictionary:(NSMutableDictionary *)dict withUsdlResult:(PPUsdlRecognizerResult *)usdlResult {
    [dict setObject:[usdlResult getAllStringElements] forKey:FIELDS];
    [dict setObject:USDL_RESULT_TYPE forKey:RESULT_TYPE];
}

- (void)setDictionary:(NSMutableDictionary *)dict withMrtdRecognizerResult:(PPMrtdRecognizerResult *)mrtdResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[mrtdResult getAllStringElements]];
    [stringElements setObject:[mrtdResult rawDateOfBirth] forKey:@"DateOfBirth"];
    [stringElements setObject:[mrtdResult rawDateOfExpiry] forKey:@"DateOfExpiry"];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:[mrtdResult mrzText] forKey:RAW_DATA];
    [dict setObject:MRTD_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:mrtdResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withEudlRecognizerResult:(PPEudlRecognizerResult *)eudlResult {
    [dict setObject:[eudlResult getAllStringElements] forKey:FIELDS];

    NSString *eudlResultType;

    // Select the result type by country.
    switch (eudlResult.country) {
        case PPEudlCountryUnitedKingdom:
            eudlResultType = UKDL_RESULT_TYPE;
            break;
        case PPEudlCountryGermany:
            eudlResultType = DEDL_RESULT_TYPE;
            break;
        case PPEudlCountryAustria:
            eudlResultType = EUDL_RESULT_TYPE;
            break;
        case PPEudlCountryAny:
            eudlResultType = EUDL_RESULT_TYPE;
            break;
    }

    [dict setObject:eudlResultType forKey:RESULT_TYPE];

    [self setupDictionary:dict withImagesForResult:eudlResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withMyKadRecognizerResult:(PPMyKadRecognizerResult *)myKadResult {
    [dict setObject:[myKadResult getAllStringElements] forKey:FIELDS];
    [dict setObject:MYKAD_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:myKadResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withDocumentFaceResult:(PPDocumentFaceRecognizerResult *)documentFaceResult {
    [dict setObject:[documentFaceResult getAllStringElements] forKey:FIELDS];
    [dict setObject:DOCUMENTFACE_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:documentFaceResult];
}

- (void)returnResults:(NSArray *)results cancelled:(BOOL)cancelled {
    
    NSMutableDictionary *resultDict = [[NSMutableDictionary alloc] init];
    [resultDict setObject:[NSNumber numberWithInt:(cancelled ? 1 : 0)] forKey:CANCELLED];
    
    NSMutableArray *resultArray = [[NSMutableArray alloc] init];
    
    for (PPRecognizerResult *result in results) {
        
        if ([result isKindOfClass:[PPPdf417RecognizerResult class]]) {
            PPPdf417RecognizerResult *pdf417Result = (PPPdf417RecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withPdf417RecognizerResult:pdf417Result];
            
            [resultArray addObject:dict];
        }

        if ([result isKindOfClass:[PPBarcodeRecognizerResult class]]) {
            PPBarcodeRecognizerResult *barcodeRecognizerResult = (PPBarcodeRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withBarcodeRecognizerResult:barcodeRecognizerResult];

            [resultArray addObject:dict];
        }
        
        if ([result isKindOfClass:[PPUsdlRecognizerResult class]]) {
            PPUsdlRecognizerResult *usdlResult = (PPUsdlRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withUsdlResult:usdlResult];
            
            [resultArray addObject:dict];
        }
        
        if ([result isKindOfClass:[PPMrtdRecognizerResult class]]) {
            PPMrtdRecognizerResult *mrtdDecoderResult = (PPMrtdRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withMrtdRecognizerResult:mrtdDecoderResult];
            
            [resultArray addObject:dict];
        }
        
        if ([result isKindOfClass:[PPEudlRecognizerResult class]]) {
            PPEudlRecognizerResult *eudlDecoderResult = (PPEudlRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withEudlRecognizerResult:eudlDecoderResult];
            
            [resultArray addObject:dict];
        }
        
        if ([result isKindOfClass:[PPMyKadRecognizerResult class]]) {
            PPMyKadRecognizerResult *myKadDecoderResult = (PPMyKadRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withMyKadRecognizerResult:myKadDecoderResult];
            
            [resultArray addObject:dict];
        }
        
        if ([result isKindOfClass:[PPDocumentFaceRecognizerResult class]]) {
            PPDocumentFaceRecognizerResult *documentFaceResult = (PPDocumentFaceRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withDocumentFaceResult:documentFaceResult];
            
            [resultArray addObject:dict];
        }
    };
    
    if ([resultArray count] > 0) {
        [resultDict setObject:resultArray forKey:RESULT_LIST];
    }
    
    if (!cancelled) {
        [self setupDictionary:resultDict withImageMetadata:self.successfulImageMetadata resultKey:RESULT_SUCCESSFUL_IMAGE];
    }
    
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:resultDict];
    
    /*
     NSString* js = [result toSuccessCallbackString:[[self lastCommand] callbackId]];
     
     [self writeJavascript:js];
     */
    
    [self.commandDelegate sendPluginResult:result callbackId:self.lastCommand.callbackId];
    
    // As scanning view controller is presented full screen and modally, dismiss it
    [[self viewController] dismissViewControllerAnimated:YES completion:nil];
}

- (void)setupDictionary:(NSMutableDictionary *)dict withImageMetadata:(PPImageMetadata *)imageMetadata resultKey:(NSString *)resultKey {

    if (imageMetadata == nil) return;
    if (imageMetadata.image == nil) return;

    NSData *imageData = UIImageJPEGRepresentation(imageMetadata.image, COMPRESSED_IMAGE_QUALITY / 100.f);
    [dict setObject:[imageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength] forKey:resultKey];
}

- (void)setupDictionary:(NSMutableDictionary *)dict withImagesForResult:(PPRecognizerResult *)result {
    NSDictionary *metadatas = [self.imageMetadatas objectForKey:NSStringFromClass([result class])];

    [metadatas enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
        switch ([key intValue]) {
            case PPImageTypeFace:
                [self setupDictionary:dict withImageMetadata:obj resultKey:RESULT_FACE_IMAGE];
                break;
            case PPImageTypeDocument:
                [self setupDictionary:dict withImageMetadata:obj resultKey:RESULT_DOCUMENT_IMAGE];
                break;
        }
    }];
}

- (void)returnError:(NSString *)message {
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:message];
    /*
     NSString* js = [result toErrorCallbackString:[[self lastCommand] callbackId]];
     
     [self writeJavascript:js];
     */
    
    [self.commandDelegate sendPluginResult:result callbackId:self.lastCommand.callbackId];
    
    // As scanning view controller is presented full screen and modally, dismiss it
    [[self viewController] dismissViewControllerAnimated:YES completion:nil];
}

#pragma mark - PPScanDelegate delegate methods

- (void)scanningViewControllerUnauthorizedCamera:(UIViewController<PPScanningViewController> *)scanningViewController {
    // Add any logic which handles UI when app user doesn't allow usage of the phone's camera
}

- (void)scanningViewController:(UIViewController<PPScanningViewController> *)scanningViewController didFindError:(NSError *)error {
    // Can be ignored. See description of the method
}

- (void)scanningViewControllerDidClose:(UIViewController<PPScanningViewController> *)scanningViewController {
    
    [self returnResults:nil cancelled:YES];
    
    // As scanning view controller is presented full screen and modally, dismiss it
    [[self viewController] dismissViewControllerAnimated:YES completion:nil];
}

- (BOOL)checkAreImagesReturned:(NSArray<PPRecognizerResult *> *)results {

    for (PPRecognizerResult *result in results) {
        NSDictionary *metadatas = [self.imageMetadatas objectForKey:NSStringFromClass([result class])];

        for (NSObject *obj in [metadatas allValues]) {
            if ([obj isEqual:[NSNull null]]) {
                return NO;
            }
        }
    }

    return YES;
}

- (void)scanningViewController:(UIViewController<PPScanningViewController> *)scanningViewController
              didOutputResults:(NSArray<PPRecognizerResult *> *)results {

    if (self.shouldReturnSuccessfulImage && (self.successfulImageMetadata == nil || self.successfulImageMetadata.image == nil)) {
        return;
    }
    
    if (![self checkAreImagesReturned:results]) {
        return;
    }
    
    [self returnResults:results cancelled:(results == nil)];
    
    // As scanning view controller is presented full screen and modally, dismiss it
    [[self viewController] dismissViewControllerAnimated:YES completion:nil];
}

- (void)scanningViewController:(UIViewController<PPScanningViewController> *)scanningViewController
             didOutputMetadata:(PPMetadata *)metadata {

    if ([metadata isKindOfClass:[PPImageMetadata class]]) {
        PPImageMetadata *imageMetadata = (PPImageMetadata *)metadata;

        if ([imageMetadata imageType] == PPImageMetadataTypeSuccessfulFrame) {
            self.successfulImageMetadata = imageMetadata;

        } else if ([imageMetadata imageType] == PPImageMetadataTypeDewarpedImage) {

            [self setImageMetadata:imageMetadata forName:[PPMrtdRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPMrtdRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPDocumentFaceRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPDocumentFaceRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPMyKadRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPMyKadRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPEudlRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPEudlRecognizerResult class]];

            [self setImageMetadata:imageMetadata forName:[PPMyKadRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPMyKadRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPDocumentFaceRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPDocumentFaceRecognizerResult class]];
        }
    }
}

- (void)setImageMetadata:(PPImageMetadata *)metadata forName:(NSString *)name imageType:(PPImageType)type resultClass:(Class)result {
    if ([[metadata name] isEqualToString:name]) {
        NSMutableDictionary *dict = [self.imageMetadatas objectForKey:NSStringFromClass(result)];
        [dict setObject:metadata forKey:@(type)];
    }
}

#pragma mark - String utils

+ (NSString *)nameForBarcodeType:(PPBarcodeType)type {
    switch (type) {
        case PPBarcodeNone:
            return @"NONE";
        case PPBarcodeTypeQR:
            return @"QR";
        case PPBarcodeTypeDataMatrix:
            return @"DATA_MATRIX";
        case PPBarcodeTypeUPCE:
            return @"UPCE";
        case PPBarcodeTypeUPCA:
            return @"UPCA";
        case PPBarcodeTypeEAN8:
            return @"EAN8";
        case PPBarcodeTypeEAN13:
            return @"EAN13";
        case PPBarcodeTypeCode128:
            return @"CODE128";
        case PPBarcodeTypeCode39:
            return @"CODE39";
        case PPBarcodeTypeITF:
            return @"ITF";
        case PPBarcodeTypeAztec:
            return @"AZTEC";
    }
}

@end

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

@interface CDVPlugin () <PPScanningDelegate>

@property (nonatomic, retain) CDVInvokedUrlCommand *lastCommand;

@end

@interface CDVblinkIdScanner ()

@property (nonatomic) PPImageMetadata *lastImageMetadata;

@property (nonatomic) BOOL shouldReturnCroppedDocument;

@property (nonatomic) BOOL shouldReturnSuccessfulFrame;

@end

@implementation CDVblinkIdScanner

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
    
    /********* All recognizer settings are set to their default values. To use Zxing Recognizer you must set atleast 1 standard which will
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
    
    
    /********* All recognizer settings are set to their default values. Change accordingly. *********/
    
    /**
     * Set this to YES to scan Code 39 barcodes
     */
    barcodeRecognizerSettings.scanCode39 = YES;
    
    /**
     * Set this to YES to scan Code 128 barcodes
     */
    barcodeRecognizerSettings.scanCode128 = YES;
    
    /**
     * Set this to YES to allow scanning barcodes with inverted intensities
     * (i.e. white barcodes on black background)
     * @Warning: this option doubles frame processing time
     */
    barcodeRecognizerSettings.scanInverse = NO;
    
    return barcodeRecognizerSettings;
}

- (PPMrtdRecognizerSettings *)mrtdRecognizerSettings {
    
    PPMrtdRecognizerSettings *mrtdRecognizerSettings = [[PPMrtdRecognizerSettings alloc] init];
    
    /********* All recognizer settings are set to their default values. Change accordingly. *********/
    
    
    // Setting this will give you the chance to parse MRZ result, if Mrtd recognizer wasn't
    // successful in parsing (this can happen since MRZ isn't always formatted accoring to ICAO Document 9303 standard.
    // @see http://www.icao.int/Security/mrtd/pages/Document9303.aspx
    mrtdRecognizerSettings.allowUnparsedResults = NO;
    
    // This property is useful if you're at the same time obtaining Dewarped image metadata, since it allows you to obtain dewarped and
    // cropped
    // images of MRTD documents. Dewarped images are returned to scanningViewController:didOutputMetadata: callback,
    // as PPImageMetadata objects with name @"MRTD"
    
    if (self.shouldReturnCroppedDocument) {
        mrtdRecognizerSettings.dewarpFullDocument = YES;
    } else {
        mrtdRecognizerSettings.dewarpFullDocument = NO;
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
    
    // This property is useful if you're at the same time obtaining Dewarped image metadata, since it allows you to obtain dewarped and
    // cropped
    // images of MRTD documents. Dewarped images are returned to scanningViewController:didOutputMetadata: callback,
    // as PPImageMetadata objects with name @"MRTD"
    
    if (self.shouldReturnCroppedDocument) {
        eudlRecognizerSettings.showFullDocument = YES;
    } else {
        eudlRecognizerSettings.showFullDocument = NO;
    }
    
    return eudlRecognizerSettings;
}

- (PPDocumentFaceRecognizerSettings *)documentFaceRecognizerSettings {
    
    PPDocumentFaceRecognizerSettings *documentFaceReconizerSettings = [[PPDocumentFaceRecognizerSettings alloc] init];
    
    // This property is useful if you're at the same time obtaining Dewarped image metadata, since it allows you to obtain dewarped and
    // cropped
    // images of MRTD documents. Dewarped images are returned to scanningViewController:didOutputMetadata: callback,
    // as PPImageMetadata objects with name @"MRTD"
    
    if (self.shouldReturnCroppedDocument) {
        documentFaceReconizerSettings.returnFullDocument = YES;
    } else {
        documentFaceReconizerSettings.returnFullDocument = NO;
    }
    
    return documentFaceReconizerSettings;
}

- (PPMyKadRecognizerSettings *)myKadRecognizerSettings {
    
    PPMyKadRecognizerSettings *myKadRecognizerSettings = [[PPMyKadRecognizerSettings alloc] init];
    
    // This property is useful if you're at the same time obtaining Dewarped image metadata, since it allows you to obtain dewarped and
    // cropped
    // images of MRTD documents. Dewarped images are returned to scanningViewController:didOutputMetadata: callback,
    // as PPImageMetadata objects with name @"MRTD"
    
    if (self.shouldReturnCroppedDocument) {
        myKadRecognizerSettings.showFullDocument = YES;
    } else {
        myKadRecognizerSettings.showFullDocument = NO;
    }
    
    return myKadRecognizerSettings;
}

#pragma mark - Used Recognizers

- (BOOL)shouldUsePdf417RecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"PDF417"];
}

- (BOOL)shouldUseUsdlRecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"USDL"];
}

- (BOOL)shouldUseBarDecoderRecognizerForTypes:(NSArray *)types {
    
    return [types containsObject:@"Bar Decoder"];
}

- (BOOL)shouldUseBarcodeRecognizerForTypes:(NSArray *)types {
    
    return [types containsObject:@"Barcode"];
}

- (BOOL)shouldUseZxingRecognizerForTypes:(NSArray *)types {
    
    return [types containsObject:@"Zxing"];
}

- (BOOL)shouldUseMrtdRecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"MRTD"];
}

- (BOOL)shouldUseEudlRecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"EUDL"];
}

- (BOOL)shouldUseUkdlRecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"UKDL"];
}

- (BOOL)shouldUseDedlRecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"DEDL"];
}

- (BOOL)shouldUseDocumentFaceRecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"DocumentFace"];
}

- (BOOL)shouldUseMyKadRecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"MyKad"];
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
    
    self.shouldReturnCroppedDocument = NO;
    self.shouldReturnSuccessfulFrame = NO;
    
    NSString *imageType = [self.lastCommand argumentAtIndex:1];
    if ([imageType isEqualToString:@"IMAGE_SUCCESSFUL_SCAN"]) {
        settings.metadataSettings.successfulFrame = YES;
        self.shouldReturnSuccessfulFrame = YES;
    } else if ([imageType isEqualToString:@"IMAGE_CROPPED"]) {
        settings.metadataSettings.dewarpedImage = YES;
        self.shouldReturnCroppedDocument = YES;
    };
    
    self.lastImageMetadata = nil;
    
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
    
    if ([self shouldUseUsdlRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self usdlRecognizerSettings]];
    }
    
    if ([self shouldUseMrtdRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self mrtdRecognizerSettings]];
    }
    
    if ([self shouldUseBarcodeRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self barcodeRecognizerSettings]];
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
    
    if ([data stringUsingGuessedEncoding]) {
        [dict setObject:[data stringUsingGuessedEncoding] forKey:@"data"];
    }
    
    [dict setObject:[PPRecognizerResult urlStringFromData:[data data]] forKey:@"raw"];
    [dict setObject:@"PDF417" forKey:@"type"];
    [dict setObject:@"Barcode result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary *)dict withZXingRecognizerResult:(PPZXingRecognizerResult *)data {
    
    if ([data stringUsingGuessedEncoding]) {
        [dict setObject:[data stringUsingGuessedEncoding] forKey:@"data"];
    }
    
    [dict setObject:[PPRecognizerResult urlStringFromData:[data data]] forKey:@"raw"];
    [dict setObject:[PPZXingRecognizerResult toTypeName:data.barcodeType] forKey:@"type"];
    [dict setObject:@"Barcode result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary *)dict withBarDecoderRecognizerResult:(PPBarDecoderRecognizerResult *)data {
    
    if ([data stringUsingGuessedEncoding]) {
        [dict setObject:[data stringUsingGuessedEncoding] forKey:@"data"];
    }
    
    [dict setObject:[PPRecognizerResult urlStringFromData:[data data]] forKey:@"raw"];
    [dict setObject:[PPBarDecoderRecognizerResult toTypeName:data.barcodeType] forKey:@"type"];
    [dict setObject:@"Barcode result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary *)dict withUsdlResult:(PPUsdlRecognizerResult *)usdlResult {
    [dict setObject:[usdlResult getAllStringElements] forKey:@"fields"];
    [dict setObject:@"USDL result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary *)dict withMrtdRecognizerResult:(PPMrtdRecognizerResult *)mrtdResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[mrtdResult getAllStringElements]];
    [stringElements setObject:[mrtdResult rawDateOfBirth] forKey:@"DateOfBirth"];
    [stringElements setObject:[mrtdResult rawDateOfExpiry] forKey:@"DateOfExpiry"];
    [dict setObject:stringElements forKey:@"fields"];
    [dict setObject:[mrtdResult mrzText] forKey:@"raw"];
    [dict setObject:@"MRTD result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary *)dict withEudlRecognizerResult:(PPEudlRecognizerResult *)eudlResult {
    [dict setObject:[eudlResult getAllStringElements] forKey:@"fields"];
    [dict setObject:@"EUDL result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary *)dict withMyKadRecognizerResult:(PPMyKadRecognizerResult *)myKadResult {
    [dict setObject:[myKadResult getAllStringElements] forKey:@"fields"];
    [dict setObject:@"MyKad result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary *)dict withDocumentFaceResult:(PPDocumentFaceRecognizerResult *)documentFaceResult {
    [dict setObject:[documentFaceResult getAllStringElements] forKey:@"fields"];
    [dict setObject:@"DocumentFace result" forKey:@"resultType"];
}

- (void)returnResults:(NSArray *)results cancelled:(BOOL)cancelled {
    
    NSMutableDictionary *resultDict = [[NSMutableDictionary alloc] init];
    [resultDict setObject:[NSNumber numberWithInt:(cancelled ? 1 : 0)] forKey:@"cancelled"];
    
    NSMutableArray *resultArray = [[NSMutableArray alloc] init];
    
    for (PPRecognizerResult *result in results) {
        
        if ([result isKindOfClass:[PPPdf417RecognizerResult class]]) {
            PPPdf417RecognizerResult *pdf417Result = (PPPdf417RecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withPdf417RecognizerResult:pdf417Result];
            
            [resultArray addObject:dict];
        }
        
        if ([result isKindOfClass:[PPZXingRecognizerResult class]]) {
            PPZXingRecognizerResult *zxingResult = (PPZXingRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withZXingRecognizerResult:zxingResult];
            
            [resultArray addObject:dict];
        }
        
        if ([result isKindOfClass:[PPUsdlRecognizerResult class]]) {
            PPUsdlRecognizerResult *usdlResult = (PPUsdlRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withUsdlResult:usdlResult];
            
            [resultArray addObject:dict];
        }
        
        if ([result isKindOfClass:[PPBarDecoderRecognizerResult class]]) {
            PPBarDecoderRecognizerResult *barDecoderResult = (PPBarDecoderRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withBarDecoderRecognizerResult:barDecoderResult];
            
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
        [resultDict setObject:resultArray forKey:@"resultList"];
    }
    
    if (!cancelled) {
        UIImage *image = self.lastImageMetadata.image;
        if (image) {
            NSData *imageData = UIImageJPEGRepresentation(self.lastImageMetadata.image, 0.9f);
            [resultDict setObject:[imageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength]
                           forKey:@"resultImage"];
        }
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

- (BOOL)resultCanOutputCroppedImage:(NSArray<PPRecognizerResult *> *)results {
    
    NSArray<Class> *classes = @[ [PPMrtdRecognizerResult class], [PPEudlRecognizerResult class], [PPMyKadRecognizerResult class] ];
    
    for (PPRecognizerResult *result in results) {
        for (Class class in classes) {
            if ([result isKindOfClass:class]) {
                return YES;
            }
        }
    }
    
    return NO;
}

- (void)scanningViewController:(UIViewController<PPScanningViewController> *)scanningViewController
              didOutputResults:(NSArray<PPRecognizerResult *> *)results {
    
    if (self.shouldReturnSuccessfulFrame && self.lastImageMetadata == nil) {
        // We need to have image saved if the user requested a successful frame
        return;
    }
    
    if (self.shouldReturnCroppedDocument && self.lastImageMetadata == nil && [self resultCanOutputCroppedImage:results]) {
        // We need to have image saved if the user requested cropped image
        // and the recognizer which gave the result was able to output it
        return;
    }
    
    [self returnResults:results cancelled:(results == nil)];
    
    // As scanning view controller is presented full screen and modally, dismiss it
    [[self viewController] dismissViewControllerAnimated:YES completion:nil];
}

- (void)scanningViewController:(UIViewController<PPScanningViewController> *)scanningViewController
             didOutputMetadata:(PPMetadata *)metadata {
    if ([metadata isKindOfClass:[PPImageMetadata class]]) {
        self.lastImageMetadata = (PPImageMetadata *)metadata;
    }
}

@end

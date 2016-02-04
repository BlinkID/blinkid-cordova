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

@interface CDVPlugin () <PPScanDelegate>

@property (nonatomic, retain) CDVInvokedUrlCommand* lastCommand;

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
    pdf417RecognizerSettings.allowNullQuietZone = NO;

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

    /**
     * Set this to YES if you want to scan 1D barcodes if they are present on the DL.
     * If NO, just PDF417 barcode will be scanned.
     */
    usdlRecognizerSettings.scan1DCodes = NO;

    return usdlRecognizerSettings;
}

- (PPBarDecoderRecognizerSettings *)barDecoderRecognizerSettings {

    PPBarDecoderRecognizerSettings *barDecoderRecognizerSettings = [[PPBarDecoderRecognizerSettings alloc] init];

    /********* All recognizer settings are set to their default values. Change accordingly. *********/

    /**
     * Set this to YES to scan Code 39 barcodes
     */
    barDecoderRecognizerSettings.scanCode39 = YES;

    /**
     * Set this to YES to scan Code 128 barcodes
     */
    barDecoderRecognizerSettings.scanCode128 = YES;

    /**
     * Set this to YES to allow scanning barcodes with inverted intensities
     * (i.e. white barcodes on black background)
     * @warning: this options doubles the frame processing time
     */
    barDecoderRecognizerSettings.scanInverse = NO;

    /**
     * Use automatic scale detection feature. This normally should not be used.
     * The only situation where this helps in getting better scanning results is
     * when using kPPUseVideoPresetPhoto on iPad devices.
     * Video preview resoution of 2045x1536 in that case is very large and autoscale helps.
     */
    barDecoderRecognizerSettings.autoDetectScale = NO;

    /**
     * Set this to YES to enable scanning of lower resolution barcodes
     * at cost of additional processing time.
     */
    barDecoderRecognizerSettings.tryHarder = NO;

    return barDecoderRecognizerSettings;
}

- (PPZXingRecognizerSettings *)zxingRecognizerSettings {

    PPZXingRecognizerSettings *zxingRecognizerSettings = [[PPZXingRecognizerSettings alloc] init];

    /********* All recognizer settings are set to their default values. To use Zxing Recognizer you must set atleast 1 standard which will be used to true. *********/

    /**
     * Set this to YES to scan Aztec 2D barcodes
     */
    zxingRecognizerSettings.scanAztec = NO;

    /**
     * Set this to YES to scan Code 128 1D barcodes
     */
    zxingRecognizerSettings.scanCode128 = YES;

    /**
     * Set this to YES to scan Code 39 1D barcodes
     */
    zxingRecognizerSettings.scanCode39 = YES;

    /**
     * Set this to YES to scan DataMatrix 2D barcodes
     */
    zxingRecognizerSettings.scanDataMatrix = NO;

    /**
     * Set this to YES to scan EAN 13 barcodes
     */
    zxingRecognizerSettings.scanEAN13 = YES;

    /**
     * Set this to YES to scan EAN8 barcodes
     */
    zxingRecognizerSettings.scanEAN8 = YES;

    /**
     * Set this to YES to scan ITF barcodes
     */
    zxingRecognizerSettings.scanITF = NO;

    /**
     * Set this to YES to scan QR barcodes
     */
    zxingRecognizerSettings.scanQR = YES;

    /**
     * Set this to YES to scan UPCA barcodes
     */
    zxingRecognizerSettings.scanUPCA = YES;

    /**
     * Set this to YES to scan UPCE barcodes
     */
    zxingRecognizerSettings.scanUPCE = YES;

    /**
     * Set this to YES to allow scanning barcodes with inverted intensities
     * (i.e. white barcodes on black background)
     * @Warning: this option doubles frame processing time
     */
    zxingRecognizerSettings.scanInverse = NO;
    
    return zxingRecognizerSettings;
}

- (PPMrtdRecognizerSettings *)mrtdRecognizerSettings {

    PPMrtdRecognizerSettings *mrtdRecognizerSettings = [[PPMrtdRecognizerSettings alloc] init];

    /********* All recognizer settings are set to their default values. Change accordingly. *********/


    // Setting this will give you the chance to parse MRZ result, if Mrtd recognizer wasn't
    // successful in parsing (this can happen since MRZ isn't always formatted accoring to ICAO Document 9303 standard.
    // @see http://www.icao.int/Security/mrtd/pages/Document9303.aspx
    mrtdRecognizerSettings.allowUnparsedResults = NO;

    // This is useful if you're at the same time obtaining Dewarped image metadata, since it allows you to obtain dewarped and cropped
    // images of MRTD documents. Dewarped images are returned to scanningViewController:didOutputMetadata: callback,
    // as PPImageMetadata objects with name @"MRTD"
    mrtdRecognizerSettings.dewarpFullDocument = NO;

    return mrtdRecognizerSettings;
}

- (PPUkdlRecognizerSettings *)ukdlRecognizerSettings {

    PPUkdlRecognizerSettings *ukdlRecognizerSettings = [[PPUkdlRecognizerSettings alloc] init];

    /********* All recognizer settings are set to their default values. Change accordingly. *********/

    /**
     * If YES, document issue date will be extracted
     * Set this to NO if youre not interested in this data to speed up the scanning process!
     */
    ukdlRecognizerSettings.extractIssueDate = YES;

    /**
     * If YES, document expiry date will be extracted
     * Set this to NO if youre not interested in this data to speed up the scanning process!
     */
    ukdlRecognizerSettings.extractExpiryDate = YES;

    /**
     * If YES, owner's address will be extracted
     * Set this to NO if youre not interested in this data to speed up the scanning process!
     */
    ukdlRecognizerSettings.extractAddress = YES;


    return ukdlRecognizerSettings;
}

- (PPMyKadRecognizerSettings *)myKadRecognizerSettings {

    PPMyKadRecognizerSettings *myKadRecognizerSettings = [[PPMyKadRecognizerSettings alloc] init];

    /********* All recognizer settings are set to their default values. Change accordingly. *********/

    /**
     * If YES, full image of the document will be dewarped and returned via the API.
     */
    myKadRecognizerSettings.showFullDocument = NO;

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

- (BOOL)shouldUseZxingRecognizerForTypes:(NSArray *)types {

    return [types containsObject:@"Zxing"];
}

- (BOOL)shouldUseMrtdRecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"MRTD"];
}

- (BOOL)shouldUseUkdlRecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"UKDL"];
}

- (BOOL)shouldUseMyKadRecognizerForTypes:(NSArray *)types {
    return [types containsObject:@"MyKad"];
}

#pragma mark - Main

- (PPCoordinator *)coordinatorWithError:(NSError**)error {

    /** 0. Check if scanning is supported */

    if ([PPCoordinator isScanningUnsupported:error]) {
        return nil;
    }

    NSArray* types = [self.lastCommand argumentAtIndex:0];

    /** 1. Initialize the Scanning settings */

    // Initialize the scanner settings object. This initialize settings with all default values.
    PPSettings *settings = [[PPSettings alloc] init];

    // Set PPCameraPresetOptimal for very dense or lower quality barcodes
    settings.cameraSettings.cameraPreset = PPCameraPresetOptimal;

    /** 2. Setup the license key */

    // Visit www.microblink.com to get the license key for your app
    settings.licenseSettings.licenseKey = [self.lastCommand argumentAtIndex:1];

    /**
     * 3. Set up what is being scanned. See detailed guides for specific use cases.
     * Here's an example for initializing PDF417 scanning
     */

    // Add PDF417 Recognizer setting to a list of used recognizer settings
    if ([self shouldUsePdf417RecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self pdf417RecognizerSettings]];
    }

    if ([self shouldUseZxingRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self zxingRecognizerSettings]];
    }

    if ([self shouldUseUsdlRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self usdlRecognizerSettings]];
    }

    if ([self shouldUseBarDecoderRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self barDecoderRecognizerSettings]];
    }

    if ([self shouldUseMrtdRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self mrtdRecognizerSettings]];
    }

    if ([self shouldUseUkdlRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self ukdlRecognizerSettings]];
    }

    if ([self shouldUseMyKadRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self myKadRecognizerSettings]];
    }

    /** 4. Initialize the Scanning Coordinator object */

    PPCoordinator *coordinator = [[PPCoordinator alloc] initWithSettings:settings];

    return coordinator;
}

- (void)scan:(CDVInvokedUrlCommand*)command {

    [self setLastCommand:command];

    /** Instantiate the scanning coordinator */
    NSError *error;
    PPCoordinator *coordinator = [self coordinatorWithError:&error];

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
    UIViewController<PPScanningViewController>* scanningViewController = [coordinator cameraViewControllerWithDelegate:self];

    /** You can use other presentation methods as well */
    [[self viewController] presentViewController:scanningViewController animated:YES completion:nil];
}

#pragma mark - Result Processing

- (void)setDictionary:(NSMutableDictionary*)dict withPdf417RecognizerResult:(PPPdf417RecognizerResult*)data {

    if ([data stringUsingGuessedEncoding]) {
        [dict setObject:[data stringUsingGuessedEncoding] forKey:@"data"];
    }

    [dict setObject:[PPRecognizerResult urlStringFromData:[data data]] forKey:@"raw"];
    [dict setObject:@"PDF417" forKey:@"type"];
    [dict setObject:@"Barcode result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary*)dict withZXingRecognizerResult:(PPZXingRecognizerResult*)data {

    if ([data stringUsingGuessedEncoding]) {
        [dict setObject:[data stringUsingGuessedEncoding] forKey:@"data"];
    }

    [dict setObject:[PPRecognizerResult urlStringFromData:[data data]] forKey:@"raw"];
    [dict setObject:[PPZXingRecognizerResult toTypeName:data.barcodeType] forKey:@"type"];
    [dict setObject:@"Barcode result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary*)dict withBarDecoderRecognizerResult:(PPBarDecoderRecognizerResult*)data {

    if ([data stringUsingGuessedEncoding]) {
        [dict setObject:[data stringUsingGuessedEncoding] forKey:@"data"];
    }

    [dict setObject:[PPRecognizerResult urlStringFromData:[data data]] forKey:@"raw"];
    [dict setObject:[PPBarDecoderRecognizerResult toTypeName:data.barcodeType] forKey:@"type"];
    [dict setObject:@"Barcode result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary*)dict withUsdlResult:(PPUsdlRecognizerResult*)usdlResult {
    [dict setObject:[usdlResult getAllStringElements] forKey:@"fields"];
    [dict setObject:@"USDL result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary*)dict withMrtdRecognizerResult:(PPMrtdRecognizerResult*)mrtdResult {
    [dict setObject:[mrtdResult getAllStringElements] forKey:@"fields"];
    [dict setObject:[mrtdResult mrzText] forKey:@"raw"];
    [dict setObject:@"MRTD result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary*)dict withUkdlRecognizerResult:(PPUkdlRecognizerResult*)ukdlResult {
    [dict setObject:[ukdlResult getAllStringElements] forKey:@"fields"];
    [dict setObject:@"UKDL result" forKey:@"resultType"];
}

- (void)setDictionary:(NSMutableDictionary*)dict withMyKadRecognizerResult:(PPMyKadRecognizerResult*)myKadResult {
    [dict setObject:[myKadResult getAllStringElements] forKey:@"fields"];
    [dict setObject:@"MyKad result" forKey:@"resultType"];
}

- (void)returnResults:(NSArray *)results cancelled:(BOOL)cancelled {

    NSMutableDictionary* resultDict = [[NSMutableDictionary alloc] init];
    [resultDict setObject:[NSNumber numberWithInt: (cancelled ? 1 : 0)] forKey:@"cancelled"];

    NSMutableArray *resultArray = [[NSMutableArray alloc] init];

    for (PPRecognizerResult* result in results) {

        if ([result isKindOfClass:[PPPdf417RecognizerResult class]]) {
            PPPdf417RecognizerResult *pdf417Result = (PPPdf417RecognizerResult *)result;

            NSMutableDictionary* dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withPdf417RecognizerResult:pdf417Result];

            [resultArray addObject:dict];
        }

        if ([result isKindOfClass:[PPZXingRecognizerResult class]]) {
            PPZXingRecognizerResult *zxingResult = (PPZXingRecognizerResult *)result;

            NSMutableDictionary* dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withZXingRecognizerResult:zxingResult];

            [resultArray addObject:dict];
        }

        if ([result isKindOfClass:[PPUsdlRecognizerResult class]]) {
            PPUsdlRecognizerResult *usdlResult = (PPUsdlRecognizerResult *)result;

            NSMutableDictionary* dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withUsdlResult:usdlResult];

            [resultArray addObject:dict];
        }

        if ([result isKindOfClass:[PPBarDecoderRecognizerResult class]]) {
            PPBarDecoderRecognizerResult *barDecoderResult = (PPBarDecoderRecognizerResult *)result;

            NSMutableDictionary* dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withBarDecoderRecognizerResult:barDecoderResult];

            [resultArray addObject:dict];
        }

        if ([result isKindOfClass:[PPMrtdRecognizerResult class]]) {
            PPMrtdRecognizerResult *mrtdDecoderResult = (PPMrtdRecognizerResult *)result;

            NSMutableDictionary* dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withMrtdRecognizerResult:mrtdDecoderResult];

            [resultArray addObject:dict];
        }

        if ([result isKindOfClass:[PPUkdlRecognizerResult class]]) {
            PPUkdlRecognizerResult *ukdlDecoderResult = (PPUkdlRecognizerResult *)result;

            NSMutableDictionary* dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withUkdlRecognizerResult:ukdlDecoderResult];

            [resultArray addObject:dict];
        }

        if ([result isKindOfClass:[PPMyKadRecognizerResult class]]) {
            PPMyKadRecognizerResult *myKadDecoderResult = (PPMyKadRecognizerResult *)result;

            NSMutableDictionary* dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withMyKadRecognizerResult:myKadDecoderResult];

            [resultArray addObject:dict];
        }
    };

    if ([resultArray count] > 0) {
        [resultDict setObject:resultArray forKey:@"resultList"];
    }

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:resultDict];

    /*
     NSString* js = [result toSuccessCallbackString:[[self lastCommand] callbackId]];

     [self writeJavascript:js];
     */

    [self.commandDelegate sendPluginResult:result callbackId:self.lastCommand.callbackId];

    // As scanning view controller is presented full screen and modally, dismiss it
    [[self viewController] dismissViewControllerAnimated:YES completion:nil];
}

- (void)returnError:(NSString*)message {
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                messageAsString:message];
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

- (void)scanningViewController:(UIViewController<PPScanningViewController> *)scanningViewController
                  didFindError:(NSError *)error {
    // Can be ignored. See description of the method
}

- (void)scanningViewControllerDidClose:(UIViewController<PPScanningViewController> *)scanningViewController {

    [self returnResults:nil cancelled:YES];

    // As scanning view controller is presented full screen and modally, dismiss it
    [[self viewController] dismissViewControllerAnimated:YES completion:nil];
}

- (void)scanningViewController:(UIViewController<PPScanningViewController> *)scanningViewController
              didOutputResults:(NSArray *)results {
    
    [self returnResults:results cancelled:(results == nil)];
    
    // As scanning view controller is presented full screen and modally, dismiss it
    [[self viewController] dismissViewControllerAnimated:YES completion:nil];
}

@end

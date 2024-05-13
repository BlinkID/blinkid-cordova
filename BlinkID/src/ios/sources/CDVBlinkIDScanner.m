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

#import "CDVBlinkIDScanner.h"

#import "MBOverlayViewControllerDelegate.h"
#import "MBRecognizerSerializers.h"
#import "MBOverlaySettingsSerializers.h"
#import "MBRecognizerWrapper.h"
#import "MBSerializationUtils.h"

#import <BlinkID/BlinkID.h>

@interface CDVPlugin () <MBOverlayViewControllerDelegate, MBScanningRecognizerRunnerDelegate, MBFirstSideFinishedRecognizerRunnerDelegate>

@property (nonatomic, retain) CDVInvokedUrlCommand *lastCommand;

@end

@interface CDVBlinkIDScanner ()

@property (nonatomic, strong) MBRecognizerCollection *recognizerCollection;
@property (nonatomic) id<MBRecognizerRunnerViewController> scanningViewController;
@property (nonatomic, strong) MBRecognizerRunner *recognizerRunner;

@property (class, nonatomic, readonly) NSString *RESULT_LIST;
@property (class, nonatomic, readonly) NSString *CANCELLED;
@property (class, nonatomic, readonly) NSString *EMPTY_IMAGE;
@property (class, nonatomic, readonly) NSString *INVALID_IMAGE_FORMAT;
@property (class, nonatomic, readonly) NSString *NO_DATA;
@property (class, nonatomic, readonly) int COMPRESSED_IMAGE_QUALITY;

@end

@implementation CDVBlinkIDScanner

@synthesize lastCommand;

/**
 Method  sanitizes the dictionary replaces all occurances of NSNull with nil

 @param dictionary JSON objects
 @return new dictionary with NSNull values replaced with nil
*/
- (NSDictionary *)sanitizeDictionary:(NSDictionary *)dictionary {
    NSMutableDictionary *mutableDictionary = [[NSMutableDictionary alloc] initWithDictionary:dictionary];
    for (NSString* key in dictionary.allKeys) {
        if (mutableDictionary[key] == [NSNull null]) {
            mutableDictionary[key] = nil;
        }
    }
    return mutableDictionary;
}

#pragma mark - Main
//MARK: scanning with camera
- (void)scanWithCamera:(CDVInvokedUrlCommand *)command {

    [self setLastCommand:command];

    NSDictionary *jsonOverlaySettings = [self sanitizeDictionary:[self.lastCommand argumentAtIndex:0]];
    NSDictionary *jsonRecognizerCollection = [self sanitizeDictionary:[self.lastCommand argumentAtIndex:1]];
    NSDictionary *jsonLicenses = [self sanitizeDictionary:[self.lastCommand argumentAtIndex:2]];

    [self setLicense:jsonLicenses];
    [self setLanguage:(NSString *)jsonOverlaySettings[@"language"] country:(NSString *)jsonOverlaySettings[@"country"]];

    self.recognizerCollection = [[MBRecognizerSerializers sharedInstance] deserializeRecognizerCollection:jsonRecognizerCollection];

    // create overlay VC
    MBOverlayViewController *overlayVC = [[MBOverlaySettingsSerializers sharedInstance] createOverlayViewController:jsonOverlaySettings recognizerCollection:self.recognizerCollection delegate:self];

    UIViewController<MBRecognizerRunnerViewController>* recognizerRunnerViewController = [MBViewControllerFactory recognizerRunnerViewControllerWithOverlayViewController:overlayVC];

    self.scanningViewController = recognizerRunnerViewController;

    /** You can use other presentation methods as well */
    [[self viewController] presentViewController:recognizerRunnerViewController animated:YES completion:nil];
}

//MARK: DirectAPI scanning
- (void)scanWithDirectApi:(CDVInvokedUrlCommand *)command {
    [self setLastCommand:command];
    NSDictionary *jsonRecognizerCollection = [self sanitizeDictionary:[self.lastCommand argumentAtIndex:0]];
    NSDictionary *jsonLicenses = [self sanitizeDictionary:[self.lastCommand argumentAtIndex:3]];
    
    [self setLicense:jsonLicenses];
    [self setupRecognizerRunner:jsonRecognizerCollection];
    
    if ([self.lastCommand argumentAtIndex:1] != nil) {
        UIImage * frontImage = [self convertbase64ToImage:[self.lastCommand argumentAtIndex:1]];
        if (!CGSizeEqualToSize(frontImage.size, CGSizeZero)) {
            [self processImage:[self convertbase64ToImage:[self.lastCommand argumentAtIndex:1]]];
        } else {
            [self handleDirectApiError:CDVBlinkIDScanner.INVALID_IMAGE_FORMAT];
        }
    } else {
        [self handleDirectApiError:CDVBlinkIDScanner.EMPTY_IMAGE];
    }
}

- (void)recognizerRunnerDidFinishRecognitionOfFirstSide:(MBRecognizerRunner *)recognizerRunner {
    if ([self.lastCommand argumentAtIndex:2] != nil  && !CGSizeEqualToSize([self convertbase64ToImage:[self.lastCommand argumentAtIndex:2]].size, CGSizeZero)) {
        [self processImage:[self convertbase64ToImage:[self.lastCommand argumentAtIndex:2]]];
    } else {
        [self handleJsonResult];
    }
}

- (void)recognizerRunner:(nonnull MBRecognizerRunner *)recognizerRunner didFinishScanningWithState:(MBRecognizerResultState)state {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (state == MBRecognizerResultStateValid || state == MBRecognizerResultStateUncertain) {
            [self handleJsonResult];
        } else if (state == MBRecognizerResultStateEmpty) {
            [self handleDirectApiError:CDVBlinkIDScanner.NO_DATA];
        }
    });
}

//setup the recognizer runner
- (void) setupRecognizerRunner:(NSDictionary *)jsonRecognizerCollection {
    self.recognizerCollection = [[MBRecognizerSerializers sharedInstance] deserializeRecognizerCollection:jsonRecognizerCollection];
    self.recognizerRunner = [[MBRecognizerRunner alloc] initWithRecognizerCollection:self.recognizerCollection];
    self.recognizerRunner.scanningRecognizerRunnerDelegate = self;
    self.recognizerRunner.metadataDelegates.firstSideFinishedRecognizerRunnerDelegate = self;
}

//convert the image to MBImage and process it
- (void)processImage:(UIImage *)originalImage {
    MBImage *image = [MBImage imageWithUIImage:originalImage];
    image.cameraFrame = NO;
    image.orientation = MBProcessingOrientationLeft;
    dispatch_queue_t _serialQueue = dispatch_queue_create("com.microblink.DirectAPI", DISPATCH_QUEUE_SERIAL);
    dispatch_async(_serialQueue, ^{
        [self.recognizerRunner processImage:image];
    });
}

//convert image from base64 to UIImage
-(UIImage*)convertbase64ToImage:(NSString *)base64Image {
    NSData *imageData = [[NSData alloc] initWithBase64EncodedString:base64Image options:NSDataBase64DecodingIgnoreUnknownCharacters];
    if (imageData) {
        UIImage *image = [UIImage imageWithData:imageData];
        return image;
    } else {
        return [UIImage new];
    }
}

//handle JSON results
- (void) handleJsonResult {
    NSMutableArray *jsonResults = [[NSMutableArray alloc] initWithCapacity:self.recognizerCollection.recognizerList.count];
    for (NSUInteger i = 0; i < self.recognizerCollection.recognizerList.count; ++i) {
        [jsonResults addObject:[[self.recognizerCollection.recognizerList objectAtIndex:i] serializeResult]];
    }

    NSDictionary *resultDict;
        resultDict = @{
            CDVBlinkIDScanner.CANCELLED: [NSNumber numberWithBool:NO],
            CDVBlinkIDScanner.RESULT_LIST: jsonResults
        };

    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:resultDict];
    [self.commandDelegate sendPluginResult:result callbackId:self.lastCommand.callbackId];
}

- (void)setLicense:(NSDictionary*) jsonLicense {
    __weak CDVBlinkIDScanner *weakSelf = self;
    
    if ([jsonLicense objectForKey:@"showTrialLicenseWarning"] != nil) {
        BOOL showTrialLicenseWarning = [[jsonLicense objectForKey:@"showTrialLicenseWarning"] boolValue];
        [MBMicroblinkSDK sharedInstance].showTrialLicenseWarning = showTrialLicenseWarning;
    }
    NSString* iosLicense = [jsonLicense objectForKey:@"ios"];
    if ([jsonLicense objectForKey:@"licensee"] != nil) {
        NSString *licensee = [jsonLicense objectForKey:@"licensee"];
        [[MBMicroblinkSDK sharedInstance] setLicenseKey:iosLicense andLicensee:licensee errorCallback:^(MBLicenseError licenseError) {
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[CDVBlinkIDScanner licenseErrorToString:licenseError]];
            [weakSelf.commandDelegate sendPluginResult:result callbackId:weakSelf.lastCommand.callbackId];
        }];
    }
    else {
        [[MBMicroblinkSDK sharedInstance] setLicenseKey:iosLicense errorCallback:^(MBLicenseError licenseError) {
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[CDVBlinkIDScanner licenseErrorToString:licenseError]];
            [weakSelf.commandDelegate sendPluginResult:result callbackId:weakSelf.lastCommand.callbackId];
        }];
    }

}

- (void)setLanguage:(NSString *)language country:(NSString *)country {
    if (language != nil) {
        if (country != nil && ![country isEqualToString:@""]) {
            MBMicroblinkApp.sharedInstance.language = [[language stringByAppendingString:@"-"] stringByAppendingString:country];
        } else {
            MBMicroblinkApp.sharedInstance.language = language;
        }
    }
}

- (void)overlayViewControllerDidFinishScanning:(MBOverlayViewController *)overlayViewController state:(MBRecognizerResultState)state {
    if (state != MBRecognizerResultStateEmpty) {
        [overlayViewController.recognizerRunnerViewController pauseScanning];
        // recognizers within self.recognizerCollection now have their results filled
        [self handleJsonResult];

        // dismiss recognizer runner view controller
        dispatch_async(dispatch_get_main_queue(), ^{
            [[self viewController] dismissViewControllerAnimated:YES completion:nil];
            self.recognizerCollection = nil;
            self.scanningViewController = nil;
        });
    }
}

- (void)overlayDidTapClose:(MBOverlayViewController *)overlayViewController {
    [[self viewController] dismissViewControllerAnimated:YES completion:nil];
    self.recognizerCollection = nil;
    self.scanningViewController = nil;
    NSDictionary *resultDict = @{
        CDVBlinkIDScanner.CANCELLED : [NSNumber numberWithBool:YES]
    };
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:resultDict];
    [self.commandDelegate sendPluginResult:result callbackId:self.lastCommand.callbackId];
}

+ (NSString *)RESULT_LIST {
    return @"resultList";
}

+ (NSString *)CANCELLED {
    return @"cancelled";
}

+ (NSString *)EMPTY_IMAGE {
    return @"The provided image for the 'frontImage' parameter is empty!";
}

+ (NSString *)INVALID_IMAGE_FORMAT {
    return @"Could not decode the Base64 image!";
}

+ (NSString *)NO_DATA {
    return @"Could not extract the information with DirectAPI!";
}

+ (int)COMPRESSED_IMAGE_QUALITY {
    return 90;
}

- (void) handleDirectApiError:(NSString*)errorString {
    self.recognizerCollection = nil;
    self.recognizerRunner = nil;
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:errorString];
    [self.commandDelegate sendPluginResult:result callbackId:self.lastCommand.callbackId];
}

+ (NSString *)licenseErrorToString:(MBLicenseError)licenseError {
    switch(licenseError) {
        case MBLicenseErrorNetworkRequired:
            return @"License error network required";
            break;
        case MBLicenseErrorUnableToDoRemoteLicenceCheck:
            return @"License error unable to do remote licence check";
            break;
        case MBLicenseErrorLicenseIsLocked:
            return @"License error license is locked";
            break;
        case MBLicenseErrorLicenseCheckFailed:
            return @"License error license check failed";
            break;
        case MBLicenseErrorInvalidLicense:
            return @"License error invalid license";
            break;
        case MBLicenseErrorPermissionExpired:
            return @"License error permission expired";
            break;
        case MBLicenseErrorPayloadCorrupted:
            return @"License error payload corrupted";
            break;
        case MBLicenseErrorPayloadSignatureVerificationFailed:
            return @"License error payload signature verification failed";
            break;
        case MBLicenseErrorIncorrectTokenState:
            return @"License error incorrect token state";
            break;
    }
}

@end
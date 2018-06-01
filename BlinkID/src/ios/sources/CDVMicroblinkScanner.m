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

#import "CDVMicroblinkScanner.h"

#import "MBOverlayViewControllerDelegate.h"

#import <MicroBlink/MicroBlink.h>

const NSString *RESULT_LIST = @"resultList";

const NSString *CANCELLED = @"cancelled";

const int COMPRESSED_IMAGE_QUALITY = 90;


@interface CDVPlugin () <MBOverlayViewControllerDelegate>

@property (nonatomic, retain) CDVInvokedUrlCommand *lastCommand;

@end

@interface CDVMicroblinkScanner ()

@property (nonatomic, strong) MBRecognizerCollection *recognizerCollection;
@property (nonatomic) id<MBRecognizerRunnerViewController> scanningViewController;

@end

@implementation CDVMicroblinkScanner

@synthesize lastCommand;

#pragma mark - Main
- (void)scanWithCamera:(CDVInvokedUrlCommand *)command {

    [self setLastCommand:command];

    NSDictionary *jsonOverlaySettings = [self.lastCommand argumentAtIndex:0];
    NSDictionary *jsonRecognizerCollection = [self.lastCommand argumentAtIndex:1];
    NSDictionary *jsonLicenses = [self.lastCommand argumentAtIndex:2];

    [self setLicense:jsonLicenses];

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

- (void)setLicense:(NSDictionary*) jsonLicense {
    NSString* iosLicense = [jsonLicense objectForKey:@"ios"];
    [[MBMicroblinkSDK sharedInstance] setLicenseKey:iosLicense];
}

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

    // Set specified language
    settings.uiSettings.language = [self.lastCommand argumentAtIndex:4 withDefault:nil];

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
    
    if ([self shouldUseDetectorRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self detectorRecognizerSettings]];
    }

    if ([self shouldUseDocumentFaceRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self documentFaceRecognizerSettings]];
    }
    
    if ([self shouldUseMyKadFrontRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self myKadFrontRecognizerSettings]];
    }

    if ([self shouldUseMyKadBackRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self myKadBackRecognizerSettings]];
    }

    if ([self shouldUseMyTenteraRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self myTenteraRecognizerSettings]];
    }

    if ([self shouldUseIKadRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self iKadRecognizerSettings]];
    }

    if ([self shouldUseIndonesiaRecognizerForTypes:types]) {
        [settings.scanSettings addRecognizerSettings:[self indonesiaRecognizerSettings]];
    }

    if ([self shouldUseGermanOldIDType:types]) {
        [settings.scanSettings addRecognizerSettings:[self germanOldIDRecognizerSettings]];
    }

    if ([self shouldUseGermanIDFrontType:types]) {
        [settings.scanSettings addRecognizerSettings:[self germanIDFrontRecognizerSettings]];
    }

    if ([self shouldUseGermanIDBackType:types]) {
        [settings.scanSettings addRecognizerSettings:[self germanIDBackRecognizerSettings]];
    }

    if ([self shouldUseGermanPassType:types]) {
        [settings.scanSettings addRecognizerSettings:[self germanPassportRecognizerSettings]];
    }
    
    if ([self shouldUseUaeIDBackType:types]) {
        [settings.scanSettings addRecognizerSettings:[self uaeBackRecognizerSettings]];
    }
    
    if ([self shouldUseUaeIDFrontType:types]) {
        [settings.scanSettings addRecognizerSettings:[self uaeFrontRecognizerSettings]];
    }

    if ([self shouldUseSingaporeIDFrontType:types]) {
        [settings.scanSettings addRecognizerSettings:[self singaporeDFrontRecognizerSettings]];
    }

    if ([self shouldUseSingaporeIDBackType:types]) {
        [settings.scanSettings addRecognizerSettings:[self singaporeIDBackRecognizerSettings]];
    }
    /** 4. Initialize the Scanning Coordinator object */
    
    PPCameraCoordinator *coordinator = [[PPCameraCoordinator alloc] initWithSettings:settings];
    
    return coordinator;
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
    [stringElements setObject:[mrtdResult rawDateOfBirth] forKey:MRTD_DATE_OF_BIRTH];
    [stringElements setObject:[mrtdResult rawDateOfExpiry] forKey:MRTD_DATE_OF_EXPIRY];
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

- (void)setDictionary:(NSMutableDictionary *)dict withMyKadFrontRecognizerResult:(PPMyKadFrontRecognizerResult *)myKadFrontResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[myKadFrontResult getAllStringElements]];
    [stringElements setObject:[myKadFrontResult rawOwnerBirthDate] forKey:MYKAD_FRONT_OWNER_BIRTH_DATE];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:MYKAD_FRONT_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:myKadFrontResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withMyKadBackRecognizerResult:(PPMyKadBackRecognizerResult *)myKadBackResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[myKadBackResult getAllStringElements]];
    [stringElements setObject:[myKadBackResult rawOwnerBirthDate] forKey:MYKAD_BACK_OWNER_BIRTH_DATE];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:MYKAD_BACK_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:myKadBackResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withMyTenteraRecognizerResult:(PPMyTenteraRecognizerResult *)myTenteraResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[myTenteraResult getAllStringElements]];
    [stringElements setObject:[myTenteraResult rawOwnerBirthDate] forKey:MYTENTERA_OWNER_BIRTH_DATE];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:MYTENTERA_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:myTenteraResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withIKadRecognizerResult:(PPiKadRecognizerResult *)iKadResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[iKadResult getAllStringElements]];
    [stringElements setObject:[iKadResult rawDateOfBirth] forKey:IKAD_DATE_OF_BIRTH];
    [stringElements setObject:[iKadResult rawExpiryDate] forKey:IKAD_EXPIRY_DATE];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:IKAD_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:iKadResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withIndonesiaRecognizerResult:(PPIndonesianIDFrontRecognizerResult *)indonesiaResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[indonesiaResult getAllStringElements]];
    [stringElements setObject:[indonesiaResult rawDateOfBirth] forKey:INDONESIA_DATE_OF_BIRTH];
    [stringElements setObject:[indonesiaResult rawDocumentDateOfExpiry] forKey:INDONESIA_DATE_OF_EXPIRY];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:INDONESIA_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:indonesiaResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withDocumentDetectorResult:(PPDetectorRecognizerResult *)detectorRecognizerResult {
    [dict setObject:[detectorRecognizerResult getAllStringElements] forKey:FIELDS];
    [dict setObject:DOCUMENTDETECTOR_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:detectorRecognizerResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withDocumentFaceResult:(PPDocumentFaceRecognizerResult *)documentFaceResult {
    [dict setObject:[documentFaceResult getAllStringElements] forKey:FIELDS];
    [dict setObject:DOCUMENTFACE_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:documentFaceResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withGermanOldIDRecognizerResult:(PPGermanOldIDRecognizerResult *)germanOldIDResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[germanOldIDResult getAllStringElements]];
    [stringElements setObject:[germanOldIDResult rawDateOfExpiry] forKey:MRTD_DATE_OF_EXPIRY];
    [stringElements setObject:[germanOldIDResult rawDateOfBirth] forKey:MRTD_DATE_OF_BIRTH];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:GERMAN_OLD_ID_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:germanOldIDResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withGermanIDFrontRecognizerResult:(PPGermanIDFrontRecognizerResult *)germanIDFrontResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[germanIDFrontResult getAllStringElements]];
    [stringElements setObject:[germanIDFrontResult rawDateOfExpiry] forKey:GERMAN_ID_DATE_OF_EXPIRY];
    [stringElements setObject:[germanIDFrontResult rawDateOfBirth] forKey:GERMAN_ID_DATE_OF_BIRTH];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:GERMAN_ID_FRONT_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:germanIDFrontResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withGermanIDBackRecognizerResult:(PPGermanIDBackRecognizerResult *)germanIDBackResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[germanIDBackResult getAllStringElements]];
    [stringElements setObject:[germanIDBackResult rawDateOfIssue] forKey:GERMAN_ID_DATE_OF_ISSUE];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:GERMAN_ID_BACK_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:germanIDBackResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withGermanPassportRecognizerResult:(PPGermanPassportRecognizerResult *)germanPassportResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[germanPassportResult getAllStringElements]];
    [stringElements setObject:[germanPassportResult rawDateOfExpiry] forKey:MRTD_DATE_OF_EXPIRY];
    [stringElements setObject:[germanPassportResult rawDateOfBirth] forKey:MRTD_DATE_OF_BIRTH];
    [stringElements setObject:[germanPassportResult rawDateOfIssue] forKey:GERMAN_PASS_DATE_OF_ISSUE];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:GERMAN_PASS_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:germanPassportResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withUaeIDBackRecognizerResult:(PPUnitedArabEmiratesIDBackRecognizerResult *)uaeIDBackResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[uaeIDBackResult getAllStringElements]];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:UAE_ID_BACK_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:uaeIDBackResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withUaeIDFrontRecognizerResult:(PPUnitedArabEmiratesIDFrontRecognizerResult *)uaeIDFrontResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[uaeIDFrontResult getAllStringElements]];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:UAE_ID_FRONT_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:uaeIDFrontResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withSingaporeIDFrontRecognizerResult:(PPSingaporeIDFrontRecognizerResult *)singaporeIDFrontResult {
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"dd-MM-yyyy"];
    [formatter setTimeZone:[NSTimeZone localTimeZone]];

    NSDate *dateOfBirth = [singaporeIDFrontResult dateOfBirth];
    NSString *stringDateOfBirth = [formatter stringFromDate:dateOfBirth];

    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[singaporeIDFrontResult getAllStringElements]];
    [stringElements setObject:stringDateOfBirth forKey:SINGAPORE_DATE_OF_BIRTH];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:SINGAPORE_ID_FRONT_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:singaporeIDFrontResult];
}

- (void)setDictionary:(NSMutableDictionary *)dict withSingaporeIDBackRecognizerResult:(PPSingaporeIDBackRecognizerResult *)singaporeIDBackResult {
    NSMutableDictionary *stringElements = [NSMutableDictionary dictionaryWithDictionary:[singaporeIDBackResult getAllStringElements]];
    [stringElements setObject:[singaporeIDBackResult rawDateOfIssue] forKey:SINGAPORE_DATE_OF_ISSUE];
    [dict setObject:stringElements forKey:FIELDS];
    [dict setObject:SINGAPORE_ID_BACK_RESULT_TYPE forKey:RESULT_TYPE];
    [self setupDictionary:dict withImagesForResult:singaporeIDBackResult];
}

- (void)returnResults:(NSArray *)results cancelled:(BOOL)cancelled {
    
    NSMutableDictionary *resultDict = [[NSMutableDictionary alloc] init];
    [resultDict setObject:[NSNumber numberWithInt:(cancelled ? 1 : 0)] forKey:CANCELLED];
    
    NSMutableArray *resultArray = [[NSMutableArray alloc] init];
    
    for (PPRecognizerResult *result in results) {

        if ([result isKindOfClass:[PPGermanOldIDRecognizerResult class]]) {
            PPGermanOldIDRecognizerResult *germanOldIDDecoderResult = (PPGermanOldIDRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withGermanOldIDRecognizerResult:germanOldIDDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPGermanIDFrontRecognizerResult class]]) {
            PPGermanIDFrontRecognizerResult *germanIDFrontDecoderResult = (PPGermanIDFrontRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withGermanIDFrontRecognizerResult:germanIDFrontDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPGermanIDBackRecognizerResult class]]) {
            PPGermanIDBackRecognizerResult *germanIDBackDecoderResult = (PPGermanIDBackRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withGermanIDBackRecognizerResult:germanIDBackDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPGermanPassportRecognizerResult class]]) {
            PPGermanPassportRecognizerResult *germanPassportDecoderResult = (PPGermanPassportRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withGermanPassportRecognizerResult:germanPassportDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPPdf417RecognizerResult class]]) {
            PPPdf417RecognizerResult *pdf417Result = (PPPdf417RecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withPdf417RecognizerResult:pdf417Result];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPBarcodeRecognizerResult class]]) {
            PPBarcodeRecognizerResult *barcodeRecognizerResult = (PPBarcodeRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withBarcodeRecognizerResult:barcodeRecognizerResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPUsdlRecognizerResult class]]) {
            PPUsdlRecognizerResult *usdlResult = (PPUsdlRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withUsdlResult:usdlResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPMrtdRecognizerResult class]]) {
            PPMrtdRecognizerResult *mrtdDecoderResult = (PPMrtdRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withMrtdRecognizerResult:mrtdDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPEudlRecognizerResult class]]) {
            PPEudlRecognizerResult *eudlDecoderResult = (PPEudlRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withEudlRecognizerResult:eudlDecoderResult];

            [resultArray addObject:dict];
            continue;
        }
        
        if ([result isKindOfClass:[PPMyKadFrontRecognizerResult class]]) {
            PPMyKadFrontRecognizerResult *myKadFrontDecoderResult = (PPMyKadFrontRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withMyKadFrontRecognizerResult:myKadFrontDecoderResult];
            
            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPMyKadBackRecognizerResult class]]) {
            PPMyKadBackRecognizerResult *myKadBackDecoderResult = (PPMyKadBackRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withMyKadBackRecognizerResult:myKadBackDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPMyTenteraRecognizerResult class]]) {
            PPMyTenteraRecognizerResult *myTenteraDecoderResult = (PPMyTenteraRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withMyTenteraRecognizerResult:myTenteraDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPiKadRecognizerResult class]]) {
            PPiKadRecognizerResult *iKadDecoderResult = (PPiKadRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withIKadRecognizerResult:iKadDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPIndonesianIDFrontRecognizerResult class]]) {
            PPIndonesianIDFrontRecognizerResult *indonesiaDecoderResult = (PPIndonesianIDFrontRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withIndonesiaRecognizerResult:indonesiaDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPUnitedArabEmiratesIDBackRecognizerResult class]]) {
            PPUnitedArabEmiratesIDBackRecognizerResult *uaeIDBackResult = (PPUnitedArabEmiratesIDBackRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withUaeIDBackRecognizerResult:uaeIDBackResult];
            
            [resultArray addObject:dict];
            continue;
        }
        
        if ([result isKindOfClass:[PPUnitedArabEmiratesIDFrontRecognizerResult class]]) {
            PPUnitedArabEmiratesIDFrontRecognizerResult *uaeIDFrontResult = (PPUnitedArabEmiratesIDFrontRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withUaeIDFrontRecognizerResult:uaeIDFrontResult];
            
            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPSingaporeIDFrontRecognizerResult class]]) {
            PPSingaporeIDFrontRecognizerResult *singaporeIDFrontDecoderResult = (PPSingaporeIDFrontRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withSingaporeIDFrontRecognizerResult:singaporeIDFrontDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPSingaporeIDBackRecognizerResult class]]) {
            PPSingaporeIDBackRecognizerResult *singaporeIDBackDecoderResult = (PPSingaporeIDBackRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withSingaporeIDBackRecognizerResult:singaporeIDBackDecoderResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPDetectorRecognizerResult class]]) {
            PPDetectorRecognizerResult *documentDetectorResult = (PPDetectorRecognizerResult *)result;

            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withDocumentDetectorResult:documentDetectorResult];

            [resultArray addObject:dict];
            continue;
        }

        if ([result isKindOfClass:[PPDocumentFaceRecognizerResult class]]) {
            PPDocumentFaceRecognizerResult *documentFaceResult = (PPDocumentFaceRecognizerResult *)result;
            
            NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
            [self setDictionary:dict withDocumentFaceResult:documentFaceResult];

            [resultArray addObject:dict];
            continue;
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
            [self setImageMetadata:imageMetadata forName:[PPMyKadFrontRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPMyKadFrontRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPMyKadBackRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPMyKadBackRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPMyTenteraRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPMyTenteraRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPiKadRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPiKadRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPIndonesianIDFrontRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPIndonesianIDFrontRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPEudlRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPEudlRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPGermanOldIDRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPGermanOldIDRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPGermanIDFrontRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPGermanIDFrontRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPGermanIDBackRecognizerSettings ID_FULL_DOCUMENT] imageType:PPImageTypeDocument resultClass:[PPGermanIDBackRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPGermanPassportRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPGermanPassportRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPUnitedArabEmiratesIDBackRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPUnitedArabEmiratesIDBackRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPUnitedArabEmiratesIDFrontRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPUnitedArabEmiratesIDFrontRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPSingaporeIDFrontRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPSingaporeIDFrontRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPSingaporeIDBackRecognizerSettings FULL_DOCUMENT_IMAGE] imageType:PPImageTypeDocument resultClass:[PPSingaporeIDBackRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:DOCUMENTDETECTOR_ID1_NAME imageType:PPImageTypeDocument resultClass:[PPDetectorRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:DOCUMENTDETECTOR_ID1_NAME imageType:PPImageTypeDocument resultClass:[PPDetectorRecognizerResult class]];

            [self setImageMetadata:imageMetadata forName:[PPMyKadFrontRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPMyKadFrontRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPiKadRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPiKadRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPIndonesianIDFrontRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPIndonesianIDFrontRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPMyTenteraRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPMyTenteraRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPDocumentFaceRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPDocumentFaceRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPGermanOldIDRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPGermanOldIDRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPGermanIDFrontRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPGermanIDFrontRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPGermanPassportRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPGermanPassportRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPUnitedArabEmiratesIDFrontRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPUnitedArabEmiratesIDFrontRecognizerResult class]];
            [self setImageMetadata:imageMetadata forName:[PPSingaporeIDFrontRecognizerSettings ID_FACE] imageType:PPImageTypeFace resultClass:[PPSingaporeIDFrontRecognizerResult class]];
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

#import "MBGermanyDlFrontRecognizerWrapper.h"
#import "MBSerializationUtils.h"
#import "MBBlinkIDSerializationUtils.h"

@implementation MBGermanyDlFrontRecognizerCreator

@synthesize jsonName = _jsonName;

-(instancetype) init {
    self = [super init];
    if (self) {
        _jsonName = @"GermanyDlFrontRecognizer";
    }
    return self;
}

-(MBRecognizer *) createRecognizer:(NSDictionary*) jsonRecognizer {
    MBGermanyDlFrontRecognizer *recognizer = [[MBGermanyDlFrontRecognizer alloc] init];
    {
        id detectGlare = [jsonRecognizer valueForKey:@"detectGlare"];
        if (detectGlare != nil) {
            recognizer.detectGlare = [(NSNumber *)detectGlare boolValue];
        }
    }
    {
        id extractDateOfBirth = [jsonRecognizer valueForKey:@"extractDateOfBirth"];
        if (extractDateOfBirth != nil) {
            recognizer.extractDateOfBirth = [(NSNumber *)extractDateOfBirth boolValue];
        }
    }
    {
        id extractDateOfExpiry = [jsonRecognizer valueForKey:@"extractDateOfExpiry"];
        if (extractDateOfExpiry != nil) {
            recognizer.extractDateOfExpiry = [(NSNumber *)extractDateOfExpiry boolValue];
        }
    }
    {
        id extractDateOfIssue = [jsonRecognizer valueForKey:@"extractDateOfIssue"];
        if (extractDateOfIssue != nil) {
            recognizer.extractDateOfIssue = [(NSNumber *)extractDateOfIssue boolValue];
        }
    }
    {
        id extractFirstName = [jsonRecognizer valueForKey:@"extractFirstName"];
        if (extractFirstName != nil) {
            recognizer.extractFirstName = [(NSNumber *)extractFirstName boolValue];
        }
    }
    {
        id extractIssuingAuthority = [jsonRecognizer valueForKey:@"extractIssuingAuthority"];
        if (extractIssuingAuthority != nil) {
            recognizer.extractIssuingAuthority = [(NSNumber *)extractIssuingAuthority boolValue];
        }
    }
    {
        id extractLastName = [jsonRecognizer valueForKey:@"extractLastName"];
        if (extractLastName != nil) {
            recognizer.extractLastName = [(NSNumber *)extractLastName boolValue];
        }
    }
    {
        id extractLicenceCategories = [jsonRecognizer valueForKey:@"extractLicenceCategories"];
        if (extractLicenceCategories != nil) {
            recognizer.extractLicenceCategories = [(NSNumber *)extractLicenceCategories boolValue];
        }
    }
    {
        id extractPlaceOfBirth = [jsonRecognizer valueForKey:@"extractPlaceOfBirth"];
        if (extractPlaceOfBirth != nil) {
            recognizer.extractPlaceOfBirth = [(NSNumber *)extractPlaceOfBirth boolValue];
        }
    }
    {
        id faceImageDpi = [jsonRecognizer valueForKey:@"faceImageDpi"];
        if (faceImageDpi != nil) {
            recognizer.faceImageDpi = [(NSNumber *)faceImageDpi unsignedIntegerValue];
        }
    }
    {
        id fullDocumentImageDpi = [jsonRecognizer valueForKey:@"fullDocumentImageDpi"];
        if (fullDocumentImageDpi != nil) {
            recognizer.fullDocumentImageDpi = [(NSNumber *)fullDocumentImageDpi unsignedIntegerValue];
        }
    }
    {
        id fullDocumentImageExtensionFactors = [jsonRecognizer valueForKey:@"fullDocumentImageExtensionFactors"];
        if (fullDocumentImageExtensionFactors != nil) {
            recognizer.fullDocumentImageExtensionFactors = [MBBlinkIDSerializationUtils deserializeMBImageExtensionFactors:(NSDictionary*)fullDocumentImageExtensionFactors];
        }
    }
    {
        id returnFaceImage = [jsonRecognizer valueForKey:@"returnFaceImage"];
        if (returnFaceImage != nil) {
            recognizer.returnFaceImage = [(NSNumber *)returnFaceImage boolValue];
        }
    }
    {
        id returnFullDocumentImage = [jsonRecognizer valueForKey:@"returnFullDocumentImage"];
        if (returnFullDocumentImage != nil) {
            recognizer.returnFullDocumentImage = [(NSNumber *)returnFullDocumentImage boolValue];
        }
    }
    {
        id returnSignatureImage = [jsonRecognizer valueForKey:@"returnSignatureImage"];
        if (returnSignatureImage != nil) {
            recognizer.returnSignatureImage = [(NSNumber *)returnSignatureImage boolValue];
        }
    }
    {
        id signatureImageDpi = [jsonRecognizer valueForKey:@"signatureImageDpi"];
        if (signatureImageDpi != nil) {
            recognizer.signatureImageDpi = [(NSNumber *)signatureImageDpi unsignedIntegerValue];
        }
    }

    return recognizer;
}

@end

@interface MBGermanyDlFrontRecognizer (JsonSerialization)
@end

@implementation MBGermanyDlFrontRecognizer (JsonSerialization)

-(NSDictionary *) serializeResult {
    NSMutableDictionary* jsonResult = (NSMutableDictionary*)[super serializeResult];
    [jsonResult setValue:[MBSerializationUtils serializeMBDateResult:self.result.dateOfBirth] forKey:@"dateOfBirth"];
    [jsonResult setValue:[MBSerializationUtils serializeMBDateResult:self.result.dateOfExpiry] forKey:@"dateOfExpiry"];
    [jsonResult setValue:[MBSerializationUtils serializeMBDateResult:self.result.dateOfIssue] forKey:@"dateOfIssue"];
    [jsonResult setValue:[MBSerializationUtils encodeMBImage:self.result.faceImage] forKey:@"faceImage"];
    [jsonResult setValue:self.result.firstName forKey:@"firstName"];
    [jsonResult setValue:[MBSerializationUtils encodeMBImage:self.result.fullDocumentImage] forKey:@"fullDocumentImage"];
    [jsonResult setValue:self.result.issuingAuthority forKey:@"issuingAuthority"];
    [jsonResult setValue:self.result.lastName forKey:@"lastName"];
    [jsonResult setValue:self.result.licenceCategories forKey:@"licenceCategories"];
    [jsonResult setValue:self.result.licenceNumber forKey:@"licenceNumber"];
    [jsonResult setValue:self.result.placeOfBirth forKey:@"placeOfBirth"];
    [jsonResult setValue:[MBSerializationUtils encodeMBImage:self.result.signatureImage] forKey:@"signatureImage"];

    return jsonResult;
}

@end
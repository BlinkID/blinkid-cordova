#import "MBBlinkCardRecognizerWrapper.h"
#import "MBSerializationUtils.h"
#import "MBBlinkIDSerializationUtils.h"

@implementation MBBlinkCardRecognizerCreator

@synthesize jsonName = _jsonName;

-(instancetype) init {
    self = [super init];
    if (self) {
        _jsonName = @"BlinkCardRecognizer";
    }
    return self;
}

-(MBRecognizer *) createRecognizer:(NSDictionary*) jsonRecognizer {
    MBBlinkCardRecognizer *recognizer = [[MBBlinkCardRecognizer alloc] init];
    {
        id anonymizeCardNumber = [jsonRecognizer valueForKey:@"anonymizeCardNumber"];
        if (anonymizeCardNumber != nil) {
            recognizer.anonymizeCardNumber = [(NSNumber *)anonymizeCardNumber boolValue];
        }
    }
    {
        id anonymizeCvv = [jsonRecognizer valueForKey:@"anonymizeCvv"];
        if (anonymizeCvv != nil) {
            recognizer.anonymizeCvv = [(NSNumber *)anonymizeCvv boolValue];
        }
    }
    {
        id anonymizeOwner = [jsonRecognizer valueForKey:@"anonymizeOwner"];
        if (anonymizeOwner != nil) {
            recognizer.anonymizeOwner = [(NSNumber *)anonymizeOwner boolValue];
        }
    }
    {
        id detectGlare = [jsonRecognizer valueForKey:@"detectGlare"];
        if (detectGlare != nil) {
            recognizer.detectGlare = [(NSNumber *)detectGlare boolValue];
        }
    }
    {
        id extractCvv = [jsonRecognizer valueForKey:@"extractCvv"];
        if (extractCvv != nil) {
            recognizer.extractCvv = [(NSNumber *)extractCvv boolValue];
        }
    }
    {
        id extractInventoryNumber = [jsonRecognizer valueForKey:@"extractInventoryNumber"];
        if (extractInventoryNumber != nil) {
            recognizer.extractInventoryNumber = [(NSNumber *)extractInventoryNumber boolValue];
        }
    }
    {
        id extractOwner = [jsonRecognizer valueForKey:@"extractOwner"];
        if (extractOwner != nil) {
            recognizer.extractOwner = [(NSNumber *)extractOwner boolValue];
        }
    }
    {
        id extractValidThru = [jsonRecognizer valueForKey:@"extractValidThru"];
        if (extractValidThru != nil) {
            recognizer.extractValidThru = [(NSNumber *)extractValidThru boolValue];
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
        id returnFullDocumentImage = [jsonRecognizer valueForKey:@"returnFullDocumentImage"];
        if (returnFullDocumentImage != nil) {
            recognizer.returnFullDocumentImage = [(NSNumber *)returnFullDocumentImage boolValue];
        }
    }
    {
        id signResult = [jsonRecognizer valueForKey:@"signResult"];
        if (signResult != nil) {
            recognizer.signResult = [(NSNumber *)signResult boolValue];
        }
    }

    return recognizer;
}

@end

@interface MBBlinkCardRecognizer (JsonSerialization)
@end

@implementation MBBlinkCardRecognizer (JsonSerialization)

-(NSDictionary *) serializeResult {
    NSMutableDictionary* jsonResult = (NSMutableDictionary*)[super serializeResult];
    [jsonResult setValue:self.result.cardNumber forKey:@"cardNumber"];
    [jsonResult setValue:self.result.cvv forKey:@"cvv"];
    [jsonResult setValue:[self.result.digitalSignature base64EncodedStringWithOptions:0] forKey:@"digitalSignature"];
    [jsonResult setValue:[NSNumber numberWithUnsignedInteger:self.result.digitalSignatureVersion] forKey:@"digitalSignatureVersion"];
    [jsonResult setValue:[NSNumber numberWithBool:self.result.documentDataMatch] forKey:@"documentDataMatch"];
    [jsonResult setValue:[MBSerializationUtils encodeMBImage:self.result.fullDocumentBackImage] forKey:@"fullDocumentBackImage"];
    [jsonResult setValue:[MBSerializationUtils encodeMBImage:self.result.fullDocumentFrontImage] forKey:@"fullDocumentFrontImage"];
    [jsonResult setValue:self.result.inventoryNumber forKey:@"inventoryNumber"];
    [jsonResult setValue:[NSNumber numberWithInteger:(self.result.issuer + 1)] forKey:@"issuer"];
    [jsonResult setValue:self.result.owner forKey:@"owner"];
    [jsonResult setValue:[NSNumber numberWithBool:self.result.scanningFirstSideDone] forKey:@"scanningFirstSideDone"];
    [jsonResult setValue:[MBSerializationUtils serializeMBDateResult:self.result.validThru] forKey:@"validThru"];

    return jsonResult;
}

@end
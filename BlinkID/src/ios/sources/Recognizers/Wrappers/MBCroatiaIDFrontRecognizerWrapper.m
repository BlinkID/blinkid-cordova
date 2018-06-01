//
//  MBCroatiaIDFrontRecognizerWrapper.m
//  BlinkIdDevDemo
//
//  Created by DoDo on 01/06/2018.
//

#import "MBCroatiaIDFrontRecognizerWrapper.h"
#import "MBSerializationUtils.h"

@implementation MBCroatiaIDFrontRecognizerWrapper

@synthesize jsonName = _jsonName;

-(instancetype) init {
    self = [super init];
    if (self) {
        _jsonName = @"CroatiaIDFrontSideRecognizer";
    }
    return self;
}

-(MBRecognizer *) createRecognizer:(NSDictionary*) jsonRecognizer {
    MBCroIDFrontRecognizer *recognizer = [[MBCroIDFrontRecognizer alloc] init];

    {
        id detectGlare = [jsonRecognizer valueForKey:@"detectGlare"];
        if (detectGlare != nil) {
            recognizer.detectGlare = [(NSNumber *)detectGlare boolValue];
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

    return recognizer;
}

@end

@interface MBCroIDFrontRecognizer (JsonSerialization)
@end

@implementation MBCroIDFrontRecognizer (JsonSerialization)

-(NSDictionary *) serializeResult {
    NSMutableDictionary* jsonResult = (NSMutableDictionary*)[super serializeResult];

    [jsonResult setObject:self.result.citizenship forKey:@"citizenship"];
    [jsonResult setObject:[MBSerializationUtils serializeNSDate:self.result.dateOfBirth] forKey:@"dateOfBirth"];
    [jsonResult setObject:[MBSerializationUtils serializeNSDate:self.result.documentDateOfExpiry] forKey:@"documentDateOfExpiry"];

    return jsonResult;
}

@end

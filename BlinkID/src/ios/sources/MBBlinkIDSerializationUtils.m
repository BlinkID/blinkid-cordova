//
//  MBBlinkIDSerializationUtils.m
//  BlinkIdDevDemo
//
//  Created by DoDo on 04/06/2018.
//

#import "MBBlinkIDSerializationUtils.h"
#import "MBSerializationUtils.h"

@implementation MBBlinkIDSerializationUtils

+(NSDictionary *) serializeMRZResult:(MBMRZResult *)mrzResult {
    NSMutableDictionary *jsonMrz = [[NSMutableDictionary alloc] init];

    [jsonMrz setObject:[NSNumber numberWithInteger:(mrzResult.documentType + 1)] forKey:@"documentType"];
    [jsonMrz setObject:mrzResult.primaryID forKey:@"primaryId"];
    [jsonMrz setObject:mrzResult.secondaryID forKey:@"secondaryId"];
    [jsonMrz setObject:mrzResult.issuer forKey:@"issuer"];
    [jsonMrz setObject:[MBSerializationUtils serializeMBDateResult:mrzResult.dateOfBirth] forKey:@"dateOfBirth"];
    [jsonMrz setObject:mrzResult.documentNumber forKey:@"documentNumber"];
    [jsonMrz setObject:mrzResult.nationality forKey:@"nationality"];
    [jsonMrz setObject:mrzResult.gender forKey:@"gender"];
    [jsonMrz setObject:mrzResult.documentCode forKey:@"documentCode"];
    [jsonMrz setObject:[MBSerializationUtils serializeMBDateResult:mrzResult.dateOfExpiry] forKey:@"dateOfExpiry"];
    [jsonMrz setObject:mrzResult.opt1 forKey:@"opt1"];
    [jsonMrz setObject:mrzResult.opt2 forKey:@"opt2"];
    [jsonMrz setObject:mrzResult.alienNumber forKey:@"alienNumber"];
    [jsonMrz setObject:mrzResult.applicationReceiptNumber forKey:@"applicationReceiptNumber"];
    [jsonMrz setObject:mrzResult.immigrantCaseNumber forKey:@"immigrantCaseNumber"];
    [jsonMrz setObject:mrzResult.mrzText forKey:@"mrzText"];
    [jsonMrz setObject:[NSNumber numberWithBool:mrzResult.isParsed] forKey:@"mrzParsed"];
    [jsonMrz setObject:[NSNumber numberWithBool:mrzResult.isVerified] forKey:@"mrzVerified"];

    return jsonMrz;
}

@end

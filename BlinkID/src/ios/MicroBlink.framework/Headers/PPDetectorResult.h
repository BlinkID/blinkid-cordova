//
//  PPDetectorResult.h
//  BlinkIdFramework
//
//  Created by Jura on 10/01/16.
//  Copyright © 2016 MicroBlink Ltd. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSUInteger, PPDetectionCode) {
    PPDetectionCodeFail = 0,
    PPDetectionCodeFallback,
    PPDetectionCodeSuccess,
};

typedef NS_ENUM(NSUInteger, PPDetectorResultType) {
    PPDetectorResultTypeQuadrangle,
    PPDetectorResultTypeDocument,
    PPDetectorResultTypeOcrLine,
    PPDetectorResultTypeMulti,
};

@interface PPDetectorResult : NSObject

@property (nonatomic, assign, readonly) PPDetectionCode code;

@property (nonatomic, assign, readonly) PPDetectorResultType type;

- (instancetype)initWithCode:(PPDetectionCode)code
                        type:(PPDetectorResultType)type NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;

@end

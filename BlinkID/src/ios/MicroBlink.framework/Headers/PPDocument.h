//
//  PPDocument.h
//  BlinkIdFramework
//
//  Created by Jura on 07/01/16.
//  Copyright © 2016 MicroBlink Ltd. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "PPDocumentDecodingInfo.h"

NS_ASSUME_NONNULL_BEGIN

struct DocumentImpl;
typedef struct DocumentImpl DocumentImpl;

/**
 * Document class describes a document which is being detected by DocumentDetector.
 */
PP_CLASS_AVAILABLE_IOS(6.0) @interface PPDocument : NSObject<NSCopying>

@property (nonatomic, readonly, assign) DocumentImpl *documentImpl;

/**
 * Use this initializer for specifiying a document format.
 *
 *  @param aspectRatio  Aspect ratio of the document. Calculated as width / height
 *  @param decodingInfo Decoding info for the document
 *
 *  @return initialized object
 */
- (instancetype)initWithAspectRatio:(CGFloat)aspectRatio
                       decodingInfo:(PPDocumentDecodingInfo *)decodingInfo;

// used for internal initialization
- (instancetype)initWithDocument:(DocumentImpl *)documentImpl NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
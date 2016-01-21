//
//  PPDocumentDetectorSettings.h
//  BlinkIdFramework
//
//  Created by Jura on 06/10/15.
//  Copyright © 2015 MicroBlink Ltd. All rights reserved.
//

#import "PPDetectorSettings.h"

#import "PPDocument.h"

PP_CLASS_AVAILABLE_IOS(6.0) @interface PPDocumentDetectorSettings : PPDetectorSettings

@property (nonatomic) NSUInteger numStableDetectionsThreshold;

- (instancetype)initWithNumStableDetectionsThreshold:(NSUInteger)threshold;

- (instancetype)initWithSettings:(DetectorSettingsImpl*)settings NS_UNAVAILABLE;

- (void)addDocument:(PPDocument *)document;

@end

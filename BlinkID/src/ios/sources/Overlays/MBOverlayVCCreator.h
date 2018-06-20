//
//  MBOverlaySettingsSerialization.h
//  BlinkIdDevDemo
//
//  Created by DoDo on 04/06/2018.
//

#pragma once

#import "MBOverlayViewControllerDelegate.h"

#import <MicroBlink/MicroBlink.h>
#import <Foundation/Foundation.h>

@protocol MBOverlayVCCreator
@required

-(MBOverlayViewController *) createOverlayViewController:(NSDictionary *)jsonOverlaySettings recognizerCollection:(MBRecognizerCollection*)recognizerCollection delegate:(id<MBOverlayViewControllerDelegate>) delegate;

@property (nonatomic, nonnull, readonly) NSString *jsonName;

@end

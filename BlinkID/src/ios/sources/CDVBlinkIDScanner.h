//
//  pdf417Plugin.h
//  CDVpdf417
//
//  Created by Jurica Cerovec, Marko Mihovilic on 10/01/13.
//  Copyright (c) 2013 Racuni.hr. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import <Cordova/CDV.h>

/**
 * BlinkID plugin class.
 * Responds to JS calls
 */
@interface CDVBlinkIDScanner : CDVPlugin

/**
 * Starts the scanning process
 */
- (void)scanWithCamera:(CDVInvokedUrlCommand *)command;
/**
 * Returns successful recognition
 */
- (void)returnResults:(NSArray *)results cancelled:(BOOL)cancelled;

/**
 * Returns error, for example, not supported pdf417
 */
- (void)returnError:(NSString *)message;

@end
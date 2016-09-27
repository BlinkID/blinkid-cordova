/**
 * cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) Matt Kane 2010
 * Copyright (c) 2011, IBM Corporation
 */


    var exec = require("cordova/exec");

    /**
     * Constructor.
     *
     * @returns {BlinkIdScanner}
     */
    function BlinkIdScanner() {

    };

/**
 * types: Types of supported scanners (pass as array of desired scanner types):
 *  "PDF417"
 *  "USDL"
 *  "Bar Decoder"
 *  "Zxing"
 *  "MRTD"
 *  "UKDL"
 *  "MyKad"
 *
 * imageType - image type that should be returned if image is captured (depends on used scanner):
 *  "IMAGE_NONE" : do not return image in scan result
 *  "IMAGE_SUCCESSFUL_SCAN" : return full camera frame of successful scan
 *  "IMAGE_CROPPED" : return cropped document image (successful scan)
 *
 * licenseiOS - iOS license key to enable all features (not required)
 * licenseAndroid - Android license key to enable all features (not required)
 */

    BlinkIdScanner.prototype.scan = function (successCallback, errorCallback, types, imageType, licenseiOs, licenseAndroid) {
        if (errorCallback == null) {
            errorCallback = function () {
            };
        }

        if (typeof errorCallback != "function") {
            console.log("BlinkIdScanner.scan failure: failure parameter not a function");
            return;
        }

        if (typeof successCallback != "function") {
            console.log("BlinkIdScanner.scan failure: success callback parameter must be a function");
            return;
        }

        exec(successCallback, errorCallback, 'BlinkIdScanner', 'scan', [types, imageType, licenseiOs, licenseAndroid]);
    };

    var blinkIdScanner = new BlinkIdScanner();
    module.exports = blinkIdScanner;


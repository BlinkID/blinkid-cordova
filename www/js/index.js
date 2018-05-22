/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// implement your decoding as you need it, this just does ASCII decoding
function hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        
        var resultDiv = document.getElementById('resultDiv');

        var successfulImageDiv = document.getElementById('successfulImageDiv');
        var successfulImage = document.getElementById('successfulImage');

        var documentImageDiv = document.getElementById('documentImageDiv');
        var documentImage = document.getElementById('documentImage');

        var faceImageDiv = document.getElementById('faceImageDiv');
        var faceImage = document.getElementById('faceImage');

        successfulImageDiv.style.visibility = "hidden"
        documentImageDiv.style.visibility = "hidden"
        faceImageDiv.style.visibility = "hidden"

        var croIdFrontRecognizer = new cordova.plugins.BlinkID.CroatianIDFrontSideRecognizer();
        croIdFrontRecognizer.returnFaceImage = true;
        croIdFrontRecognizer.returnFullDocumentImage = true;

        var documentOverlaySettings = new cordova.plugins.BlinkID.DocumentOverlaySettings();

        var recognizerCollection = new cordova.plugins.BlinkID.RecognizerCollection([croIdFrontRecognizer]);

        // package name/bundleID com.microblink.blinkid
        var licenseKeys = {
            android: 'sRwAAAAWY29tLm1pY3JvYmxpbmsuYmxpbmtpZJ9ew03yWSf86/uxZPHQ4PBK8Xl7FWLTK6DY3zACIj5Y0x0zqP44y/f9HU+1d+mmyadazZeUHHW+q8PwmDsV+5CmqxpFavyEK4t1dcw0O3GfwDQS1tenfQYsZqqY+KXf+XPW87FupyPD36m44rBiPhMuFnzhXOllkCBrAz8YWm1fqz/DiH5ZM8KU/ypLfW+ipg==',
            ios: 'sRwAAAEWY29tLm1pY3JvYmxpbmsuYmxpbmtpZFG2rW+L4lA0y++pNbwRi7nGsZAzUO+QVAJr1+O8efMlVH+Wjey5oFl4AdQ9Jwe7i+prTE8H/d0ewiwj5uTDe1G9UQ3DHqEiSFEthriGikq0UayY1qBPVZvUHPPlYJthjadbwRmT2kFcXyZPv3qtff/eMhcwDK9bR+VUlEz3G/YIfOEAXHMbPXzNPQVxPqwGww=='
        };

        scanButton.addEventListener('click', function() {
            cordova.plugins.BlinkID.scanWithCamera(
            
                // Register the callback handler
                function callback(cancelled) {
                    
                    // handle cancelled scanning
                    if (cancelled) {
                        resultDiv.innerHTML = "Cancelled!";
                        return;
                    }
                    
                    // if not cancelled, every recognizer will have its result property updated

                    successfulImageDiv.style.visibility = "hidden"
                    documentImageDiv.style.visibility = "hidden"
                    faceImageDiv.style.visibility = "hidden"

                    if (croIdFrontRecognizer.result.resultState == 'valid') {
                         // Document image is returned as Base64 encoded JPEG
                         var resultDocumentImage = croIdFrontRecognizer.result.fullDocumentImage;
                         if (resultDocumentImage) {
                             documentImage.src = "data:image/jpg;base64, " + resultDocumentImage;
                             documentImageDiv.style.visibility = "visible"
                         } else {
                             documentImageDiv.style.visibility = "hidden"
                         }
                        
                        // Face image is returned as Base64 encoded JPEG
                        var resultFaceImage = croIdFrontRecognizer.result.faceImage;
                        if (resultFaceImage) {
                            faceImage.src = "data:image/jpg;base64, " + resultFaceImage;
                            faceImageDiv.style.visibility = "visible"
                        } else {
                            faceImageDiv.style.visibility = "hidden"
                        }

                        // fill data
                        resultDiv.innerHTML = /** Personal information */
                                "First name: " + croIdFrontRecognizer.result.firstName + "<br>" +
                                "Last name: " + croIdFrontRecognizer.result.lastName + "<br>" +
                                "ID card number: " + croIdFrontRecognizer.result.identityCardNumber + "<br>" +
                                "Sex: " + croIdFrontRecognizer.result.sex + "<br>" +
                                "Citizenship: " + croIdFrontRecognizer.result.citizenship + "<br>" +
                                "Date of expiry: " + croIdFrontRecognizer.result.documentDateOfExpiry.day + "." + croIdFrontRecognizer.result.documentDateOfExpiry.month + "." + croIdFrontRecognizer.result.documentDateOfExpiry.year + ".<br>" +
                                "Document bilingual: " + croIdFrontRecognizer.result.documentBilingual;
                    } else {
                        resultDiv.innerHTML = "Result is empty!";
                    }
                },
                
                // Register the error callback
                function errorHandler(err) {
                    alert('Error: ' + err);
                },

                documentOverlaySettings, recognizerCollection, licenseKeys
            );
        });

    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

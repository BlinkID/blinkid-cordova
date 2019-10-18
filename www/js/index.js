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

        // to scan any machine readable travel document (passports, visa's and IDs with 
        // machine readable zone), use MrtdRecognizer
//        var mrtdRecognizer = new cordova.plugins.BlinkID.MrtdRecognizer();
//        mrtdRecognizer.returnFullDocumentImage = true;
        // wrap recognizer with SuccessFrameGrabberRecognizer to obtain camera frame from the successful scan
//        var mrtdSuccessFrameGrabber = new cordova.plugins.BlinkID.SuccessFrameGrabberRecognizer(mrtdRecognizer);

        // to scan any machine readable travel document (passports, visa's and IDs with 
        // machine readable zone), use MrtdRecognizer
        var blinkIdRecognizer = new cordova.plugins.BlinkID.BlinkIdRecognizer();
        blinkIdRecognizer.returnFullDocumentImage = true;
        blinkIdRecognizer.returnFaceImage = true;

        // there are lots of Recognizer objects in BlinkID - check blinkIdScanner.js for full reference

        var blinkidOverlaySettings = new cordova.plugins.BlinkID.BlinkIdOverlaySettings();

        // create RecognizerCollection from any number of recognizers that should perform recognition
        var recognizerCollection = new cordova.plugins.BlinkID.RecognizerCollection([blinkIdRecognizer /*, mrtdSuccessFrameGrabber */]);

        // package name/bundleID com.microblink.blinkid
        var licenseKeys = {
            android: 'sRwAAAAWY29tLm1pY3JvYmxpbmsuYmxpbmtpZJ9ew00uWSf86/uxZPHEBpL6LHXqPogMlETCNKjFP9T0z4TWTOJHROqlTx/kfMKYmpqvZN7v3J6f3+/kQflgDR0tvDECMzG1iXlfUJWnQXpABOO6F8sLzJmbJO7TjJv1DAjuv+2D1uez1LjErzyqCy7jFrtjpza9uUCLMrFopL9KuQ1/N+jxW/byQl6BtUeaj1IYBZzAhrUDBofLSlv6WC9GUrCqmO+TdgQvjUiSfx/60kU7bmBZX/T6A2hAfGvRWpfKo12NYs3a',
            ios: 'sRwAAAEWY29tLm1pY3JvYmxpbmsuYmxpbmtpZFG2rW9X4lA0y++ptboR69ypRSJvTVDmZZWdCfGEKT2PSYI2e6goCTXvROwYexCNWL3Ew5HzJwdKs0ugrPpKvGqOG4iiF+yrTCplrislVppjfV6v1NFN3y3b053kMcZwZFnL2dVTg5cfF2nkep2LoCsBF+eSG1u6c0uWITOTv96UzBZljFNLsokRGLtMQoN0V4WsrXCIzzhDgt0xbBHQWSW1QDFKAT9CiJ9qbljtk5UwjqLvDUMW372IPybPYco7D2zR'
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

                    /*if (mrtdRecognizer.result.resultState == cordova.plugins.BlinkID.RecognizerResultState.valid) {
                        // Document image is returned as Base64 encoded JPEG
                        var resultDocumentImage = mrtdRecognizer.result.fullDocumentImage;
                        if (resultDocumentImage) {
                            documentImage.src = "data:image/jpg;base64, " + resultDocumentImage;
                            documentImageDiv.style.visibility = "visible";
                        }

                        // success frame is available in mrtdRecognizer's successFrameGrabber wrapper's result as Base64 encoded JPEG
                        var successFrame = mrtdSuccessFrameGrabber.result.successFrame;
                        if (successFrame) {
                            successfulImage.src = "data:image/jpg;base64, " + successFrame;
                            successfulImageDiv.style.visibility = "visible";
                        }

                        // fill data
                        resultDiv.innerHTML = // Personal information
                            "First name: " + mrtdRecognizer.result.mrzResult.secondaryId + "<br>" +
                            "Last name: " + mrtdRecognizer.result.mrzResult.primaryId + "<br>" +
                            "Nationality: " + mrtdRecognizer.result.mrzResult.nationality + "<br>" +
                            "Gender: " + mrtdRecognizer.result.mrzResult.gender + "<br>" +
                            "Date of birth: " +
                                mrtdRecognizer.result.mrzResult.dateOfBirth.day + "." +
                                mrtdRecognizer.result.mrzResult.dateOfBirth.month + "." +
                                mrtdRecognizer.result.mrzResult.dateOfBirth.year + ". <br>";
                            // there are other fields to extract - check blinkIdScanner.js for full reference
                    } else */
                    if (blinkIdRecognizer.result.resultState == cordova.plugins.BlinkID.RecognizerResultState.valid) {
                        var resultDocumentImage = blinkIdRecognizer.result.fullDocumentImage;
                        if (resultDocumentImage) {
                            documentImage.src = "data:image/jpg;base64, " + resultDocumentImage;
                            documentImageDiv.style.visibility = "visible";
                        }
                        var resultFaceImage = blinkIdRecognizer.result.faceImage;
                        if (resultFaceImage) {
                            faceImage.src = "data:image/jpg;base64, " + resultFaceImage;
                            faceImageDiv.style.visibility = "visible";
                        }

                        var fieldDelim = "<br>";
                        var blinkIdResult = blinkIdRecognizer.result;

                        resultDiv.innerHTML = /** Personal information */
                             "First name: " + blinkIdResult.firstName + fieldDelim +
                             "Last name: " + blinkIdResult.lastName + fieldDelim +
                             "Address: " + blinkIdResult.address + fieldDelim +
                             "Document number: " + blinkIdResult.documentNumber + fieldDelim +
                             "Sex: " + blinkIdResult.sex + fieldDelim +
                             "Date of birth: " +
                                  blinkIdResult.dateOfBirth.day + "." +
                                  blinkIdResult.dateOfBirth.month + "." +
                                  blinkIdResult.dateOfBirth.year + "." + fieldDelim +
                             "Date of issue: " +
                                  blinkIdResult.dateOfIssue.day + "." +
                                  blinkIdResult.dateOfIssue.month + "." +
                                  blinkIdResult.dateOfIssue.year + "." + fieldDelim +
                             "Date of expiry: " +
                                  blinkIdResult.dateOfExpiry.day + "." +
                                  blinkIdResult.dateOfExpiry.month + "." +
                                  blinkIdResult.dateOfExpiry.year + "." + fieldDelim;
                             // there are other fields to extract - check blinkIdScanner.js for full reference
                    } else {
                        resultDiv.innerHTML = "Result is empty!";
                    }
                },
                
                // Register the error callback
                function errorHandler(err) {
                    alert('Error: ' + err);
                },

                blinkidOverlaySettings, recognizerCollection, licenseKeys
            );
        });

    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

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

        var documentFrontImageDiv = document.getElementById('documentFrontImageDiv');
        var documentFrontImage = document.getElementById('documentFrontImage');

        var documentBackImageDiv = document.getElementById('documentBackImageDiv');
        var documentBackImage = document.getElementById('documentBackImage');

        var faceImageDiv = document.getElementById('faceImageDiv');
        var faceImage = document.getElementById('faceImage');

        successfulImageDiv.style.visibility = "hidden"
        documentFrontImageDiv.style.visibility = "hidden"
        documentBackImageDiv.style.visibility = "hidden"
        faceImageDiv.style.visibility = "hidden"

        // to scan any machine readable travel document (passports, visa's and IDs with 
        // machine readable zone), use MrtdRecognizer
//        var mrtdRecognizer = new cordova.plugins.BlinkID.MrtdRecognizer();
//        mrtdRecognizer.returnFullDocumentImage = true;
        // wrap recognizer with SuccessFrameGrabberRecognizer to obtain camera frame from the successful scan
//        var mrtdSuccessFrameGrabber = new cordova.plugins.BlinkID.SuccessFrameGrabberRecognizer(mrtdRecognizer);

        // BlinkIDCombinedRecognizer automatically classifies different document types and scans the data from
        // the supported document
        var blinkIdCombinedRecognizer = new cordova.plugins.BlinkID.BlinkIdCombinedRecognizer();
        blinkIdCombinedRecognizer.returnFullDocumentImage = true;
        blinkIdCombinedRecognizer.returnFaceImage = true;

        // there are lots of Recognizer objects in BlinkID - check blinkIdScanner.js for full reference

        var blinkidOverlaySettings = new cordova.plugins.BlinkID.BlinkIdOverlaySettings();

        // create RecognizerCollection from any number of recognizers that should perform recognition
        var recognizerCollection = new cordova.plugins.BlinkID.RecognizerCollection([blinkIdCombinedRecognizer /*, mrtdSuccessFrameGrabber */]);

        // package name/bundleID com.microblink.blinkid
        var licenseKeys = {
            android: 'sRwAAAAWY29tLm1pY3JvYmxpbmsuYmxpbmtpZJ9ew00uWSf86/uxZPDUA5Y7Oc3p1/52juQNMX4a9uDfl7RLEccLrXcY/Zrj+rc/SyYZ/Des28sW4gExbnaFe8Rh0gFnstoUgcjp86VwQU+fCNKS5LGpftSxwsKtT/Oii4misuR/9S6ZInJ1LtS+isF7lPJggms6y3aKcVICHIj8Dih0UetSfk58PPwn9+fa2OeJskBf1mwc8by81a/RUDliwa3COGQTcgNCgfETtJkc9XMMfY2WSBWO+FHvpFrbrQhZxonXwDqNnDCV1yUwLg==',
            ios: 'sRwAAAEWY29tLm1pY3JvYmxpbmsuYmxpbmtpZFG2rW9X4lA0y++pNbrNSXU9j08ergMPUmsCXxJMGTuECq91Y5sRP4fq0pZb069yM4V5US2psR7OeYLwjmZr9ixYrpnRWdFFRqO9730tCFmdrK2ZAstMXEBBcLqGI8z9dJwT8eFQlv4caQmAlzTLl0c7VmbKl+ysb8XBQsjUcIv6lwUksFIkt9nBBVrCduzev8HvKwKQw7kmm/xXrcrNxHWzkwgum7r3D5rsFf9cJapU9zoltHdwyyUdcBONELtK1mZvvS6lTGsfebW2F+0pHw=='
        };

        scanButton.addEventListener('click', function() {
            cordova.plugins.BlinkID.scanWithCamera(
            
                // Register the callback handler
                function callback(cancelled) {

                    resultDiv.innerHTML = "";
                    
                    // handle cancelled scanning
                    if (cancelled) {
                        resultDiv.innerHTML = "Cancelled!";
                        return;
                    }
                    
                    // if not cancelled, every recognizer will have its result property updated

                    successfulImageDiv.style.visibility = "hidden"
                    documentFrontImageDiv.style.visibility = "hidden"
                    documentBackImageDiv.style.visibility = "hidden"
                    faceImageDiv.style.visibility = "hidden"

                    if (blinkIdCombinedRecognizer.result.resultState == cordova.plugins.BlinkID.RecognizerResultState.valid) {
                        var resultDocumentFrontImage = blinkIdCombinedRecognizer.result.fullDocumentFrontImage;
                        if (resultDocumentFrontImage) {
                            documentFrontImage.src = "data:image/jpg;base64, " + resultDocumentFrontImage;
                            documentFrontImageDiv.style.visibility = "visible";
                        }
                        var resultDocumentBackImage = blinkIdCombinedRecognizer.result.fullDocumentBackImage;
                        if (resultDocumentBackImage) {
                            documentBackImage.src = "data:image/jpg;base64, " + resultDocumentBackImage;
                            documentBackImageDiv.style.visibility = "visible";
                        }
                        var resultFaceImage = blinkIdCombinedRecognizer.result.faceImage;
                        if (resultFaceImage) {
                            faceImage.src = "data:image/jpg;base64, " + resultFaceImage;
                            faceImageDiv.style.visibility = "visible";
                        }

                        var fieldDelim = "<br>";
                        var blinkIdResult = blinkIdCombinedRecognizer.result;

                        var resultString =
                            "First name: " + blinkIdResult.firstName + fieldDelim +
                            "Last name: " + blinkIdResult.lastName + fieldDelim +
                            "Address: " + blinkIdResult.address + fieldDelim +
                            "Document number: " + blinkIdResult.documentNumber + fieldDelim +
                            "Sex: " + blinkIdResult.sex + fieldDelim;
                        if (blinkIdResult.dateOfBirth) {
                            resultString +=
                                "Date of birth: " +
                                    blinkIdResult.dateOfBirth.day + "." +
                                    blinkIdResult.dateOfBirth.month + "." +
                                    blinkIdResult.dateOfBirth.year + "." + fieldDelim;
                        }
                        if (blinkIdResult.dateOfIssue) {
                            resultString +=
                                "Date of issue: " +
                                    blinkIdResult.dateOfIssue.day + "." +
                                    blinkIdResult.dateOfIssue.month + "." +
                                    blinkIdResult.dateOfIssue.year + "." + fieldDelim;
                        }
                        if (blinkIdResult.dateOfExpiry) {
                            resultString +=
                                "Date of expiry: " +
                                    blinkIdResult.dateOfExpiry.day + "." +
                                    blinkIdResult.dateOfExpiry.month + "." +
                                    blinkIdResult.dateOfExpiry.year + "." + fieldDelim;
                        }
                        // there are other fields to extract - check blinkIdScanner.js for full reference
                        resultDiv.innerHTML = resultString;
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

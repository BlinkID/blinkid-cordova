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
            android: 'sRwAAAAWY29tLm1pY3JvYmxpbmsuYmxpbmtpZJ9ew00uWSf86/uxZPRkApavUXSK2m0Sma1re/JQZO1UmCTuXXJsenPqD3PxK7JqxpaF6o5xuTGNbpUTVtLpU3VzFQ8xM36aaX0aXeWG1POkJKB3aB37OoMtvMTZSZzgOB+iTTEFCsMvy7aKmbriGAF/tAy2XeJEL+MsHAdDAhQVwTM73G46Kcs88fFaSejtxvpIpu/k7aAAKMXMniwCyas5un4EjaOJkEiNhvRMOj7bsQRM3UDbXTKxdY6pzRmEKh2fe0YlP2HjxA==',
            ios: 'sRwAAAEWY29tLm1pY3JvYmxpbmsuYmxpbmtpZFG2rW9X4lA0y++pNbklbtuVIchJbwwyTP+mN9TRXJtKAdk8OHnANbNZw+gawwStzPmGdhrmjcoalnz5/oxITB5xBvfDLUl1az/dPpPrRsLrZ1KaTJ/rF+2sCh4DeUibZ3iRxtLVZoXxiXdJ4P9JR2A5uPqPsWNublWT1klkNJeS5j4ynV+MDWNSLcAa6USgTcgTLKxPho0g3JzqB9IMCr+m+B6OOaxFolH5VmbSM4XiPIeMZEf9v0urR9kE+XG9cffgipNzSpJl2A=='
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

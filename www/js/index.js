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

        // to scan EU driver's licences, use EudlRecognizer
        var eudlRecognizer = new cordova.plugins.BlinkID.EudlRecognizer();
        eudlRecognizer.returnFaceImage = true;
        eudlRecognizer.returnFullDocumentImage = true;

        // if you also want to obtain camera frame on which specific recognizer has
        // finished its recognition, wrap it with SuccessFrameGrabberRecognizer and use
        // the wrapper instead of original for building RecognizerCollection
        var eudlSuccessFrameGrabber = new cordova.plugins.BlinkID.SuccessFrameGrabberRecognizer(eudlRecognizer);

        // to scan US driver's licenses, use UsdlRecognizer
        var usdlRecognizer = new cordova.plugins.BlinkID.UsdlRecognizer();

        var usdlSuccessFrameGrabber = new cordova.plugins.BlinkID.SuccessFrameGrabberRecognizer(usdlRecognizer);
        
        // to scan any machine readable travel document (passports, visa's and IDs with 
        // machine readable zone), use MrtdRecognizer
        var mrtdRecognizer = new cordova.plugins.BlinkID.MrtdRecognizer();
        mrtdRecognizer.returnFullDocumentImage = true;

        var mrtdSuccessFrameGrabber = new cordova.plugins.BlinkID.SuccessFrameGrabberRecognizer(mrtdRecognizer);

        // there are lots of Recognizer objects in BlinkID - check blinkIdScanner.js for full reference

        var documentOverlaySettings = new cordova.plugins.BlinkID.DocumentOverlaySettings();

        // create RecognizerCollection from any number of recognizers that should perform recognition
        var recognizerCollection = new cordova.plugins.BlinkID.RecognizerCollection([eudlSuccessFrameGrabber, usdlSuccessFrameGrabber, mrtdSuccessFrameGrabber]);

        // package name/bundleID com.microblink.blinkid
        var licenseKeys = {
            android: 'sRwAAAAWY29tLm1pY3JvYmxpbmsuYmxpbmtpZJ9ew03MWSf86/uxZPBIIjSbIVXcSslY2BqoMKkxQN9n66rydG2HAsvEDTcbRx7FsLxGjoolQEFwmdYAbGlwqMxCa8RyAFEGc1lGNqlapufxmZFSIxNU6YW6LNt2yYb8yHN3mZgRPm/XtDeIUu7dl/hMDlDr9TpSH+lk6qZs5iEiiMkcqLXeyD5D/MY11AQmNLW30/DVy9kNRQQxxPMVPmJ520wkEtYEAcfxm2ic+SucP0BLX+071Vqk',
            ios: 'sRwAAAEWY29tLm1pY3JvYmxpbmsuYmxpbmtpZFG2rW+14lA0y++pNb3JTnEec82j7eFQAKhO+h06wHAwgD+3XIWK50rVwpbLzLLYfB9M6Nh5oDJPqMhdc3tTl8v4SDI6RhJ90i0kpjCWDDkY/u5nBwLGXgi1n3Q1DYlJ52uH0b0NHK9C3aNr3O36vD34xk2MCPtpsyaVbP0n8H7bnJuMW5y0Adxzr1Tk7dfvEcMcJ196LnkrKYolWd2wIrJCwIkLiXFR28jvLZUvFROTNXBG6U/51M0f'
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

                    if (eudlRecognizer.result.resultState == cordova.plugins.BlinkID.RecognizerResultState.valid) {
                        // Document image is returned as Base64 encoded JPEG
                        var resultDocumentImage = eudlRecognizer.result.fullDocumentImage;
                        if (resultDocumentImage) {
                            documentImage.src = "data:image/jpg;base64, " + resultDocumentImage;
                            documentImageDiv.style.visibility = "visible";
                        } else {
                            documentImageDiv.style.visibility = "hidden";
                        }
                        
                        // Face image is returned as Base64 encoded JPEG
                        var resultFaceImage = eudlRecognizer.result.faceImage;
                        if (resultFaceImage) {
                            faceImage.src = "data:image/jpg;base64, " + resultFaceImage;
                            faceImageDiv.style.visibility = "visible";
                        } else {
                            faceImageDiv.style.visibility = "hidden";
                        }

                        // success frame is available in eudlRecognizer's successFrameGrabber wrapper's result as Base64 encoded JPEG
                        var successFrame = eudlSuccessFrameGrabber.result.successFrame;
                        if (successFrame) {
                            successfulImage.src = "data:image/jpg;base64, " + successFrame;
                            successfulImageDiv.style.visibility = "visible";
                        } else {
                            successfulImageDiv.style.visibility = "hidden";
                        }

                        // fill data
                        resultDiv.innerHTML = /** Personal information */
                            "First name: " + eudlRecognizer.result.firstName + "<br>" +
                            "Last name: " + eudlRecognizer.result.lastName + "<br>" +
                            "Address: " + eudlRecognizer.result.address + "<br>" +
                            "Personal number: " + eudlRecognizer.result.personalNumber + "<br>" +
                            "Driver number: " + eudlRecognizer.result.driverNumber + "<br>";
                    } else if (mrtdRecognizer.result.resultState == cordova.plugins.BlinkID.RecognizerResultState.valid) {
                        // Document image is returned as Base64 encoded JPEG
                        var resultDocumentImage = mrtdRecognizer.result.fullDocumentImage;
                        if (resultDocumentImage) {
                            documentImage.src = "data:image/jpg;base64, " + resultDocumentImage;
                            documentImageDiv.style.visibility = "visible";
                        } else {
                            documentImageDiv.style.visibility = "hidden";
                        }

                        // MrtdRecognizer does not support face image extraction
                        faceImageDiv.style.visibility = "hidden";

                        // success frame is available in mrtdRecognizer's successFrameGrabber wrapper's result as Base64 encoded JPEG
                        var successFrame = mrtdSuccessFrameGrabber.result.successFrame;
                        if (successFrame) {
                            successfulImage.src = "data:image/jpg;base64, " + successFrame;
                            successfulImageDiv.style.visibility = "visible";
                        } else {
                            successfulImageDiv.style.visibility = "hidden";
                        }

                        // fill data
                        resultDiv.innerHTML = /** Personal information */
                            "First name: " + mrtdRecognizer.result.mrzResult.secondaryId + "<br>" +
                            "Last name: " + mrtdRecognizer.result.mrzResult.primaryId + "<br>" +
                            "Nationality: " + mrtdRecognizer.result.mrzResult.nationality + "<br>" +
                            "Gender: " + mrtdRecognizer.result.mrzResult.gender + "<br>" +
                            "Date of birth: " +
                            mrtdRecognizer.result.mrzResult.dateOfBirth.day + "." +
                            mrtdRecognizer.result.mrzResult.dateOfBirth.month + "." +
                            mrtdRecognizer.result.mrzResult.dateOfBirth.year + ". <br>";
                    } else if (usdlRecognizer.result.resultState == cordova.plugins.BlinkID.RecognizerResultState.valid) {
                        // UsdlRecognizer does not support face image extraction
                        faceImageDiv.style.visibility = "hidden";
                        // UsdlRecognizer does not support full document image extraction
                        faceImageDiv.style.visibility = "hidden";

                        // success frame is available in usdlRecognizer's successFrameGrabber wrapper's result as Base64 encoded JPEG
                        var successFrame = usdlSuccessFrameGrabber.result.successFrame;
                        if (successFrame) {
                            successfulImage.src = "data:image/jpg;base64, " + successFrame;
                            successfulImageDiv.style.visibility = "visible";
                        } else {
                            successfulImageDiv.style.visibility = "hidden";
                        }

                        var fields = usdlRecognizer.result.fields;
                        var USDLKeys = cordova.plugins.BlinkID.UsdlKeys;
                        var fieldDelim = "<br>";

                        resultDiv.innerHTML = /** Personal information */
                            "USDL version: " + fields[USDLKeys.StandardVersionNumber] + fieldDelim +
                            "Family name: " + fields[USDLKeys.CustomerFamilyName] + fieldDelim +
                            "First name: " + fields[USDLKeys.CustomerFirstName] + fieldDelim +
                            "Date of birth: " + fields[USDLKeys.DateOfBirth] + fieldDelim +
                            "Sex: " + fields[USDLKeys.Sex] + fieldDelim +
                            "Eye color: " + fields[USDLKeys.EyeColor] + fieldDelim +
                            "Height: " + fields[USDLKeys.Height] + fieldDelim +
                            "Street: " + fields[USDLKeys.AddressStreet] + fieldDelim +
                            "City: " + fields[USDLKeys.AddressCity] + fieldDelim +
                            "Jurisdiction: " + fields[USDLKeys.AddressJurisdictionCode] + fieldDelim +
                            "Postal code: " + fields[USDLKeys.AddressPostalCode] + fieldDelim +
                            /** License information */
                            "Issue date: " + fields[USDLKeys.DocumentIssueDate] + fieldDelim +
                            "Expiration date: " + fields[USDLKeys.DocumentExpirationDate] + fieldDelim +
                            "Issuer ID: " + fields[USDLKeys.IssuerIdentificationNumber] + fieldDelim +
                            "Jurisdiction version: " + fields[USDLKeys.JurisdictionVersionNumber] + fieldDelim +
                            "Vehicle class: " + fields[USDLKeys.JurisdictionVehicleClass] + fieldDelim +
                            "Restrictions: " + fields[USDLKeys.JurisdictionRestrictionCodes] + fieldDelim +
                            "Endorsments: " + fields[USDLKeys.JurisdictionEndorsementCodes] + fieldDelim +
                            "Customer ID: " + fields[USDLKeys.CustomerIdNumber] + fieldDelim;

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

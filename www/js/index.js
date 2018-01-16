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

        /**
         * Use these scanner types
         * Available: "PDF417", "USDL", "Barcode", "MRTD", "EUDL", "UKDL", "DEDL", "MyKad", "GermanOldID", "GermanIDFront", "GermanIDBack", "GermanPassport", "DocumentFace"
         * PDF417 - scans PDF417 barcodes
         * USDL - scans barcodes located on the back of US driver's license
         * Barcode - scans various types of codes (i.e. QR, UPCA, UPCE...). Types of scanned codes can be modified in plugin classes (Explained later in this readme). By default, scanned codes are set to: Code 39, Code 128, EAN 13, EAN 8, QR, UPCA, UPCE
         * MRTD - scans Machine Readable Travel Document, contained in various IDs and passports
         * EUDL - scans the front of European driver's license
         * UKDL - scans the front of United Kingom driver's license
         * DEDL - scans the front of German driver's license
         * MyKad - scans the front of Malaysian ID cards
         * GermanOldID - scans the front of old German ID cards
         * GermanIDFront - scans the front of German ID cards
         * GermanIDBack - scans the back of German ID cards
         * GermanPassport - scans the front of German passports
         * DocumentFace - scans documents which contain owner's face image
         *
         * Variable << types >> declared below has to contain all the scanners needed by your application. Applying additional scanners will slow down the scanning process
         */
        var types = ["USDL", "MRTD", "Barcode", "MyKad"];

        /**
         * Image type defines type of the image that will be returned in scan result (image is returned as Base64 encoded JPEG)
         * available:
         *  empty - do not return any images - IMPORTANT : THIS IMPROVES SCANNING SPEED!
         *  "IMAGE_SUCCESSFUL_SCAN" : return full camera frame of successful scan
         *  "IMAGE_DOCUMENT" : return cropped document image
         *  "IMAGE_FACE" : return image of the face from the ID
         */
        var imageTypes = ["IMAGE_SUCCESSFUL_SCAN", "IMAGE_FACE", "IMAGE_DOCUMENT"]

        /**
        * Language to be used in the scanning UI
        * Available:
        *  - English: "en"
        *  - Croatian: "hr"
        */
        var language = "en"

        // Note that each platform requires its own license key

        // This license key allows setting overlay views for this application ID: com.microblink.blinkid
        var licenseiOs = "RYRTHFTE-BGSW25OV-22FACO5I-XKFH6NNV-EYKLREEQ-SCIJBEEQ-SCIJAMA4-CTCG345C"; // valid until 2018-03-04

        // This license is only valid for package name "com.microblink.blinkid"
        var licenseAndroid = "HOTRRR7E-GOK7UXTG-4EZJS4BX-QCZHZEPZ-JGPURT4Y-GD4K5X42-OJL67PQQ-K3FMQDM3";  // valid until 2018-03-04

        scanButton.addEventListener('click', function() {    
            cordova.plugins.blinkIdScanner.scan(
            
                // Register the callback handler
                function callback(scanningResult) {
                    
                    // handle cancelled scanning
                    if (scanningResult.cancelled == true) {
                        resultDiv.innerHTML = "Cancelled!";
                        return;
                    }
                    
                    // Obtain list of recognizer results
                    var resultList = scanningResult.resultList;

                    successfulImageDiv.style.visibility = "hidden"
                    documentImageDiv.style.visibility = "hidden"
                    faceImageDiv.style.visibility = "hidden"

                    // Image is returned as Base64 encoded JPEG
                    var image = scanningResult.resultImage;

                    // Successful image is returned as Base64 encoded JPEG
                    var resultSuccessfulImage = scanningResult.resultSuccessfulImage;
                    if (resultSuccessfulImage) {
                        successfulImage.src = "data:image/jpg;base64, " + resultSuccessfulImage;
                        successfulImageDiv.style.visibility = "visible"
                    }
                    
                    // Iterate through all results
                    for (var i = 0; i < resultList.length; i++) {

                        // Get individual resilt
                        var recognizerResult = resultList[i];

                        if (recognizerResult.resultType == "Barcode result") {
                            // handle Barcode scanning result

                            var raw = "";
                            if (typeof(recognizerResult.raw) != "undefined" && recognizerResult.raw != null) {
                                raw = " (raw: " + hex2a(recognizerResult.raw) + ")";
                            }
                            resultDiv.innerHTML = "Data: " + recognizerResult.data +
                                               raw +
                                               " (Type: " + recognizerResult.type + ")";

                        } else if (recognizerResult.resultType == "USDL result") {
                            // handle USDL parsing result

                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                               "USDL version: " + fields[kPPStandardVersionNumber] + "<br>" +
                                                "Family name: " + fields[kPPCustomerFamilyName] + "<br>" +
                                                "First name: " + fields[kPPCustomerFirstName] + "<br>" +
                                                "Date of birth: " + fields[kPPDateOfBirth] + "<br>" +
                                                "Sex: " + fields[kPPSex] + "<br>" +
                                                "Eye color: " + fields[kPPEyeColor] + "<br>" +
                                                "Height: " + fields[kPPHeight] + "<br>" +
                                                "Street: " + fields[kPPAddressStreet] + "<br>" +
                                                "City: " + fields[kPPAddressCity] + "<br>" +
                                                "Jurisdiction: " + fields[kPPAddressJurisdictionCode] + "<br>" +
                                                "Postal code: " + fields[kPPAddressPostalCode] + "<br>" +

                                                /** License information */
                                                "Issue date: " + fields[kPPDocumentIssueDate] + "<br>" +
                                                "Expiration date: " + fields[kPPDocumentExpirationDate] + "<br>" +
                                                "Issuer ID: " + fields[kPPIssuerIdentificationNumber] + "<br>" +
                                                "Jurisdiction version: " + fields[kPPJurisdictionVersionNumber] + "<br>" +
                                                "Vehicle class: " + fields[kPPJurisdictionVehicleClass] + "<br>" +
                                                "Restrictions: " + fields[kPPJurisdictionRestrictionCodes] + "<br>" +
                                                "Endorsments: " + fields[kPPJurisdictionEndorsementCodes] + "<br>" +
                                                "Customer ID: " + fields[kPPCustomerIdNumber] + "<br>";

                        } else if (recognizerResult.resultType == "MRTD result") {

                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                                "Family name: " + fields[kPPmrtdPrimaryId] + "<br>" +
                                                "First name: " + fields[kPPmrtdSecondaryId] + "<br>" +
                                                "Date of birth: " + fields[kPPmrtdBirthDate] + "<br>" +
                                                "Sex: " + fields[kPPmrtdSex] + "<br>" +
                                                "Nationality: " + fields[kPPmrtdNationality] + "<br>" +
                                                "Date of Expiry: " + fields[kPPmrtdExpiry] + "<br>" +
                                                "Document Code: " + fields[kPPmrtdDocCode] + "<br>" +
                                                "Document Number: " + fields[kPPmrtdDocNumber] + "<br>" +
                                                "Issuer: " + fields[kPPmrtdIssuer] + "<br>" +
                                                "ID Type: " + fields[kPPmrtdDataType] + "<br>" +
                                                "Opt1: " + fields[kPPmrtdOpt1] + "<br>" +
                                                "Opt2: " + fields[kPPmrtdOpt2] + "<br>";

                        } else if (recognizerResult.resultType == "EUDL result" || recognizerResult.resultType == "UKDL result" || recognizerResult.resultType == "DEDL result") {
                            
                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                                recognizerResult.resultType + "<br>" + 
                                                "ID Type: " + fields[kPPeudlDataType] + "<br>" +
                                                "Date of Expiry: " + fields[kPPeudlExpiry] + "<br>" +
                                                "Issue Date: " + fields[kPPeudlIssueDate] + "<br>" +
                                                "Issuing Authority: " + fields[kPPeudlIssuingAuthority] + "<br>" +
                                                "Driver Number: " + fields[kPPeudlDriverNumber] + "<br>" +
                                                "Address: " + fields[kPPeudlAddress] + "<br>" +
                                                "Birth Data: " + fields[kPPeudlBirthData] + "<br>" +
                                                "First name: " + fields[kPPeudlFirstName] + "<br>" +
                                                "Last name: " + fields[kPPeudlLastName] + "<br>";

                        } else if (recognizerResult.resultType == "MyKad result") {

                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                                "ID Type: " + fields[kPPmyKadDataType] + "<br>" +
                                                "NRIC Number: " + fields[kPPmyKadNricNumber] + "<br>" +
                                                "Address: " + fields[kPPmyKadAddress] + "<br>" +
                                                "Address ZIP Code: " + fields[kPPmyKadAddressZipCode] + "<br>" +
                                                "Address Street: " + fields[kPPmyKadAddressStreet] + "<br>" +
                                                "Address City: " + fields[kPPmyKadAddressCity] + "<br>" +
                                                "Address State: " + fields[kPPmyKadAddressState] + "<br>" +
                                                "Birth Date: " + fields[kPPmyKadBirthDate] + "<br>" +
                                                "Full Name: " + fields[kPPmyKadFullName] + "<br>" +
                                                "Religion: " + fields[kPPmyKadReligion] + "<br>" +
                                                "Sex: " + fields[kPPmyKadSex] + "<br>";

                        } else if (recognizerResult.resultType == "GermanOldID result") {

                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                                "ID Type: " + fields[kPPmrtdDataType] + "<br>" +
                                                "Family name: " + fields[kPPmrtdPrimaryId] + "<br>" +
                                                "First name: " + fields[kPPmrtdSecondaryId] + "<br>" +
                                                "Date of birth: " + fields[kPPmrtdBirthDate] + "<br>" +
                                                "Nationality: " + fields[kPPmrtdNationality] + "<br>" +
                                                "Document Code: " + fields[kPPmrtdDocCode] + "<br>" +
                                                "Document Number: " + fields[kPPmrtdDocNumber] + "<br>" +
                                                "Issuer: " + fields[kPPmrtdIssuer] + "<br>" +
                                                "Place of birth: " + fields[kPPgermanIdBirthPlace] + "<br>";

                        } else if (recognizerResult.resultType == "GermanFrontID result") {

                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                                "Last name: " + fields[kPPgermanIdLastName] + "<br>" +
                                                "First name: " + fields[kPPgermanIdFirstName] + "<br>" +
                                                "Date of birth: " + fields[kPPgermanIdBirthDate] + "<br>" +
                                                "Place of birth: " + fields[kPPgermanIdBirthPlace] + "<br>" +
                                                "Nationality: " + fields[kPPgermanIdNationality] + "<br>" +
                                                "Date of expiry: " + fields[kPPgermanIdExpiryDate] + "<br>" +
                                                "Card number: " + fields[kPPgermanIdCardNumber] + "<br>";

                        } else if (recognizerResult.resultType == "GermanBackID result") {

                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                                "Colour of eyes: " + fields[kPPgermanIdEyeColour] + "<br>" +
                                                "Height: " + fields[kPPgermanIdHeight] + "<br>" +
                                                "Issue date: " + fields[kPPgermanIdIssueDate] + "<br>" +
                                                "Issuing authority: " + fields[kPPgermanIdIssuingAuthority] + "<br>" +
                                                "Address: " + fields[kPPgermanIdAddress] + "<br>";

                        } else if (recognizerResult.resultType == "GermanPassport result") {

                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                                "Passport number: " + fields[kPPmrtdDocNumber] + "<br>" +
                                                "Surname: " + fields[kPPgermanPassSurname] + "<br>" +
                                                "Name: " + fields[kPPgermanPassName] + "<br>" +
                                                "Nationality: " + fields[kPPgermanPassNationality] + "<br>" +
                                                "Date of birth: " + fields[kPPmrtdBirthDate] + "<br>" +
                                                "Sex: " + fields[kPPmrtdSex] + "<br>" +
                                                "Place of birth: " + fields[kPPgermanPassBirthPlace] + "<br>" +
                                                "Date of issue: " + fields[kPPgermanPassIssueDate] + "<br>" +
                                                "Date of expiry: " + fields[kPPmrtdExpiry] + "<br>" +
                                                "Authority: " + fields[kPPgermanPassIssuingAuthority] + "<br>";

                        } else if (recognizerResult.resultType == "DocumentFace result") {

                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = "Found document with face";
                        } else {
                          var fields = recognizerResult.fields;
                          
                          resultDiv.innerHTML = recognizerResult.resultType;
                        }

                        // Document image is returned as Base64 encoded JPEG
                        var resultDocumentImage = recognizerResult.resultDocumentImage;
                        if (resultDocumentImage) {
                            documentImage.src = "data:image/jpg;base64, " + resultDocumentImage;
                            documentImageDiv.style.visibility = "visible"
                        } else {
                            documentImageDiv.style.visibility = "hidden"
                        }

                        // Face image is returned as Base64 encoded JPEG
                        var resultFaceImage = recognizerResult.resultFaceImage;
                        if (resultFaceImage) {
                            faceImage.src = "data:image/jpg;base64, " + resultFaceImage;
                            faceImageDiv.style.visibility = "visible"
                        } else {
                            faceImageDiv.style.visibility = "hidden"
                        }
                    }
                },
                
                // Register the error callback
                function errorHandler(err) {
                    alert('Error: ' + err);
                },

                types, imageTypes, licenseiOs, licenseAndroid, language
            );
        });

    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

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
        var resultImgDiv = document.getElementById('imageDiv');
        var resultImg = document.getElementById('documentImage');
    
        resultImgDiv.style.visibility = "hidden"

        /**
         * Use these scanner types
         * Available: "PDF417", "USDL", "Bar Decoder", "Zxing", "MRTD", "EUDL", "UKDL", "DEDL", "MyKad", "DocumentFace"
         */
        var types = ["PDF417", "UKDL", "MRTD"];

        /**
         * Image type defines type of the image that will be returned in scan result (image is returned as Base64 encoded JPEG)
         * available:
         *  "IMAGE_NONE" : do not return image in scan result
         *  "IMAGE_SUCCESSFUL_SCAN" : return full camera frame of successful scan
         *  "IMAGE_CROPPED" : return cropped document image (successful scan)
         *
         */
        var imageType = "IMAGE_CROPPED"

        // Note that each platform requires its own license key

        // This license key allows setting overlay views for this application ID: com.microblink.blinkid
        var licenseiOs = "SKM5EHOC-2RYRUIEI-E5CT7PZZ-BKMLKJQU-XCIJBEEQ-SCIJBEEQ-SCIJAMA4-CTCG2HA7"; // valid until 2017-05-23

        // This license is only valid for package name "com.microblink.blinkid"
        var licenseAndroid = "NFRZVYWD-MCK7SSO7-TJ7ZWOC4-AT2AYDM7-JDHZQMHY-V3PZU4SX-54PGUFQM-AUX5RGYJ";

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
                    // Image is returned as Base64 encoded JPEG
                    var image = scanningResult.resultImage;

                    if (image) {
                        resultImg.src = "data:image/jpg;base64, " + image;
                        resultImgDiv.style.visibility = "visible"
                    } else {
                        resultImgDiv.style.visibility = "hidden"
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
                                               "USDL version: " + fields[kPPStandardVersionNumber] + "; " +
                                                "Family name: " + fields[kPPCustomerFamilyName] + "; " +
                                                "First name: " + fields[kPPCustomerFirstName] + "; " +
                                                "Date of birth: " + fields[kPPDateOfBirth] + "; " +
                                                "Sex: " + fields[kPPSex] + "; " +
                                                "Eye color: " + fields[kPPEyeColor] + "; " +
                                                "Height: " + fields[kPPHeight] + "; " +
                                                "Street: " + fields[kPPAddressStreet] + "; " +
                                                "City: " + fields[kPPAddressCity] + "; " +
                                                "Jurisdiction: " + fields[kPPAddressJurisdictionCode] + "; " +
                                                "Postal code: " + fields[kPPAddressPostalCode] + "; " +

                                                /** License information */
                                                "Issue date: " + fields[kPPDocumentIssueDate] + "; " +
                                                "Expiration date: " + fields[kPPDocumentExpirationDate] + "; " +
                                                "Issuer ID: " + fields[kPPIssuerIdentificationNumber] + "; " +
                                                "Jurisdiction version: " + fields[kPPJurisdictionVersionNumber] + "; " +
                                                "Vehicle class: " + fields[kPPJurisdictionVehicleClass] + "; " +
                                                "Restrictions: " + fields[kPPJurisdictionRestrictionCodes] + "; " +
                                                "Endorsments: " + fields[kPPJurisdictionEndorsementCodes] + "; " +
                                                "Customer ID: " + fields[kPPCustomerIdNumber] + "; ";

                        } else if (recognizerResult.resultType == "MRTD result") {
                        
                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                                "Family name: " + fields[kPPmrtdPrimaryId] + "; " +
                                                "First name: " + fields[kPPmrtdSecondaryId] + "; " +
                                                "Date of birth: " + fields[kPPmrtdBirthDate] + "; " +
                                                "Sex: " + fields[kPPmrtdSex] + "; " +
                                                "Nationality: " + fields[kPPmrtdNationality] + "; " +
                                                "Date of Expiry: " + fields[kPPmrtdExpiry] + "; " +
                                                "Document Code: " + fields[kPPmrtdDocCode] + "; " +
                                                "Document Number: " + fields[kPPmrtdDocNumber] + "; " +
                                                "Issuer: " + fields[kPPmrtdIssuer] + "; " +
                                                "ID Type: " + fields[kPPmrtdDataType] + "; " +
                                                "Opt1: " + fields[kPPmrtdOpt1] + "; " +
                                                "Opt2: " + fields[kPPmrtdOpt2] + "; ";

                        } else if (recognizerResult.resultType == "EUDL result") {
                            
                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                                "ID Type: " + fields[kPPukdlDataType] + "; " +
                                                "Date of Expiry: : " + fields[kPPukdlExpiry] + "; " +
                                                "Issue Date: " + fields[kPPukdlIssueDate] + "; " +
                                                "Driver Number: " + fields[kPPukdlDriverNumber] + "; " +
                                                "Address: " + fields[kPPukdlAddress] + "; " +
                                                "Birth Data: " + fields[kPPukdlBirthData] + "; " +
                                                "First name: " + fields[kPPukdlFirstName] + "; " +
                                                "Last name: " + fields[kPPukdlLastName] + "; ";

                        } else if (recognizerResult.resultType == "MyKad result") {
                            
                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = /** Personal information */
                                                "ID Type: " + fields[kPPmyKadDataType] + "; " +
                                                "NRIC Number: " + fields[kPPmyKadNricNumber] + "; " +
                                                "Address: " + fields[kPPmyKadAddress] + "; " +
                                                "Birth Date: " + fields[kPPmyKadBirthDate] + "; " +
                                                "Full Name: " + fields[kPPmyKadFullName] + "; " +
                                                "Religion: " + fields[kPPmyKadReligion] + "; " +
                                                "Sex: " + fields[kPPmyKadSex] + "; ";

                        } else if (recognizerResult.resultType == "DocumentFace result") {

                            var fields = recognizerResult.fields;

                            resultDiv.innerHTML = "Found document with face";
                        }
                    }
                },
                
                // Register the error callback
                function errorHandler(err) {
                    alert('Error: ' + err);
                },

                types, imageType, licenseiOs, licenseAndroid
            );
        });

    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};

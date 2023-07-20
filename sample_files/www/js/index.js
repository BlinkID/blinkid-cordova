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

        successfulImageDiv.style.visibility = "hidden";
        documentFrontImageDiv.style.visibility = "hidden";
        documentBackImageDiv.style.visibility = "hidden";
        faceImageDiv.style.visibility = "hidden";

        // to scan any machine readable travel document (passports, visa's and IDs with 
        // machine readable zone), use MrtdRecognizer
//        var mrtdRecognizer = new cordova.plugins.BlinkID.MrtdRecognizer();
//        mrtdRecognizer.returnFullDocumentImage = true;
        // wrap recognizer with SuccessFrameGrabberRecognizer to obtain camera frame from the successful scan
//        var mrtdSuccessFrameGrabber = new cordova.plugins.BlinkID.SuccessFrameGrabberRecognizer(mrtdRecognizer);

        // BlinkIDMultiSideRecognizer automatically classifies different document types and scans the data from
        // the supported document
        var blinkIdMultiSideRecognizer = new cordova.plugins.BlinkID.BlinkIdMultiSideRecognizer();
        blinkIdMultiSideRecognizer.returnFullDocumentImage = true;
        blinkIdMultiSideRecognizer.returnFaceImage = true;

        // there are lots of Recognizer objects in BlinkID - check blinkIdScanner.js for full reference

        var blinkidOverlaySettings = new cordova.plugins.BlinkID.BlinkIdOverlaySettings();

        // create RecognizerCollection from any number of recognizers that should perform recognition
        var recognizerCollection = new cordova.plugins.BlinkID.RecognizerCollection([blinkIdMultiSideRecognizer /*, mrtdSuccessFrameGrabber */]);

        // package name/bundleID com.microblink.sample
        var licenseKeys = {
            android: 'sRwAAAAVY29tLm1pY3JvYmxpbmsuc2FtcGxlU9kJdZhZkGlTu9W3Oc1qzW2fUUuFAtgSxguvo8rtYSPvgK/vMOPS30PBqMTKgCktdau7LEeDaYWHi+6nhgwcfhveZAVs3EnYMO5AfL1D+6fHB1mxr/bXQIwByVd2Ol97Beqch/qfhhJlWsrrt+R3pyhrp/iigPo618waEnrne7vCglFwuEsUbtlhWtDOXB4xTpZ2FEadLMgN+YQUi7sR8MweaGeoCwyDMXGcYKNNiyfPOs63DDWKK8NrAhN7mRm2wEMvNqYzp0ycgzgv5VzoBD8132FMqSDQLt3DS3SJKUHE4pbDvv50QJHdZx/OLXxxbxwI88XaP/8hhZ0=',
            ios: 'sRwAAAEVY29tLm1pY3JvYmxpbmsuc2FtcGxl1BIcP4FpSuS/38LVO6iNNLvwTdq8BXiJ5UonUGzXseoV2n66Da5wNIZLr1ZBRlnFt2rbdnzzt/qU/fcwoCOqO8Zs2aUb2Psx4KutvE2SPyDiBo2Ko6yiA/P54/B8Jh8sEVWrLT341QghRicpTDbfiuJLtQ6HyCUrQOd28fxlwulwrZhqdyHmVJVQ6S4Gu2Dxd5dxt3LiIcZ0JeOjNKaPtc4Qnz7BYI2nQ5VfW2V2gYRIsvTzjgvT1AM2OibUXY0HeY4CTZ0BHwPVKTkQVnE39cOJST5k9JtZoZV086L2elpxizJueRIh4J8IzopUIFEFwq70cBj17Qr5gtc='
        };

        function buildResult(result, key) {
            if (result && result != -1) {
                return key + ": " + result + "<br>";
            }
            return ""
        }

        function buildDateResult(result, key) {
            if (result) {
                if (result.year != undefined) {
                    return key + ": " +
                        result.day + "." + result.month + "." + result.year + "."
                        + "<br>";
                    }
            }
            return ""
        }

        scanButton.addEventListener('click', function() {
            cordova.plugins.BlinkID.scanWithCamera(

                // Register the callback handler
                function callback(cancelled) {

                    resultDiv.innerHTML = "";

                    successfulImageDiv.style.visibility = "hidden";
                    documentFrontImageDiv.style.visibility = "hidden";
                    documentBackImageDiv.style.visibility = "hidden";
                    faceImageDiv.style.visibility = "hidden";

                    // handle cancelled scanning
                    if (cancelled) {
                        resultDiv.innerHTML = "Cancelled!";
                        return;
                    }

                    // if not cancelled, every recognizer will have its result property updated

                    if (blinkIdMultiSideRecognizer.result.resultState == cordova.plugins.BlinkID.RecognizerResultState.valid) {

                        var blinkIdResult = blinkIdMultiSideRecognizer.result;
                        var resultString =
                            buildResult(blinkIdResult.firstName.description, "First name") +
                            buildResult(blinkIdResult.lastName.description, "Last name") +
                            buildResult(blinkIdResult.fullName.description, "Full name") +
                            buildResult(blinkIdResult.localizedName.description, "Localized name") +
                            buildResult(blinkIdResult.additionalNameInformation.description, "Additional name info") +
                            buildResult(blinkIdResult.address.description, "Address") +
                            buildResult(blinkIdResult.additionalAddressInformation.description, "Additional address info") +
                            buildResult(blinkIdResult.additionalOptionalAddressInformation.description, "Additional optional address info") +
                            buildResult(blinkIdResult.documentNumber.description, "Document number") +
                            buildResult(blinkIdResult.documentAdditionalNumber.description, "Additional document number") +
                            buildResult(blinkIdResult.sex.description, "Sex") +
                            buildResult(blinkIdResult.issuingAuthority.description, "Issuing authority") +
                            buildResult(blinkIdResult.nationality.description, "Nationality") +
                            buildDateResult(blinkIdResult.dateOfBirth, "Date of birth") +
                            buildResult(blinkIdResult.age.description, "Age") +
                            buildDateResult(blinkIdResult.dateOfIssue, "Date of issue") +
                            buildDateResult(blinkIdResult.dateOfExpiry, "Date of expiry") +
                            buildResult(blinkIdResult.dateOfExpiryPermanent.description, "Date of expiry permanent") +
                            buildResult(blinkIdResult.expired.description, "Expired") +
                            buildResult(blinkIdResult.maritalStatus.description, "Martial status") +
                            buildResult(blinkIdResult.personalIdNumber.description, "Personal id number") +
                            buildResult(blinkIdResult.profession.description, "Profession") +
                            buildResult(blinkIdResult.race.description, "Race") +
                            buildResult(blinkIdResult.religion.description, "Religion") +
                            buildResult(blinkIdResult.residentialStatus.description, "Residential status") +
                            buildResult(blinkIdResult.processingStatus.description, "Processing status") +
                            buildResult(blinkIdResult.recognitionMode.description, "Recognition mode")
                            ;

                        let dataMatchResult = blinkIdResult.dataMatchResult;
                        resultString +=
                        buildResult(dataMatchResult.stateForWholeDocument, "State for the whole document") +
                        buildResult(dataMatchResult.states[0].state, "Date of birth") +
                        buildResult(dataMatchResult.states[1].state, "Date of expiry") +
                        buildResult(dataMatchResult.states[2].state, "Document number");

                        var licenceInfo = blinkIdResult.driverLicenseDetailedInfo;
                        if (licenceInfo) {
                            var vehicleClassesInfoString = '';
                            if (licenceInfo.vehicleClassesInfo) {
                              for (let i=0; i<licenceInfo.vehicleClassesInfo.length; i++) {
                                    vehicleClassesInfoString += buildResult(licenceInfo.vehicleClassesInfo[i].vehicleClass.description, 'Vehicle class') +  
                                    buildResult(licenceInfo.vehicleClassesInfo[i].licenceType.description, 'License type') +  
                                    buildDateResult(licenceInfo.vehicleClassesInfo[i].effectiveDate, 'Effective date') + 
                                    buildDateResult(licenceInfo.vehicleClassesInfo[i].expiryDate, 'Expiry date');
                                }
                            }
                            resultString +=
                                buildResult(licenceInfo.restrictions.description, "Restrictions") +
                                buildResult(licenceInfo.endorsements.description, "Endorsements") +
                                buildResult(licenceInfo.vehicleClass.description, "Vehicle class") +
                                buildResult(licenceInfo.conditions.description, "Conditions") + 
                                vehicleClassesInfoString;
                        }

                        // there are other fields to extract - check blinkIdScanner.js for full reference
                        resultDiv.innerHTML = resultString;

                        var resultDocumentFrontImage = blinkIdMultiSideRecognizer.result.fullDocumentFrontImage;
                        if (resultDocumentFrontImage) {
                            documentFrontImage.src = "data:image/jpg;base64, " + resultDocumentFrontImage;
                            documentFrontImageDiv.style.visibility = "visible";
                        }
                        var resultDocumentBackImage = blinkIdMultiSideRecognizer.result.fullDocumentBackImage;
                        if (resultDocumentBackImage) {
                            documentBackImage.src = "data:image/jpg;base64, " + resultDocumentBackImage;
                            documentBackImageDiv.style.visibility = "visible";
                        }
                        var resultFaceImage = blinkIdMultiSideRecognizer.result.faceImage;
                        if (resultFaceImage) {
                            faceImage.src = "data:image/jpg;base64, " + resultFaceImage;
                            faceImageDiv.style.visibility = "visible";
                        }
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

/**
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) Matt Kane 2010
 * Copyright (c) 2011, IBM Corporation
 * Copyright (c) 2013, Maciej Nux Jaros
 */
package com.microblink.blinkid.plugins.cordova;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import androidx.annotation.NonNull;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.microblink.blinkid.MicroblinkSDK;
import com.microblink.blinkid.entities.recognizers.RecognizerBundle;
import com.microblink.blinkid.intent.IntentDataTransferMode;
import com.microblink.blinkid.uisettings.UISettings;
import com.microblink.blinkid.plugins.cordova.overlays.OverlaySettingsSerializers;
import com.microblink.blinkid.plugins.cordova.recognizers.RecognizerSerializers;
import com.microblink.blinkid.locale.LanguageUtils;
import com.microblink.blinkid.directApi.DirectApiErrorListener;
import com.microblink.blinkid.directApi.RecognizerRunner;
import com.microblink.blinkid.hardware.orientation.Orientation;
import com.microblink.blinkid.metadata.recognition.FirstSideRecognitionCallback;
import com.microblink.blinkid.recognition.RecognitionSuccessType;
import com.microblink.blinkid.metadata.MetadataCallbacks;
import com.microblink.blinkid.view.recognition.ScanResultListener;
import com.microblink.blinkid.licence.exception.LicenceKeyException;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class BlinkIDScanner extends CordovaPlugin {

    private static final int REQUEST_CODE = 1337;

    private static final String SCAN_WITH_CAMERA = "scanWithCamera";
    private static final String SCAN_WITH_DIRECT_API = "scanWithDirectApi";
    private static final String CANCELLED = "cancelled";
    private static final String RESULT_LIST = "resultList";

    private RecognizerBundle mRecognizerBundle;
    private RecognizerRunner mRecognizerRunner;
    private boolean mFirstSideScanned = false;
    private CallbackContext mCallbackContext;

    /**
     * Constructor.
     */
    public BlinkIDScanner() {
    }

    /**
     * Executes the request.
     *
     * This method is called from the WebView thread. To do a non-trivial amount
     * of work, use: cordova.getThreadPool().execute(runnable);
     *
     * To run on the UI thread, use:
     * cordova.getActivity().runOnUiThread(runnable);
     *
     * @param action
     *            The action to execute.
     * @param args
     *            The exec() arguments.
     * @param callbackContext
     *            The callback context used when calling back into JavaScript.
     * @return Whether the action was valid.
     *
     * @sa
     *     https://github.com/apache/cordova-android/blob/master/framework/src/org
     *     /apache/cordova/CordovaPlugin.java
     */
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        mCallbackContext = callbackContext;

        try {
            if (action.equals(SCAN_WITH_CAMERA)) {
            	//Scan with camera
                scanWithCamera(args);
            } else if (action.equals(SCAN_WITH_DIRECT_API)) {
            	//Scan with DirectAPI
                scanWithDirectApi(args);
            } else {
                return false;
            }
            return true;
        } catch (JSONException e) {
            mCallbackContext.error("JSON error: " + e.getMessage());
            return false;
        }
    }

    private void scanWithCamera(JSONArray arguments) throws JSONException {
        try {
            JSONObject jsonOverlaySettings = arguments.getJSONObject(0);
            JSONObject jsonRecognizerCollection = arguments.getJSONObject(1);
            JSONObject jsonLicenses = arguments.getJSONObject(2);
            if (setLicense(jsonLicenses)) {
                setLanguage(jsonOverlaySettings.getString("language"),
                        jsonOverlaySettings.getString("country"));
                mRecognizerBundle = RecognizerSerializers.INSTANCE.deserializeRecognizerCollection(jsonRecognizerCollection);
                UISettings overlaySettings = OverlaySettingsSerializers.INSTANCE.getOverlaySettings(this.cordova.getContext(), jsonOverlaySettings, mRecognizerBundle);

                // unable to use ActivityRunner because we need to use cordova's activity launcher
                Intent intent = new Intent(this.cordova.getContext(), overlaySettings.getTargetActivity());
                overlaySettings.saveToIntent(intent);
                this.cordova.startActivityForResult(this, intent, REQUEST_CODE);   
            }
        } catch (JSONException e) {
            mCallbackContext.error("Could not start scanWithCamera.\nJSON error: " + e);
        }
    }

    private void scanWithDirectApi(JSONArray arguments) throws JSONException {
        //DirectAPI processing
        JSONObject jsonRecognizerCollection = arguments.getJSONObject(0);
        JSONObject jsonLicense = arguments.getJSONObject(3);
        if (setLicense(jsonLicense)) {

            ScanResultListener mScanResultListenerBackSide = new ScanResultListener() {
                @Override
                public void onScanningDone(@NonNull RecognitionSuccessType recognitionSuccessType) {
                    mFirstSideScanned = false;
                    handleDirectApiResult(recognitionSuccessType);
                }
                @Override
                public void onUnrecoverableError(@NonNull Throwable throwable) {
                    handleDirectApiError(throwable.getMessage());
                }
            };

            FirstSideRecognitionCallback  mFirstSideRecognitionCallback = new FirstSideRecognitionCallback() {
                @Override
                public void onFirstSideRecognitionFinished() {
                    mFirstSideScanned = true;
                }
            };

            ScanResultListener mScanResultListenerFrontSide = new ScanResultListener() {
                @Override
                public void onScanningDone(@NonNull RecognitionSuccessType recognitionSuccessType) {
                    if (mFirstSideScanned) {
                        //multiside recognizer used
                        try {
                            if (!arguments.getString(2).isEmpty() && !arguments.isNull(2)) {
                                processImage(arguments.getString(2), mScanResultListenerBackSide);
                            } else if (recognitionSuccessType != RecognitionSuccessType.UNSUCCESSFUL) {
                                handleDirectApiResult(recognitionSuccessType);
                            } else {
                                handleDirectApiError("Could not extract the information from the front side and the back side is empty!");
                            }
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }
                    } else if (!mFirstSideScanned && recognitionSuccessType != RecognitionSuccessType.UNSUCCESSFUL){
                        //singleside recognizer used
                        handleDirectApiResult(recognitionSuccessType);
                    } else {
                        mFirstSideScanned = false;
                        handleDirectApiError("Could not extract the information with DirectAPI!");
                    }
                }
                @Override
                public void onUnrecoverableError(@NonNull Throwable throwable) {
                    handleDirectApiError(throwable.getMessage());
                }
            };

            setupRecognizerRunner(jsonRecognizerCollection, mFirstSideRecognitionCallback);

            if (!arguments.getString(1).isEmpty() && !arguments.isNull(1)) {
                processImage(arguments.getString(1), mScanResultListenerFrontSide);
            } else {
                handleDirectApiError("The provided image for the 'frontImage' parameter is empty!");
            }
        }
    }

    private void setupRecognizerRunner(JSONObject jsonRecognizerCollection, FirstSideRecognitionCallback mFirstSideRecognitionCallback) {
        if (mRecognizerRunner != null) {
            mRecognizerRunner.terminate();
        }
        
        mRecognizerBundle = RecognizerSerializers.INSTANCE.deserializeRecognizerCollection(jsonRecognizerCollection);

        try {
            mRecognizerRunner = RecognizerRunner.getSingletonInstance();
        } catch (Exception e) {
            handleDirectApiError("DirectAPI not supported: " + e.getMessage());
        }

        MetadataCallbacks metadataCallbacks = new MetadataCallbacks();
        metadataCallbacks.setFirstSideRecognitionCallback(mFirstSideRecognitionCallback);
        mRecognizerRunner.setMetadataCallbacks(metadataCallbacks);
        mRecognizerRunner.initialize(cordova.getContext(), mRecognizerBundle, new DirectApiErrorListener() {
            @Override
            public void onRecognizerError(@NonNull Throwable throwable) {
                handleDirectApiError("Failed to initialize recognizer with DirectAPI: " + throwable.getMessage());
            }
        });
    }

    private void processImage(String base64Image, ScanResultListener scanResultListener) {
        Bitmap image = base64ToBitmap(base64Image);
        if (image != null) {
            mRecognizerRunner.recognizeBitmap(
                    base64ToBitmap(base64Image),
                    Orientation.ORIENTATION_LANDSCAPE_RIGHT,
                    scanResultListener
            );
        } else {
            handleDirectApiError("Could not decode the Base64 image!");
        }
    }

    private void handleDirectApiResult(RecognitionSuccessType recognitionSuccessType) {
        if (recognitionSuccessType != RecognitionSuccessType.UNSUCCESSFUL) {
            JSONObject result = new JSONObject();
            try {
                result.put(CANCELLED, false);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            try {
                JSONArray resultList = RecognizerSerializers.INSTANCE.serializeRecognizerResults(mRecognizerBundle.getRecognizers());
                result.put(RESULT_LIST, resultList);
            } catch(JSONException e) {
                throw new RuntimeException(e);
            }
            mCallbackContext.success(result);

        } else {
            handleDirectApiError("Could not extract the information with DirectAPI!");
        }
    }

    private void handleDirectApiError(String errorMessage) {
        mCallbackContext.error(errorMessage);
        mFirstSideScanned = false;
        if (mRecognizerRunner != null) {
            mRecognizerRunner.resetRecognitionState(true);
        }
    }

    private boolean setLicense( JSONObject jsonLicense ) throws JSONException {
        MicroblinkSDK.setShowTrialLicenseWarning(
                jsonLicense.optBoolean("showTrialLicenseKeyWarning", true)
        );
        String androidLicense = jsonLicense.getString("android");
        String licensee = jsonLicense.optString("licensee", null);
        Context context = cordova.getContext();
        if (licensee == null) {
            try {
                MicroblinkSDK.setLicenseKey(androidLicense, context);
            } catch (LicenceKeyException licenceKeyException) {
                mCallbackContext.error("Android license key error: " + licenceKeyException.toString());
                return false;
            }
        } else {
            try {
                MicroblinkSDK.setLicenseKey(androidLicense, licensee, context);
            } catch (LicenceKeyException licenceKeyException) {
                mCallbackContext.error("Android license key error: " + licenceKeyException.toString());
                return false;
            }
        }
        MicroblinkSDK.setIntentDataTransferMode(IntentDataTransferMode.PERSISTED_OPTIMISED);
        return true;
    }

    private Bitmap base64ToBitmap(String base64String) {
        byte[] decodedBytes = Base64.decode(base64String, Base64.DEFAULT);
        return BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
    }

    private void setLanguage(String language, String country) {
        LanguageUtils.setLanguageAndCountry(language, country, this.cordova.getContext());
    }

    /**
     * Called when the scanner intent completes.
     *
     * @param requestCode
     *            The request code originally supplied to
     *            startActivityForResult(), allowing you to identify who this
     *            result came from.
     * @param resultCode
     *            The integer result code returned by the child activity through
     *            its setResult().
     * @param data
     *            An Intent, which can return result data to the caller (various
     *            data can be attached to Intent "extras").
     */
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {

        if (resultCode == Activity.RESULT_OK) {

            JSONObject result = new JSONObject();
            try {
                result.put(CANCELLED, false);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }

            if (requestCode == REQUEST_CODE) {
                mRecognizerBundle.loadFromIntent(data);
                try {
                    JSONArray resultList = RecognizerSerializers.INSTANCE.serializeRecognizerResults(mRecognizerBundle.getRecognizers());
                    result.put(RESULT_LIST, resultList);
                } catch(JSONException e) {
                    throw new RuntimeException(e);
                }
            }
            mCallbackContext.success(result);
        } else if (resultCode == Activity.RESULT_CANCELED) {
            JSONObject obj = new JSONObject();
            try {
                obj.put(CANCELLED, true);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            mCallbackContext.success(obj);

        } else {
            mCallbackContext.error("Unexpected error");
        }

    }
}
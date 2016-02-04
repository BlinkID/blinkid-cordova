/**
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) Matt Kane 2010
 * Copyright (c) 2011, IBM Corporation
 * Copyright (c) 2013, Maciej Nux Jaros
 */
package com.phonegap.plugins.blinkid;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.microblink.activity.ScanCard;
import com.microblink.recognizers.BaseRecognitionResult;
import com.microblink.recognizers.IResultHolder;
import com.microblink.recognizers.RecognitionResults;
import com.microblink.recognizers.blinkbarcode.BarcodeType;
import com.microblink.recognizers.blinkbarcode.bardecoder.BarDecoderRecognizerSettings;
import com.microblink.recognizers.blinkbarcode.bardecoder.BarDecoderScanResult;
import com.microblink.recognizers.blinkbarcode.pdf417.Pdf417RecognizerSettings;
import com.microblink.recognizers.blinkbarcode.pdf417.Pdf417ScanResult;
import com.microblink.recognizers.blinkbarcode.usdl.USDLRecognizerSettings;
import com.microblink.recognizers.blinkbarcode.usdl.USDLScanResult;
import com.microblink.recognizers.blinkbarcode.zxing.ZXingRecognizerSettings;
import com.microblink.recognizers.blinkbarcode.zxing.ZXingScanResult;
import com.microblink.recognizers.blinkid.malaysia.MyKadRecognitionResult;
import com.microblink.recognizers.blinkid.malaysia.MyKadRecognizerSettings;
import com.microblink.recognizers.blinkid.mrtd.MRTDRecognitionResult;
import com.microblink.recognizers.blinkid.mrtd.MRTDRecognizerSettings;
import com.microblink.recognizers.blinkid.ukdl.UKDLRecognitionResult;
import com.microblink.recognizers.blinkid.ukdl.UKDLRecognizerSettings;
import com.microblink.recognizers.settings.RecognitionSettings;
import com.microblink.recognizers.settings.RecognizerSettings;
import com.microblink.results.barcode.BarcodeDetailedData;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class BlinkIdScanner extends CordovaPlugin {

    private static final int REQUEST_CODE = 1337;

    // keys for recognizer types
    private static final String PDF417_TYPE = "PDF417";
    private static final String USDL_TYPE = "USDL";
    private static final String BARDECODER_TYPE = "Bar Decoder";
    private static final String ZXING_TYPE = "Zxing";
    private static final String MRTD_TYPE = "MRTD";
    private static final String UKDL_TYPE = "UKDL";
    private static final String MYKAD_TYPE = "MyKad";

    // keys for result types
    private static final String PDF417_RESULT_TYPE = "Barcode result";
    private static final String USDL_RESULT_TYPE = "USDL result";
    private static final String BARDECODER_RESULT_TYPE = "Barcode result";
    private static final String ZXING_RESULT_TYPE = "Barcode result";
    private static final String MRTD_RESULT_TYPE = "MRTD result";
    private static final String UKDL_RESULT_TYPE = "UKDL result";
    private static final String MYKAD_RESULT_TYPE = "MyKad result";


    private static final String SCAN = "scan";
    private static final String CANCELLED = "cancelled";

    private static final String RESULT_LIST = "resultList";
    private static final String RESULT_TYPE = "resultType";
    private static final String TYPE = "type";
    private static final String DATA = "data";
    private static final String FIELDS = "fields";
    private static final String RAW_DATA = "raw";

    private static final String LOG_TAG = "BlinkIdScanner";

    private CallbackContext callbackContext;

    /**
     * Constructor.
     */
    public BlinkIdScanner() {
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
        this.callbackContext = callbackContext;

        if (action.equals(SCAN)) {
            Set<String> types = new HashSet<String>();

            JSONArray typesArg = args.optJSONArray(0);
            for (int i = 0; i < typesArg.length(); ++i) {
                types.add(typesArg.optString(i));
            }

            String licenseKey = null;
            if (!args.isNull(2)) {
                licenseKey = args.optString(2);
            }
            scan(types, licenseKey);
        } else {
            return false;
        }
        return true;
    }


    /**
     * Starts an intent from provided class to scan and return result.
     */
    public void scan(Set<String> types, String license) {

        Context context = this.cordova.getActivity().getApplicationContext();
        FakeR fakeR = new FakeR(this.cordova.getActivity());

        Intent intent = new Intent(context, ScanCard.class);

        // set the license key - obtain your key at
        // http://help.microblink.com.
        if (license != null) {
            intent.putExtra(ScanCard.EXTRAS_LICENSE_KEY, license);
        }

        List<RecognizerSettings> recSett = new ArrayList<RecognizerSettings>();
        for (String type : types) {
            try {
                recSett.add(buildRecognizerSettings(type));
            } catch (IllegalArgumentException ex) {
                this.callbackContext.error(ex.getMessage());
                return;
            }
        }

        // finally, when you have defined settings for each recognizer you want to use,
        // you should put them into array held by global settings object

        RecognitionSettings recognitionSettings = new RecognitionSettings();
        RecognizerSettings[] settingsArray = new RecognizerSettings[recSett.size()];
        settingsArray = recSett.toArray(settingsArray);
        recognitionSettings.setRecognizerSettingsArray(settingsArray);

        // additionally, there are generic settings that are used by all recognizers or the
        // whole recognition process

        // set this to true to enable returning of multiple scan results from single camera frame
        // default is false, which means that as soon as first barcode is found (no matter which type)
        // its contents will be returned.
        recognitionSettings.setAllowMultipleScanResultsOnSingleImage(true);

        // finally send that settings object over intent to scan activity
        // use ScanCard.EXTRAS_RECOGNITION_SETTINGS to set recognizer settings
        intent.putExtra(ScanCard.EXTRAS_RECOGNITION_SETTINGS, recognitionSettings);


        // If you want sound to be played after the scanning process ends, 
        // put here the resource ID of your sound file. (optional)
        intent.putExtra(ScanCard.EXTRAS_BEEP_RESOURCE, fakeR.getId("raw", "beep"));

        this.cordova.startActivityForResult((CordovaPlugin)this, intent, REQUEST_CODE);
    }


    private RecognizerSettings buildRecognizerSettings(String type) {
        if (type.equals(PDF417_TYPE)) {
            return buildPDF417Settings();
        } else if (type.equals(USDL_TYPE)) {
            return buildUsdlSettings();
        } else if (type.equals(BARDECODER_TYPE)) {
            return buildBardecoderSettings();
        } else if (type.equals(ZXING_TYPE)) {
            return buildZXingSettings();
        } else if (type.equals(MRTD_TYPE)) {
            return buildMrtdSettings();
        } else if (type.equals(UKDL_TYPE)) {
            return buildUkdlSettings();
        } else if (type.equals(MYKAD_TYPE)) {
            return  buildMyKadSettings();
        }
        throw new IllegalArgumentException("Recognizer type not supported: " + type);
    }

    private MRTDRecognizerSettings buildMrtdSettings() {
        // prepare settings for Machine Readable Travel Document (MRTD) recognizer
        MRTDRecognizerSettings mrtd = new MRTDRecognizerSettings();
        // Set this to true to allow obtaining results that have not been parsed by SDK.
        // By default this is off. The reason for this is that we want to ensure best possible
        // data quality when returning results.
        mrtd.setAllowUnparsedResults(false);
        return mrtd;
    }

    private UKDLRecognizerSettings buildUkdlSettings() {
        // prepare settings for United Kingdom Driver's Licence recognizer
        UKDLRecognizerSettings ukdl = new UKDLRecognizerSettings();
        // Defines if issue date should be extracted. Default is true
        ukdl.setExtractIssueDate(true);
        // Defines if expiry date should be extracted. Default is true.
        ukdl.setExtractExpiryDate(true);
        // Defines if address should be extracted. Default is true.
        ukdl.setExtractAddress(true);
        return ukdl;
    }

    private MyKadRecognizerSettings buildMyKadSettings() {
        // prepare settings for Malaysian MyKad ID document recognizer
        MyKadRecognizerSettings myKad = new MyKadRecognizerSettings();
        return myKad;
    }

    private USDLRecognizerSettings buildUsdlSettings() {
        // prepare settings for US Driver's Licence recognizer
        USDLRecognizerSettings usdl = new USDLRecognizerSettings();
        // By setting this to true, you will enable scanning of non-standard elements,
        // but there is no guarantee that all data will be read. This option is used when multiple
        // rows are missing (e.g. not whole barcode is printed). Default is false.
        usdl.setUncertainScanning(false);
        // By setting this to true, you will allow scanning barcodes which don't have quiet zone
        // surrounding it (e.g. text concatenated with barcode). This option can significantly
        // increase recognition time. Default is true.
        usdl.setNullQuietZoneAllowed(true);
        // Some driver's licenses contain 1D Code39 and Code128 barcodes alongside PDF417 barcode.
        // These barcodes usually contain only reduntant information and are therefore not read by
        // default. However, if you feel that some information is missing, you can enable scanning
        // of those barcodes by setting this to true.
        usdl.setScan1DBarcodes(true);
        return usdl;
    }

    private Pdf417RecognizerSettings buildPDF417Settings() {
        // prepare settings for PDF417 barcode recognizer
        Pdf417RecognizerSettings pdf417 = new Pdf417RecognizerSettings();
        // By setting this to true, you will enable scanning of non-standard elements, but there
        // is no guarantee that all data will be read. This option is used when multiple rows are
        // missing (e.g. not whole barcode is printed). Default is false.
        pdf417.setUncertainScanning(false);
        // By setting this to true, you will allow scanning barcodes which don't have quiet zone
        // surrounding it (e.g. text concatenated with barcode). This option can significantly
        // increase recognition time. Default is false.
        pdf417.setNullQuietZoneAllowed(false);
        // By setting this to true, you will enable scanning of barcodes with inverse intensity
        // values (i.e. white barcodes on dark background). This option can significantly increase
        // recognition time. Default is false.
        pdf417.setInverseScanning(false);
        return pdf417;
    }

    private BarDecoderRecognizerSettings buildBardecoderSettings() {
        // prepare settings for 1D barcode recognizer
        BarDecoderRecognizerSettings bar1d = new BarDecoderRecognizerSettings();
        // Method activates or deactivates the scanning of Code128 1D barcodes.
        // Default (initial) value is false.
        bar1d.setScanCode128(true);
        // Method activates or deactivates the scanning of Code39 1D barcodes.
        // Default (initial) value is false.
        bar1d.setScanCode39(true);
        // By setting this to true, you will enable scanning of barcodes with inverse intensity
        // values (i.e. white barcodes on dark background). This option can significantly increase
        // recognition time. Default is false.
        bar1d.setInverseScanning(false);
        // By setting this to true, you will enabled scanning of lower resolution barcodes at cost
        // of additional processing time. This option can significantly increase recognition time.
        // Default is false.
        bar1d.setTryHarder(false);
        return bar1d;
    }

    private ZXingRecognizerSettings buildZXingSettings() {
        // prepare settings for ZXing barcode recognizer
        ZXingRecognizerSettings zxing = new ZXingRecognizerSettings();
        // disable or enable scanning of various barcode types, by default all barcode types are
        // disabled
        zxing.setScanQRCode(true);
        zxing.setScanAztecCode(false);
        zxing.setScanCode128(true);
        zxing.setScanCode39(true);
        zxing.setScanDataMatrixCode(false);
        zxing.setScanEAN13Code(true);
        zxing.setScanEAN8Code(true);
        zxing.setScanITFCode(false);
        zxing.setScanUPCACode(true);
        zxing.setScanUPCECode(true);

        // By setting this to true, you will enable scanning of barcodes with inverse intensity
        // values (i.e. white barcodes on dark background). This option can significantly increase
        // recognition time. Default is false.
        zxing.setInverseScanning(false);
        // Use this method to enable slower, but more thorough scan procedure when scanning barcodes.
        // By default, this option is turned on.
        zxing.setSlowThoroughScan(true);
        return zxing;
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

        if (requestCode == REQUEST_CODE) {

            if (resultCode == ScanCard.RESULT_OK) {

                // First, obtain recognition result
                RecognitionResults results = data.getParcelableExtra(ScanCard.EXTRAS_RECOGNITION_RESULTS);
                // Get scan results array. If scan was successful, array will contain at least one element.
                // Multiple element may be in array if multiple scan results from single image were allowed in settings.
                BaseRecognitionResult[] resultArray = results.getRecognitionResults();

                // Each recognition result corresponds to active recognizer. There are 7 types of
                // recognizers available (PDF417, USDL, Bardecoder, ZXing, MRTD, UKDL and MyKad),
                // so there are 7 types of results available.

                JSONArray resultsList = new JSONArray();                

                for (BaseRecognitionResult res : resultArray) {
                    try {
                        if (res instanceof Pdf417ScanResult) { // check if scan result is result of Pdf417 recognizer
                            resultsList.put(buildPdf417Result((Pdf417ScanResult) res));
                        } else if (res instanceof BarDecoderScanResult) { // check if scan result is result of BarDecoder recognizer
                           resultsList.put(buildBarDecoderResult((BarDecoderScanResult) res));
                        } else if (res instanceof ZXingScanResult) { // check if scan result is result of ZXing recognizer
                            resultsList.put(buildZxingResult((ZXingScanResult) res));
                        } else if (res instanceof MRTDRecognitionResult) { // check if scan result is result of MRTD recognizer
                            resultsList.put(buildMRTDResult((MRTDRecognitionResult) res));
                        } else if (res instanceof USDLScanResult) { // check if scan result is result of US Driver's Licence recognizer
                            resultsList.put(buildUSDLResult((USDLScanResult) res));
                        } else if (res instanceof UKDLRecognitionResult) { // check if scan result is result of UKDL recognizer
                            resultsList.put(buildUKDLResult((UKDLRecognitionResult) res));
                        } else if (res instanceof MyKadRecognitionResult) { // check if scan result is result of MyKad recognizer
                            resultsList.put(buildMyKadResult((MyKadRecognitionResult) res));
                        }
                    } catch (Exception e) {
                        Log.e(LOG_TAG, "Error parsing " + res.getClass().getName());
                    }
                }
                
                try {
                    JSONObject root = new JSONObject();
                    root.put(RESULT_LIST, resultsList);             
                    root.put(CANCELLED, false);
                    this.callbackContext.success(root);
                } catch (JSONException e) {
                    Log.e(LOG_TAG, "This should never happen");
                }

            } else if (resultCode == ScanCard.RESULT_CANCELED) {
                JSONObject obj = new JSONObject();
                try {
                    obj.put(CANCELLED, true);

                } catch (JSONException e) {
                    Log.e(LOG_TAG, "This should never happen");
                }
                this.callbackContext.success(obj);

            } else {
                this.callbackContext.error("Unexpected error");
            }
        }
    }


    private JSONObject buildPdf417Result(Pdf417ScanResult res) throws JSONException {
        // getStringData getter will return the string version of barcode contents
        String barcodeData = res.getStringData();
        // getRawData getter will return the raw data information object of barcode contents
        BarcodeDetailedData rawData = res.getRawData();
        // BarcodeDetailedData contains information about barcode's binary layout, if you
        // are only interested in raw bytes, you can obtain them with getAllData getter
        byte[] rawDataBuffer = rawData.getAllData();

        JSONObject result = new JSONObject();
        result.put(RESULT_TYPE, PDF417_RESULT_TYPE);
        result.put(TYPE, "PDF417");
        result.put(DATA, barcodeData);
        result.put(RAW_DATA, byteArrayToHex(rawDataBuffer));
        return result;
    }

    private JSONObject buildBarDecoderResult(BarDecoderScanResult res) throws JSONException {
        // with getBarcodeType you can obtain barcode type enum that tells you the type of decoded barcode
        BarcodeType type = res.getBarcodeType();
        // as with PDF417, getStringData will return the string contents of barcode
        String barcodeData = res.getStringData();

        JSONObject result = new JSONObject();
        result.put(RESULT_TYPE, BARDECODER_RESULT_TYPE);
        result.put(TYPE, type.name());
        result.put(DATA, barcodeData);
        return result;
    }

    private JSONObject buildZxingResult(ZXingScanResult res) throws JSONException {
        // with getBarcodeType you can obtain barcode type enum that tells you the type of decoded barcode
        BarcodeType type = res.getBarcodeType();

        // as with PDF417, getStringData will return the string contents of barcode
        String barcodeData = res.getStringData();

        JSONObject result = new JSONObject();
        result.put(RESULT_TYPE, ZXING_RESULT_TYPE);
        result.put(TYPE, type.name());
        result.put(DATA, barcodeData);
        return result;
    }

    private JSONObject buildUSDLResult(USDLScanResult res) throws JSONException {
        return buildKeyValueResult(res, USDL_RESULT_TYPE);
    }

    private JSONObject buildMyKadResult(MyKadRecognitionResult res) throws JSONException {
       return buildKeyValueResult(res, MYKAD_RESULT_TYPE);
    }

    private JSONObject buildUKDLResult(UKDLRecognitionResult res) throws JSONException{
        return buildKeyValueResult(res, UKDL_RESULT_TYPE);
    }

    private JSONObject buildMRTDResult(MRTDRecognitionResult res) throws JSONException{
        return buildKeyValueResult(res, MRTD_RESULT_TYPE);
    }

    private JSONObject buildKeyValueResult(BaseRecognitionResult res, String resultType)
            throws JSONException {
        JSONObject fields = new JSONObject();
        IResultHolder resultHolder = res.getResultHolder();
        for (String key : resultHolder.keySet()) {
            Object value = resultHolder.getObject(key);
            if (value instanceof String) {
                fields.put(key, (String)value);
            } else {
                Log.d(LOG_TAG, "Ignoring non string key '" + key + "'");
            }
        }
        JSONObject result = new JSONObject();
        result.put(RESULT_TYPE, resultType);
        result.put(FIELDS, fields);
        return result;
    }

    private String byteArrayToHex(byte[] data) {
        StringBuilder sb = new StringBuilder();
        for (byte b : data) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

}

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
import android.graphics.Bitmap;
import android.os.Parcel;
import android.util.Base64;
import android.util.Log;

import com.microblink.locale.LanguageUtils;
import com.microblink.activity.ScanCard;
import com.microblink.image.Image;
import com.microblink.image.ImageListener;
import com.microblink.metadata.MetadataSettings;
import com.microblink.recognizers.BaseRecognitionResult;
import com.microblink.recognizers.IResultHolder;
import com.microblink.recognizers.RecognitionResults;
import com.microblink.recognizers.blinkbarcode.BarcodeType;
import com.microblink.recognizers.blinkbarcode.barcode.BarcodeRecognizerSettings;
import com.microblink.recognizers.blinkbarcode.barcode.BarcodeScanResult;
import com.microblink.recognizers.blinkbarcode.pdf417.Pdf417RecognizerSettings;
import com.microblink.recognizers.blinkbarcode.pdf417.Pdf417ScanResult;
import com.microblink.recognizers.blinkbarcode.usdl.USDLRecognizerSettings;
import com.microblink.recognizers.blinkbarcode.usdl.USDLScanResult;
import com.microblink.recognizers.blinkid.malaysia.MyKadRecognitionResult;
import com.microblink.recognizers.blinkid.malaysia.MyKadRecognizerSettings;
import com.microblink.recognizers.blinkid.mrtd.MRTDRecognitionResult;
import com.microblink.recognizers.blinkid.mrtd.MRTDRecognizerSettings;
import com.microblink.recognizers.blinkid.eudl.EUDLCountry;
import com.microblink.recognizers.blinkid.eudl.EUDLRecognitionResult;
import com.microblink.recognizers.blinkid.eudl.EUDLRecognizerSettings;
import com.microblink.recognizers.blinkid.documentface.DocumentFaceRecognizerSettings;
import com.microblink.recognizers.blinkid.documentface.DocumentFaceDetectorType;
import com.microblink.recognizers.blinkid.documentface.DocumentFaceRecognitionResult;
import com.microblink.recognizers.settings.RecognitionSettings;
import com.microblink.recognizers.settings.RecognizerSettings;
import com.microblink.results.barcode.BarcodeDetailedData;
import com.microblink.results.date.DateResult;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class BlinkIdScanner extends CordovaPlugin {

    private static final int REQUEST_CODE = 1337;

    // keys for recognizer types
    private static final String PDF417_TYPE = "PDF417";
    private static final String USDL_TYPE = "USDL";
    private static final String MRTD_TYPE = "MRTD";
    private static final String UKDL_TYPE = "UKDL";
    private static final String DEDL_TYPE = "DEDL";
    private static final String EUDL_TYPE = "EUDL";
    private static final String MYKAD_TYPE = "MyKad";
    private static final String BARCODE_TYPE = "Barcode";
    private static final String DOCUMENTFACE_TYPE = "DocumentFace";

    // keys for result types
    private static final String PDF417_RESULT_TYPE = "Barcode result";
    private static final String USDL_RESULT_TYPE = "USDL result";
    private static final String BARCODE_RESULT_TYPE = "Barcode result";
    private static final String MRTD_RESULT_TYPE = "MRTD result";
    private static final String UKDL_RESULT_TYPE = "UKDL result";
    private static final String DEDL_RESULT_TYPE = "DEDL result";
    private static final String EUDL_RESULT_TYPE = "EUDL result";
    private static final String MYKAD_RESULT_TYPE = "MyKad result";
    private static final String DOCUMENTFACE_RESULT_TYPE = "DocumentFace result";

    private static final String SCAN = "scan";
    private static final String CANCELLED = "cancelled";

    private static final String RESULT_LIST = "resultList";
    private static final String RESULT_SUCCESSFUL_IMAGE = "resultSuccessfulImage";
    private static final String RESULT_DOCUMENT_IMAGE = "resultDocumentImage";
    private static final String RESULT_FACE_IMAGE = "resultFaceImage";
    private static final String RESULT_TYPE = "resultType";
    private static final String TYPE = "type";
    private static final String DATA = "data";
    private static final String FIELDS = "fields";
    private static final String RAW_DATA = "raw";

    private static final int COMPRESSED_IMAGE_QUALITY = 90;

    private static final String IMAGE_SUCCESSFUL_SCAN_STR = "IMAGE_SUCCESSFUL_SCAN";
    private static final String IMAGE_DOCUMENT_STR = "IMAGE_DOCUMENT";
    private static final String IMAGE_FACE_STR = "IMAGE_FACE";

    private static final String LOG_TAG = "BlinkIdScanner";

    private static boolean sReturnSuccessfulImage;
    private static boolean sReturnDocumentImage;
    private static boolean sReturnFaceImage;

    private static CallbackContext sCallbackContext;

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
        sCallbackContext = callbackContext;

        if (action.equals(SCAN)) {
            Set<String> types = new HashSet<String>();

            JSONArray typesArg = args.optJSONArray(0);
            for (int i = 0; i < typesArg.length(); ++i) {
                types.add(typesArg.optString(i));
            }

            JSONArray imageTypes = args.optJSONArray(1);
            for (int i = 0; i < imageTypes.length(); ++i) {
                if (imageTypes.optString(i).equals(IMAGE_SUCCESSFUL_SCAN_STR)) {
                    sReturnSuccessfulImage = true;
                } else if (imageTypes.optString(i).equals(IMAGE_DOCUMENT_STR)) {
                    sReturnDocumentImage = true;
                } else if (imageTypes.optString(i).equals(IMAGE_FACE_STR)) {
                    sReturnFaceImage = true;
                }
            }

            // ios license key is at index 2 in args

            String licenseKey = null;
            if (!args.isNull(3)) {
                licenseKey = args.optString(3);
            }

            String language = null;
            if (!args.isNull(4)) {
              language = args.optString(4);
            }

            scan(types, licenseKey, language);
        } else {
            return false;
        }
        return true;
    }


    /**
     * Starts an intent from provided class to scan and return result.
     */
    public void scan(Set<String> types, String license, String language) {

        Context context = this.cordova.getActivity().getApplicationContext();
        FakeR fakeR = new FakeR(this.cordova.getActivity());

        // set the language if it's specified
        if (language != null) {
            LanguageUtils.setLanguageAndCountry(language, "", context);
        }

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
                sCallbackContext.error(ex.getMessage());
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

        // set image metadata settings to define which images will be obtained as metadata during scan process
        MetadataSettings.ImageMetadataSettings ims = new MetadataSettings.ImageMetadataSettings();
        if (sReturnDocumentImage || sReturnFaceImage) {
            // enable obtaining of dewarped(cropped) images
            ims.setDewarpedImageEnabled(true);
        }
        if (sReturnSuccessfulImage) {
            // enable obtaining of successful frames
            ims.setSuccessfulScanFrameEnabled(true);
        }
        // pass prepared image metadata settings to scan activity
        intent.putExtra(ScanCard.EXTRAS_IMAGE_METADATA_SETTINGS, ims);

        // pass image listener to scan activity
        intent.putExtra(ScanCard.EXTRAS_IMAGE_LISTENER, new ScanImageListener());

        // If you want sound to be played after the scanning process ends,
        // put here the resource ID of your sound file. (optional)
        intent.putExtra(ScanCard.EXTRAS_BEEP_RESOURCE, fakeR.getId("raw", "beep"));
        intent.putExtra(ScanCard.EXTRAS_SPLASH_SCREEN_LAYOUT_RESOURCE, fakeR.getId("layout", "splash_screen"));

        ImageHolder.getInstance().clear();
        this.cordova.startActivityForResult((CordovaPlugin)this, intent, REQUEST_CODE);
    }


    private RecognizerSettings buildRecognizerSettings(String type) {
        if (type.equals(PDF417_TYPE)) {
            return buildPDF417Settings();
        } else if (type.equals(USDL_TYPE)) {
            return buildUsdlSettings();
        } else if (type.equals(MRTD_TYPE)) {
            return buildMrtdSettings();
        } else if (type.equals(UKDL_TYPE)) {
            return buildUkdlSettings();
        } else if (type.equals(DEDL_TYPE)) {
            return buildDedlSettings();
        } else if (type.equals(EUDL_TYPE)) {
            return buildEudlSettings();
        } else if (type.equals(MYKAD_TYPE)) {
            return buildMyKadSettings();
        } else if(type.equals(BARCODE_TYPE)) {
            return buildBarcodeSettings();
        } else if (type.equals(DOCUMENTFACE_TYPE)) {
          return buildDocumentFaceSettings();
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
        if (sReturnDocumentImage) {
            mrtd.setShowFullDocument(true);
        }
        return mrtd;
    }

    private EUDLRecognizerSettings buildUkdlSettings() {
        // To specify we want to perform EUDL (EU Driver's License) recognition,
        // prepare settings for EUDL recognizer. Pass country as parameter to EUDLRecognizerSettings
        // constructor. Here we choose UK.
        EUDLRecognizerSettings ukdl = new EUDLRecognizerSettings(EUDLCountry.EUDL_COUNTRY_UK);
        // Defines if issue date should be extracted. Default is true
        ukdl.setExtractIssueDate(true);
        // Defines if expiry date should be extracted. Default is true.
        ukdl.setExtractExpiryDate(true);
        // Defines if address should be extracted. Default is true.
        ukdl.setExtractAddress(true);
        if (sReturnDocumentImage) {
            ukdl.setShowFullDocument(true);
        }
        if (sReturnFaceImage) {
            ukdl.setShowFaceImage(true);
        }
        return ukdl;
    }
    
    private EUDLRecognizerSettings buildDedlSettings() {
        // To specify we want to perform EUDL (EU Driver's License) recognition,
        // prepare settings for EUDL recognizer. Pass country as parameter to EUDLRecognizerSettings
        // constructor. Here we choose UK.
        EUDLRecognizerSettings dedl = new EUDLRecognizerSettings(EUDLCountry.EUDL_COUNTRY_GERMANY);
        // Defines if issue date should be extracted. Default is true
        dedl.setExtractIssueDate(true);
        // Defines if expiry date should be extracted. Default is true.
        dedl.setExtractExpiryDate(true);
        // Defines if address should be extracted. Default is true.
        dedl.setExtractAddress(true);
        if (sReturnDocumentImage) {
            dedl.setShowFullDocument(true);
        }
        if (sReturnFaceImage) {
            dedl.setShowFaceImage(true);
        }
        return dedl;
    }
    
    private EUDLRecognizerSettings buildEudlSettings() {
        // To specify we want to perform EUDL (EU Driver's License) recognition,
        // prepare settings for EUDL recognizer. Pass country as parameter to EUDLRecognizerSettings
        // constructor. Here we choose UK.
        EUDLRecognizerSettings eudl = new EUDLRecognizerSettings(EUDLCountry.EUDL_COUNTRY_AUTO);
        // Defines if issue date should be extracted. Default is true
        eudl.setExtractIssueDate(true);
        // Defines if expiry date should be extracted. Default is true.
        eudl.setExtractExpiryDate(true);
        // Defines if address should be extracted. Default is true.
        eudl.setExtractAddress(true);
        if (sReturnDocumentImage) {
            eudl.setShowFullDocument(true);
        }
        if (sReturnFaceImage) {
            eudl.setShowFaceImage(true);
        }
        return eudl;
    }

    private MyKadRecognizerSettings buildMyKadSettings() {
        // prepare settings for Malaysian MyKad ID document recognizer
        MyKadRecognizerSettings myKad = new MyKadRecognizerSettings();
        if (sReturnDocumentImage) {
            myKad.setShowFullDocument(true);
        }
        if (sReturnFaceImage) {
            myKad.setShowFaceImage(true);
        }
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

    private BarcodeRecognizerSettings buildBarcodeSettings() {
        // prepare settings for the Barcode recognizer
        BarcodeRecognizerSettings barcode = new BarcodeRecognizerSettings();
        // disable or enable scanning of various barcode types, by default all barcode types are
        // disabled
        barcode.setScanQRCode(true);
        barcode.setScanAztecCode(false);
        barcode.setScanCode128(true);
        barcode.setScanCode39(true);
        barcode.setScanDataMatrixCode(false);
        barcode.setScanEAN13Code(true);
        barcode.setScanEAN8Code(true);
        barcode.setScanITFCode(false);
        barcode.setScanUPCACode(true);
        barcode.setScanUPCECode(true);

        // By setting this to true, you will enable scanning of barcodes with inverse intensity
        // values (i.e. white barcodes on dark background). This option can significantly increase
        // recognition time. Default is false.
        barcode.setInverseScanning(false);
        // Use this method to enable slower, but more thorough scan procedure when scanning barcodes.
        // By default, this option is turned on.
        barcode.setSlowThoroughScan(true);
        return barcode;
    }
    
    private DocumentFaceRecognizerSettings buildDocumentFaceSettings() {
        // prepare settings for the DocumentFace recognizer
        DocumentFaceRecognizerSettings docFace = new DocumentFaceRecognizerSettings(DocumentFaceDetectorType.IDENTITY_CARD_TD1);
      
        if (sReturnDocumentImage) {
            docFace.setShowFullDocument(true);
        }
        if (sReturnFaceImage) {
            docFace.setShowFaceImage(true);
        }
      
        return docFace;
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
                        } else if (res instanceof MRTDRecognitionResult) { // check if scan result is result of MRTD recognizer
                            resultsList.put(buildMRTDResult((MRTDRecognitionResult) res));
                        } else if (res instanceof USDLScanResult) { // check if scan result is result of US Driver's Licence recognizer
                            resultsList.put(buildUSDLResult((USDLScanResult) res));
                        } else if (res instanceof EUDLRecognitionResult) { // check if scan result is result of EUDL recognizer
                            resultsList.put(buildEUDLResult((EUDLRecognitionResult) res));
                        } else if (res instanceof MyKadRecognitionResult) { // check if scan result is result of MyKad recognizer
                            resultsList.put(buildMyKadResult((MyKadRecognitionResult) res));
                        } else if (res instanceof BarcodeScanResult) {
                            resultsList.put(buildBarcodeResult((BarcodeScanResult) res));
                        } else if (res instanceof DocumentFaceRecognitionResult) {
                            resultsList.put(buildDocumentFaceResult((DocumentFaceRecognitionResult) res));
                        }
                    } catch (Exception e) {
                        Log.e(LOG_TAG, "Error parsing " + res.getClass().getName());
                    }
                }

                try {
                    JSONObject root = new JSONObject();
                    root.put(RESULT_LIST, resultsList);
                    String successfulImageBase64 = encodeImageBase64(ImageHolder.getInstance().getSuccessfulImage());
                    if (successfulImageBase64 != null) {
                        root.put(RESULT_SUCCESSFUL_IMAGE, successfulImageBase64);
                    }
                    root.put(CANCELLED, false);
//                    ImageHolder.getInstance().clear();
                    sCallbackContext.success(root);
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
                sCallbackContext.success(obj);

            } else {
                sCallbackContext.error("Unexpected error");
            }
            ImageHolder.getInstance().clear();
        }
    }

    private String encodeImageBase64(Image image) {
        if (image == null) {
            return null;
        }
        Bitmap resultImgBmp = image.convertToBitmap();
        if (resultImgBmp == null) {
            return null;
        }
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        boolean success = resultImgBmp.compress(Bitmap.CompressFormat.JPEG, COMPRESSED_IMAGE_QUALITY, byteArrayOutputStream);
        String resultImgBase64 = null;
        if (success) {
            resultImgBase64 = Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.DEFAULT);
        }
        try {
            byteArrayOutputStream.close();
        } catch (IOException ignorable) {}
        return resultImgBase64;
    }

    private boolean putDocumentImageToResultJson(JSONObject resultHolder, Class<? extends BaseRecognitionResult> resultType) {
        ImagesBundle imagesBundle =  ImageHolder.getInstance().getImages(resultType);
        String documentImageBase64 = null;
        if (imagesBundle != null) {
            documentImageBase64 = encodeImageBase64(imagesBundle.getDocumentImage());
        }
        if (documentImageBase64 != null) {
            try {
                resultHolder.put(RESULT_DOCUMENT_IMAGE, documentImageBase64);
                return true;
            } catch (JSONException e) {}
        }
        return false;
    }

    private boolean putFaceImageToResultJson(JSONObject resultHolder, Class<? extends BaseRecognitionResult> resultType) {
        ImagesBundle imagesBundle =  ImageHolder.getInstance().getImages(resultType);
        String faceImageBase64 = null;
        if (imagesBundle != null) {
            faceImageBase64 = encodeImageBase64(imagesBundle.getFaceImage());
        }
        if (faceImageBase64 != null) {
            try {
                resultHolder.put(RESULT_FACE_IMAGE, faceImageBase64);
                return true;
            } catch (JSONException e) {}
        }
        return false;
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

    private JSONObject buildBarcodeResult(BarcodeScanResult res) throws JSONException {
        // with getBarcodeType you can obtain barcode type enum that tells you the type of decoded barcode
        BarcodeType type = res.getBarcodeType();
        // as with PDF417, getStringData will return the string contents of barcode
        String barcodeData = res.getStringData();

        JSONObject result = new JSONObject();
        result.put(RESULT_TYPE, BARCODE_RESULT_TYPE);
        result.put(TYPE, type.name());
        result.put(DATA, barcodeData);
        return result;
    }

    private JSONObject buildUSDLResult(USDLScanResult res) throws JSONException {
        return buildKeyValueResult(res, USDL_RESULT_TYPE);
    }

    private JSONObject buildMyKadResult(MyKadRecognitionResult res) throws JSONException {
       JSONObject result = buildKeyValueResult(res, MYKAD_RESULT_TYPE);
       putDocumentImageToResultJson(result, MyKadRecognitionResult.class);
       putFaceImageToResultJson(result, MyKadRecognitionResult.class);
       return result;
    }
    
    private JSONObject buildEUDLResult(EUDLRecognitionResult res) throws JSONException{
      String resultType;
      
      // Select the result type by country.
      switch(res.getCountry()) {
        case EUDL_COUNTRY_UK:
            resultType = UKDL_RESULT_TYPE;
            break;
        case EUDL_COUNTRY_GERMANY:
            resultType = DEDL_RESULT_TYPE;
            break;
        default:
            resultType = EUDL_RESULT_TYPE;
      }
      JSONObject result = buildKeyValueResult(res, resultType);
      putDocumentImageToResultJson(result, EUDLRecognitionResult.class);
      putFaceImageToResultJson(result, EUDLRecognitionResult.class);
      return result;
    }

    private JSONObject buildMRTDResult(MRTDRecognitionResult res) throws JSONException{
        JSONObject result = buildKeyValueResult(res, MRTD_RESULT_TYPE);
        putDocumentImageToResultJson(result, MRTDRecognitionResult.class);
        return result;
    }
    
    private JSONObject buildDocumentFaceResult(DocumentFaceRecognitionResult res) throws JSONException {
        JSONObject result = buildKeyValueResult(res, DOCUMENTFACE_RESULT_TYPE);
        putDocumentImageToResultJson(result, DocumentFaceRecognitionResult.class);
        putFaceImageToResultJson(result, DocumentFaceRecognitionResult.class);
        return result;
    }

    private JSONObject buildKeyValueResult(BaseRecognitionResult res, String resultType)
            throws JSONException {
        JSONObject fields = new JSONObject();
        IResultHolder resultHolder = res.getResultHolder();
        for (String key : resultHolder.keySet()) {
            Object value = resultHolder.getObject(key);
            if (value instanceof String) {
                fields.put(key, (String) value);
            } else if (value instanceof DateResult) {
                fields.put( key, ((DateResult) value).getOriginalDateString());
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


    public static class ScanImageListener implements ImageListener {

        /**
         * Called when library has image available.
         */
        @Override
        public void onImageAvailable(Image image) {
            switch (image.getImageType()) {
                case DEWARPED:
                    if (sReturnFaceImage && storeFaceImage(image)) {
                        return;
                    } else if (sReturnDocumentImage && storeDocumentImage(image)) {
                        return;
                    }
                    break;
                case SUCCESSFUL_SCAN:
                    ImageHolder.getInstance().setSuccessfulImage(image.clone());
                    break;
            }
        }

        private boolean storeFaceImage(Image image) {
            String imageName = image.getImageName();
            Class<? extends BaseRecognitionResult> resultType = null;
            if (imageName.equals(EUDLRecognizerSettings.FACE_IMAGE_NAME)) {
                resultType = EUDLRecognitionResult.class;
            } else if (imageName.equals(MyKadRecognizerSettings.FACE_IMAGE_NAME)) {
                resultType = MyKadRecognitionResult.class;
            } else if (imageName.equals(DocumentFaceRecognizerSettings.FACE_IMAGE_NAME)) {
                resultType = DocumentFaceRecognitionResult.class;
            }
            if (resultType != null) {
                ImageHolder.getInstance().setFaceImage(resultType, image.clone());
                return true;
            }
            return false;
        }

        private boolean storeDocumentImage(Image image) {
            String imageName = image.getImageName();
            Class<? extends BaseRecognitionResult> resultType = null;
            if (imageName.equals(MRTDRecognizerSettings.FULL_DOCUMENT_IMAGE)) {
                resultType = MRTDRecognitionResult.class;
            } else if (imageName.equals(EUDLRecognizerSettings.FULL_DOCUMENT_IMAGE)) {
                resultType = EUDLRecognitionResult.class;
            } else if (imageName.equals(MyKadRecognizerSettings.FULL_DOCUMENT_IMAGE)) {
                resultType = MyKadRecognitionResult.class;
            } else if (imageName.equals(DocumentFaceRecognizerSettings.FULL_DOCUMENT_IMAGE)) {
                resultType = DocumentFaceRecognitionResult.class;
            }
            if (resultType != null) {
                ImageHolder.getInstance().setDocumentImage(resultType, image.clone());
                return true;
            }
            return false;
        }

        /**
         * ImageListener interface extends Parcelable interface, so we also need to implement
         * that interface. The implementation of Parcelable interface is below this line.
         */

        @Override
        public int describeContents() {
            return 0;
        }

        @Override
        public void writeToParcel(Parcel dest, int flags) {
        }

        public static final Creator<ScanImageListener> CREATOR = new Creator<ScanImageListener>() {
            @Override
            public ScanImageListener createFromParcel(Parcel source) {
                return new ScanImageListener();
            }

            @Override
            public ScanImageListener[] newArray(int size) {
                return new ScanImageListener[size];
            }
        };
    }

    public static class ImageHolder {

        private static ImageHolder sInstance = new ImageHolder();
        private Map<Class<? extends BaseRecognitionResult>, ImagesBundle> mImages;
        private Image mLastSuccessfulImage;

        private ImageHolder() {
            mImages = new HashMap<Class<? extends BaseRecognitionResult>, ImagesBundle>();
        }

        public static ImageHolder getInstance() {
            return sInstance;
        }

        public void setSuccessfulImage(Image image) {
            mLastSuccessfulImage = image;
        }

        public void setDocumentImage(Class<? extends BaseRecognitionResult> resultClass, Image image) {
            getAndCreateBundle(resultClass).setDocumentImage(image);
        }

        public void setFaceImage(Class<? extends BaseRecognitionResult> resultClass, Image image) {
            getAndCreateBundle(resultClass).setFaceImage(image);
        }

        private ImagesBundle getAndCreateBundle(Class<? extends BaseRecognitionResult> resultClass) {
            ImagesBundle imagesBundle = mImages.get(resultClass);
            if (imagesBundle == null) {
                imagesBundle = new ImagesBundle();
                mImages.put(resultClass, imagesBundle);
            }
            return imagesBundle;
        }

        public ImagesBundle getImages(Class<? extends BaseRecognitionResult> resultClass) {
            return mImages.get(resultClass);
        }

        public Image getSuccessfulImage() {
            return mLastSuccessfulImage;
        }

        public void clear() {
            for (ImagesBundle ib : mImages.values()) {
                ib.dispose();
            }
            mImages.clear();
            if (mLastSuccessfulImage != null) {
                mLastSuccessfulImage.dispose();
                mLastSuccessfulImage = null;
            }
        }
    }

    private static class ImagesBundle {
        private Image mDocumentImage;
        private Image mFaceImage;

        public Image getDocumentImage() {
            return mDocumentImage;
        }

        public void setDocumentImage(Image documentImage) {
            if (mDocumentImage != null) {
                mDocumentImage.dispose();
            }
            mDocumentImage = documentImage;
        }

        public Image getFaceImage() {
            return mFaceImage;
        }

        public void setFaceImage(Image faceImage) {
            if (mFaceImage != null) {
                mFaceImage.dispose();
            }
            mFaceImage = faceImage;
        }

        public void dispose() {
            if (mDocumentImage != null) {
                mDocumentImage.dispose();
                mDocumentImage = null;
            }
            if (mFaceImage != null) {
                mFaceImage.dispose();
                mFaceImage = null;
            }
        }
    }

}
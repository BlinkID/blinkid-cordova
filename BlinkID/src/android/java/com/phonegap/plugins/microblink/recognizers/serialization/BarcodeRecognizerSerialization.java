package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;
import com.phonegap.plugins.microblink.recognizers.SerializationUtils;

import org.json.JSONException;
import org.json.JSONObject;

public final class BarcodeRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkbarcode.barcode.BarcodeRecognizer recognizer = new com.microblink.entities.recognizers.blinkbarcode.barcode.BarcodeRecognizer();
        recognizer.setAutoScaleDetection(jsonRecognizer.optBoolean("autoScaleDetection", true));
        recognizer.setInverseScanning(jsonRecognizer.optBoolean("inverseScanning", false));
        recognizer.setNullQuietZoneAllowed(jsonRecognizer.optBoolean("nullQuietZoneAllowed", false));
        recognizer.setReadCode39AsExtendedData(jsonRecognizer.optBoolean("readCode39AsExtendedData", false));
        recognizer.setScanAztecCode(jsonRecognizer.optBoolean("scanAztecCode", false));
        recognizer.setScanCode128(jsonRecognizer.optBoolean("scanCode128", false));
        recognizer.setScanCode39(jsonRecognizer.optBoolean("scanCode39", false));
        recognizer.setScanDataMatrixCode(jsonRecognizer.optBoolean("scanDataMatrixCode", false));
        recognizer.setScanEAN13Code(jsonRecognizer.optBoolean("scanEAN13Code", false));
        recognizer.setScanEAN8Code(jsonRecognizer.optBoolean("scanEAN8Code", false));
        recognizer.setScanITFCode(jsonRecognizer.optBoolean("scanITFCode", false));
        recognizer.setScanPDF417(jsonRecognizer.optBoolean("scanPDF417", false));
        recognizer.setScanQRCode(jsonRecognizer.optBoolean("scanQRCode", false));
        recognizer.setScanUPCACode(jsonRecognizer.optBoolean("scanUPCACode", false));
        recognizer.setScanUPCECode(jsonRecognizer.optBoolean("scanUPCECode", false));
        recognizer.setSlowerThoroughScan(jsonRecognizer.optBoolean("slowerThoroughScan", true));
        recognizer.setUncertainDecoding(jsonRecognizer.optBoolean("uncertainDecoding", true));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkbarcode.barcode.BarcodeRecognizer.Result result = ((com.microblink.entities.recognizers.blinkbarcode.barcode.BarcodeRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("barcodeFormat", SerializationUtils.serializeEnum(result.getBarcodeFormat()));
            jsonResult.put("rawData", SerializationUtils.encodeByteArrayToBase64(result.getRawData()));
            jsonResult.put("stringData", result.getStringData());
            jsonResult.put("uncertain", result.isUncertain());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "BarcodeRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkbarcode.barcode.BarcodeRecognizer.class;
    }
}
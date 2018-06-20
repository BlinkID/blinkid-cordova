package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class BarcodeRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkbarcode.barcode.BarcodeRecognizer recognizer = new com.microblink.entities.recognizers.blinkbarcode.barcode.BarcodeRecognizer();
        recognizer.setAutoScaleDetection(jsonRecognizer.optBoolean("autoScaleDetection", true));
        recognizer.setManateeLicenseKey(jsonRecognizer.optString("manateeLicenseKey", ""));
        recognizer.setNullQuietZoneAllowed(jsonRecognizer.optBoolean("nullQuietZoneAllowed", false));
        recognizer.setReadCode39AsExtendedData(jsonRecognizer.optBoolean("readCode39AsExtendedData", false));
        recognizer.setScanAztecCode(jsonRecognizer.optBoolean("scanAztecCode", false));
        recognizer.setScanCode128(jsonRecognizer.optBoolean("scanCode128", false));
        recognizer.setScanCode39(jsonRecognizer.optBoolean("scanCode39", false));
        recognizer.setScanDataMatrix(jsonRecognizer.optBoolean("scanDataMatrix", false));
        recognizer.setScanEan13(jsonRecognizer.optBoolean("scanEan13", false));
        recognizer.setScanEan8(jsonRecognizer.optBoolean("scanEan8", false));
        recognizer.setScanInverse(jsonRecognizer.optBoolean("scanInverse", false));
        recognizer.setScanItf(jsonRecognizer.optBoolean("scanItf", false));
        recognizer.setScanPdf417(jsonRecognizer.optBoolean("scanPdf417", false));
        recognizer.setScanQrCode(jsonRecognizer.optBoolean("scanQrCode", false));
        recognizer.setScanUncertain(jsonRecognizer.optBoolean("scanUncertain", true));
        recognizer.setScanUpca(jsonRecognizer.optBoolean("scanUpca", false));
        recognizer.setScanUpce(jsonRecognizer.optBoolean("scanUpce", false));
        recognizer.setSlowerThoroughScan(jsonRecognizer.optBoolean("slowerThoroughScan", true));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkbarcode.barcode.BarcodeRecognizer.Result result = ((com.microblink.entities.recognizers.blinkbarcode.barcode.BarcodeRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("barcodeType", SerializationUtils.serializeEnum(result.getBarcodeType()));
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
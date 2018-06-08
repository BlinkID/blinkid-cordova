package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.microblink.entities.recognizers.blinkbarcode.usdl.USDLKeys;
import com.microblink.entities.recognizers.blinkbarcode.usdl.USDLRecognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public final class USDLRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkbarcode.usdl.USDLRecognizer recognizer = new com.microblink.entities.recognizers.blinkbarcode.usdl.USDLRecognizer();
        recognizer.setNullQuietZoneAllowed(jsonRecognizer.optBoolean("nullQuietZoneAllowed", true));
        recognizer.setUncertainDecoding(jsonRecognizer.optBoolean("uncertainDecoding", true));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        USDLRecognizer.Result result = ((USDLRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("optionalElements", SerializationUtils.serializeStringArray(result.getOptionalElements()));
            jsonResult.put("rawData", SerializationUtils.encodeByteArrayToBase64(result.getRawData()));
            jsonResult.put("rawStringData", result.getRawStringData());
            jsonResult.put("uncertain", result.isUncertain());
            jsonResult.put("fields", serializeFields(result));
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    private JSONArray serializeFields(USDLRecognizer.Result result) {
        JSONArray fieldsArr = new JSONArray();
        for (int i = 0; i < USDLKeys.values().length; ++i) {
            fieldsArr.put(result.getField(USDLKeys.values()[i]));
        }
        return fieldsArr;
    }

    @Override
    public String getJsonName() {
        return "USDLRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkbarcode.usdl.USDLRecognizer.class;
    }
}
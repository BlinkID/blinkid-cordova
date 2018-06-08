package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class ColombiaIDBackSideRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.colombia.ColombiaIDBackSideRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.colombia.ColombiaIDBackSideRecognizer();
        recognizer.setNullQuietZoneAllowed(jsonRecognizer.optBoolean("nullQuietZoneAllowed", true));
        recognizer.setScanUncertain(jsonRecognizer.optBoolean("scanUncertain", true));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.colombia.ColombiaIDBackSideRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.colombia.ColombiaIDBackSideRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("ownerBloodGroup", result.getOwnerBloodGroup());
            jsonResult.put("ownerDateOfBirth", SerializationUtils.serializeDate(result.getOwnerDateOfBirth()));
            jsonResult.put("ownerFingerprint", SerializationUtils.encodeByteArrayToBase64(result.getOwnerFingerprint()));
            jsonResult.put("ownerFirsName", result.getOwnerFirsName());
            jsonResult.put("ownerLastName", result.getOwnerLastName());
            jsonResult.put("ownerSex", result.getOwnerSex());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "ColombiaIDBackSideRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.colombia.ColombiaIDBackSideRecognizer.class;
    }
}
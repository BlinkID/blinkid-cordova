package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class ColombiaIdBackRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.colombia.ColombiaIdBackRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.colombia.ColombiaIdBackRecognizer();
        recognizer.setNullQuietZoneAllowed(jsonRecognizer.optBoolean("nullQuietZoneAllowed", true));
        recognizer.setScanUncertain(jsonRecognizer.optBoolean("scanUncertain", true));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.colombia.ColombiaIdBackRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.colombia.ColombiaIdBackRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("bloodGroup", result.getBloodGroup());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("fingerprint", SerializationUtils.encodeByteArrayToBase64(result.getFingerprint()));
            jsonResult.put("firstName", result.getFirstName());
            jsonResult.put("lastName", result.getLastName());
            jsonResult.put("sex", result.getSex());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "ColombiaIdBackRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.colombia.ColombiaIdBackRecognizer.class;
    }
}
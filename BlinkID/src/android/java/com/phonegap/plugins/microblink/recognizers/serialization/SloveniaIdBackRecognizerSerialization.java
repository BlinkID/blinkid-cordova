package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class SloveniaIdBackRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.slovenia.SloveniaIdBackRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.slovenia.SloveniaIdBackRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractAuthority(jsonRecognizer.optBoolean("extractAuthority", true));
        recognizer.setExtractDateOfIssue(jsonRecognizer.optBoolean("extractDateOfIssue", true));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.slovenia.SloveniaIdBackRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.slovenia.SloveniaIdBackRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("address", result.getAddress());
            jsonResult.put("authority", result.getAuthority());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("dateOfExpiry", SerializationUtils.serializeDate(result.getDateOfExpiry()));
            jsonResult.put("dateOfIssue", SerializationUtils.serializeDate(result.getDateOfIssue()));
            jsonResult.put("documentCode", result.getDocumentCode());
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("issuer", result.getIssuer());
            jsonResult.put("mrzParsed", result.isMrzParsed());
            jsonResult.put("mrzText", result.getMrzText());
            jsonResult.put("mrzVerified", result.isMrzVerified());
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("opt1", result.getOpt1());
            jsonResult.put("opt2", result.getOpt2());
            jsonResult.put("primaryId", result.getPrimaryId());
            jsonResult.put("secondaryId", result.getSecondaryId());
            jsonResult.put("sex", result.getSex());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "SloveniaIdBackRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.slovenia.SloveniaIdBackRecognizer.class;
    }
}
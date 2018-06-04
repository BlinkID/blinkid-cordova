package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;
import com.phonegap.plugins.microblink.recognizers.SerializationUtils;

import org.json.JSONException;
import org.json.JSONObject;

public final class AustriaIDBackSideRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.austria.AustriaIDBackSideRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.austria.AustriaIDBackSideRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setEncodeFullDocumentImage(jsonRecognizer.optBoolean("encodeFullDocumentImage", false));
        recognizer.setExtractDateOfIssuance(jsonRecognizer.optBoolean("extractDateOfIssuance", true));
        recognizer.setExtractHeight(jsonRecognizer.optBoolean("extractHeight", true));
        recognizer.setExtractIssuingAuthority(jsonRecognizer.optBoolean("extractIssuingAuthority", true));
        recognizer.setExtractPlaceOfBirth(jsonRecognizer.optBoolean("extractPlaceOfBirth", true));
        recognizer.setExtractPrincipalResidence(jsonRecognizer.optBoolean("extractPrincipalResidence", true));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.austria.AustriaIDBackSideRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.austria.AustriaIDBackSideRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("MRZResult", com.phonegap.plugins.microblink.recognizers.BlinkIDSerializationUtils.serializeMRZResult(result.getMRZResult()));
            jsonResult.put("dateOfIssuance", SerializationUtils.serializeDate(result.getDateOfIssuance().getDate()));
            jsonResult.put("encodedFullDocumentImage", SerializationUtils.encodeByteArrayToBase64(result.getEncodedFullDocumentImage()));
            jsonResult.put("eyeColour", result.getEyeColour());
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("issuingAuthority", result.getIssuingAuthority());
            jsonResult.put("placeOfBirth", result.getPlaceOfBirth());
            jsonResult.put("principalResidence", result.getPrincipalResidence());
            jsonResult.put("height", result.getHeight());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "AustriaIDBackSideRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.austria.AustriaIDBackSideRecognizer.class;
    }
}
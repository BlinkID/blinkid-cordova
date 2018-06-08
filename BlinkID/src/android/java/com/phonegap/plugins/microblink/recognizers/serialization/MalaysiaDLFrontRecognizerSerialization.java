package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class MalaysiaDLFrontRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.malaysia.MalaysiaDLFrontRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.malaysia.MalaysiaDLFrontRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractDLClass(jsonRecognizer.optBoolean("extractDLClass", true));
        recognizer.setExtractFullAddress(jsonRecognizer.optBoolean("extractFullAddress", true));
        recognizer.setExtractName(jsonRecognizer.optBoolean("extractName", true));
        recognizer.setExtractNationality(jsonRecognizer.optBoolean("extractNationality", true));
        recognizer.setExtractValidFrom(jsonRecognizer.optBoolean("extractValidFrom", true));
        recognizer.setExtractValidUntil(jsonRecognizer.optBoolean("extractValidUntil", true));
        recognizer.setFullDocumentImageDPI(jsonRecognizer.optInt("fullDocumentImageDPI", 250));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.malaysia.MalaysiaDLFrontRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.malaysia.MalaysiaDLFrontRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("city", result.getCity());
            jsonResult.put("dLClass", result.getDLClass());
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullAddress", result.getFullAddress());
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("identityNumber", result.getIdentityNumber());
            jsonResult.put("name", result.getName());
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("state", result.getState());
            jsonResult.put("street", result.getStreet());
            jsonResult.put("validFrom", SerializationUtils.serializeDate(result.getValidFrom()));
            jsonResult.put("validUntil", SerializationUtils.serializeDate(result.getValidUntil()));
            jsonResult.put("zipCode", result.getZipCode());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "MalaysiaDLFrontRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.malaysia.MalaysiaDLFrontRecognizer.class;
    }
}
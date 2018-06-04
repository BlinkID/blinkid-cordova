package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;
import com.phonegap.plugins.microblink.recognizers.SerializationUtils;

import org.json.JSONException;
import org.json.JSONObject;

public final class GermanyOldIDRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.germany.GermanyOldIDRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.germany.GermanyOldIDRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setReturnSignatureImage(jsonRecognizer.optBoolean("returnSignatureImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.germany.GermanyOldIDRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.germany.GermanyOldIDRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("MRZParsed", result.isMRZParsed());
            jsonResult.put("MRZText", result.getMRZText());
            jsonResult.put("MRZVerified", result.isMRZVerified());
            jsonResult.put("alienNumber", result.getAlienNumber());
            jsonResult.put("applicationReceiptNumber", result.getApplicationReceiptNumber());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("dateOfExpiry", SerializationUtils.serializeDate(result.getDateOfExpiry()));
            jsonResult.put("documentCode", result.getDocumentCode());
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("documentType", SerializationUtils.serializeEnum(result.getDocumentType()));
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("immigrantCaseNumber", result.getImmigrantCaseNumber());
            jsonResult.put("issuer", result.getIssuer());
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("opt1", result.getOpt1());
            jsonResult.put("opt2", result.getOpt2());
            jsonResult.put("placeOfBirth", result.getPlaceOfBirth());
            jsonResult.put("primaryId", result.getPrimaryId());
            jsonResult.put("rawDateOfBirth", result.getRawDateOfBirth());
            jsonResult.put("rawDateOfExpiry", result.getRawDateOfExpiry());
            jsonResult.put("secondaryId", result.getSecondaryId());
            jsonResult.put("sex", result.getSex());
            jsonResult.put("signatureImage", SerializationUtils.encodeImageBase64(result.getSignatureImage()));
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "GermanyOldIDRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.germany.GermanyOldIDRecognizer.class;
    }
}
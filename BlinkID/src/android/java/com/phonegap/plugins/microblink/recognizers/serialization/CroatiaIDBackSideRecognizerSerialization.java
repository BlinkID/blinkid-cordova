package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;
import com.phonegap.plugins.microblink.recognizers.SerializationUtils;

import org.json.JSONException;
import org.json.JSONObject;

public final class CroatiaIDBackSideRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.croatia.CroatiaIDBackSideRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.croatia.CroatiaIDBackSideRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractDateOfIssue(jsonRecognizer.optBoolean("extractDateOfIssue", true));
        recognizer.setExtractIssuingAuthority(jsonRecognizer.optBoolean("extractIssuingAuthority", true));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.croatia.CroatiaIDBackSideRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.croatia.CroatiaIDBackSideRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("MRZParsed", result.isMRZParsed());
            jsonResult.put("MRZText", result.getMRZText());
            jsonResult.put("MRZVerified", result.isMRZVerified());
            jsonResult.put("address", result.getAddress());
            jsonResult.put("alienNumber", result.getAlienNumber());
            jsonResult.put("applicationReceiptNumber", result.getApplicationReceiptNumber());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("dateOfExpiry", SerializationUtils.serializeDate(result.getDateOfExpiry()));
            jsonResult.put("documentCode", result.getDocumentCode());
            jsonResult.put("documentDateOfExpiryPermanent", result.getDocumentDateOfExpiryPermanent());
            jsonResult.put("documentDateOfIssue", SerializationUtils.serializeDate(result.getDocumentDateOfIssue()));
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("documentType", SerializationUtils.serializeEnum(result.getDocumentType()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("immigrantCaseNumber", result.getImmigrantCaseNumber());
            jsonResult.put("issuer", result.getIssuer());
            jsonResult.put("issuingAuthority", result.getIssuingAuthority());
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("opt1", result.getOpt1());
            jsonResult.put("opt2", result.getOpt2());
            jsonResult.put("primaryId", result.getPrimaryId());
            jsonResult.put("rawDateOfBirth", result.getRawDateOfBirth());
            jsonResult.put("rawDateOfExpiry", result.getRawDateOfExpiry());
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
        return "CroatiaIDBackSideRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.croatia.CroatiaIDBackSideRecognizer.class;
    }
}
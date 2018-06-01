package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;
import com.phonegap.plugins.microblink.recognizers.SerializationUtils;

import org.json.JSONException;
import org.json.JSONObject;

public final class SwitzerlandPassportRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.switzerland.SwitzerlandPassportRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.switzerland.SwitzerlandPassportRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractAuthority(jsonRecognizer.optBoolean("extractAuthority", true));
        recognizer.setExtractDateOfBirth(jsonRecognizer.optBoolean("extractDateOfBirth", true));
        recognizer.setExtractDateOfExpiry(jsonRecognizer.optBoolean("extractDateOfExpiry", true));
        recognizer.setExtractDateOfIssue(jsonRecognizer.optBoolean("extractDateOfIssue", true));
        recognizer.setExtractHeight(jsonRecognizer.optBoolean("extractHeight", true));
        recognizer.setExtractName(jsonRecognizer.optBoolean("extractName", true));
        recognizer.setExtractPassportNumber(jsonRecognizer.optBoolean("extractPassportNumber", true));
        recognizer.setExtractPlaceOfOrigin(jsonRecognizer.optBoolean("extractPlaceOfOrigin", true));
        recognizer.setExtractSex(jsonRecognizer.optBoolean("extractSex", true));
        recognizer.setExtractSurname(jsonRecognizer.optBoolean("extractSurname", true));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.switzerland.SwitzerlandPassportRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.switzerland.SwitzerlandPassportRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("MRZParsed", result.isMRZParsed());
            jsonResult.put("MRZText", result.getMRZText());
            jsonResult.put("MRZVerified", result.isMRZVerified());
            jsonResult.put("alienNumber", result.getAlienNumber());
            jsonResult.put("applicationReceiptNumber", result.getApplicationReceiptNumber());
            jsonResult.put("authority", result.getAuthority());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("dateOfExpiry", SerializationUtils.serializeDate(result.getDateOfExpiry()));
            jsonResult.put("dateOfIssue", SerializationUtils.serializeDate(result.getDateOfIssue()));
            jsonResult.put("documentCode", result.getDocumentCode());
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("documentType", SerializationUtils.serializeEnum(result.getDocumentType()));
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("height", result.getHeight());
            jsonResult.put("immigrantCaseNumber", result.getImmigrantCaseNumber());
            jsonResult.put("issuer", result.getIssuer());
            jsonResult.put("name", result.getName());
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("nonMRZDateOfBirth", SerializationUtils.serializeDate(result.getNonMRZDateOfBirth()));
            jsonResult.put("nonMRZDateOfExpiry", SerializationUtils.serializeDate(result.getNonMRZDateOfExpiry()));
            jsonResult.put("nonMRZSex", result.getNonMRZSex());
            jsonResult.put("opt1", result.getOpt1());
            jsonResult.put("opt2", result.getOpt2());
            jsonResult.put("passportNumber", result.getPassportNumber());
            jsonResult.put("placeOfOrigin", result.getPlaceOfOrigin());
            jsonResult.put("primaryId", result.getPrimaryId());
            jsonResult.put("rawDateOfBirth", result.getRawDateOfBirth());
            jsonResult.put("rawDateOfExpiry", result.getRawDateOfExpiry());
            jsonResult.put("secondaryId", result.getSecondaryId());
            jsonResult.put("sex", result.getSex());
            jsonResult.put("surname", result.getSurname());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "SwitzerlandPassportRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.switzerland.SwitzerlandPassportRecognizer.class;
    }
}
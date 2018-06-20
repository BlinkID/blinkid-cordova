package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class RomaniaIdFrontRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.romania.RomaniaIdFrontRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.romania.RomaniaIdFrontRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractAddress(jsonRecognizer.optBoolean("extractAddress", true));
        recognizer.setExtractFirstName(jsonRecognizer.optBoolean("extractFirstName", true));
        recognizer.setExtractIssuedBy(jsonRecognizer.optBoolean("extractIssuedBy", true));
        recognizer.setExtractLastName(jsonRecognizer.optBoolean("extractLastName", true));
        recognizer.setExtractNonMRZSex(jsonRecognizer.optBoolean("extractNonMRZSex", true));
        recognizer.setExtractPlaceOfBirth(jsonRecognizer.optBoolean("extractPlaceOfBirth", true));
        recognizer.setExtractValidFrom(jsonRecognizer.optBoolean("extractValidFrom", true));
        recognizer.setExtractValidUntil(jsonRecognizer.optBoolean("extractValidUntil", true));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.romania.RomaniaIdFrontRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.romania.RomaniaIdFrontRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("address", result.getAddress());
            jsonResult.put("cardNumber", result.getCardNumber());
            jsonResult.put("cnp", result.getCnp());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("dateOfExpiry", SerializationUtils.serializeDate(result.getDateOfExpiry()));
            jsonResult.put("documentCode", result.getDocumentCode());
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("firstName", result.getFirstName());
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("idSeries", result.getIdSeries());
            jsonResult.put("issuedBy", result.getIssuedBy());
            jsonResult.put("issuer", result.getIssuer());
            jsonResult.put("lastName", result.getLastName());
            jsonResult.put("mrzParsed", result.isMrzParsed());
            jsonResult.put("mrzText", result.getMrzText());
            jsonResult.put("mrzVerified", result.isMrzVerified());
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("nonMRZNationality", result.getNonMRZNationality());
            jsonResult.put("nonMRZSex", result.getNonMRZSex());
            jsonResult.put("opt1", result.getOpt1());
            jsonResult.put("opt2", result.getOpt2());
            jsonResult.put("parentNames", result.getParentNames());
            jsonResult.put("placeOfBirth", result.getPlaceOfBirth());
            jsonResult.put("primaryId", result.getPrimaryId());
            jsonResult.put("secondaryId", result.getSecondaryId());
            jsonResult.put("sex", result.getSex());
            jsonResult.put("validFrom", SerializationUtils.serializeDate(result.getValidFrom()));
            jsonResult.put("validUntil", SerializationUtils.serializeDate(result.getValidUntil()));
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "RomaniaIdFrontRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.romania.RomaniaIdFrontRecognizer.class;
    }
}
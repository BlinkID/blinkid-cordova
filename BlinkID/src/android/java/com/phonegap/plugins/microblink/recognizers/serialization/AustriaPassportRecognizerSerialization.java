package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class AustriaPassportRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.austria.AustriaPassportRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.austria.AustriaPassportRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractDateOfBirth(jsonRecognizer.optBoolean("extractDateOfBirth", true));
        recognizer.setExtractDateOfExpiry(jsonRecognizer.optBoolean("extractDateOfExpiry", true));
        recognizer.setExtractDateOfIssue(jsonRecognizer.optBoolean("extractDateOfIssue", true));
        recognizer.setExtractGivenName(jsonRecognizer.optBoolean("extractGivenName", true));
        recognizer.setExtractHeight(jsonRecognizer.optBoolean("extractHeight", true));
        recognizer.setExtractIssuingAuthority(jsonRecognizer.optBoolean("extractIssuingAuthority", true));
        recognizer.setExtractNationality(jsonRecognizer.optBoolean("extractNationality", false));
        recognizer.setExtractPassportNumber(jsonRecognizer.optBoolean("extractPassportNumber", true));
        recognizer.setExtractPlaceOfBirth(jsonRecognizer.optBoolean("extractPlaceOfBirth", true));
        recognizer.setExtractSex(jsonRecognizer.optBoolean("extractSex", true));
        recognizer.setExtractSurname(jsonRecognizer.optBoolean("extractSurname", true));
        recognizer.setFaceImageDpi(jsonRecognizer.optInt("faceImageDpi", 250));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setReturnSignatureImage(jsonRecognizer.optBoolean("returnSignatureImage", false));
        recognizer.setSignatureImageDpi(jsonRecognizer.optInt("signatureImageDpi", 250));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.austria.AustriaPassportRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.austria.AustriaPassportRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("dateOfExpiry", SerializationUtils.serializeDate(result.getDateOfExpiry()));
            jsonResult.put("dateOfIssue", SerializationUtils.serializeDate(result.getDateOfIssue()));
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("givenName", result.getGivenName());
            jsonResult.put("height", result.getHeight());
            jsonResult.put("issuingAuthority", result.getIssuingAuthority());
            jsonResult.put("mrzResult", BlinkIDSerializationUtils.serializeMrzResult(result.getMrzResult()));
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("passportNumber", result.getPassportNumber());
            jsonResult.put("placeOfBirth", result.getPlaceOfBirth());
            jsonResult.put("sex", result.getSex());
            jsonResult.put("signatureImage", SerializationUtils.encodeImageBase64(result.getSignatureImage()));
            jsonResult.put("surname", result.getSurname());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "AustriaPassportRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.austria.AustriaPassportRecognizer.class;
    }
}
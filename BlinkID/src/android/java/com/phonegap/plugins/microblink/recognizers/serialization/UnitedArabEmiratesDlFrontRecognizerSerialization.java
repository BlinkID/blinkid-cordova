package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class UnitedArabEmiratesDlFrontRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.unitedArabEmirates.UnitedArabEmiratesDlFrontRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.unitedArabEmirates.UnitedArabEmiratesDlFrontRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractDateOfBirth(jsonRecognizer.optBoolean("extractDateOfBirth", true));
        recognizer.setExtractIssueDate(jsonRecognizer.optBoolean("extractIssueDate", true));
        recognizer.setExtractLicenseNumber(jsonRecognizer.optBoolean("extractLicenseNumber", true));
        recognizer.setExtractLicensingAuthority(jsonRecognizer.optBoolean("extractLicensingAuthority", true));
        recognizer.setExtractName(jsonRecognizer.optBoolean("extractName", true));
        recognizer.setExtractNationality(jsonRecognizer.optBoolean("extractNationality", true));
        recognizer.setExtractPlaceOfIssue(jsonRecognizer.optBoolean("extractPlaceOfIssue", true));
        recognizer.setFaceImageDpi(jsonRecognizer.optInt("faceImageDpi", 250));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setFullDocumentImageExtensionFactors(BlinkIDSerializationUtils.deserializeExtensionFactors(jsonRecognizer.optJSONObject("fullDocumentImageExtensionFactors")));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.unitedArabEmirates.UnitedArabEmiratesDlFrontRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.unitedArabEmirates.UnitedArabEmiratesDlFrontRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("expiryDate", SerializationUtils.serializeDate(result.getExpiryDate()));
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("issueDate", SerializationUtils.serializeDate(result.getIssueDate()));
            jsonResult.put("licenseNumber", result.getLicenseNumber());
            jsonResult.put("licensingAuthority", result.getLicensingAuthority());
            jsonResult.put("name", result.getName());
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("placeOfIssue", result.getPlaceOfIssue());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "UnitedArabEmiratesDlFrontRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.unitedArabEmirates.UnitedArabEmiratesDlFrontRecognizer.class;
    }
}
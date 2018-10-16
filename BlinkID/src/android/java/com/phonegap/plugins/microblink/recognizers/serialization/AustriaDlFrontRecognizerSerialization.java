package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class AustriaDlFrontRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.austria.AustriaDlFrontRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.austria.AustriaDlFrontRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractDateOfBirth(jsonRecognizer.optBoolean("extractDateOfBirth", true));
        recognizer.setExtractDateOfExpiry(jsonRecognizer.optBoolean("extractDateOfExpiry", true));
        recognizer.setExtractDateOfIssue(jsonRecognizer.optBoolean("extractDateOfIssue", true));
        recognizer.setExtractFirstName(jsonRecognizer.optBoolean("extractFirstName", true));
        recognizer.setExtractIssuingAuthority(jsonRecognizer.optBoolean("extractIssuingAuthority", true));
        recognizer.setExtractName(jsonRecognizer.optBoolean("extractName", true));
        recognizer.setExtractPlaceOfBirth(jsonRecognizer.optBoolean("extractPlaceOfBirth", true));
        recognizer.setExtractVehicleCategories(jsonRecognizer.optBoolean("extractVehicleCategories", true));
        recognizer.setFaceImageDpi(jsonRecognizer.optInt("faceImageDpi", 250));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setFullDocumentImageExtensionFactors(BlinkIDSerializationUtils.deserializeExtensionFactors(jsonRecognizer.optJSONObject("fullDocumentImageExtensionFactors")));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setReturnSignatureImage(jsonRecognizer.optBoolean("returnSignatureImage", false));
        recognizer.setSignatureImageDpi(jsonRecognizer.optInt("signatureImageDpi", 250));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.austria.AustriaDlFrontRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.austria.AustriaDlFrontRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("dateOfExpiry", SerializationUtils.serializeDate(result.getDateOfExpiry()));
            jsonResult.put("dateOfIssue", SerializationUtils.serializeDate(result.getDateOfIssue()));
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("firstName", result.getFirstName());
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("issuingAuthority", result.getIssuingAuthority());
            jsonResult.put("licenceNumber", result.getLicenceNumber());
            jsonResult.put("name", result.getName());
            jsonResult.put("placeOfBirth", result.getPlaceOfBirth());
            jsonResult.put("signatureImage", SerializationUtils.encodeImageBase64(result.getSignatureImage()));
            jsonResult.put("vehicleCategories", result.getVehicleCategories());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "AustriaDlFrontRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.austria.AustriaDlFrontRecognizer.class;
    }
}
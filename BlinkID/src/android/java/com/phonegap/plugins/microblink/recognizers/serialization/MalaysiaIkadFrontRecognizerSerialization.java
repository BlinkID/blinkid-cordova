package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class MalaysiaIkadFrontRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.malaysia.MalaysiaIkadFrontRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.malaysia.MalaysiaIkadFrontRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractAddress(jsonRecognizer.optBoolean("extractAddress", true));
        recognizer.setExtractDateOfExpiry(jsonRecognizer.optBoolean("extractDateOfExpiry", true));
        recognizer.setExtractEmployer(jsonRecognizer.optBoolean("extractEmployer", true));
        recognizer.setExtractFacultyAddress(jsonRecognizer.optBoolean("extractFacultyAddress", true));
        recognizer.setExtractGender(jsonRecognizer.optBoolean("extractGender", true));
        recognizer.setExtractName(jsonRecognizer.optBoolean("extractName", true));
        recognizer.setExtractNationality(jsonRecognizer.optBoolean("extractNationality", true));
        recognizer.setExtractPassportNumber(jsonRecognizer.optBoolean("extractPassportNumber", true));
        recognizer.setExtractSector(jsonRecognizer.optBoolean("extractSector", true));
        recognizer.setFaceImageDpi(jsonRecognizer.optInt("faceImageDpi", 250));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setFullDocumentImageExtensionFactors(BlinkIDSerializationUtils.deserializeExtensionFactors(jsonRecognizer.optJSONObject("fullDocumentImageExtensionFactors")));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?> recognizer) {
        com.microblink.entities.recognizers.blinkid.malaysia.MalaysiaIkadFrontRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.malaysia.MalaysiaIkadFrontRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("address", result.getAddress());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("dateOfExpiry", SerializationUtils.serializeDate(result.getDateOfExpiry()));
            jsonResult.put("employer", result.getEmployer());
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("facultyAddress", result.getFacultyAddress());
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("gender", result.getGender());
            jsonResult.put("name", result.getName());
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("passportNumber", result.getPassportNumber());
            jsonResult.put("sector", result.getSector());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "MalaysiaIkadFrontRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.malaysia.MalaysiaIkadFrontRecognizer.class;
    }
}
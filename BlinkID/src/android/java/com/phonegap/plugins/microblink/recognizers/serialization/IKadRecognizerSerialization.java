package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;
import com.phonegap.plugins.microblink.recognizers.SerializationUtils;

import org.json.JSONException;
import org.json.JSONObject;

public final class IKadRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.malaysia.IKadRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.malaysia.IKadRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractAddress(jsonRecognizer.optBoolean("extractAddress", true));
        recognizer.setExtractEmployer(jsonRecognizer.optBoolean("extractEmployer", true));
        recognizer.setExtractExpiryDate(jsonRecognizer.optBoolean("extractExpiryDate", true));
        recognizer.setExtractNationality(jsonRecognizer.optBoolean("extractNationality", true));
        recognizer.setExtractPassportNumber(jsonRecognizer.optBoolean("extractPassportNumber", true));
        recognizer.setExtractSector(jsonRecognizer.optBoolean("extractSector", true));
        recognizer.setExtractSex(jsonRecognizer.optBoolean("extractSex", true));
        recognizer.setFullDocumentImageDPI(jsonRecognizer.optInt("fullDocumentImageDPI", 250));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.malaysia.IKadRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.malaysia.IKadRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("address", result.getAddress());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("employer", result.getEmployer());
            jsonResult.put("expiryDate", SerializationUtils.serializeDate(result.getExpiryDate()));
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("fullName", result.getFullName());
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("passportNumber", result.getPassportNumber());
            jsonResult.put("sector", result.getSector());
            jsonResult.put("sex", result.getSex());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "IKadRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.malaysia.IKadRecognizer.class;
    }
}
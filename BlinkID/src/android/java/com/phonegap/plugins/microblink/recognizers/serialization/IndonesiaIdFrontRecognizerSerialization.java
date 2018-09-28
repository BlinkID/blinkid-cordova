package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class IndonesiaIdFrontRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.indonesia.IndonesiaIdFrontRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.indonesia.IndonesiaIdFrontRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractAddress(jsonRecognizer.optBoolean("extractAddress", true));
        recognizer.setExtractBloodType(jsonRecognizer.optBoolean("extractBloodType", true));
        recognizer.setExtractCitizenship(jsonRecognizer.optBoolean("extractCitizenship", true));
        recognizer.setExtractCity(jsonRecognizer.optBoolean("extractCity", true));
        recognizer.setExtractDistrict(jsonRecognizer.optBoolean("extractDistrict", true));
        recognizer.setExtractKelDesa(jsonRecognizer.optBoolean("extractKelDesa", true));
        recognizer.setExtractMaritalStatus(jsonRecognizer.optBoolean("extractMaritalStatus", true));
        recognizer.setExtractName(jsonRecognizer.optBoolean("extractName", true));
        recognizer.setExtractOccupation(jsonRecognizer.optBoolean("extractOccupation", true));
        recognizer.setExtractPlaceOfBirth(jsonRecognizer.optBoolean("extractPlaceOfBirth", true));
        recognizer.setExtractReligion(jsonRecognizer.optBoolean("extractReligion", true));
        recognizer.setExtractRt(jsonRecognizer.optBoolean("extractRt", true));
        recognizer.setExtractRw(jsonRecognizer.optBoolean("extractRw", true));
        recognizer.setExtractValidUntil(jsonRecognizer.optBoolean("extractValidUntil", true));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setReturnSignatureImage(jsonRecognizer.optBoolean("returnSignatureImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.indonesia.IndonesiaIdFrontRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.indonesia.IndonesiaIdFrontRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("address", result.getAddress());
            jsonResult.put("bloodType", result.getBloodType());
            jsonResult.put("citizenship", result.getCitizenship());
            jsonResult.put("city", result.getCity());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("district", result.getDistrict());
            jsonResult.put("documentClassifier", result.getDocumentClassifier());
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("kelDesa", result.getKelDesa());
            jsonResult.put("maritalStatus", result.getMaritalStatus());
            jsonResult.put("name", result.getName());
            jsonResult.put("occupation", result.getOccupation());
            jsonResult.put("placeOfBirth", result.getPlaceOfBirth());
            jsonResult.put("province", result.getProvince());
            jsonResult.put("religion", result.getReligion());
            jsonResult.put("rt", result.getRt());
            jsonResult.put("rw", result.getRw());
            jsonResult.put("sex", result.getSex());
            jsonResult.put("signatureImage", SerializationUtils.encodeImageBase64(result.getSignatureImage()));
            jsonResult.put("validUntil", SerializationUtils.serializeDate(result.getValidUntil()));
            jsonResult.put("validUntilPermanent", result.getValidUntilPermanent());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "IndonesiaIdFrontRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.indonesia.IndonesiaIdFrontRecognizer.class;
    }
}
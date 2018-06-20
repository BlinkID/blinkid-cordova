package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class PolandIdFrontRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.poland.PolandIdFrontRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.poland.PolandIdFrontRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractDateOfBirth(jsonRecognizer.optBoolean("extractDateOfBirth", true));
        recognizer.setExtractFamilyName(jsonRecognizer.optBoolean("extractFamilyName", true));
        recognizer.setExtractGivenNames(jsonRecognizer.optBoolean("extractGivenNames", true));
        recognizer.setExtractParentsGivenNames(jsonRecognizer.optBoolean("extractParentsGivenNames", true));
        recognizer.setExtractSex(jsonRecognizer.optBoolean("extractSex", true));
        recognizer.setExtractSurname(jsonRecognizer.optBoolean("extractSurname", true));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.poland.PolandIdFrontRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.poland.PolandIdFrontRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("familyName", result.getFamilyName());
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("givenNames", result.getGivenNames());
            jsonResult.put("parentsGivenNames", result.getParentsGivenNames());
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
        return "PolandIdFrontRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.poland.PolandIdFrontRecognizer.class;
    }
}
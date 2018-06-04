package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;
import com.phonegap.plugins.microblink.recognizers.SerializationUtils;

import org.json.JSONException;
import org.json.JSONObject;

public final class AustriaIDFrontSideRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.austria.AustriaIDFrontSideRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.austria.AustriaIDFrontSideRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setEncodeFaceImage(jsonRecognizer.optBoolean("encodeFaceImage", false));
        recognizer.setEncodeFullDocumentImage(jsonRecognizer.optBoolean("encodeFullDocumentImage", false));
        recognizer.setEncodeSignatureImage(jsonRecognizer.optBoolean("encodeSignatureImage", false));
        recognizer.setExtractDateOfBirth(jsonRecognizer.optBoolean("extractDateOfBirth", true));
        recognizer.setExtractGivenName(jsonRecognizer.optBoolean("extractGivenName", true));
        recognizer.setExtractSex(jsonRecognizer.optBoolean("extractSex", true));
        recognizer.setExtractSurname(jsonRecognizer.optBoolean("extractSurname", true));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setReturnSignatureImage(jsonRecognizer.optBoolean("returnSignatureImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.austria.AustriaIDFrontSideRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.austria.AustriaIDFrontSideRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth().getDate()));
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("encodedFaceImage", SerializationUtils.encodeByteArrayToBase64(result.getEncodedFaceImage()));
            jsonResult.put("encodedFullDocumentImage", SerializationUtils.encodeByteArrayToBase64(result.getEncodedFullDocumentImage()));
            jsonResult.put("encodedSignatureImage", SerializationUtils.encodeByteArrayToBase64(result.getEncodedSignatureImage()));
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("givenName", result.getGivenName());
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
        return "AustriaIDFrontSideRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.austria.AustriaIDFrontSideRecognizer.class;
    }
}
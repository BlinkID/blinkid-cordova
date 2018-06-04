package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;
import com.phonegap.plugins.microblink.recognizers.SerializationUtils;

import org.json.JSONException;
import org.json.JSONObject;

public final class SingaporeCombinedRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.singapore.SingaporeCombinedRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.singapore.SingaporeCombinedRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setEncodeFaceImage(jsonRecognizer.optBoolean("encodeFaceImage", false));
        recognizer.setEncodeFullDocumentImage(jsonRecognizer.optBoolean("encodeFullDocumentImage", false));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setSignResult(jsonRecognizer.optBoolean("signResult", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.singapore.SingaporeCombinedRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.singapore.SingaporeCombinedRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("address", result.getAddress());
            jsonResult.put("bloodGroup", result.getBloodGroup());
            jsonResult.put("cardNumber", result.getCardNumber());
            jsonResult.put("countryOfBirth", result.getCountryOfBirth());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("digitalSignature", SerializationUtils.encodeByteArrayToBase64(result.getDigitalSignature()));
            jsonResult.put("digitalSignatureVersion", result.getDigitalSignatureVersion());
            jsonResult.put("documentDataMatch", result.isDocumentDataMatch());
            jsonResult.put("documentDateOfIssue", SerializationUtils.serializeDate(result.getDocumentDateOfIssue()));
            jsonResult.put("encodedBackFullDocumentImage", SerializationUtils.encodeByteArrayToBase64(result.getEncodedBackFullDocumentImage()));
            jsonResult.put("encodedFaceImage", SerializationUtils.encodeByteArrayToBase64(result.getEncodedFaceImage()));
            jsonResult.put("encodedFrontFullDocumentImage", SerializationUtils.encodeByteArrayToBase64(result.getEncodedFrontFullDocumentImage()));
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentBackImage", SerializationUtils.encodeImageBase64(result.getFullDocumentBackImage()));
            jsonResult.put("fullDocumentFrontImage", SerializationUtils.encodeImageBase64(result.getFullDocumentFrontImage()));
            jsonResult.put("name", result.getName());
            jsonResult.put("race", result.getRace());
            jsonResult.put("scanningFirstSideDone", result.isScanningFirstSideDone());
            jsonResult.put("sex", result.getSex());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "SingaporeCombinedRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.singapore.SingaporeCombinedRecognizer.class;
    }
}
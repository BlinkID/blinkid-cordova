package com.phonegap.plugins.blinkid.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.blinkid.recognizers.RecognizerSerialization;
import com.phonegap.plugins.blinkid.recognizers.SerializationUtils;

import org.json.JSONException;
import org.json.JSONObject;

public final class CroatianIDFrontSideRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.croatia.CroatianIDFrontSideRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.croatia.CroatianIDFrontSideRecognizer();
        recognizer.setExtractSex(jsonRecognizer.optBoolean("extractSex", true));
        recognizer.setExtractCitizenship(jsonRecognizer.optBoolean("extractCitizenship", true));
        recognizer.setExtractDateOfExpiry(jsonRecognizer.optBoolean("extractDateOfExpiry", true));
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setReturnSignatureImage(jsonRecognizer.optBoolean("returnSignatureImage", false));

        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.croatia.CroatianIDFrontSideRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.croatia.CroatianIDFrontSideRecognizer)recognizer).getResult();

        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("firstName", result.getFirstName());
            jsonResult.put("lastName", result.getLastName());
            jsonResult.put("identityCardNumber", result.getIdentityCardNumber());
            jsonResult.put("sex", result.getSex());
            jsonResult.put("citizenship", result.getCitizenship());
            jsonResult.put("documentDateOfExpiry", SerializationUtils.serializeDate(result.getDocumentDateOfExpiry()));
            jsonResult.put("documentDateOfExpiryPermanent", result.getDocumentDateOfExpiryPermanent());
            jsonResult.put("documentBilingual", result.isDocumentBilingual());
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("signatureImage", SerializationUtils.encodeImageBase64(result.getSignatureImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));

        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }

        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "CroatianIDFrontSideRecognizerSerialization";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.croatia.CroatianIDFrontSideRecognizer.class;
    }
}

package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class UsdlCombinedRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.usdl.UsdlCombinedRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.usdl.UsdlCombinedRecognizer();
        recognizer.setFaceImageDpi(jsonRecognizer.optInt("faceImageDpi", 250));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setSignResult(jsonRecognizer.optBoolean("signResult", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.usdl.UsdlCombinedRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.usdl.UsdlCombinedRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("digitalSignature", SerializationUtils.encodeByteArrayToBase64(result.getDigitalSignature()));
            jsonResult.put("digitalSignatureVersion", result.getDigitalSignatureVersion());
            jsonResult.put("documentDataMatch", result.isDocumentDataMatch());
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("optionalElements", SerializationUtils.serializeStringArray(result.getOptionalElements()));
            jsonResult.put("rawData", SerializationUtils.encodeByteArrayToBase64(result.getRawData()));
            jsonResult.put("rawStringData", result.getRawStringData());
            jsonResult.put("scanningFirstSideDone", result.isScanningFirstSideDone());
            jsonResult.put("uncertain", result.isUncertain());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "UsdlCombinedRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.usdl.UsdlCombinedRecognizer.class;
    }
}
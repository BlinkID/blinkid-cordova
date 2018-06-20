package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class MrtdRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.mrtd.MrtdRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.mrtd.MrtdRecognizer();
        recognizer.setAllowUnparsedResults(jsonRecognizer.optBoolean("allowUnparsedResults", false));
        recognizer.setAllowUnverifiedResults(jsonRecognizer.optBoolean("allowUnverifiedResults", false));
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setReturnMrzImage(jsonRecognizer.optBoolean("returnMrzImage", false));
        recognizer.setSaveImageDPI(jsonRecognizer.optInt("saveImageDPI", 250));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.mrtd.MrtdRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.mrtd.MrtdRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("mrzImage", SerializationUtils.encodeImageBase64(result.getMrzImage()));
            jsonResult.put("mrzResult", BlinkIDSerializationUtils.serializeMrzResult(result.getMrzResult()));
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "MrtdRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.mrtd.MrtdRecognizer.class;
    }
}
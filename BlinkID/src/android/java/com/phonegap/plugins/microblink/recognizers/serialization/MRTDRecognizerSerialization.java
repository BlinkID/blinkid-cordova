package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class MRTDRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.mrtd.MRTDRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.mrtd.MRTDRecognizer();
        recognizer.setAllowUnparsedResults(jsonRecognizer.optBoolean("allowUnparsedResults", false));
        recognizer.setAllowUnverifiedResults(jsonRecognizer.optBoolean("allowUnverifiedResults", false));
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setReturnMRZImage(jsonRecognizer.optBoolean("returnMRZImage", false));
        recognizer.setSaveImageDPI(jsonRecognizer.optInt("saveImageDPI", 250));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.mrtd.MRTDRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.mrtd.MRTDRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("MRZResult", BlinkIDSerializationUtils.serializeMRZResult(result.getMRZResult()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("mrzImage", SerializationUtils.encodeImageBase64(result.getMrzImage()));
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "MRTDRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.mrtd.MRTDRecognizer.class;
    }
}
package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class CyprusIdBackRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.cyprus.CyprusIdBackRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.cyprus.CyprusIdBackRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setFullDocumentImageExtensionFactors(BlinkIDSerializationUtils.deserializeExtensionFactors(jsonRecognizer.optJSONObject("fullDocumentImageExtensionFactors")));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.cyprus.CyprusIdBackRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.cyprus.CyprusIdBackRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("mrzResult", BlinkIDSerializationUtils.serializeMrzResult(result.getMrzResult()));
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "CyprusIdBackRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.cyprus.CyprusIdBackRecognizer.class;
    }
}
package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class GermanyIdBackRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.germany.GermanyIdBackRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.germany.GermanyIdBackRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractAddress(jsonRecognizer.optBoolean("extractAddress", true));
        recognizer.setExtractAuthority(jsonRecognizer.optBoolean("extractAuthority", true));
        recognizer.setExtractColourOfEyes(jsonRecognizer.optBoolean("extractColourOfEyes", true));
        recognizer.setExtractDateOfIssue(jsonRecognizer.optBoolean("extractDateOfIssue", true));
        recognizer.setExtractHeight(jsonRecognizer.optBoolean("extractHeight", true));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setFullDocumentImageExtensionFactors(BlinkIDSerializationUtils.deserializeExtensionFactors(jsonRecognizer.optJSONObject("fullDocumentImageExtensionFactors")));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.germany.GermanyIdBackRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.germany.GermanyIdBackRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("addressCity", result.getAddressCity());
            jsonResult.put("addressHouseNumber", result.getAddressHouseNumber());
            jsonResult.put("addressStreet", result.getAddressStreet());
            jsonResult.put("addressZipCode", result.getAddressZipCode());
            jsonResult.put("authority", result.getAuthority());
            jsonResult.put("colourOfEyes", result.getColourOfEyes());
            jsonResult.put("dateOfIssue", SerializationUtils.serializeDate(result.getDateOfIssue()));
            jsonResult.put("fullAddress", result.getFullAddress());
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("height", result.getHeight());
            jsonResult.put("mrzResult", BlinkIDSerializationUtils.serializeMrzResult(result.getMrzResult()));
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "GermanyIdBackRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.germany.GermanyIdBackRecognizer.class;
    }
}
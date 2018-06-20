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
        recognizer.setExtractDateOfIssue(jsonRecognizer.optBoolean("extractDateOfIssue", true));
        recognizer.setExtractEyeColour(jsonRecognizer.optBoolean("extractEyeColour", true));
        recognizer.setExtractHeight(jsonRecognizer.optBoolean("extractHeight", true));
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
            jsonResult.put("address", result.getAddress());
            jsonResult.put("addressCity", result.getAddressCity());
            jsonResult.put("addressHouseNumber", result.getAddressHouseNumber());
            jsonResult.put("addressStreet", result.getAddressStreet());
            jsonResult.put("addressZipCode", result.getAddressZipCode());
            jsonResult.put("authority", result.getAuthority());
            jsonResult.put("dateOfBirth", SerializationUtils.serializeDate(result.getDateOfBirth()));
            jsonResult.put("dateOfExpiry", SerializationUtils.serializeDate(result.getDateOfExpiry()));
            jsonResult.put("dateOfIssue", SerializationUtils.serializeDate(result.getDateOfIssue()));
            jsonResult.put("documentCode", result.getDocumentCode());
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("eyeColour", result.getEyeColour());
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("height", result.getHeight());
            jsonResult.put("issuer", result.getIssuer());
            jsonResult.put("mrzParsed", result.isMrzParsed());
            jsonResult.put("mrzText", result.getMrzText());
            jsonResult.put("mrzVerified", result.isMrzVerified());
            jsonResult.put("nationality", result.getNationality());
            jsonResult.put("opt1", result.getOpt1());
            jsonResult.put("opt2", result.getOpt2());
            jsonResult.put("primaryId", result.getPrimaryId());
            jsonResult.put("secondaryId", result.getSecondaryId());
            jsonResult.put("sex", result.getSex());
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
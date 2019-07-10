package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class BlinkCardEliteRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkcard.BlinkCardEliteRecognizer recognizer = new com.microblink.entities.recognizers.blinkcard.BlinkCardEliteRecognizer();
        recognizer.setAnonymizeCardNumber(jsonRecognizer.optBoolean("anonymizeCardNumber", false));
        recognizer.setAnonymizeCvv(jsonRecognizer.optBoolean("anonymizeCvv", false));
        recognizer.setAnonymizeOwner(jsonRecognizer.optBoolean("anonymizeOwner", false));
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractInventoryNumber(jsonRecognizer.optBoolean("extractInventoryNumber", true));
        recognizer.setExtractOwner(jsonRecognizer.optBoolean("extractOwner", true));
        recognizer.setExtractValidThru(jsonRecognizer.optBoolean("extractValidThru", true));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setFullDocumentImageExtensionFactors(BlinkIDSerializationUtils.deserializeExtensionFactors(jsonRecognizer.optJSONObject("fullDocumentImageExtensionFactors")));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setSignResult(jsonRecognizer.optBoolean("signResult", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?> recognizer) {
        com.microblink.entities.recognizers.blinkcard.BlinkCardEliteRecognizer.Result result = ((com.microblink.entities.recognizers.blinkcard.BlinkCardEliteRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("cardNumber", result.getCardNumber());
            jsonResult.put("cvv", result.getCvv());
            jsonResult.put("digitalSignature", SerializationUtils.encodeByteArrayToBase64(result.getDigitalSignature()));
            jsonResult.put("digitalSignatureVersion", (int)result.getDigitalSignatureVersion());
            jsonResult.put("documentDataMatch", result.isDocumentDataMatch());
            jsonResult.put("fullDocumentBackImage", SerializationUtils.encodeImageBase64(result.getFullDocumentBackImage()));
            jsonResult.put("fullDocumentFrontImage", SerializationUtils.encodeImageBase64(result.getFullDocumentFrontImage()));
            jsonResult.put("inventoryNumber", result.getInventoryNumber());
            jsonResult.put("owner", result.getOwner());
            jsonResult.put("scanningFirstSideDone", result.isScanningFirstSideDone());
            jsonResult.put("validThru", SerializationUtils.serializeDate(result.getValidThru()));
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "BlinkCardEliteRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkcard.BlinkCardEliteRecognizer.class;
    }
}
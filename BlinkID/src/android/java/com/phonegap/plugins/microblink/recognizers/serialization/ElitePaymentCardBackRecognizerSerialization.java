package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class ElitePaymentCardBackRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.elitepaymentcard.ElitePaymentCardBackRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.elitepaymentcard.ElitePaymentCardBackRecognizer();
        recognizer.setAnonymizeCardNumber(jsonRecognizer.optBoolean("anonymizeCardNumber", false));
        recognizer.setAnonymizeCvv(jsonRecognizer.optBoolean("anonymizeCvv", false));
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractCvv(jsonRecognizer.optBoolean("extractCvv", true));
        recognizer.setExtractInventoryNumber(jsonRecognizer.optBoolean("extractInventoryNumber", true));
        recognizer.setExtractValidThru(jsonRecognizer.optBoolean("extractValidThru", true));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setFullDocumentImageExtensionFactors(BlinkIDSerializationUtils.deserializeExtensionFactors(jsonRecognizer.optJSONObject("fullDocumentImageExtensionFactors")));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.elitepaymentcard.ElitePaymentCardBackRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.elitepaymentcard.ElitePaymentCardBackRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("cardNumber", result.getCardNumber());
            jsonResult.put("cvv", result.getCvv());
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("inventoryNumber", result.getInventoryNumber());
            jsonResult.put("validThru", SerializationUtils.serializeDate(result.getValidThru()));
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "ElitePaymentCardBackRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.elitepaymentcard.ElitePaymentCardBackRecognizer.class;
    }
}
package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class AustraliaDlBackRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.australia.AustraliaDlBackRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.australia.AustraliaDlBackRecognizer();
        recognizer.setExtractAddress(jsonRecognizer.optBoolean("extractAddress", true));
        recognizer.setExtractDateOfExpiry(jsonRecognizer.optBoolean("extractDateOfExpiry", true));
        recognizer.setExtractLastName(jsonRecognizer.optBoolean("extractLastName", true));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.australia.AustraliaDlBackRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.australia.AustraliaDlBackRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("address", result.getAddress());
            jsonResult.put("dateOfExpiry", SerializationUtils.serializeDate(result.getDateOfExpiry()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("lastName", result.getLastName());
            jsonResult.put("licenceNumber", result.getLicenceNumber());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "AustraliaDlBackRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.australia.AustraliaDlBackRecognizer.class;
    }
}
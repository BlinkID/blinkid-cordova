package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class MyKadFrontRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.malaysia.MyKadFrontRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.malaysia.MyKadFrontRecognizer();
        recognizer.setExtractArmyNumber(jsonRecognizer.optBoolean("extractArmyNumber", false));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.malaysia.MyKadFrontRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.malaysia.MyKadFrontRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("armyNumber", result.getArmyNumber());
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("nricNumber", result.getNricNumber());
            jsonResult.put("ownerAddress", result.getOwnerAddress());
            jsonResult.put("ownerAddressCity", result.getOwnerAddressCity());
            jsonResult.put("ownerAddressState", result.getOwnerAddressState());
            jsonResult.put("ownerAddressStreet", result.getOwnerAddressStreet());
            jsonResult.put("ownerAddressZipCode", result.getOwnerAddressZipCode());
            jsonResult.put("ownerBirthDate", SerializationUtils.serializeDate(result.getOwnerBirthDate()));
            jsonResult.put("ownerFullName", result.getOwnerFullName());
            jsonResult.put("ownerReligion", result.getOwnerReligion());
            jsonResult.put("ownerSex", result.getOwnerSex());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "MyKadFrontRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.malaysia.MyKadFrontRecognizer.class;
    }
}
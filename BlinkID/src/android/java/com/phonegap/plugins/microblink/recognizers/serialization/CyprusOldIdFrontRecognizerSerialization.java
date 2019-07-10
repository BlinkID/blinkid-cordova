package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class CyprusOldIdFrontRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.cyprus.CyprusOldIdFrontRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.cyprus.CyprusOldIdFrontRecognizer();
        recognizer.setDetectGlare(jsonRecognizer.optBoolean("detectGlare", true));
        recognizer.setExtractDocumentNumber(jsonRecognizer.optBoolean("extractDocumentNumber", true));
        recognizer.setExtractName(jsonRecognizer.optBoolean("extractName", true));
        recognizer.setExtractSurname(jsonRecognizer.optBoolean("extractSurname", true));
        recognizer.setFaceImageDpi(jsonRecognizer.optInt("faceImageDpi", 250));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setFullDocumentImageExtensionFactors(BlinkIDSerializationUtils.deserializeExtensionFactors(jsonRecognizer.optJSONObject("fullDocumentImageExtensionFactors")));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?> recognizer) {
        com.microblink.entities.recognizers.blinkid.cyprus.CyprusOldIdFrontRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.cyprus.CyprusOldIdFrontRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("documentNumber", result.getDocumentNumber());
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentImage", SerializationUtils.encodeImageBase64(result.getFullDocumentImage()));
            jsonResult.put("idNumber", result.getIdNumber());
            jsonResult.put("name", result.getName());
            jsonResult.put("surname", result.getSurname());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "CyprusOldIdFrontRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.cyprus.CyprusOldIdFrontRecognizer.class;
    }
}
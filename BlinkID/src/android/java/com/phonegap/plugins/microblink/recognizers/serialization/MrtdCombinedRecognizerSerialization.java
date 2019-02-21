package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.Recognizer;
import com.phonegap.plugins.microblink.recognizers.RecognizerSerialization;

import org.json.JSONException;
import org.json.JSONObject;

public final class MrtdCombinedRecognizerSerialization implements RecognizerSerialization {

    @Override
    public Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer) {
        com.microblink.entities.recognizers.blinkid.mrtd.MrtdCombinedRecognizer recognizer = new com.microblink.entities.recognizers.blinkid.mrtd.MrtdCombinedRecognizer();
        recognizer.setAllowSpecialCharacters(jsonRecognizer.optBoolean("allowSpecialCharacters", false));
        recognizer.setAllowUnparsedResults(jsonRecognizer.optBoolean("allowUnparsedResults", false));
        recognizer.setAllowUnverifiedResults(jsonRecognizer.optBoolean("allowUnverifiedResults", false));
        recognizer.setDetectorType(com.microblink.entities.recognizers.blinkid.documentface.DocumentFaceDetectorType.values()[jsonRecognizer.optInt("detectorType", 1) - 1]);
        recognizer.setFaceImageDpi(jsonRecognizer.optInt("faceImageDpi", 250));
        recognizer.setFullDocumentImageDpi(jsonRecognizer.optInt("fullDocumentImageDpi", 250));
        recognizer.setFullDocumentImageExtensionFactors(BlinkIDSerializationUtils.deserializeExtensionFactors(jsonRecognizer.optJSONObject("fullDocumentImageExtensionFactors")));
        recognizer.setNumStableDetectionsThreshold(jsonRecognizer.optInt("numStableDetectionsThreshold", 6));
        recognizer.setReturnFaceImage(jsonRecognizer.optBoolean("returnFaceImage", false));
        recognizer.setReturnFullDocumentImage(jsonRecognizer.optBoolean("returnFullDocumentImage", false));
        recognizer.setSignResult(jsonRecognizer.optBoolean("signResult", false));
        return recognizer;
    }

    @Override
    public JSONObject serializeResult(Recognizer<?, ?> recognizer) {
        com.microblink.entities.recognizers.blinkid.mrtd.MrtdCombinedRecognizer.Result result = ((com.microblink.entities.recognizers.blinkid.mrtd.MrtdCombinedRecognizer)recognizer).getResult();
        JSONObject jsonResult = new JSONObject();
        try {
            SerializationUtils.addCommonResultData(jsonResult, result);
            jsonResult.put("digitalSignature", SerializationUtils.encodeByteArrayToBase64(result.getDigitalSignature()));
            jsonResult.put("digitalSignatureVersion", (int)result.getDigitalSignatureVersion());
            jsonResult.put("documentDataMatch", result.isDocumentDataMatch());
            jsonResult.put("faceImage", SerializationUtils.encodeImageBase64(result.getFaceImage()));
            jsonResult.put("fullDocumentBackImage", SerializationUtils.encodeImageBase64(result.getFullDocumentBackImage()));
            jsonResult.put("fullDocumentFrontImage", SerializationUtils.encodeImageBase64(result.getFullDocumentFrontImage()));
            jsonResult.put("mrzResult", BlinkIDSerializationUtils.serializeMrzResult(result.getMrzResult()));
            jsonResult.put("scanningFirstSideDone", result.isScanningFirstSideDone());
        } catch (JSONException e) {
            // see https://developer.android.com/reference/org/json/JSONException
            throw new RuntimeException(e);
        }
        return jsonResult;
    }

    @Override
    public String getJsonName() {
        return "MrtdCombinedRecognizer";
    }

    @Override
    public Class<?> getRecognizerClass() {
        return com.microblink.entities.recognizers.blinkid.mrtd.MrtdCombinedRecognizer.class;
    }
}
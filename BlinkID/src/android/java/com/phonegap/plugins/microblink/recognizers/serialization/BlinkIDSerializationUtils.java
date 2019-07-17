package com.phonegap.plugins.microblink.recognizers.serialization;

import com.microblink.entities.recognizers.blinkid.mrtd.MrzResult;
import com.microblink.entities.recognizers.blinkid.imageoptions.extension.ImageExtensionFactors;
import com.microblink.entities.recognizers.blinkid.generic.DriverLicenseDetailedInfo;

import org.json.JSONException;
import org.json.JSONObject;

public abstract class BlinkIDSerializationUtils {
    public static JSONObject serializeMrzResult(MrzResult mrzResult) throws JSONException {
        JSONObject jsonMrz = new JSONObject();
        jsonMrz.put("documentType", mrzResult.getDocumentType().ordinal() + 1);
        jsonMrz.put("primaryId", mrzResult.getPrimaryId());
        jsonMrz.put("secondaryId", mrzResult.getSecondaryId());
        jsonMrz.put("issuer", mrzResult.getIssuer());
        jsonMrz.put("dateOfBirth", SerializationUtils.serializeDate(mrzResult.getDateOfBirth().getDate()));
        jsonMrz.put("documentNumber", mrzResult.getDocumentNumber());
        jsonMrz.put("nationality", mrzResult.getNationality());
        jsonMrz.put("gender", mrzResult.getGender());
        jsonMrz.put("documentCode", mrzResult.getDocumentCode());
        jsonMrz.put("dateOfExpiry", SerializationUtils.serializeDate(mrzResult.getDateOfExpiry().getDate()));
        jsonMrz.put("opt1", mrzResult.getOpt1());
        jsonMrz.put("opt2", mrzResult.getOpt2());
        jsonMrz.put("alienNumber", mrzResult.getAlienNumber());
        jsonMrz.put("applicationReceiptNumber", mrzResult.getApplicationReceiptNumber());
        jsonMrz.put("immigrantCaseNumber", mrzResult.getImmigrantCaseNumber());
        jsonMrz.put("mrzText", mrzResult.getMrzText());
        jsonMrz.put("mrzParsed", mrzResult.isMrzParsed());
        jsonMrz.put("mrzVerified", mrzResult.isMrzVerified());
        return jsonMrz;
    }

    public static JSONObject serializeDriverLicenseDetailedInfo(DriverLicenseDetailedInfo dlDetailedInfo) throws JSONException {
        JSONObject jsonDriverLicenseDetailedInfo = new JSONObject();
        jsonDriverLicenseDetailedInfo.put("restrictions", dlDetailedInfo.getRestrictions());
        jsonDriverLicenseDetailedInfo.put("endorsements", dlDetailedInfo.getEndorsements());
        jsonDriverLicenseDetailedInfo.put("vehicleClass", dlDetailedInfo.getVehicleClass());
        return jsonDriverLicenseDetailedInfo;
    }

    public static ImageExtensionFactors deserializeExtensionFactors(JSONObject jsonExtensionFactors) {
        if (jsonExtensionFactors == null) {
            return new ImageExtensionFactors(0.f, 0.f, 0.f, 0.f);
        } else {
            float up = (float)jsonExtensionFactors.optDouble("upFactor", 0.0);
            float right = (float)jsonExtensionFactors.optDouble("rightFactor", 0.0);
            float down = (float)jsonExtensionFactors.optDouble("downFactor", 0.0);
            float left = (float)jsonExtensionFactors.optDouble("leftFactor", 0.0);
            return new ImageExtensionFactors(up, down, left, right);
        }
    }
}

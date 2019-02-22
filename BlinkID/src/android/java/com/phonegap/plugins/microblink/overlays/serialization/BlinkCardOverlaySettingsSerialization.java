package com.phonegap.plugins.microblink.overlays.serialization;

import com.microblink.entities.recognizers.RecognizerBundle;
import com.microblink.uisettings.BlinkCardUISettings;
import com.microblink.uisettings.UISettings;
import com.phonegap.plugins.microblink.overlays.OverlaySettingsSerialization;

import org.json.JSONObject;

public final class BlinkCardOverlaySettingsSerialization implements OverlaySettingsSerialization {
    @Override
    public UISettings createUISettings(JSONObject jsonUISettings, RecognizerBundle recognizerBundle) {
        BlinkCardUISettings settings = new BlinkCardUISettings(recognizerBundle);

        String firstSideInstructions = getStringFromJSONObject(jsonUISettings, "firstSideInstructions");
        if (firstSideInstructions != null) {
            settings.setFirstSideInstructions(firstSideInstructions);
        }
        String secondSideInstructions = getStringFromJSONObject(jsonUISettings, "secondSideInstructions");
        if (secondSideInstructions != null) {
            settings.setSecondSideInstructions(secondSideInstructions);
        }

        return settings;
    }

    private String getStringFromJSONObject(JSONObject map, String key) {
    	String value = map.optString(key, null);
 		if ("null".equals(value)) {
 			value = null;
 		}
        return value;
    }

    @Override
    public String getJsonName() {
        return "BlinkCardOverlaySettings";
    }
}

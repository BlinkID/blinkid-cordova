package com.phonegap.plugins.microblink.overlays.serialization;

import android.content.Context;

import com.microblink.entities.recognizers.RecognizerBundle;
import com.microblink.fragment.overlay.blinkcard.scanlineui.ScanLineOverlayStrings;
import com.microblink.uisettings.BlinkCardUISettings;
import com.microblink.uisettings.UISettings;
import com.phonegap.plugins.microblink.overlays.OverlaySettingsSerialization;

import org.json.JSONObject;

public final class BlinkCardOverlaySettingsSerialization implements OverlaySettingsSerialization {
    @Override
    public UISettings createUISettings(Context context, JSONObject jsonUISettings, RecognizerBundle recognizerBundle) {
        BlinkCardUISettings settings = new BlinkCardUISettings(recognizerBundle);

        ScanLineOverlayStrings.Builder overlayStringsBuilder = new ScanLineOverlayStrings.Builder(context);
        String firstSideInstructions = getStringFromJSONObject(jsonUISettings, "firstSideInstructions");
        if (firstSideInstructions != null) {
            overlayStringsBuilder.setFrontSideInstructions(firstSideInstructions);
        }
        String secondSideInstructions = getStringFromJSONObject(jsonUISettings, "secondSideInstructions");
        if (secondSideInstructions != null) {
            overlayStringsBuilder.setBackSideInstructions(secondSideInstructions);
        }

        settings.setStrings(overlayStringsBuilder.build());
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

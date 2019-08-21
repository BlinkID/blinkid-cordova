package com.phonegap.plugins.microblink.overlays;

import android.content.Context;

import com.microblink.entities.recognizers.RecognizerBundle;
import com.microblink.uisettings.UISettings;
import com.phonegap.plugins.microblink.overlays.serialization.*;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;

public enum OverlaySettingsSerializers {
    INSTANCE;

    private HashMap<String, OverlaySettingsSerialization> mByJSONName = new HashMap<>();

    private void registerMapping(OverlaySettingsSerialization overlaySettingsSerialization) {
        mByJSONName.put(overlaySettingsSerialization.getJsonName(), overlaySettingsSerialization);
    }

    OverlaySettingsSerializers() {
        registerMapping(new BarcodeOverlaySettingsSerialization());
        registerMapping(new DocumentOverlaySettingsSerialization());
        registerMapping(new DocumentVerificationOverlaySettingsSerialization());
        registerMapping(new BlinkCardOverlaySettingsSerialization());
        registerMapping(new BlinkIdOverlaySettingsSerialization());
    }

    public UISettings getOverlaySettings(Context context, JSONObject jsonOverlaySettings, RecognizerBundle recognizerBundle) {
        try {
            return mByJSONName.get(jsonOverlaySettings.getString("overlaySettingsType")).createUISettings(context, jsonOverlaySettings, recognizerBundle);
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

}
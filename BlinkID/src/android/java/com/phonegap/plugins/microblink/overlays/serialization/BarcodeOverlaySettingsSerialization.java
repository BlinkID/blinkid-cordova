package com.phonegap.plugins.microblink.overlays.serialization;

import android.content.Context;

import com.microblink.entities.recognizers.RecognizerBundle;
import com.microblink.uisettings.BarcodeUISettings;
import com.microblink.uisettings.UISettings;
import com.phonegap.plugins.microblink.overlays.OverlaySettingsSerialization;

import org.json.JSONObject;

public final class BarcodeOverlaySettingsSerialization implements OverlaySettingsSerialization {
    @Override
    public UISettings createUISettings(Context context, JSONObject jsonUISettings, RecognizerBundle recognizerBundle) {
        // no settings deserialized at the moment
        return new BarcodeUISettings(recognizerBundle);
    }

    @Override
    public String getJsonName() {
        return "BarcodeOverlaySettings";
    }
}

package com.microblink.plugins.cordova.overlays.serialization;

import android.content.Context;

import com.microblink.entities.recognizers.RecognizerBundle;;
import com.microblink.uisettings.DocumentUISettings;
import com.microblink.uisettings.UISettings;
import com.microblink.plugins.cordova.overlays.OverlaySettingsSerialization;
import com.microblink.plugins.cordova.overlays.OverlaySerializationUtils;

import org.json.JSONObject;

public final class DocumentOverlaySettingsSerialization implements OverlaySettingsSerialization {
    @Override
    public UISettings createUISettings(Context context, JSONObject jsonUISettings, RecognizerBundle recognizerBundle) {
        DocumentUISettings settings =  new DocumentUISettings(recognizerBundle);
        OverlaySerializationUtils.prepareCommonUiSettings(context, jsonUISettings, settings);
        return settings;
    }

    @Override
    public String getJsonName() {
        return "DocumentOverlaySettings";
    }
}
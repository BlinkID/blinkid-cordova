package com.phonegap.plugins.microblink.overlays;

import com.microblink.entities.recognizers.RecognizerBundle;
import com.microblink.uisettings.BaseScanUISettings;

import org.json.JSONObject;

public interface OverlaySettingsSerialization {

    BaseScanUISettings createUISettings(JSONObject jsonUISettings, RecognizerBundle recognizerBundle);

    String getJsonName();
}

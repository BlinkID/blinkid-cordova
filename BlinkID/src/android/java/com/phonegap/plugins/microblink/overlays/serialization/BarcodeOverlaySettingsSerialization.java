package com.phonegap.plugins.microblink.overlays.serialization;

import com.microblink.blinkid.R;
import com.microblink.entities.recognizers.RecognizerBundle;
import com.microblink.uisettings.BarcodeUISettings;
import com.microblink.uisettings.UISettings;
import com.phonegap.plugins.microblink.overlays.OverlaySettingsSerialization;

import org.json.JSONObject;

public final class BarcodeOverlaySettingsSerialization implements OverlaySettingsSerialization {
    @Override
    public UISettings createUISettings(JSONObject jsonUISettings, RecognizerBundle recognizerBundle) {
        // no settings deserialized at the moment
        BarcodeUISettings uiSettings = new BarcodeUISettings(recognizerBundle);
        uiSettings.setSplashScreenLayoutResourceID(R.layout.mb_layout_splash_screen);
        return uiSettings;
    }

    @Override
    public String getJsonName() {
        return "BarcodeOverlaySettings";
    }
}

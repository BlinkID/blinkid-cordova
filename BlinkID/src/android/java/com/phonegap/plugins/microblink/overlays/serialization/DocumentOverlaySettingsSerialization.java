package com.phonegap.plugins.microblink.overlays.serialization;

import com.microblink.blinkid.R;
import com.microblink.entities.recognizers.RecognizerBundle;;
import com.microblink.uisettings.DocumentUISettings;
import com.microblink.uisettings.UISettings;
import com.phonegap.plugins.microblink.overlays.OverlaySettingsSerialization;

import org.json.JSONObject;

public final class DocumentOverlaySettingsSerialization implements OverlaySettingsSerialization {
    @Override
    public UISettings createUISettings(JSONObject jsonUISettings, RecognizerBundle recognizerBundle) {
        // no settings deserialized at the moment
        DocumentUISettings uiSettings = new DocumentUISettings(recognizerBundle);
        uiSettings.setSplashScreenLayoutResourceID(R.layout.mb_layout_splash_screen);
        return uiSettings;
    }

    @Override
    public String getJsonName() {
        return "DocumentOverlaySettings";
    }
}

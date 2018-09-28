package com.phonegap.plugins.microblink.overlays.serialization;

import com.microblink.entities.recognizers.RecognizerBundle;
import com.microblink.uisettings.BaseScanUISettings;
import com.microblink.uisettings.DocumentUISettings;

import org.json.JSONObject;

public final class DocumentOverlaySettingsSerialization extends BaseOverlaySettingsSerialization {
    @Override
    public BaseScanUISettings createUISettings(JSONObject jsonUISettings, RecognizerBundle recognizerBundle) {
        // no settings deserialized at the moment
        DocumentUISettings uiSettings = new DocumentUISettings(recognizerBundle);
        return uiSettings;
    }

    @Override
    public String getJsonName() {
        return "DocumentOverlaySettings";
    }
}

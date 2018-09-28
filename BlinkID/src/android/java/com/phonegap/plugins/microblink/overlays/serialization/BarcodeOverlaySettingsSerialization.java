package com.phonegap.plugins.microblink.overlays.serialization;

import com.microblink.entities.recognizers.RecognizerBundle;
import com.microblink.uisettings.BarcodeUISettings;
import com.microblink.uisettings.BaseScanUISettings;

import org.json.JSONObject;

public final class BarcodeOverlaySettingsSerialization extends BaseOverlaySettingsSerialization {
    @Override
    public BaseScanUISettings createUISettings(JSONObject jsonUISettings, RecognizerBundle recognizerBundle) {
        // no settings deserialized at the moment
        BarcodeUISettings uiSettings = new BarcodeUISettings(recognizerBundle);
        return uiSettings;
    }

    @Override
    public String getJsonName() {
        return "BarcodeOverlaySettings";
    }
}

package com.phonegap.plugins.microblink.overlays.serialization;

import android.content.Context;

import com.microblink.entities.recognizers.RecognizerBundle;
import com.microblink.uisettings.BaseScanUISettings;
import com.microblink.uisettings.UISettings;
import com.phonegap.plugins.microblink.FakeR;
import com.phonegap.plugins.microblink.overlays.OverlaySettingsSerialization;

import org.json.JSONObject;

public abstract class BaseOverlaySettingsSerialization implements OverlaySettingsSerialization {
    @Override
    public UISettings createUISettings(Context context, JSONObject jsonUISettings, RecognizerBundle recognizerBundle) {
        BaseScanUISettings uiSettings = createUISettings(jsonUISettings, recognizerBundle);
        FakeR fakeR = new FakeR(context);
        uiSettings.setSplashScreenLayoutResourceID(fakeR.getId("layout", "mb_layout_splash_screen"));
        return uiSettings;
    }

    protected abstract BaseScanUISettings createUISettings(JSONObject jsonUISettings, RecognizerBundle recognizerBundle);
}

package com.microblink.plugins.cordova.overlays.serialization;

import android.content.Context;

import com.microblink.entities.recognizers.RecognizerBundle;
import com.microblink.fragment.overlay.blinkid.documentverification.DocumentVerificationOverlayStrings;
import com.microblink.uisettings.DocumentVerificationUISettings;
import com.microblink.uisettings.UISettings;
import com.microblink.plugins.cordova.overlays.OverlaySettingsSerialization;
import com.microblink.plugins.cordova.overlays.OverlaySerializationUtils;

import org.json.JSONObject;

import static com.microblink.plugins.cordova.SerializationUtils.getStringFromJSONObject;

public final class DocumentVerificationOverlaySettingsSerialization implements OverlaySettingsSerialization {
    @Override
    public UISettings createUISettings(Context context, JSONObject jsonUISettings, RecognizerBundle recognizerBundle) {
        DocumentVerificationUISettings settings = new DocumentVerificationUISettings(recognizerBundle);

        OverlaySerializationUtils.prepareCommonUiSettings(context, jsonUISettings, settings);

        DocumentVerificationOverlayStrings.Builder overlasStringsBuilder = new DocumentVerificationOverlayStrings.Builder(context);
        String firstSideSplashMessage = getStringFromJSONObject(jsonUISettings, "firstSideSplashMessage");
        if (firstSideSplashMessage != null) {
            overlasStringsBuilder.setFrontSideSplashText(firstSideSplashMessage);
        }
        String secondSideSplashMessage = getStringFromJSONObject(jsonUISettings, "secondSideSplashMessage");
        if (secondSideSplashMessage != null) {
            overlasStringsBuilder.setBackSideSplashText(secondSideSplashMessage);
        }
        String firstSideInstructions = getStringFromJSONObject(jsonUISettings, "firstSideInstructions");
        if (firstSideInstructions != null) {
            overlasStringsBuilder.setFrontSideInstructions(firstSideInstructions);
        }
        String secondSideInstructions = getStringFromJSONObject(jsonUISettings, "secondSideInstructions");
        if (secondSideInstructions != null) {
            overlasStringsBuilder.setBackSideInstructions(secondSideInstructions);
        }
        String glareMessage = getStringFromJSONObject(jsonUISettings, "glareMessage");
        if (glareMessage != null) {
            overlasStringsBuilder.setGlareMessage(glareMessage);
        }
        settings.setStrings(overlasStringsBuilder.build());

        return settings;
    }

    @Override
    public String getJsonName() {
        return "DocumentVerificationOverlaySettings";
    }
}
package com.microblink.plugins.cordova.overlays;

import android.content.Context;

import com.microblink.hardware.camera.CameraType;
import com.microblink.plugins.cordova.FakeR;
import com.microblink.uisettings.CameraSettings;
import com.microblink.uisettings.UISettings;
import com.microblink.uisettings.options.BeepSoundUIOptions;

import org.json.JSONObject;

public class OverlaySerializationUtils {

    public static void prepareCommonUiSettings(Context context, JSONObject jsonUISettings, UISettings uiSettings) {
        boolean useFrontCamera = jsonUISettings.optBoolean("useFrontCamera", false);
        if (useFrontCamera) {
            CameraSettings cameraSettings = new CameraSettings.Builder()
                    .setType(CameraType.CAMERA_FRONTFACE).build();
            uiSettings.setCameraSettings(cameraSettings);
        }

        if (uiSettings instanceof BeepSoundUIOptions) {
            boolean enableBeep = jsonUISettings.optBoolean("enableBeep", false);
            if (enableBeep) {
                FakeR fakeR = new FakeR(context);
                ((BeepSoundUIOptions) uiSettings).setBeepSoundResourceID(fakeR.getId("raw", "beep"));
            }
        }
    }
}
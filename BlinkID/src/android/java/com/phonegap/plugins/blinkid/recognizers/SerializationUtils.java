package com.phonegap.plugins.blinkid.recognizers;

import android.graphics.Bitmap;
import android.support.annotation.Nullable;
import android.util.Base64;

import com.microblink.entities.recognizers.Recognizer;
import com.microblink.image.Image;
import com.microblink.results.date.Date;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

public abstract class SerializationUtils {
    private static final int COMPRESSED_IMAGE_QUALITY = 90;

    public static <T extends Recognizer.Result> void addCommonResultData(JSONObject jsonObject, T result) throws JSONException {
        jsonObject.put("resultState", result.getResultState().name().toLowerCase());
    }

    public static JSONObject serializeDate( @Nullable  Date date ) throws JSONException {
        if (date != null ) {
            JSONObject jsonDate = new JSONObject();
            jsonDate.put("day", date.getDay());
            jsonDate.put("month", date.getMonth());
            jsonDate.put("year", date.getYear());
            return jsonDate;
        } else {
            return null;
        }
    }

    public static String encodeImageBase64(Image image) {
        if (image == null) {
            return null;
        }
        Bitmap resultImgBmp = image.convertToBitmap();
        if (resultImgBmp == null) {
            return null;
        }
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        boolean success = resultImgBmp.compress(Bitmap.CompressFormat.JPEG, COMPRESSED_IMAGE_QUALITY, byteArrayOutputStream);
        String resultImgBase64 = null;
        if (success) {
            resultImgBase64 = Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP);
        }
        try {
            byteArrayOutputStream.close();
        } catch (IOException ignorable) {}
        return resultImgBase64;
    }

    public static String encodeByteArrayToBase64(byte[] arr) {
        return Base64.encodeToString(arr, Base64.NO_WRAP);
    }
}

package com.phonegap.plugins.microblink.recognizers;

import com.microblink.entities.recognizers.Recognizer;

import org.json.JSONObject;

public interface RecognizerSerialization {
    Recognizer<?, ?> createRecognizer(JSONObject jsonRecognizer);
    JSONObject serializeResult(Recognizer<?, ?> recognizer);

    String getJsonName();
    Class<?> getRecognizerClass();
}

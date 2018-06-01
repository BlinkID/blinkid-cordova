package com.phonegap.plugins.microblink.recognizers;

import com.microblink.entities.recognizers.Recognizer;
import com.microblink.entities.recognizers.RecognizerBundle;
import com.phonegap.plugins.microblink.recognizers.serialization.*;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;

public enum RecognizerSerializers {
    INSTANCE;

    private HashMap<String, RecognizerSerialization> mByJSONName = new HashMap<>();
    private HashMap<Class<?>, RecognizerSerialization> mByClass = new HashMap<>();

    private void registerMapping( RecognizerSerialization recognizerSerialization ) {
        mByJSONName.put(recognizerSerialization.getJsonName(), recognizerSerialization);
        mByClass.put(recognizerSerialization.getRecognizerClass(), recognizerSerialization);
    }

    RecognizerSerializers() {
        registerMapping(new AustraliaDLBackSideRecognizerSerialization());
        registerMapping(new AustraliaDLFrontSideRecognizerSerialization());
        registerMapping(new AustriaCombinedRecognizerSerialization());
        registerMapping(new AustriaIDBackSideRecognizerSerialization());
        registerMapping(new AustriaIDFrontSideRecognizerSerialization());
        registerMapping(new AustriaPassportRecognizerSerialization());
        registerMapping(new BarcodeRecognizerSerialization());
        registerMapping(new ColombiaIDBackSideRecognizerSerialization());
        registerMapping(new ColombiaIDFrontSideRecognizerSerialization());
        registerMapping(new CroatiaCombinedRecognizerSerialization());
        registerMapping(new CroatiaIDBackSideRecognizerSerialization());
        registerMapping(new CroatiaIDFrontSideRecognizerSerialization());
        registerMapping(new CzechiaCombinedRecognizerSerialization());
        registerMapping(new CzechiaIDBackSideRecognizerSerialization());
        registerMapping(new CzechiaIDFrontSideRecognizerSerialization());
        registerMapping(new DocumentFaceRecognizerSerialization());
        registerMapping(new EUDLRecognizerSerialization());
        registerMapping(new EgyptIDFrontRecognizerSerialization());
        registerMapping(new GermanyCombinedRecognizerSerialization());
        registerMapping(new GermanyIDBackSideRecognizerSerialization());
        registerMapping(new GermanyIDFrontSideRecognizerSerialization());
        registerMapping(new GermanyOldIDRecognizerSerialization());
        registerMapping(new GermanyPassportRecognizerSerialization());
        registerMapping(new HongKongIDFrontRecognizerSerialization());
        registerMapping(new IKadRecognizerSerialization());
        registerMapping(new IndonesiaIDFrontRecognizerSerialization());
        registerMapping(new JordanCombinedRecognizerSerialization());
        registerMapping(new JordanIDBackRecognizerSerialization());
        registerMapping(new JordanIDFrontRecognizerSerialization());
        registerMapping(new MRTDCombinedRecognizerSerialization());
        registerMapping(new MRTDRecognizerSerialization());
        registerMapping(new MalaysiaDLFrontRecognizerSerialization());
        registerMapping(new MyKadBackRecognizerSerialization());
        registerMapping(new MyKadFrontRecognizerSerialization());
        registerMapping(new MyTenteraRecognizerSerialization());
        registerMapping(new NewZealandDLFrontRecognizerSerialization());
        registerMapping(new Pdf417RecognizerSerialization());
        registerMapping(new PolandCombinedRecognizerSerialization());
        registerMapping(new PolandIDBackSideRecognizerSerialization());
        registerMapping(new PolandIDFrontSideRecognizerSerialization());
        registerMapping(new RomaniaIDFrontRecognizerSerialization());
        registerMapping(new SerbiaCombinedRecognizerSerialization());
        registerMapping(new SerbiaIDBackRecognizerSerialization());
        registerMapping(new SerbiaIDFrontRecognizerSerialization());
        registerMapping(new SimNumberRecognizerSerialization());
        registerMapping(new SingaporeCombinedRecognizerSerialization());
        registerMapping(new SingaporeIDBackRecognizerSerialization());
        registerMapping(new SingaporeIDFrontRecognizerSerialization());
        registerMapping(new SlovakiaCombinedRecognizerSerialization());
        registerMapping(new SlovakiaIDBackRecognizerSerialization());
        registerMapping(new SlovakiaIDFrontRecognizerSerialization());
        registerMapping(new SloveniaCombinedRecognizerSerialization());
        registerMapping(new SloveniaIDBackRecognizerSerialization());
        registerMapping(new SloveniaIDFrontRecognizerSerialization());
        registerMapping(new SwitzerlandIDBackRecognizerSerialization());
        registerMapping(new SwitzerlandIDFrontRecognizerSerialization());
        registerMapping(new SwitzerlandPassportRecognizerSerialization());
        registerMapping(new UnitedArabEmiratesIDBackRecognizerSerialization());
        registerMapping(new UnitedArabEmiratesIDFrontRecognizerSerialization());
        registerMapping(new VinRecognizerSerialization());
        registerMapping(new USDLRecognizerSerialization());
        
    }

    private RecognizerSerialization getRecognizerSerialization(JSONObject jsonRecognizer) throws JSONException {
        return mByJSONName.get(jsonRecognizer.getString("recognizerType"));
    }

    private RecognizerSerialization getRecognizerSerialization(Recognizer<?,?> recognizer) {
        return mByClass.get(recognizer.getClass());
    }

    public RecognizerBundle deserializeRecognizerCollection(JSONObject jsonRecognizerCollection) {
        try {
            JSONArray recognizerArray = jsonRecognizerCollection.getJSONArray("recognizerArray");
            int numRecognizers = recognizerArray.length();
            Recognizer<?,?>[] recognizers = new Recognizer[numRecognizers];
            for (int i = 0; i < numRecognizers; ++i) {
                recognizers[ i ] = getRecognizerSerialization(recognizerArray.getJSONObject(i)).createRecognizer(recognizerArray.getJSONObject(i));
            }
            RecognizerBundle recognizerBundle = new RecognizerBundle(recognizers);
            recognizerBundle.setAllowMultipleScanResultsOnSingleImage(jsonRecognizerCollection.optBoolean("allowMultipleResults", false));
            recognizerBundle.setNumMsBeforeTimeout(jsonRecognizerCollection.optInt("milisecondsBeforeTimeout", 10000));

            return recognizerBundle;
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    public JSONArray serializeRecognizerResults(Recognizer<?,?>[] recognizers) {
        JSONArray jsonArray = new JSONArray();

        for (Recognizer<?, ?> recognizer : recognizers) {
            jsonArray.put(getRecognizerSerialization(recognizer).serializeResult(recognizer));
        }

        return jsonArray;
    }

}
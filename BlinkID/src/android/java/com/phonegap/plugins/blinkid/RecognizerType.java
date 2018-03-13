package com.phonegap.plugins.blinkid;

enum RecognizerType {

    DOCUMENTFACE("DocumentFace"),
    BARCODE("Barcode"),
    DEDL("DEDL"),
    DOCUMENTDETECTOR("DocumentDetector"),
    EUDL("EUDL"),
    USDL("USDL"),
    MRTD("MRTD"),
    MYKAD("MyKad"),
    PDF417("PDF417"),
    UKDL("UKDL"),
    
    GERMAN_ID_BACK("GermanIDBack"),
    GERMAN_ID_FRONT("GermanIDFront"),
    GERMAN_OLD_ID("GermanOldID"),
    GERMAN_PASSPORT("GermanPassport"),
    
    SINGAPORE_ID_FRONT("SingaporeIDFront"),
    SINGAPORE_ID_BACK("SingaporeIDBack"),
    
    UAE_ID_BACK("UnitedArabEmiratesIDBack"),
    UAE_ID_FRONT("UnitedArabEmiratesIDFront"),

    UNKNOWN("");

    public final String id;

    RecognizerType(String id) {
        this.id = id;
    }

    static RecognizerType fromId(String id) {
        for (RecognizerType type : values()) {
            if (type.id.equals(id)) {
                return type;
            }
        }
        return UNKNOWN;
    }

}

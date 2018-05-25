package com.phonegap.plugins.microblink;

enum RecognizerType {

    DOCUMENTFACE("DocumentFace", "DocumentFace result"),
    BARCODE("Barcode", "Barcode result"),
    DEDL("DEDL", "DEDL result"),
    DOCUMENTDETECTOR("DocumentDetector", "DocumentDetector result"),
    EUDL("EUDL", "EUDL result"),
    USDL("USDL", "USDL result"),
    MRTD("MRTD", "MRTD result"),
    PDF417("PDF417", "Barcode result"),
    UKDL("UKDL", "UKDL result"),

    MYKAD_FRONT("MyKadFront", "MyKadFront result"),
    MYKAD_BACK("MyKadBack", "MyKadBack result"),
    IKAD("IKad", "IKad result"),
    MY_TENTERA("MyTentera", "MyTentera result"),

    GERMAN_ID_BACK("GermanIDBack", "GermanBackID result"),
    GERMAN_ID_FRONT("GermanIDFront", "GermanFrontID result"),
    GERMAN_OLD_ID("GermanOldID", "GermanOldID result"),
    GERMAN_PASSPORT("GermanPassport", "GermanPassport result"),

    SINGAPORE_ID_FRONT("SingaporeIDFront", "SingaporeFrontID result"),
    SINGAPORE_ID_BACK("SingaporeIDBack", "SingaporeBackID result"),

    UAE_ID_BACK("UnitedArabEmiratesIDBack", "UnitedArabEmiratesIDBack result"),
    UAE_ID_FRONT("UnitedArabEmiratesIDFront", "UnitedArabEmiratesIDFront result"),

    INDONESIA_ID("IndonesiaID", "IndonesiaID result"),

    UNKNOWN("", "");

    public final String id;
    public final String resultId;

    RecognizerType(String id, String resultId) {
        this.id = id;
        this.resultId = resultId;
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

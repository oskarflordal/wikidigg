package com.oskarflordal;

import com.sun.media.sound.InvalidFormatException;

import java.io.FileInputStream;
import java.io.IOException;
import opennlp.tools.sentdetect.SentenceDetectorME;
import opennlp.tools.sentdetect.SentenceModel;

public class Main {

    public static void main(String[] args) throws IOException {
        Database db = new Database();

        db.getRandom();

        SentenceDetect("Juha är en liten björn. Varför då? Jo men det är han.");
    }

    public static void SentenceDetect(String paragrah) throws InvalidFormatException,
            IOException {
        // always start with a model, a model is learned from training data
        FileInputStream is = new FileInputStream("/home/oskar/projekt/wikidigg/bin/se-sent.bin");
        SentenceModel model = new SentenceModel(is);
        SentenceDetectorME sdetector = new SentenceDetectorME(model);

        String sentences[] = sdetector.sentDetect(paragrah);

        System.out.println(sentences[0]);
        System.out.println(sentences[1]);
        is.close();
    }
}

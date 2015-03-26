package com.oskarflordal;

import com.sun.media.sound.InvalidFormatException;

import java.io.FileInputStream;
import java.io.IOException;
import opennlp.tools.sentdetect.SentenceDetectorME;
import opennlp.tools.sentdetect.SentenceModel;

public class Main {

    public static void main(String[] args) throws IOException {
        SentenceDetect();
    }

    public static void SentenceDetect() throws InvalidFormatException,
            IOException {
        String paragraph = "Hi. How are you? This is Mike.";

        // always start with a model, a model is learned from training data
        FileInputStream is = new FileInputStream("en-sent.bin");
        SentenceModel model = new SentenceModel(is);
        SentenceDetectorME sdetector = new SentenceDetectorME(model);

        String sentences[] = sdetector.sentDetect(paragraph);

        System.out.println(sentences[0]);
        System.out.println(sentences[1]);
        is.close();
    }
}

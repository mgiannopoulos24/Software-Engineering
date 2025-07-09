package com.MarineTrafficClone.SeaWatch.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicReference;

/**
 * Μια κεντρική, thread-safe υπηρεσία για τον έλεγχο των παραμέτρων της προσομοίωσης
 * σε πραγματικό χρόνο, ενώ η εφαρμογή τρέχει.
 */
@Service
public class SimulationControlService {

    // Χρησιμοποιούμε AtomicReference για να διασφαλίσουμε thread-safe αναγνώσεις και εγγραφές
    // της τιμής του speed factor, καθώς θα διαβάζεται από το thread της προσομοίωσης
    // και θα γράφεται από το thread του web server (μέσω του API call).
    private final AtomicReference<Double> speedFactor;

    /**
     * Ο constructor αρχικοποιεί την τιμή από το application.properties,
     * διατηρώντας την αρχική ζητούμενη τιμή.
     *
     * @param initialSpeedFactor Η αρχική τιμή από το αρχείο ρυθμίσεων.
     */
    public SimulationControlService(@Value("${simulation.speed.factor:1.0}") double initialSpeedFactor) {
        this.speedFactor = new AtomicReference<>(initialSpeedFactor);
        System.out.println("SIMULATION CONTROL: Initial speed factor set to: " + initialSpeedFactor);
    }

    /**
     * Επιστρέφει την τρέχουσα τιμή του παράγοντα ταχύτητας.
     * @return ο τρέχων παράγοντας ταχύτητας.
     */
    public double getSpeedFactor() {
        return this.speedFactor.get();
    }

    /**
     * Ορίζει μια νέα τιμή για τον παράγοντα ταχύτητας.
     * @param newSpeedFactor η νέα τιμή, πρέπει να είναι θετική.
     */
    public void setSpeedFactor(double newSpeedFactor) {
        if (newSpeedFactor <= 0) {
            throw new IllegalArgumentException("Simulation speed factor must be positive.");
        }
        double oldFactor = this.speedFactor.getAndSet(newSpeedFactor);
        if (oldFactor != newSpeedFactor) {
            System.out.println("SIMULATION CONTROL: Speed factor changed from " + oldFactor + " to " + newSpeedFactor);
        }
    }
}
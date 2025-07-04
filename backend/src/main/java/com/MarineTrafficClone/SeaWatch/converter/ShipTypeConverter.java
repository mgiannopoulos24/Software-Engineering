package com.MarineTrafficClone.SeaWatch.converter;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.stream.Stream;

/**
 * Ένας JPA AttributeConverter που μετατρέπει αυτόματα το enum {@link ShipType}
 * στην αντίστοιχη String τιμή του για αποθήκευση στη βάση δεδομένων, και αντίστροφα.
 * Με το @Converter(autoApply = true), το JPA θα εφαρμόζει αυτόματα αυτόν τον converter
 * σε όλα τα πεδία τύπου ShipType στις οντότητες (Entities), χωρίς να χρειάζεται
 * να προσθέτουμε το @Convert(converter = ShipTypeConverter.class) σε κάθε πεδίο.
 */
@Converter(autoApply = true)
public class ShipTypeConverter implements AttributeConverter<ShipType, String> {

    /**
     * Μετατρέπει το αντικείμενο ShipType (από την Java εφαρμογή) σε String
     * για να αποθηκευτεί στη στήλη της βάσης δεδομένων.
     *
     * @param shipType Το enum ShipType.
     * @return Η String αναπαράσταση του enum (π.χ., "cargo").
     */
    @Override
    public String convertToDatabaseColumn(ShipType shipType) {
        if (shipType == null) {
            return null;
        }
        return shipType.getValue();
    }

    /**
     * Μετατρέπει τη String τιμή (από τη βάση δεδομένων) στο αντίστοιχο
     * αντικείμενο enum ShipType για χρήση στην Java εφαρμογή.
     *
     * @param value Η String τιμή από τη βάση (π.χ., "cargo").
     * @return Το αντίστοιχο enum ShipType.
     * @throws IllegalArgumentException αν η τιμή δεν αντιστοιχεί σε κάποιο γνωστό ShipType.
     */
    @Override
    public ShipType convertToEntityAttribute(String value) {
        if (value == null) {
            return null;
        }

        // Ψάχνει σε όλες τις τιμές του enum ShipType για να βρει αυτή
        // που το πεδίο 'value' της ταιριάζει με τη τιμή από τη βάση.
        return Stream.of(ShipType.values())
                .filter(st -> st.getValue().equals(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown ShipType value: " + value));
    }
}
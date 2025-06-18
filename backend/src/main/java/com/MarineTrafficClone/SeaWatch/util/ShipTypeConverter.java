package com.MarineTrafficClone.SeaWatch.util;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.stream.Stream;

@Converter(autoApply = true)
public class ShipTypeConverter implements AttributeConverter<ShipType, String> {

    @Override
    public String convertToDatabaseColumn(ShipType shipType) {
        if (shipType == null) {
            return null;
        }
        return shipType.getValue();
    }

    @Override
    public ShipType convertToEntityAttribute(String value) {
        if (value == null) {
            return null;
        }

        return Stream.of(ShipType.values())
                .filter(st -> st.getValue().equals(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown ShipType value: " + value));
    }
}
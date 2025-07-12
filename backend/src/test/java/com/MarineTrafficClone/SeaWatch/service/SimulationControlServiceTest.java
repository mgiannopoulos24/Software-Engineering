package com.MarineTrafficClone.SeaWatch.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
public class SimulationControlServiceTest {

    @Test
    void testSetAndGetSpeedFactor() {
        // Create service with initial speed factor of 1.0
        SimulationControlService service = new SimulationControlService(1.0);
        
        // Default value should be 1.0
        assertEquals(1.0, service.getSpeedFactor(), 0.001);
        
        // Set new value
        service.setSpeedFactor(2.5);
        assertEquals(2.5, service.getSpeedFactor(), 0.001);
        
        // Set another value
        service.setSpeedFactor(0.5);
        assertEquals(0.5, service.getSpeedFactor(), 0.001);
    }
    
    @Test
    void testSetSpeedFactor_withInvalidValue_shouldThrowException() {
        // Create service with initial speed factor of 1.0
        SimulationControlService service = new SimulationControlService(1.0);
        
        // Test negative value
        assertThrows(IllegalArgumentException.class, () -> {
            service.setSpeedFactor(-1.0);
        });
        
        // Test zero value
        assertThrows(IllegalArgumentException.class, () -> {
            service.setSpeedFactor(0.0);
        });
        
        // Test extremely large value
        assertThrows(IllegalArgumentException.class, () -> {
            service.setSpeedFactor(100.1);
        });
    }
    
    @Test
    void testConstructor_withInvalidValue_shouldThrowException() {
        // Test negative initial value
        assertThrows(IllegalArgumentException.class, () -> {
            new SimulationControlService(-1.0);
        });
        
        // Test zero initial value
        assertThrows(IllegalArgumentException.class, () -> {
            new SimulationControlService(0.0);
        });
        
        // Test extremely large initial value
        assertThrows(IllegalArgumentException.class, () -> {
            new SimulationControlService(100.1);
        });
    }
}
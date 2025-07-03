package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.model.AisData;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ShipPositionCacheService {

    // A thread-safe Map to store the latest AisData for each ship (MMSI -> AisData)
    private final Map<String, AisData> positionCache = new ConcurrentHashMap<>();

    public void updatePosition(AisData aisData) {
        if (aisData != null && aisData.getMmsi() != null) {
            positionCache.put(aisData.getMmsi(), aisData);
        }
    }


    public Collection<AisData> getAllLatestPositions() {
        return positionCache.values();
    }
}
package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.exception.ResourceNotFoundException;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class AisDataService {
    private final AisDataRepository aisDataRepository;
    private final ShipRepository shipRepository;

    @Autowired
    public AisDataService(AisDataRepository aisDataRepository, ShipRepository shipRepository) {
        this.aisDataRepository = aisDataRepository;
        this.shipRepository = shipRepository;
    }

    public List<AisData> getAisData() {
        return aisDataRepository.findAll();
    }

    public AisData insertAisData(AisData aisData) {
        aisDataRepository.save(aisData);
        return aisData;
    }

    public AisData getAisDataById(Long id) {
        return aisDataRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AisData not found with id: " + id));
    }

    /**
     * Ανακτά την πορεία (track) ενός πλοίου για τις τελευταίες 12 ώρες.
     *
     * @param mmsi Το MMSI του πλοίου.
     * @return Μια λίστα με τα δεδομένα AIS της πορείας.
     */
    public List<AisData> getShipTrack(String mmsi) {
        // Υπολογίζουμε τη χρονική στιγμή "12 ώρες πριν από τώρα" σε epoch seconds.
        long twelveHoursAgoEpoch = Instant.now().minus(12, ChronoUnit.HOURS).getEpochSecond();

        return aisDataRepository.findByMmsiAndTimestampEpochAfterOrderByTimestampEpochAsc(mmsi, twelveHoursAgoEpoch);
    }

    @Transactional(readOnly = true)
    public ShipDetailsDTO getShipDetails(Long mmsi) {
        // 1. Βρες το πλοίο. Αν δεν υπάρχει, θα επιστρέψει 404.
        Ship ship = shipRepository.findByMmsi(mmsi)
                .orElseThrow(() -> new ResourceNotFoundException("Ship not found with MMSI: " + mmsi));

        // 2. Δημιούργησε το DTO και γέμισε τα στατικά δεδομένα από το πλοίο.
        ShipDetailsDTO detailsDTO = new ShipDetailsDTO();
        detailsDTO.setMmsi(ship.getMmsi());
        detailsDTO.setShiptype(ship.getShiptype());

        // 3. Βρες την πιο πρόσφατη εγγραφή AIS για αυτό το πλοίο.
        Optional<AisData> latestAisDataOptional = aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc(mmsi.toString());

        // 4. Αν υπάρχουν δυναμικά δεδομένα, γέμισε και τα υπόλοιπα πεδία του DTO.
        latestAisDataOptional.ifPresent(latestAis -> {
            detailsDTO.setNavigationalStatus(latestAis.getNavigationalStatus());
            detailsDTO.setRateOfTurn(latestAis.getRateOfTurn());
            detailsDTO.setSpeedOverGround(latestAis.getSpeedOverGround());
            detailsDTO.setCourseOverGround(latestAis.getCourseOverGround());
            detailsDTO.setTrueHeading(latestAis.getTrueHeading());
            detailsDTO.setLongitude(latestAis.getLongitude());
            detailsDTO.setLatitude(latestAis.getLatitude());
            detailsDTO.setLastUpdateTimestampEpoch(latestAis.getTimestampEpoch());
        });

        // 5. Επίστρεψε το DTO. Θα είναι πλήρες αν βρέθηκαν AIS data, ή μερικώς γεμάτο αν δεν βρέθηκαν.
        return detailsDTO;
    }
}

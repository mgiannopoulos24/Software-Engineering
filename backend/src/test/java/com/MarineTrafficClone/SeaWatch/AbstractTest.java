package com.MarineTrafficClone.SeaWatch;

import com.MarineTrafficClone.SeaWatch.service.CsvDataLoaderService;
import com.MarineTrafficClone.SeaWatch.service.StaticShipDataLoaderService;
import org.springframework.boot.test.mock.mockito.MockBean;

/**
 * Αφηρημένη κλάση βάσης για όλα τα tests.
 * Ο σκοπός της είναι να ορίσει κοινά Mock Beans που δεν θέλουμε
 * να εκτελούνται κατά τη διάρκεια των δοκιμών, όπως οι data loaders.
 */
public abstract class AbstractTest {

    @MockBean
    protected StaticShipDataLoaderService staticShipDataLoaderService;

    @MockBean
    protected CsvDataLoaderService csvDataLoaderService;
}
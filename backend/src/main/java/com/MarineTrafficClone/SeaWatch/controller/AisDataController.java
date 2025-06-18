package marinemap.controller;

import marinemap.model.AisData;
import marinemap.service.AisDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ais_data")
public class AisDataController {

    private final AisDataService aisDataService;

    @Autowired
    public AisDataController(AisDataService aisDataService) {
        this.aisDataService = aisDataService;
    }

    @GetMapping
    public List<AisData> getAisData() {
        return aisDataService.getAisData();
    }

    @GetMapping("{id}")
    public AisData getAisDataById(@PathVariable Integer id) {
        return aisDataService.getAisDataById(id);
    }

    @PostMapping
    public ResponseEntity<AisData> addAisData(@RequestBody AisData aisData) {
        AisData saved = aisDataService.insertAisData(aisData);
        return ResponseEntity.ok(saved);
    }

}

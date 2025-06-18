package marinemap.service;

import marinemap.model.AisData;
import marinemap.repository.AisDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AisDataService {
    private AisDataRepository aisDataRepository;

    @Autowired
    public AisDataService(AisDataRepository aisDataRepository) {
        this.aisDataRepository = aisDataRepository;
    }

    public List<AisData> getAisData() {
        return aisDataRepository.findAll();
    }

    public AisData insertAisData(AisData aisData) {
        aisDataRepository.save(aisData);
        return aisData;
    }

    public AisData getAisDataById(Integer id) {
        return aisDataRepository.findById(Long.valueOf(id)).orElseThrow(() -> new IllegalStateException(id + " not found"));
    }
}

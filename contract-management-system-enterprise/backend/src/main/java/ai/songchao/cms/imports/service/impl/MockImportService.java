package ai.songchao.cms.imports.service.impl;

import ai.songchao.cms.imports.dto.ImportPreviewItemDto;
import ai.songchao.cms.imports.repository.ImportRepository;
import ai.songchao.cms.imports.service.ImportService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MockImportService implements ImportService {
    private final ImportRepository importRepository;

    public MockImportService(ImportRepository importRepository) {
        this.importRepository = importRepository;
    }

    @Override
    public Map<String, Object> capabilities() {
        return importRepository.capabilities();
    }

    @Override
    public List<ImportPreviewItemDto> preview() {
        return importRepository.preview();
    }
}

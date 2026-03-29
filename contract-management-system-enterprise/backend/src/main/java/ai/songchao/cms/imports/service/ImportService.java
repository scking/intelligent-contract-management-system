package ai.songchao.cms.imports.service;

import ai.songchao.cms.imports.dto.ImportPreviewItemDto;

import java.util.List;
import java.util.Map;

public interface ImportService {
    Map<String, Object> capabilities();
    List<ImportPreviewItemDto> preview();
}

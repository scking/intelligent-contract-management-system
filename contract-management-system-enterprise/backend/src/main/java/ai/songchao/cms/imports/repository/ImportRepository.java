package ai.songchao.cms.imports.repository;

import ai.songchao.cms.imports.dto.ImportPreviewItemDto;

import java.util.List;
import java.util.Map;

public interface ImportRepository {
    Map<String, Object> capabilities();
    List<ImportPreviewItemDto> preview();
}

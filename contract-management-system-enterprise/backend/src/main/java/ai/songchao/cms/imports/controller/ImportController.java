package ai.songchao.cms.imports.controller;

import ai.songchao.cms.common.ApiResponse;
import ai.songchao.cms.imports.dto.ImportPreviewItemDto;
import ai.songchao.cms.imports.service.ImportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/imports")
public class ImportController {
    private final ImportService importService;

    public ImportController(ImportService importService) {
        this.importService = importService;
    }

    @GetMapping("/capabilities")
    public ApiResponse<Map<String, Object>> capabilities() {
        return ApiResponse.success(importService.capabilities());
    }

    @GetMapping("/preview")
    public ApiResponse<List<ImportPreviewItemDto>> preview() {
        return ApiResponse.success(importService.preview());
    }
}

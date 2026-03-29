package ai.songchao.cms.imports.controller;

import ai.songchao.cms.common.ApiResponse;
import ai.songchao.cms.imports.dto.ImportPreviewItemDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/imports")
public class ImportController {

    @GetMapping("/capabilities")
    public ApiResponse<Map<String, Object>> capabilities() {
        return ApiResponse.success(Map.of(
                "excel", true,
                "docx", true,
                "pdf", true,
                "ocrImage", false,
                "note", "图片 OCR 需要在部署机安装 OCR 引擎或接入专门识别服务。"
        ));
    }

    @GetMapping("/preview")
    public ApiResponse<List<ImportPreviewItemDto>> preview() {
        return ApiResponse.success(List.of(
                new ImportPreviewItemDto("年度软件服务合同", "杭州云象科技有限公司", "128000", 2, 2),
                new ImportPreviewItemDto("AI 服务采购合同", "上海启航供应链有限公司", "560000", 1, 1)
        ));
    }
}

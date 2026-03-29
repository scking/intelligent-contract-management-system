package ai.songchao.cms.imports.controller;

import ai.songchao.cms.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}

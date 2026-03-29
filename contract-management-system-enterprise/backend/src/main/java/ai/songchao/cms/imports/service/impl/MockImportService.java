package ai.songchao.cms.imports.service.impl;

import ai.songchao.cms.imports.dto.ImportPreviewItemDto;
import ai.songchao.cms.imports.service.ImportService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MockImportService implements ImportService {
    @Override
    public Map<String, Object> capabilities() {
        return Map.of(
                "excel", true,
                "docx", true,
                "pdf", true,
                "ocrImage", false,
                "note", "图片 OCR 需要在部署机安装 OCR 引擎或接入专门识别服务。"
        );
    }

    @Override
    public List<ImportPreviewItemDto> preview() {
        return List.of(
                new ImportPreviewItemDto("年度软件服务合同", "杭州云象科技有限公司", "128000", 2, 2),
                new ImportPreviewItemDto("AI 服务采购合同", "上海启航供应链有限公司", "560000", 1, 1)
        );
    }
}

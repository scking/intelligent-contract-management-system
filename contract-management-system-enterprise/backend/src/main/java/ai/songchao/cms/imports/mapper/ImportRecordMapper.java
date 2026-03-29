package ai.songchao.cms.imports.mapper;

import ai.songchao.cms.imports.entity.ImportRecordEntity;

import java.util.List;

public interface ImportRecordMapper {
    List<ImportRecordEntity> selectByBatchId(String batchId);
}

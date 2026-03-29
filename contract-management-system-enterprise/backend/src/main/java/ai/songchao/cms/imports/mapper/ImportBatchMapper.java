package ai.songchao.cms.imports.mapper;

import ai.songchao.cms.imports.entity.ImportBatchEntity;

import java.util.List;

public interface ImportBatchMapper {
    List<ImportBatchEntity> selectAll();
}

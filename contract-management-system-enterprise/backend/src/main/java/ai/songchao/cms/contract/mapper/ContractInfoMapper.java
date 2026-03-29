package ai.songchao.cms.contract.mapper;

import ai.songchao.cms.contract.entity.ContractInfoEntity;

import java.util.List;

public interface ContractInfoMapper {
    List<ContractInfoEntity> selectAll();
    ContractInfoEntity selectByCode(String code);
}

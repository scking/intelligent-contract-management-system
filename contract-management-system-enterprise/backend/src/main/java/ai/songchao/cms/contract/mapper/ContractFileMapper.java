package ai.songchao.cms.contract.mapper;

import ai.songchao.cms.contract.entity.ContractFileEntity;

import java.util.List;

public interface ContractFileMapper {
    List<ContractFileEntity> selectByContractId(String contractId);
}

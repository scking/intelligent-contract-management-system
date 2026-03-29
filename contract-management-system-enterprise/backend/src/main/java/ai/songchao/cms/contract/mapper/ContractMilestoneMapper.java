package ai.songchao.cms.contract.mapper;

import ai.songchao.cms.contract.entity.ContractMilestoneEntity;

import java.util.List;

public interface ContractMilestoneMapper {
    List<ContractMilestoneEntity> selectByContractId(String contractId);
}

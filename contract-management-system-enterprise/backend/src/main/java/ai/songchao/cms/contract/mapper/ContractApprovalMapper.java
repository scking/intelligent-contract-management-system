package ai.songchao.cms.contract.mapper;

import ai.songchao.cms.contract.entity.ContractApprovalEntity;

import java.util.List;

public interface ContractApprovalMapper {
    List<ContractApprovalEntity> selectByContractId(String contractId);
}

package ai.songchao.cms.contract.mapper;

import ai.songchao.cms.contract.entity.ContractPaymentPlanEntity;

import java.util.List;

public interface ContractPaymentPlanMapper {
    List<ContractPaymentPlanEntity> selectByContractId(String contractId);
}

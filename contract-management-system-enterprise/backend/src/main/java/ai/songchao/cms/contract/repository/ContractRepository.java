package ai.songchao.cms.contract.repository;

import ai.songchao.cms.contract.dto.ContractDetailDto;
import ai.songchao.cms.contract.dto.ContractSummaryDto;

import java.util.List;

public interface ContractRepository {
    List<ContractSummaryDto> findAll();
    ContractDetailDto findDetailByCode(String code);
}

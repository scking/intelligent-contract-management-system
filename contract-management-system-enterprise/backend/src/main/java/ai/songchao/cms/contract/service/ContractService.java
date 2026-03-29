package ai.songchao.cms.contract.service;

import ai.songchao.cms.contract.dto.ContractDetailDto;
import ai.songchao.cms.contract.dto.ContractSummaryDto;

import java.util.List;

public interface ContractService {
    List<ContractSummaryDto> list();
    ContractDetailDto detail(String code);
}

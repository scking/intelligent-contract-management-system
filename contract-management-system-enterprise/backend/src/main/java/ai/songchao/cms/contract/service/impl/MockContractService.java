package ai.songchao.cms.contract.service.impl;

import ai.songchao.cms.contract.dto.ContractDetailDto;
import ai.songchao.cms.contract.dto.ContractSummaryDto;
import ai.songchao.cms.contract.repository.ContractRepository;
import ai.songchao.cms.contract.service.ContractService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MockContractService implements ContractService {
    private final ContractRepository contractRepository;

    public MockContractService(ContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    @Override
    public List<ContractSummaryDto> list() {
        return contractRepository.findAll();
    }

    @Override
    public ContractDetailDto detail(String code) {
        return contractRepository.findDetailByCode(code);
    }
}

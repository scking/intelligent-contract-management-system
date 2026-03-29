package ai.songchao.cms.contract.controller;

import ai.songchao.cms.common.ApiResponse;
import ai.songchao.cms.contract.dto.ContractDetailDto;
import ai.songchao.cms.contract.dto.ContractSummaryDto;
import ai.songchao.cms.contract.service.ContractService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {
    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping
    public ApiResponse<List<ContractSummaryDto>> list() {
        return ApiResponse.success(contractService.list());
    }

    @GetMapping("/{code}")
    public ApiResponse<ContractDetailDto> detail(@PathVariable String code) {
        return ApiResponse.success(contractService.detail(code));
    }
}

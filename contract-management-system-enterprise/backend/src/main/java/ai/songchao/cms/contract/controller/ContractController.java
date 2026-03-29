package ai.songchao.cms.contract.controller;

import ai.songchao.cms.common.ApiResponse;
import ai.songchao.cms.contract.dto.ContractSummaryDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {

    @GetMapping
    public ApiResponse<List<ContractSummaryDto>> list() {
        List<ContractSummaryDto> data = List.of(
                new ContractSummaryDto("HT-2026-0001", "云平台年度服务合同", "杭州云象科技有限公司", "云平台续费项目", "860000", "审批中", "财务审核", "正常"),
                new ContractSummaryDto("HT-2026-0002", "仓储设备采购合同", "上海启航供应链有限公司", "仓储升级项目", "320000", "已生效", "已完成", "预警")
        );
        return ApiResponse.success(data);
    }
}

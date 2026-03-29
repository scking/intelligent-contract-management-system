package ai.songchao.cms.contract.controller;

import ai.songchao.cms.common.ApiResponse;
import ai.songchao.cms.contract.dto.ApprovalNodeDto;
import ai.songchao.cms.contract.dto.ContractDetailDto;
import ai.songchao.cms.contract.dto.ContractSummaryDto;
import ai.songchao.cms.contract.dto.MilestoneDto;
import ai.songchao.cms.contract.dto.PaymentPlanDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @GetMapping("/{code}")
    public ApiResponse<ContractDetailDto> detail(@PathVariable String code) {
        ContractDetailDto detail = new ContractDetailDto(
                code,
                "云平台年度服务合同",
                "杭州云象科技有限公司",
                "云平台续费项目",
                "860000",
                "审批中",
                "财务审核",
                "正常",
                "企业云平台 1 年 SaaS 服务及驻场支持。",
                List.of(
                        new PaymentPlanDto("首付款", "应收", "344000", "2026-04-10"),
                        new PaymentPlanDto("尾款", "应收", "516000", "2026-10-10")
                ),
                List.of(
                        new MilestoneDto("项目启动", "交付经理", "2026-04-05", "未开始"),
                        new MilestoneDto("验收完成", "客户项目经理", "2026-06-30", "未开始")
                ),
                List.of(
                        new ApprovalNodeDto("部门审批", "部门负责人", "通过", "同意提交法务"),
                        new ApprovalNodeDto("法务审核", "法务专员", "通过", "条款可控"),
                        new ApprovalNodeDto("财务审核", "财务经理", "待处理", "")
                )
        );
        return ApiResponse.success(detail);
    }
}

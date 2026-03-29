package ai.songchao.cms.contract.service.impl;

import ai.songchao.cms.contract.dto.ApprovalNodeDto;
import ai.songchao.cms.contract.dto.ContractDetailDto;
import ai.songchao.cms.contract.dto.ContractSummaryDto;
import ai.songchao.cms.contract.dto.MilestoneDto;
import ai.songchao.cms.contract.dto.PaymentPlanDto;
import ai.songchao.cms.contract.service.ContractService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MockContractService implements ContractService {
    @Override
    public List<ContractSummaryDto> list() {
        return List.of(
                new ContractSummaryDto("HT-2026-0001", "云平台年度服务合同", "杭州云象科技有限公司", "云平台续费项目", "860000", "审批中", "财务审核", "正常"),
                new ContractSummaryDto("HT-2026-0002", "仓储设备采购合同", "上海启航供应链有限公司", "仓储升级项目", "320000", "已生效", "已完成", "预警")
        );
    }

    @Override
    public ContractDetailDto detail(String code) {
        return new ContractDetailDto(
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
    }
}

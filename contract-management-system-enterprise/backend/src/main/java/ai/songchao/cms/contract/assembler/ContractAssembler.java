package ai.songchao.cms.contract.assembler;

import ai.songchao.cms.contract.dto.ApprovalNodeDto;
import ai.songchao.cms.contract.dto.ContractDetailDto;
import ai.songchao.cms.contract.dto.ContractSummaryDto;
import ai.songchao.cms.contract.dto.MilestoneDto;
import ai.songchao.cms.contract.dto.PaymentPlanDto;
import ai.songchao.cms.contract.entity.ContractApprovalEntity;
import ai.songchao.cms.contract.entity.ContractInfoEntity;
import ai.songchao.cms.contract.entity.ContractMilestoneEntity;
import ai.songchao.cms.contract.entity.ContractPaymentPlanEntity;

import java.util.List;
import java.util.stream.Collectors;

public final class ContractAssembler {
    private ContractAssembler() {
    }

    public static ContractSummaryDto toSummary(ContractInfoEntity entity) {
        return new ContractSummaryDto(
                entity.getCode(),
                entity.getName(),
                entity.getPartnerName(),
                entity.getProjectName(),
                entity.getAmount() == null ? null : entity.getAmount().toPlainString(),
                entity.getStatus(),
                entity.getApprovalStage(),
                entity.getRiskLevel()
        );
    }

    public static ContractDetailDto toDetail(ContractInfoEntity info,
                                             List<ContractPaymentPlanEntity> paymentPlans,
                                             List<ContractMilestoneEntity> milestones,
                                             List<ContractApprovalEntity> approvals) {
        return new ContractDetailDto(
                info.getCode(),
                info.getName(),
                info.getPartnerName(),
                info.getProjectName(),
                info.getAmount() == null ? null : info.getAmount().toPlainString(),
                info.getStatus(),
                info.getApprovalStage(),
                info.getRiskLevel(),
                info.getSummary(),
                paymentPlans.stream().map(ContractAssembler::toPaymentPlan).collect(Collectors.toList()),
                milestones.stream().map(ContractAssembler::toMilestone).collect(Collectors.toList()),
                approvals.stream().map(ContractAssembler::toApproval).collect(Collectors.toList())
        );
    }

    public static PaymentPlanDto toPaymentPlan(ContractPaymentPlanEntity entity) {
        return new PaymentPlanDto(
                entity.getPhase(),
                entity.getPayType(),
                entity.getAmount() == null ? null : entity.getAmount().toPlainString(),
                entity.getPlanDate() == null ? null : entity.getPlanDate().toString()
        );
    }

    public static MilestoneDto toMilestone(ContractMilestoneEntity entity) {
        return new MilestoneDto(
                entity.getName(),
                entity.getOwnerName(),
                entity.getDueDate() == null ? null : entity.getDueDate().toString(),
                entity.getStatus()
        );
    }

    public static ApprovalNodeDto toApproval(ContractApprovalEntity entity) {
        return new ApprovalNodeDto(
                entity.getNodeName(),
                entity.getAssigneeName(),
                entity.getStatus(),
                entity.getComment()
        );
    }
}

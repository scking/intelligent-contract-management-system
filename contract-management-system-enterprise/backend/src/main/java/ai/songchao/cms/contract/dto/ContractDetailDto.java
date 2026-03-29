package ai.songchao.cms.contract.dto;

import java.util.List;

public class ContractDetailDto {
    private String code;
    private String name;
    private String partnerName;
    private String projectName;
    private String amount;
    private String status;
    private String approvalStage;
    private String riskLevel;
    private String summary;
    private List<PaymentPlanDto> paymentPlans;
    private List<MilestoneDto> milestones;
    private List<ApprovalNodeDto> approvals;

    public ContractDetailDto(String code, String name, String partnerName, String projectName, String amount,
                             String status, String approvalStage, String riskLevel, String summary,
                             List<PaymentPlanDto> paymentPlans, List<MilestoneDto> milestones,
                             List<ApprovalNodeDto> approvals) {
        this.code = code;
        this.name = name;
        this.partnerName = partnerName;
        this.projectName = projectName;
        this.amount = amount;
        this.status = status;
        this.approvalStage = approvalStage;
        this.riskLevel = riskLevel;
        this.summary = summary;
        this.paymentPlans = paymentPlans;
        this.milestones = milestones;
        this.approvals = approvals;
    }

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getPartnerName() { return partnerName; }
    public String getProjectName() { return projectName; }
    public String getAmount() { return amount; }
    public String getStatus() { return status; }
    public String getApprovalStage() { return approvalStage; }
    public String getRiskLevel() { return riskLevel; }
    public String getSummary() { return summary; }
    public List<PaymentPlanDto> getPaymentPlans() { return paymentPlans; }
    public List<MilestoneDto> getMilestones() { return milestones; }
    public List<ApprovalNodeDto> getApprovals() { return approvals; }
}

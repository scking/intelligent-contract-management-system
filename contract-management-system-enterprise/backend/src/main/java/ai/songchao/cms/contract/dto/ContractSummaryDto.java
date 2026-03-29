package ai.songchao.cms.contract.dto;

public class ContractSummaryDto {
    private String code;
    private String name;
    private String partnerName;
    private String projectName;
    private String amount;
    private String status;
    private String approvalStage;
    private String riskLevel;

    public ContractSummaryDto(String code, String name, String partnerName, String projectName, String amount, String status, String approvalStage, String riskLevel) {
        this.code = code;
        this.name = name;
        this.partnerName = partnerName;
        this.projectName = projectName;
        this.amount = amount;
        this.status = status;
        this.approvalStage = approvalStage;
        this.riskLevel = riskLevel;
    }

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getPartnerName() { return partnerName; }
    public String getProjectName() { return projectName; }
    public String getAmount() { return amount; }
    public String getStatus() { return status; }
    public String getApprovalStage() { return approvalStage; }
    public String getRiskLevel() { return riskLevel; }
}

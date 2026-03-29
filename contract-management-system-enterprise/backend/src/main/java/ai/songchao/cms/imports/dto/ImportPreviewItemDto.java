package ai.songchao.cms.imports.dto;

public class ImportPreviewItemDto {
    private String name;
    private String partnerName;
    private String amount;
    private int paymentPlanCount;
    private int milestoneCount;

    public ImportPreviewItemDto(String name, String partnerName, String amount, int paymentPlanCount, int milestoneCount) {
        this.name = name;
        this.partnerName = partnerName;
        this.amount = amount;
        this.paymentPlanCount = paymentPlanCount;
        this.milestoneCount = milestoneCount;
    }

    public String getName() { return name; }
    public String getPartnerName() { return partnerName; }
    public String getAmount() { return amount; }
    public int getPaymentPlanCount() { return paymentPlanCount; }
    public int getMilestoneCount() { return milestoneCount; }
}

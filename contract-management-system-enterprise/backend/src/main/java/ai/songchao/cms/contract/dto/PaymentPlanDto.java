package ai.songchao.cms.contract.dto;

public class PaymentPlanDto {
    private String phase;
    private String type;
    private String amount;
    private String planDate;

    public PaymentPlanDto(String phase, String type, String amount, String planDate) {
        this.phase = phase;
        this.type = type;
        this.amount = amount;
        this.planDate = planDate;
    }

    public String getPhase() { return phase; }
    public String getType() { return type; }
    public String getAmount() { return amount; }
    public String getPlanDate() { return planDate; }
}

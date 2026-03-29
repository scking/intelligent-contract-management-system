package ai.songchao.cms.contract.dto;

public class MilestoneDto {
    private String name;
    private String owner;
    private String dueDate;
    private String status;

    public MilestoneDto(String name, String owner, String dueDate, String status) {
        this.name = name;
        this.owner = owner;
        this.dueDate = dueDate;
        this.status = status;
    }

    public String getName() { return name; }
    public String getOwner() { return owner; }
    public String getDueDate() { return dueDate; }
    public String getStatus() { return status; }
}

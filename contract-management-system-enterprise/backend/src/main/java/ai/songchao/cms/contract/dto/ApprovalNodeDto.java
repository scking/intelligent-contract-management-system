package ai.songchao.cms.contract.dto;

public class ApprovalNodeDto {
    private String nodeName;
    private String assignee;
    private String status;
    private String comment;

    public ApprovalNodeDto(String nodeName, String assignee, String status, String comment) {
        this.nodeName = nodeName;
        this.assignee = assignee;
        this.status = status;
        this.comment = comment;
    }

    public String getNodeName() { return nodeName; }
    public String getAssignee() { return assignee; }
    public String getStatus() { return status; }
    public String getComment() { return comment; }
}

# 合同管理系统 MySQL 目标模型（初版）

这一版先固化正式版最核心的业务对象，优先支撑：

- 合同台账
- 合同详情
- 审批流
- 付款节点
- 履约里程碑
- 附件
- 导入批次 / 导入结果

## 设计原则

- 所有核心表统一保留审计字段：`id`, `create_by`, `create_time`, `update_by`, `update_time`, `del_flag`
- 主键统一使用 `bigint` 或 `varchar(64)`；当前建议业务主键用 `varchar(64)`，方便导入与分布式扩展
- 金额统一使用 `decimal(18,2)`
- 日期统一使用 `date`，时间统一使用 `datetime`
- 状态字段尽量保留字典化空间，不直接硬编码为布尔值

## 核心表

### 1. `contract_info`
合同主表。

关键字段：
- `id`
- `code` 合同编号
- `name` 合同名称
- `type` 合同类型
- `contract_category` 合同类别
- `partner_name` 相对方名称
- `our_side_name` 我方主体
- `project_name` 项目名称
- `template_name` 模板名称
- `amount`
- `currency`
- `tax_rate`
- `status`
- `approval_stage`
- `risk_level`
- `performance_status`
- `payment_status`
- `archive_status`
- `signing_method`
- `sign_date`
- `effective_date`
- `expire_date`
- `summary`
- `remark`

建议索引：
- `uk_contract_info_code (code)`
- `idx_contract_info_partner_name (partner_name)`
- `idx_contract_info_status (status)`
- `idx_contract_info_expire_date (expire_date)`

### 2. `contract_approval`
审批节点实例表。

关键字段：
- `id`
- `contract_id`
- `node_name`
- `assignee_name`
- `status`
- `comment`
- `handled_time`
- `sort_no`

建议索引：
- `idx_contract_approval_contract_id (contract_id)`
- `idx_contract_approval_status (status)`

### 3. `contract_payment_plan`
付款节点表。

关键字段：
- `id`
- `contract_id`
- `phase`
- `pay_type` (`应收` / `应付`)
- `amount`
- `percent_value`
- `plan_date`
- `actual_date`
- `status`
- `remark`

建议索引：
- `idx_contract_payment_plan_contract_id (contract_id)`
- `idx_contract_payment_plan_plan_date (plan_date)`

### 4. `contract_milestone`
履约里程碑表。

关键字段：
- `id`
- `contract_id`
- `name`
- `owner_name`
- `due_date`
- `status`
- `remark`

建议索引：
- `idx_contract_milestone_contract_id (contract_id)`
- `idx_contract_milestone_due_date (due_date)`

### 5. `contract_file`
合同附件表。

关键字段：
- `id`
- `contract_id`
- `file_name`
- `file_type`
- `storage_type`
- `storage_path`
- `file_size`
- `mime_type`
- `source_type` (`上传` / `导入解析` / `签章回传`)

建议索引：
- `idx_contract_file_contract_id (contract_id)`

### 6. `import_batch`
导入批次表。

关键字段：
- `id`
- `batch_no`
- `import_type` (`excel` / `contract_file` / `ocr`)
- `source_file_name`
- `status`
- `success_count`
- `fail_count`
- `operator_name`
- `remark`

### 7. `import_record`
导入明细表。

关键字段：
- `id`
- `batch_id`
- `record_name`
- `parsed_payload` JSON
- `confirm_status`
- `target_contract_id`
- `error_message`

建议索引：
- `idx_import_record_batch_id (batch_id)`
- `idx_import_record_target_contract_id (target_contract_id)`

## 下一步

1. 基于这份模型输出首版建表 SQL
2. 给 Spring Boot 增加 entity / mapper / service 对应结构
3. 将原型版 JSON 数据映射到这些表字段

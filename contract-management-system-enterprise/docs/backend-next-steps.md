# Spring Boot 下一步落地计划

## 当前已具备

- controller
- dto
- service
- repository
- MySQL 目标模型文档
- 首版建表 SQL
- 前端 mock / real API 切换入口

## 下一步建议顺序

### 1. 引入 MyBatis-Plus 依赖
目标：让 entity / mapper 能真正承接数据库查询。

### 2. 为以下对象补 entity + mapper + service
- `contract_info`
- `contract_approval`
- `contract_payment_plan`
- `contract_milestone`
- `contract_file`

### 3. 建立 DTO 转换层
建议：
- entity 只负责数据库字段
- dto 只负责接口输出
- 用 assembler / converter 把 entity 转成 dto

### 4. 增加导入批次相关模型
- `import_batch`
- `import_record`

### 5. 前端切换成真实 API
- 将 `frontend/src/api.js` 中 `USE_MOCK` 改为 `false`
- 确保 `http.js` 指向正确的后端地址
- 完成联调后再替换为 axios + 环境变量配置

## 风险提示

- 当前机器未安装 Java / Maven，正式版后端暂时只能写代码和结构，不能本机编译验证
- 真正联调前，需要先准备一台可运行 Java 17 + Maven 的环境

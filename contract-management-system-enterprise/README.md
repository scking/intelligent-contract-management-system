# Contract Management System Enterprise

这是第 2 步正式迁移的工程骨架，目标技术栈：

- Frontend: Vue3 + Vite + Element Plus + Pinia + Axios
- Backend: Spring Boot 2.7.x + Spring Security + MyBatis-Plus
- Database: MySQL 8.0
- Cache: Redis 6.x
- Storage: MinIO / OSS

当前目录用于承接从 `contract-management-system` 原型验证版迁移出的正式生产工程。

## 目录规划

```text
contract-management-system-enterprise/
  frontend/
  backend/
  docs/
```

## 迁移顺序

1. 固化原型中的业务字段、审批流、导入识别能力
2. 将合同台账、详情、审批中心迁移到 Vue3 页面
3. 将 Node API 重构为 Spring Boot REST API
4. 将 JSON 数据迁移到 MySQL 表结构
5. 接入 Redis、MinIO、电子签章、消息通知

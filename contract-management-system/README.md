# 合同管理系统（本地落地版）

这是一个可直接本地运行的企业合同管理系统演示版，围绕“起草 -> 审批 -> 生效 -> 履约 -> 收付款 -> 归档 -> 审计”主线实现了可操作界面和 REST API。

## 已实现功能

- 登录鉴权（内置管理员、法务、财务账号）
- 合同驾驶舱：合同总额、审批中、生效合同、到期提醒、待回款
- 合同台账：查询、筛选、新建、编辑
- 审批中心：通过 / 驳回审批
- 合作方档案、模板中心
- 收付款计划、提醒预警、归档借阅
- 审计日志留痕
- 本地 JSON 数据持久化，便于继续扩展为 MySQL / Redis / MinIO 架构

## 技术方案

- 前端：原生 HTML + CSS + JavaScript 单页应用
- 后端：Node.js 原生 HTTP 服务
- 数据：`data/db.json`
- 部署：本地 Node 直接启动

这样做的目的是先把业务系统跑起来，方便快速评审交互和流程，再平滑升级到 Vue3 + SpringBoot + MySQL 正式架构。

## 启动方式

```bash
cd contract-management-system
npm start
```

启动后访问：

```text
http://127.0.0.1:3060
```

## 默认账号

- 超级管理员：`admin / Admin@123456`
- 法务：`legal / Legal@123456`
- 财务：`finance / Finance@123456`

## 目录结构

```text
contract-management-system/
  package.json
  server.js
  data/
    db.json
  public/
    index.html
    styles.css
    app.js
```

## 后续建议

1. 将数据层替换为 MySQL 8.0，并补齐建表 SQL
2. 将附件能力接入 MinIO
3. 将审批流抽象为流程定义 + 节点配置
4. 接入电子签章、邮件、企业微信 / 钉钉通知
5. 增加 RBAC 菜单权限与数据权限控制

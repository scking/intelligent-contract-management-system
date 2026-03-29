# 智能科技分公司合同管理系统

这个仓库目前包含两条并行推进的工程线：

- `contract-management-system`
  - 当前可直接运行的本地原型版
  - 用来快速验证业务流程、页面交互、导入解析、权限模型和演示数据
- `contract-management-system-enterprise`
  - 正式版迁移工程
  - 目标技术栈为 `Vue3 + Spring Boot + MySQL`

## 现在能直接用的版本

原型版目录：`contract-management-system`

已覆盖的核心能力：

- 合同驾驶舱、合同台账、审批中心
- 合同新建、编辑、详情侧边栏、附件上传
- 付款计划、履约里程碑、归档提醒、审计日志
- Excel/CSV 导入预览回填
- 新建合同内联解析 `Word/PDF/TXT`
- 用户管理、角色权限、密码重置、首次登录强制改密

启动方式：

```bash
cd contract-management-system
npm install
npm start
```

访问地址：

```text
http://127.0.0.1:3060
```

默认账号：

- 管理员：`admin / Admin@123456`
- 法务：`legal / Legal@123456`
- 财务：`finance / Finance@123456`

## 正式版工程

正式版目录：`contract-management-system-enterprise`

当前已经补到：

- 前端 API 层、HTTP client、mock/real fallback
- 后端 controller/service/repository/entity/mapper/assembler 骨架
- MySQL 目标模型文档和建表 SQL 草案

说明：当前仓库内的正式版后端仍是工程骨架，尚未完成数据库联调。本机此前也没有完整 Java/Maven 运行环境，因此正式版主要推进的是结构和迁移准备。

## 仓库说明

为了适合公开托管，这个仓库已经排除了以下本地工作区内容：

- 个人助手工作区文件
- `memory/`
- 上传附件目录
- 构建产物和依赖目录

如果你要继续推进，建议优先顺序是：

1. 把原型版权限控制从模块级细化到按钮级和数据范围级
2. 把原型版稳定功能逐步迁到正式版
3. 给正式版补完整后端落库与登录鉴权

const contracts = [
  {
    code: 'HT-2026-0001',
    name: '云平台年度服务合同',
    partnerName: '杭州云象科技有限公司',
    projectName: '云平台续费项目',
    amount: '860000',
    status: '审批中',
    approvalStage: '财务审核',
    riskLevel: '正常'
  },
  {
    code: 'HT-2026-0002',
    name: '仓储设备采购合同',
    partnerName: '上海启航供应链有限公司',
    projectName: '仓储升级项目',
    amount: '320000',
    status: '已生效',
    approvalStage: '已完成',
    riskLevel: '预警'
  }
];

const importAbilities = [
  {
    title: 'Excel / CSV 台账导入',
    desc: '按表头自动映射合同编号、名称、金额、状态，并扩展到付款节点和履约节点。'
  },
  {
    title: 'Word / PDF / TXT 合同解析',
    desc: '自动抽取合同关键信息，解析后先回填到表单，再由业务确认保存。'
  },
  {
    title: 'OCR 识别入口',
    desc: '承接后续扫描版 PDF 与图片合同识别，当前预留前端工作流和后端接口位。'
  }
];

export default {
  data() {
    return {
      activeMenu: 'contracts'
    };
  },
  methods: {
    statusClass(status) {
      if (['审批中', '预警'].includes(status)) return 'gold';
      if (['已生效', '已完成'].includes(status)) return 'green';
      return 'teal';
    },
    formatMoney(value) {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        maximumFractionDigits: 0
      }).format(Number(value || 0));
    }
  },
  computed: {
    contracts() {
      return contracts;
    },
    importAbilities() {
      return importAbilities;
    }
  },
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <small>CMS Enterprise</small>
          <h2>正式版迁移中</h2>
        </div>
        <nav class="nav">
          <button :class="['nav-item', { active: activeMenu === 'contracts' }]" @click="activeMenu = 'contracts'">合同台账</button>
          <button :class="['nav-item', { active: activeMenu === 'imports' }]" @click="activeMenu = 'imports'">导入识别</button>
          <button :class="['nav-item', { active: activeMenu === 'plan' }]" @click="activeMenu = 'plan'">迁移路线</button>
        </nav>
      </aside>
      <main class="content">
        <header class="hero">
          <div>
            <small>Vue3 + Vite + Element Plus 目标界面</small>
            <h1>正式版前端骨架已经启动</h1>
            <p>这一版先把原型里最关键的两条线迁过来：合同台账和导入识别。后续再接 Spring Boot API 和真实权限体系。</p>
          </div>
          <div class="hero-card">
            <strong>当前阶段</strong>
            <span>迁移核心业务页，而不是只搭空壳</span>
          </div>
        </header>

        <section v-if="activeMenu === 'contracts'" class="panel-grid">
          <article class="panel wide">
            <div class="panel-head">
              <h3>合同台账</h3>
              <div class="toolbar">
                <button class="ghost">导入 Excel/CSV</button>
                <button class="ghost">解析合同</button>
                <button class="primary">新建合同</button>
              </div>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>合同编号</th>
                  <th>合同信息</th>
                  <th>项目</th>
                  <th>金额</th>
                  <th>流程节点</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in contracts" :key="item.code">
                  <td>{{ item.code }}</td>
                  <td>
                    <strong>{{ item.name }}</strong>
                    <span>{{ item.partnerName }}</span>
                  </td>
                  <td>{{ item.projectName }}</td>
                  <td>{{ formatMoney(item.amount) }}</td>
                  <td>
                    <strong>{{ item.approvalStage }}</strong>
                    <span>风险：{{ item.riskLevel }}</span>
                  </td>
                  <td><em :class="['tag', statusClass(item.status)]">{{ item.status }}</em></td>
                </tr>
              </tbody>
            </table>
          </article>

          <article class="panel side">
            <h3>合同详情目标结构</h3>
            <ul class="check-list">
              <li>基础信息卡片</li>
              <li>审批链路时间线</li>
              <li>付款节点表格</li>
              <li>履约里程碑</li>
              <li>附件区与导入来源</li>
            </ul>
          </article>
        </section>

        <section v-if="activeMenu === 'imports'" class="panel-grid imports">
          <article class="panel" v-for="item in importAbilities" :key="item.title">
            <small>Import Flow</small>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
            <button class="ghost">进入该流程</button>
          </article>
        </section>

        <section v-if="activeMenu === 'plan'" class="panel-grid imports">
          <article class="panel">
            <small>Backend</small>
            <h3>Spring Boot API</h3>
            <p>先承接合同列表、合同详情、导入识别预览这三类接口，再把审批流迁进去。</p>
          </article>
          <article class="panel">
            <small>Database</small>
            <h3>MySQL 迁移</h3>
            <p>把原型版 JSON 数据结构固化成表结构，再补索引、审计字段和数据权限字段。</p>
          </article>
          <article class="panel">
            <small>Next</small>
            <h3>Element Plus UI</h3>
            <p>下一步会引入 Element Plus、Pinia、Axios，把这套界面接成真正的企业后台风格。</p>
          </article>
        </section>
      </main>
    </div>
  `
};

const contracts = [
  {
    code: 'HT-2026-0001',
    name: '云平台年度服务合同',
    partnerName: '杭州云象科技有限公司',
    projectName: '云平台续费项目',
    amount: '860000',
    status: '审批中',
    approvalStage: '财务审核',
    riskLevel: '正常',
    summary: '企业云平台 1 年 SaaS 服务及驻场支持。',
    paymentPlans: [
      { phase: '首付款', type: '应收', amount: '344000', planDate: '2026-04-10' },
      { phase: '尾款', type: '应收', amount: '516000', planDate: '2026-10-10' }
    ],
    milestones: [
      { name: '项目启动', owner: '交付经理', dueDate: '2026-04-05', status: '未开始' },
      { name: '验收完成', owner: '客户项目经理', dueDate: '2026-06-30', status: '未开始' }
    ],
    approvals: [
      { nodeName: '部门审批', assignee: '部门负责人', status: '通过', comment: '同意提交法务' },
      { nodeName: '法务审核', assignee: '法务专员', status: '通过', comment: '条款可控' },
      { nodeName: '财务审核', assignee: '财务经理', status: '待处理', comment: '' }
    ]
  },
  {
    code: 'HT-2026-0002',
    name: '仓储设备采购合同',
    partnerName: '上海启航供应链有限公司',
    projectName: '仓储升级项目',
    amount: '320000',
    status: '已生效',
    approvalStage: '已完成',
    riskLevel: '预警',
    summary: '仓储自动分拣设备采购及安装调试服务。',
    paymentPlans: [
      { phase: '预付款', type: '应付', amount: '96000', planDate: '2026-02-25' }
    ],
    milestones: [
      { name: '设备到货', owner: '仓储主管', dueDate: '2026-03-28', status: '已完成' }
    ],
    approvals: [
      { nodeName: '部门审批', assignee: '采购负责人', status: '通过', comment: '通过' }
    ]
  }
];

const importPreview = [
  { name: '年度软件服务合同', partnerName: '杭州云象科技有限公司', amount: '128000', paymentPlanCount: 2, milestoneCount: 2 },
  { name: 'AI 服务采购合同', partnerName: '上海启航供应链有限公司', amount: '560000', paymentPlanCount: 1, milestoneCount: 1 }
];

export default {
  data() {
    return {
      activeMenu: 'contracts',
      selectedContract: contracts[0]
    };
  },
  methods: {
    statusClass(status) {
      if (['审批中', '预警', '待处理'].includes(status)) return 'gold';
      if (['已生效', '已完成', '通过'].includes(status)) return 'green';
      return 'teal';
    },
    formatMoney(value) {
      return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(Number(value || 0));
    },
    pickContract(code) {
      this.selectedContract = this.contracts.find((item) => item.code === code) || this.contracts[0];
    }
  },
  computed: {
    contracts() {
      return contracts;
    },
    importPreview() {
      return importPreview;
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
            <h1>正式版前端正在承接原型功能</h1>
            <p>这一轮把合同台账、合同详情、导入预览都做成了真实业务页结构。后面只需要把示例数据替换成 Spring Boot 接口返回即可。</p>
          </div>
          <div class="hero-card">
            <strong>当前重点</strong>
            <span>页面结构先对齐真实业务，再接正式接口</span>
          </div>
        </header>

        <section v-if="activeMenu === 'contracts'" class="panel-grid contracts-layout">
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
                <tr v-for="item in contracts" :key="item.code" @click="pickContract(item.code)" class="row-clickable">
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

          <article class="panel side detail-panel">
            <small>Contract Detail</small>
            <h3>{{ selectedContract.name }}</h3>
            <p>{{ selectedContract.summary }}</p>
            <div class="detail-meta">
              <div><label>合同编号</label><strong>{{ selectedContract.code }}</strong></div>
              <div><label>相对方</label><strong>{{ selectedContract.partnerName }}</strong></div>
              <div><label>项目</label><strong>{{ selectedContract.projectName }}</strong></div>
              <div><label>金额</label><strong>{{ formatMoney(selectedContract.amount) }}</strong></div>
            </div>
            <div class="sub-block">
              <h4>审批链路</h4>
              <div class="timeline-item" v-for="node in selectedContract.approvals" :key="node.nodeName">
                <em :class="['tag', statusClass(node.status)]">{{ node.status }}</em>
                <div>
                  <strong>{{ node.nodeName }}</strong>
                  <span>{{ node.assignee }} {{ node.comment ? '· ' + node.comment : '' }}</span>
                </div>
              </div>
            </div>
            <div class="sub-block">
              <h4>付款节点</h4>
              <div class="mini-row" v-for="plan in selectedContract.paymentPlans" :key="plan.phase">
                <span>{{ plan.phase }} · {{ plan.type }}</span>
                <strong>{{ formatMoney(plan.amount) }}</strong>
              </div>
            </div>
            <div class="sub-block">
              <h4>履约节点</h4>
              <div class="mini-row" v-for="node in selectedContract.milestones" :key="node.name">
                <span>{{ node.name }}</span>
                <strong>{{ node.dueDate }}</strong>
              </div>
            </div>
          </article>
        </section>

        <section v-if="activeMenu === 'imports'" class="panel-grid imports-layout">
          <article class="panel wide">
            <div class="panel-head">
              <h3>导入预览</h3>
              <div class="toolbar">
                <button class="ghost">Excel/CSV</button>
                <button class="ghost">Word/PDF/TXT</button>
                <button class="ghost">OCR</button>
              </div>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>合同名称</th>
                  <th>相对方</th>
                  <th>金额</th>
                  <th>付款节点</th>
                  <th>履约节点</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in importPreview" :key="item.name">
                  <td>{{ item.name }}</td>
                  <td>{{ item.partnerName }}</td>
                  <td>{{ formatMoney(item.amount) }}</td>
                  <td>{{ item.paymentPlanCount }}</td>
                  <td>{{ item.milestoneCount }}</td>
                </tr>
              </tbody>
            </table>
          </article>
          <article class="panel side">
            <small>Import Strategy</small>
            <h3>导入能力拆分</h3>
            <p>正式版会把“导入预览”和“确认回填”拆成独立页面，并记录导入来源、导入批次和人工确认状态。</p>
            <ul class="check-list">
              <li>Excel/CSV 批量预览</li>
              <li>Word/PDF 单合同解析</li>
              <li>OCR 失败提示与重试</li>
              <li>人工确认后入库</li>
            </ul>
          </article>
        </section>

        <section v-if="activeMenu === 'plan'" class="panel-grid imports-layout">
          <article class="panel">
            <small>Backend</small>
            <h3>Spring Boot API</h3>
            <p>现在已经有合同列表、合同详情、导入能力、导入预览四类接口骨架，下一步开始替换成真实服务层。</p>
          </article>
          <article class="panel">
            <small>Database</small>
            <h3>MySQL 迁移</h3>
            <p>接下来会把原型版 JSON 结构固化为表结构，重点先做合同主表、审批表、付款表、附件表。</p>
          </article>
          <article class="panel">
            <small>UI</small>
            <h3>Element Plus 接入</h3>
            <p>目前先用轻量样式把页面结构定下来，后续直接替换成 Element Plus 组件化实现。</p>
          </article>
        </section>
      </main>
    </div>
  `
};

import ContractTable from './components/ContractTable.js';
import ContractDetailPanel from './components/ContractDetailPanel.js';
import ImportPreviewPanel from './components/ImportPreviewPanel.js';
import { contracts, importPreview } from './data.js';

export default {
  components: {
    ContractTable,
    ContractDetailPanel,
    ImportPreviewPanel
  },
  data() {
    return {
      activeMenu: 'contracts',
      selectedCode: contracts[0].code
    };
  },
  computed: {
    contracts() {
      return contracts;
    },
    importPreview() {
      return importPreview;
    },
    selectedContract() {
      return this.contracts.find((item) => item.code === this.selectedCode) || this.contracts[0];
    }
  },
  methods: {
    pickContract(code) {
      this.selectedCode = code;
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
            <p>这一轮已经把合同台账、合同详情、导入预览拆成组件，下一步接入状态管理和真实接口会更顺。</p>
          </div>
          <div class="hero-card">
            <strong>当前重点</strong>
            <span>组件化完成后，前后端都能沿着稳定的数据结构推进</span>
          </div>
        </header>

        <section v-if="activeMenu === 'contracts'" class="panel-grid contracts-layout">
          <ContractTable :contracts="contracts" :selected-code="selectedCode" @pick="pickContract" />
          <ContractDetailPanel :contract="selectedContract" />
        </section>

        <section v-if="activeMenu === 'imports'" class="panel-grid imports-layout">
          <ImportPreviewPanel :items="importPreview" />
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

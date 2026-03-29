import ContractTable from './components/ContractTable.js';
import ContractDetailPanel from './components/ContractDetailPanel.js';
import ImportPreviewPanel from './components/ImportPreviewPanel.js';
import { fetchContracts, fetchContractDetail, fetchImportCapabilities, fetchImportPreview } from './api.js';

export default {
  components: {
    ContractTable,
    ContractDetailPanel,
    ImportPreviewPanel
  },
  data() {
    return {
      activeMenu: 'contracts',
      selectedCode: '',
      contracts: [],
      selectedContract: null,
      importPreview: [],
      importCapabilities: null,
      loadingContracts: false,
      loadingDetail: false,
      loadingImports: false
    };
  },
  async mounted() {
    await this.loadContracts();
  },
  methods: {
    async loadContracts() {
      this.loadingContracts = true;
      this.contracts = await fetchContracts();
      this.selectedCode = this.contracts[0]?.code || '';
      this.loadingContracts = false;
      if (this.selectedCode) {
        await this.loadContractDetail(this.selectedCode);
      }
    },
    async loadContractDetail(code) {
      this.loadingDetail = true;
      this.selectedCode = code;
      this.selectedContract = await fetchContractDetail(code);
      this.loadingDetail = false;
    },
    async loadImports() {
      if (this.importPreview.length && this.importCapabilities) return;
      this.loadingImports = true;
      const [preview, capabilities] = await Promise.all([
        fetchImportPreview(),
        fetchImportCapabilities()
      ]);
      this.importPreview = preview;
      this.importCapabilities = capabilities;
      this.loadingImports = false;
    },
    async switchMenu(menu) {
      this.activeMenu = menu;
      if (menu === 'imports') {
        await this.loadImports();
      }
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
          <button :class="['nav-item', { active: activeMenu === 'contracts' }]" @click="switchMenu('contracts')">合同台账</button>
          <button :class="['nav-item', { active: activeMenu === 'imports' }]" @click="switchMenu('imports')">导入识别</button>
          <button :class="['nav-item', { active: activeMenu === 'plan' }]" @click="switchMenu('plan')">迁移路线</button>
        </nav>
      </aside>
      <main class="content">
        <header class="hero">
          <div>
            <small>Vue3 + Vite + Element Plus 目标界面</small>
            <h1>正式版开始走真实数据流</h1>
            <p>这一轮已经加了统一 API 层，页面不再直接依赖本地常量。下一步把 mock API 替换成 Axios + Spring Boot 就可以平滑过渡。</p>
          </div>
          <div class="hero-card">
            <strong>当前重点</strong>
            <span>前端从静态页面走向可替换的数据流结构</span>
          </div>
        </header>

        <section v-if="activeMenu === 'contracts'" class="panel-grid contracts-layout">
          <ContractTable :contracts="contracts" :selected-code="selectedCode" @pick="loadContractDetail" />
          <article v-if="loadingDetail || loadingContracts" class="panel side detail-panel"><p>加载合同详情中...</p></article>
          <ContractDetailPanel v-else-if="selectedContract" :contract="selectedContract" />
          <article v-else class="panel side detail-panel"><p>暂无合同详情。</p></article>
        </section>

        <section v-if="activeMenu === 'imports'" class="panel-grid imports-layout">
          <ImportPreviewPanel :items="importPreview" />
          <article class="panel side">
            <small>Import Strategy</small>
            <h3>导入能力拆分</h3>
            <p v-if="loadingImports">正在加载导入能力...</p>
            <template v-else>
              <p>正式版会把“导入预览”和“确认回填”拆成独立页面，并记录导入来源、导入批次和人工确认状态。</p>
              <ul class="check-list">
                <li>Excel/CSV：{{ importCapabilities?.excel ? '已规划' : '未开启' }}</li>
                <li>Word/PDF：{{ importCapabilities?.pdf ? '已规划' : '未开启' }}</li>
                <li>图片 OCR：{{ importCapabilities?.ocrImage ? '已开启' : '待补引擎' }}</li>
                <li>{{ importCapabilities?.note }}</li>
              </ul>
            </template>
          </article>
        </section>

        <section v-if="activeMenu === 'plan'" class="panel-grid imports-layout">
          <article class="panel">
            <small>Backend</small>
            <h3>Spring Boot API</h3>
            <p>现在已经有 controller + dto + service + mock api 对齐结构，下一步就是把前端 API 改成真实 HTTP 调用。</p>
          </article>
          <article class="panel">
            <small>Database</small>
            <h3>MySQL 迁移</h3>
            <p>接下来会把原型版 JSON 结构固化为表结构，重点先做合同主表、审批表、付款表、附件表。</p>
          </article>
          <article class="panel">
            <small>UI</small>
            <h3>Element Plus 接入</h3>
            <p>目前先把结构和交互层拆好，后面替换成 Element Plus 和 Pinia 时不会返工页面组织。</p>
          </article>
        </section>
      </main>
    </div>
  `
};

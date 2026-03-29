const app = document.querySelector('#app');
const state = {
  token: localStorage.getItem('cms-token') || '',
  user: JSON.parse(localStorage.getItem('cms-user') || 'null'),
  page: 'dashboard',
  dashboard: null,
  contracts: [],
  approvals: [],
  partners: [],
  templates: [],
  payments: [],
  reminders: [],
  archive: [],
  logs: [],
  modalOpen: false,
  editingContract: null,
  filters: { keyword: '', status: '' },
  pendingFiles: []
};

function formatMoney(value) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function statusTag(status) {
  if (['审批中', '预警', '待处理', '待收', '待付'].includes(status)) return 'gold';
  if (['已驳回', '诉讼', '纠纷'].includes(status)) return 'red';
  if (['已生效', '已付', '已收', '通过', '已归档', '已完成'].includes(status)) return 'green';
  return 'teal';
}

function fileSize(size) {
  if (!size) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadAttachment(file) {
  const link = document.createElement('a');
  link.href = file.content || '#';
  link.download = file.name || 'attachment';
  link.click();
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    },
    ...options
  });
  const json = await res.json();
  if (json.code === 401) {
    logout();
    throw new Error(json.msg || '未登录');
  }
  if (json.code !== 200) throw new Error(json.msg || '请求失败');
  return json.data;
}

function logout() {
  localStorage.removeItem('cms-token');
  localStorage.removeItem('cms-user');
  state.token = '';
  state.user = null;
  state.pendingFiles = [];
  render();
}

async function loadPageData() {
  const [dashboard, contracts, approvals, partners, templates, payments, reminders, archive, logs] = await Promise.all([
    api('/api/dashboard'),
    api(`/api/contracts?keyword=${encodeURIComponent(state.filters.keyword)}&status=${encodeURIComponent(state.filters.status)}`),
    api('/api/approvals'),
    api('/api/partners'),
    api('/api/templates'),
    api('/api/payments'),
    api('/api/reminders'),
    api('/api/archive'),
    api('/api/logs')
  ]);
  Object.assign(state, { dashboard, contracts, approvals, partners, templates, payments, reminders, archive, logs });
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const helper = document.querySelector('#login-error');
  helper.textContent = '登录中...';
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: form.get('username'), password: form.get('password') })
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('cms-token', data.token);
    localStorage.setItem('cms-user', JSON.stringify(data.user));
    await loadPageData();
    render();
  } catch (error) {
    helper.textContent = error.message;
  }
}

function openModal(contract = null) {
  state.modalOpen = true;
  state.editingContract = contract;
  state.pendingFiles = Array.isArray(contract?.files) ? [...contract.files] : [];
  render();
}

function closeModal() {
  state.modalOpen = false;
  state.editingContract = null;
  state.pendingFiles = [];
  render();
}

async function submitContractForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  payload.files = state.pendingFiles;
  payload.approvalStage = payload.status === '审批中' ? '部门审批' : (state.editingContract?.approvalStage || '待提交');
  const method = state.editingContract ? 'PUT' : 'POST';
  const url = state.editingContract ? `/api/contracts/${state.editingContract.id}` : '/api/contracts';
  await api(url, { method, body: JSON.stringify(payload) });
  await loadPageData();
  closeModal();
}

async function handleApproval(id, status) {
  const comment = window.prompt(`请输入${status}意见`, status === '通过' ? '同意，进入下一节点。' : '请补充材料后重新提交。');
  if (comment === null) return;
  await api('/api/approvals/action', {
    method: 'POST',
    body: JSON.stringify({ id, status, comment })
  });
  await loadPageData();
  render();
}

async function handleFileSelect(event) {
  const files = [...event.target.files || []];
  if (!files.length) return;
  const list = await Promise.all(files.map(async (file) => ({
    id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    type: '附件',
    uploadedAt: new Date().toISOString(),
    content: await toDataUrl(file)
  })));
  state.pendingFiles = [...state.pendingFiles, ...list];
  render();
}

function removePendingFile(id) {
  state.pendingFiles = state.pendingFiles.filter((file) => file.id !== id);
  render();
}

function loginView() {
  return `
    <div class="login-shell fade-in">
      <div class="login-card">
        <section class="hero-pane">
          <div class="hero-badge">企业正式版 · 可落地演示</div>
          <h1>合同全生命周期管理，
            <br/>从起草到归档一套闭环</h1>
          <p>覆盖组织权限、合同台账、审批流、履约、收付款、归档借阅、提醒与审计日志。先把核心链路跑通，再逐步接电子签章与企业消息。</p>
          <div class="hero-grid">
            <div class="metric-chip"><strong>14</strong><span>核心业务模块</span></div>
            <div class="metric-chip"><strong>RBAC</strong><span>权限 + 数据范围</span></div>
            <div class="metric-chip"><strong>审计留痕</strong><span>日志不可删除</span></div>
            <div class="metric-chip"><strong>本地可用</strong><span>零依赖启动</span></div>
          </div>
        </section>
        <section class="login-form-pane">
          <h2>登录系统</h2>
          <p>演示版已预置管理员、法务、财务账号，方便直接体验审批流。</p>
          <form class="form-grid" id="login-form">
            <div>
              <label>账号</label>
              <input name="username" value="admin" required />
            </div>
            <div>
              <label>密码</label>
              <input name="password" type="password" value="Admin@123456" required />
            </div>
            <div class="form-actions">
              <button class="primary" type="submit">进入合同管理系统</button>
              <span class="helper" id="login-error">默认管理员账号已填好。</span>
            </div>
          </form>
          <div class="demo-box">
            <strong>演示账号</strong><br/>
            admin / Admin@123456（超级管理员）<br/>
            legal / Legal@123456（法务）<br/>
            finance / Finance@123456（财务）
          </div>
        </section>
      </div>
    </div>
  `;
}

function dashboardView() {
  const stats = state.dashboard?.stats || { totalAmount: 0, approvalPending: 0, activeContracts: 0, expiringSoon: 0, receivable: 0 };
  const byStatus = [
    { label: '审批中', value: stats.approvalPending },
    { label: '生效中', value: stats.activeContracts },
    { label: '到期预警', value: stats.expiringSoon }
  ];
  const max = Math.max(...byStatus.map(item => item.value), 1);
  return `
    <div class="page-grid fade-in">
      <div class="stat-grid">
        <div class="stat-card"><span>合同总额</span><strong>${formatMoney(stats.totalAmount)}</strong><small class="muted">已纳入台账合同</small></div>
        <div class="stat-card"><span>审批中</span><strong>${stats.approvalPending}</strong><small class="muted">待推进流程</small></div>
        <div class="stat-card"><span>生效合同</span><strong>${stats.activeContracts}</strong><small class="muted">履约执行中</small></div>
        <div class="stat-card"><span>到期提醒</span><strong>${stats.expiringSoon}</strong><small class="muted">预警已创建</small></div>
        <div class="stat-card"><span>待回款</span><strong>${formatMoney(stats.receivable)}</strong><small class="muted">应收未收</small></div>
      </div>
      <div class="columns-2">
        <section class="panel">
          <div class="panel-head"><h3>最新合同</h3><button class="secondary" data-action="open-create">新建合同</button></div>
          <div class="table-wrap">
            <table class="table"><thead><tr><th>编号</th><th>名称</th><th>相对方</th><th>金额</th><th>状态</th></tr></thead><tbody>
            ${(state.dashboard?.latestContracts || []).map(item => `
              <tr>
                <td>${item.code}</td><td>${item.name}</td><td>${item.partnerName}</td><td>${formatMoney(item.amount)}</td><td><span class="tag ${statusTag(item.status)}">${item.status}</span></td>
              </tr>`).join('')}
            </tbody></table>
          </div>
        </section>
        <section class="panel">
          <h3>审批与风险趋势</h3>
          <div class="mini-chart">
            ${byStatus.map(item => `
              <div class="chart-row">
                <span>${item.label}</span>
                <div class="chart-bar"><i style="width:${(item.value / max) * 100}%"></i></div>
                <strong>${item.value}</strong>
              </div>
            `).join('')}
          </div>
          <div class="footer-tip" style="margin-top:16px;">第 1 步优化已开始：补附件上传、合同详情、流程配置展示、驾驶舱可视化。后面再切 Vue3 + SpringBoot 正式栈。</div>
        </section>
      </div>
      <div class="columns-2">
        <section class="panel">
          <h3>待办审批</h3>
          <div class="columns-3">
            ${(state.dashboard?.todoApprovals || []).map(item => `
              <div class="list-card">
                <strong>${item.nodeName}</strong>
                <div class="muted">处理人：${item.assignee}</div>
                <div class="muted">状态：${item.status}</div>
              </div>
            `).join('') || '<div class="muted">暂无待办审批。</div>'}
          </div>
        </section>
        <section class="panel">
          <h3>标准审批主线</h3>
          <div class="timeline">
            ${['起草合同', '部门审批', '法务审核', '财务审核', '领导终审', '电子签章', '履约执行', '归档审计'].map((step, index) => `<div class="timeline-item"><em>${index + 1}</em><span>${step}</span></div>`).join('')}
          </div>
        </section>
      </div>
    </div>
  `;
}

function contractsView() {
  return `
    <section class="panel fade-in">
      <div class="panel-head">
        <h3>合同台账</h3>
        <div class="toolbar">
          <input id="keyword" placeholder="搜索合同编号 / 名称 / 相对方" value="${state.filters.keyword}" />
          <select id="status-filter">
            <option value="">全部状态</option>
            ${['草稿', '待提交', '审批中', '已生效', '已驳回', '已作废', '已完结'].map(item => `<option ${state.filters.status === item ? 'selected' : ''}>${item}</option>`).join('')}
          </select>
          <button class="ghost" data-action="filter-contracts">筛选</button>
          <button class="primary" data-action="open-create">新建合同</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>编号</th><th>合同名称</th><th>类型</th><th>相对方</th><th>金额</th><th>流程节点</th><th>附件</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            ${state.contracts.map(item => `
              <tr>
                <td>${item.code}</td>
                <td>${item.name}<br/><span class="muted">${item.summary || '-'}</span></td>
                <td>${item.type}</td>
                <td>${item.partnerName}</td>
                <td>${formatMoney(item.amount)}</td>
                <td>${item.approvalStage}</td>
                <td>${item.files?.length || 0}</td>
                <td><span class="tag ${statusTag(item.status)}">${item.status}</span></td>
                <td><button class="secondary" data-action="edit-contract" data-id="${item.id}">编辑</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function approvalsView() {
  return `
    <section class="panel fade-in">
      <div class="panel-head"><h3>审批中心</h3><span class="muted">支持会签 / 或签 / 转办扩展，当前演示标准审批动作。</span></div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>合同</th><th>审批节点</th><th>处理人</th><th>状态</th><th>意见</th><th>处理时间</th><th>操作</th></tr></thead>
          <tbody>
          ${state.approvals.map(item => `
            <tr>
              <td>${item.contract?.code || '-'}<br/><span class="muted">${item.contract?.name || ''}</span></td>
              <td>${item.nodeName}</td>
              <td>${item.assignee}</td>
              <td><span class="tag ${statusTag(item.status)}">${item.status}</span></td>
              <td>${item.comment || '-'}</td>
              <td>${item.handledAt || '-'}</td>
              <td>${item.status === '待处理' ? `<button class="primary" data-action="approve" data-id="${item.id}">通过</button> <button class="danger" data-action="reject" data-id="${item.id}">驳回</button>` : '-'}</td>
            </tr>
          `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function simpleTableView(title, rows, columns) {
  return `
    <section class="panel fade-in">
      <div class="panel-head"><h3>${title}</h3></div>
      <div class="table-wrap"><table class="table"><thead><tr>${columns.map(col => `<th>${col.label}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(row => `<tr>${columns.map(col => `<td>${col.render ? col.render(row) : row[col.key] || '-'}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
    </section>`;
}

function attachmentList(files, editable) {
  if (!files?.length) {
    return '<div class="muted">暂未上传附件。</div>';
  }
  return `<div class="file-list">${files.map(file => `
    <div class="file-item">
      <div>
        <strong>${file.name}</strong>
        <div class="muted">${fileSize(file.size)} · ${file.type || '附件'}</div>
      </div>
      <div class="toolbar compact">
        ${file.content ? `<button type="button" class="ghost" data-action="download-file" data-id="${file.id}">下载</button>` : ''}
        ${editable ? `<button type="button" class="danger" data-action="remove-file" data-id="${file.id}">移除</button>` : ''}
      </div>
    </div>
  `).join('')}</div>`;
}

function contractModal() {
  if (!state.modalOpen) return '';
  const item = state.editingContract || {};
  return `
    <div class="modal-mask">
      <div class="modal fade-in">
        <div class="panel-head"><h3>${state.editingContract ? '编辑合同' : '新建合同'}</h3><button class="ghost" data-action="close-modal">关闭</button></div>
        <form id="contract-form">
          <div class="modal-grid">
            <div><label>合同名称</label><input name="name" value="${item.name || ''}" required /></div>
            <div><label>合同类型</label><select name="type">${['销售','采购','服务','劳务','租赁'].map(x => `<option ${item.type === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
            <div><label>相对方名称</label><input name="partnerName" value="${item.partnerName || ''}" required /></div>
            <div><label>合同金额</label><input name="amount" type="number" value="${item.amount || ''}" required /></div>
            <div><label>税率</label><input name="taxRate" type="number" value="${item.taxRate || 6}" /></div>
            <div><label>状态</label><select name="status">${['草稿','待提交','审批中','已生效','已驳回','已作废','已完结'].map(x => `<option ${item.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
            <div><label>签订日期</label><input name="signDate" type="date" value="${item.signDate || ''}" /></div>
            <div><label>到期日期</label><input name="expireDate" type="date" value="${item.expireDate || ''}" /></div>
            <div><label>归属部门</label><input name="ownerDept" value="${item.ownerDept || state.user?.dept || ''}" /></div>
            <div><label>经办人</label><input name="ownerName" value="${item.ownerName || state.user?.name || ''}" /></div>
          </div>
          <div><label>合同概要</label><textarea name="summary">${item.summary || ''}</textarea></div>
          <div>
            <label>合同附件</label>
            <div class="upload-box">
              <input id="contract-files" type="file" multiple />
              <span class="muted">支持一次添加多个附件，演示版会保存到本地 JSON 数据，可直接下载回看。</span>
            </div>
            ${attachmentList(state.pendingFiles, true)}
          </div>
          <div class="form-actions"><button class="primary" type="submit">保存合同</button><button class="secondary" type="button" data-action="close-modal">取消</button></div>
        </form>
      </div>
    </div>
  `;
}

function renderApp() {
  const pageContent = {
    dashboard: dashboardView(),
    contracts: contractsView(),
    approvals: approvalsView(),
    partners: simpleTableView('合作方管理', state.partners, [
      { label: '名称', key: 'name' }, { label: '类型', key: 'type' }, { label: '统一信用代码', key: 'creditCode' },
      { label: '联系人', key: 'contact' }, { label: '电话', key: 'phone' }, { label: '风险级别', render: row => `<span class="tag ${statusTag(row.riskLevel)}">${row.riskLevel}</span>` }
    ]),
    templates: simpleTableView('合同模板', state.templates, [
      { label: '模板名称', key: 'name' }, { label: '分类', key: 'category' }, { label: '版本', key: 'version' },
      { label: '状态', render: row => `<span class="tag ${statusTag(row.status)}">${row.status}</span>` }, { label: '维护部门', key: 'owner' }
    ]),
    payments: simpleTableView('收付款计划', state.payments, [
      { label: '合同编号', key: 'contractCode' }, { label: '类型', key: 'type' }, { label: '期次', key: 'phase' },
      { label: '金额', render: row => formatMoney(row.amount) }, { label: '计划日期', key: 'planDate' }, { label: '状态', render: row => `<span class="tag ${statusTag(row.status)}">${row.status}</span>` }
    ]),
    reminders: simpleTableView('提醒预警', state.reminders, [
      { label: '提醒标题', key: 'title' }, { label: '提醒日期', key: 'remindDate' }, { label: '渠道', key: 'channel' }, { label: '状态', render: row => `<span class="tag ${statusTag(row.status)}">${row.status}</span>` }
    ]),
    archive: simpleTableView('归档借阅', state.archive, [
      { label: '合同编号', key: 'contractCode' }, { label: '存放位置', key: 'location' }, { label: '电子归档', key: 'electronicStatus' }, { label: '纸质归档', key: 'physicalStatus' }, { label: '借阅状态', key: 'borrowStatus' }
    ]),
    logs: simpleTableView('审计日志', state.logs, [
      { label: '类型', key: 'type' }, { label: '操作人', key: 'operator' }, { label: '对象', key: 'target' }, { label: '详情', key: 'detail' }, { label: '时间', key: 'createdAt' }
    ])
  }[state.page];

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <small>企业合同管理平台</small>
          <h2 style="margin:8px 0 0;">CMS Enterprise</h2>
        </div>
        <div class="nav-group">
          ${[
            ['dashboard', '驾驶舱'], ['contracts', '合同台账'], ['approvals', '审批中心'], ['partners', '合作方'],
            ['templates', '模板中心'], ['payments', '收付款'], ['reminders', '提醒预警'], ['archive', '归档借阅'], ['logs', '审计日志']
          ].map(([key, label]) => `<button class="nav-item ${state.page === key ? 'active' : ''}" data-nav="${key}">${label}</button>`).join('')}
        </div>
      </aside>
      <main class="main-pane">
        <div class="topbar">
          <div>
            <h1>${({ dashboard: '经营驾驶舱', contracts: '合同起草与管理', approvals: '合同审批流程', partners: '合作方档案', templates: '模板与法务管控', payments: '收付款与发票', reminders: '消息提醒与预警', archive: '归档与借阅', logs: '审计与操作留痕' })[state.page]}</h1>
            <p>落地版先聚焦合同核心闭环，结构已预留组织权限、电子签章、消息推送、MinIO 文件服务扩展位。</p>
          </div>
          <div class="user-card">
            <strong>${state.user.name}</strong>
            <div class="muted">${state.user.role} · ${state.user.dept}</div>
            <div class="muted">数据范围：${state.user.scope}</div>
            <div style="margin-top:10px;"><button class="ghost" data-action="logout">退出登录</button></div>
          </div>
        </div>
        ${pageContent}
      </main>
      ${contractModal()}
    </div>
  `;
}

function bindEvents() {
  document.querySelector('#login-form')?.addEventListener('submit', handleLogin);
  document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', async () => {
    state.page = btn.dataset.nav;
    render();
  }));
  document.querySelectorAll('[data-action="logout"]').forEach(btn => btn.addEventListener('click', logout));
  document.querySelectorAll('[data-action="open-create"]').forEach(btn => btn.addEventListener('click', () => openModal()));
  document.querySelectorAll('[data-action="close-modal"]').forEach(btn => btn.addEventListener('click', closeModal));
  document.querySelector('#contract-form')?.addEventListener('submit', submitContractForm);
  document.querySelector('#contract-files')?.addEventListener('change', handleFileSelect);
  document.querySelectorAll('[data-action="edit-contract"]').forEach(btn => btn.addEventListener('click', () => {
    const item = state.contracts.find(contract => contract.id === btn.dataset.id);
    openModal(item);
  }));
  document.querySelectorAll('[data-action="approve"]').forEach(btn => btn.addEventListener('click', () => handleApproval(btn.dataset.id, '通过')));
  document.querySelectorAll('[data-action="reject"]').forEach(btn => btn.addEventListener('click', () => handleApproval(btn.dataset.id, '驳回')));
  document.querySelectorAll('[data-action="filter-contracts"]').forEach(btn => btn.addEventListener('click', async () => {
    state.filters.keyword = document.querySelector('#keyword')?.value || '';
    state.filters.status = document.querySelector('#status-filter')?.value || '';
    await loadPageData();
    render();
  }));
  document.querySelectorAll('[data-action="remove-file"]').forEach(btn => btn.addEventListener('click', () => removePendingFile(btn.dataset.id)));
  document.querySelectorAll('[data-action="download-file"]').forEach(btn => btn.addEventListener('click', () => {
    const file = state.pendingFiles.find(item => item.id === btn.dataset.id);
    if (file) downloadAttachment(file);
  }));
}

async function render() {
  app.innerHTML = state.token && state.user ? renderApp() : loginView();
  bindEvents();
}

(async function bootstrap() {
  if (state.token && state.user) {
    try {
      await loadPageData();
    } catch (error) {
      logout();
    }
  }
  render();
})();

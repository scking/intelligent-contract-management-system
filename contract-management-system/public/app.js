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
  users: [],
  roles: [],
  meta: null,
  modalOpen: false,
  userModalOpen: false,
  roleModalOpen: false,
  passwordModalOpen: false,
  editingUser: null,
  detailOpen: false,
  editingContract: null,
  contractDetail: null,
  filters: { keyword: '', status: '' },
  pendingFiles: [],
  pendingPaymentPlan: [],
  pendingMilestones: [],
  importOpen: false,
  importMode: 'excel',
  importResult: null,
  saving: false,
  uploadProgress: 0,
  importProgress: 0,
  toast: null,
  loginPending: false,
  loginError: ''
};

function formatMoney(value) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function fileSize(size) {
  if (!size) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function statusTag(status) {
  if (['审批中', '预警', '待处理', '待收', '待付', '归档中', '异常'].includes(status)) return 'gold';
  if (['已驳回', '诉讼', '纠纷'].includes(status)) return 'red';
  if (['已生效', '已付', '已收', '通过', '已归档', '已完成'].includes(status)) return 'green';
  return 'teal';
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

async function fileToPayload(file, onProgress) {
  if (onProgress) onProgress(10);
  const content = await toDataUrl(file);
  if (onProgress) onProgress(100);
  return {
    name: file.name,
    size: file.size,
    content
  };
}

function setToast(message, type = 'success') {
  state.toast = { message, type };
  render();
  clearTimeout(setToast.timer);
  setToast.timer = setTimeout(() => {
    state.toast = null;
    render();
  }, 2600);
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
  Object.assign(state, {
    token: '',
    user: null,
    pendingFiles: [],
    pendingPaymentPlan: [],
    pendingMilestones: [],
    contractDetail: null,
    detailOpen: false,
    modalOpen: false
  });
  render();
}

async function loadPageData() {
  const [dashboard, contracts, approvals, partners, templates, payments, reminders, archive, logs, users, roles, meta] = await Promise.all([
    api('/api/dashboard'),
    api(`/api/contracts?keyword=${encodeURIComponent(state.filters.keyword)}&status=${encodeURIComponent(state.filters.status)}`),
    api('/api/approvals'),
    api('/api/partners'),
    api('/api/templates'),
    api('/api/payments'),
    api('/api/reminders'),
    api('/api/archive'),
    api('/api/logs'),
    api('/api/users'),
    api('/api/roles'),
    api('/api/meta')
  ]);
  Object.assign(state, { dashboard, contracts, approvals, partners, templates, payments, reminders, archive, logs, users, roles, meta });
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.loginPending = true;
  state.loginError = '';
  render();
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: form.get('username'), password: form.get('password') })
    });
    state.token = data.token;
    state.user = data.user;
    state.loginPending = false;
    localStorage.setItem('cms-token', data.token);
    localStorage.setItem('cms-user', JSON.stringify(data.user));
    await loadPageData();
    if (data.user.mustChangePassword) {
      state.passwordModalOpen = true;
    }
    render();
  } catch (error) {
    state.loginPending = false;
    state.loginError = error.message || '登录失败，请稍后重试';
    render();
  }
}

function openModal(contract = null) {
  state.modalOpen = true;
  state.editingContract = contract;
  state.pendingFiles = Array.isArray(contract?.files) ? [...contract.files] : [];
  state.pendingPaymentPlan = Array.isArray(contract?.paymentPlan) ? [...contract.paymentPlan] : [];
  state.pendingMilestones = Array.isArray(contract?.milestones) ? [...contract.milestones] : [];
  state.importResult = null;
  state.importProgress = 0;
  state.uploadProgress = 0;
  render();
}

function closeModal() {
  state.modalOpen = false;
  state.editingContract = null;
  state.pendingFiles = [];
  state.pendingPaymentPlan = [];
  state.pendingMilestones = [];
  state.importResult = null;
  state.uploadProgress = 0;
  state.importProgress = 0;
  state.saving = false;
  render();
}

function openImport(mode = 'excel') {
  state.importOpen = true;
  state.importMode = mode;
  state.importResult = null;
  render();
}

function closeImport() {
  state.importOpen = false;
  state.importResult = null;
  render();
}

async function openDetail(id) {
  state.contractDetail = await api(`/api/contracts/${id}`);
  state.detailOpen = true;
  render();
}

function closeDetail() {
  state.detailOpen = false;
  state.contractDetail = null;
  render();
}

async function submitContractForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  payload.files = state.pendingFiles;
  payload.paymentPlan = state.pendingPaymentPlan;
  payload.milestones = state.pendingMilestones;
  const method = state.editingContract ? 'PUT' : 'POST';
  const url = state.editingContract ? `/api/contracts/${state.editingContract.id}` : '/api/contracts';
  state.saving = true;
  state.uploadProgress = 100;
  render();
  try {
    const editing = Boolean(state.editingContract);
    await api(url, { method, body: JSON.stringify(payload) });
    await loadPageData();
    closeModal();
    setToast(editing ? '合同修改已保存' : '合同已创建并保存');
  } catch (error) {
    state.saving = false;
    setToast(error.message, 'error');
    render();
  }
}

async function handleApproval(id, status) {
  const comment = window.prompt(`请输入${status}意见`, status === '通过' ? '同意，进入下一节点。' : '请补充材料后重新提交。');
  if (comment === null) return;
  await api('/api/approvals/action', {
    method: 'POST',
    body: JSON.stringify({ id, status, comment })
  });
  await loadPageData();
  if (state.contractDetail?.id) {
    state.contractDetail = await api(`/api/contracts/${state.contractDetail.id}`);
    state.detailOpen = true;
  }
  render();
}

async function handleFileSelect(event) {
  const files = [...event.target.files || []];
  if (!files.length) return;
  state.uploadProgress = 0;
  render();
  const list = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const content = await toDataUrl(file);
    list.push({
      id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      type: '附件',
      uploadedAt: new Date().toISOString(),
      content
    });
    state.uploadProgress = Math.round(((index + 1) / files.length) * 100);
    render();
  }
  state.pendingFiles = [...state.pendingFiles, ...list];
  setToast(`已加入 ${files.length} 个附件`);
}

function removePendingFile(id) {
  state.pendingFiles = state.pendingFiles.filter((file) => file.id !== id);
  render();
}

function addPaymentPlan() {
  state.pendingPaymentPlan.push({
    id: `plan-${Date.now()}`,
    phase: `节点${state.pendingPaymentPlan.length + 1}`,
    percent: 0,
    amount: 0,
    planDate: '',
    type: '应收'
  });
  render();
}

function updatePaymentPlan(id, field, value) {
  state.pendingPaymentPlan = state.pendingPaymentPlan.map((item) => item.id === id ? { ...item, [field]: value } : item);
}

function removePaymentPlan(id) {
  state.pendingPaymentPlan = state.pendingPaymentPlan.filter((item) => item.id !== id);
  render();
}

function addMilestone() {
  state.pendingMilestones.push({
    id: `ms-${Date.now()}`,
    name: `里程碑${state.pendingMilestones.length + 1}`,
    owner: '',
    dueDate: '',
    status: '未开始'
  });
  render();
}

function updateMilestone(id, field, value) {
  state.pendingMilestones = state.pendingMilestones.map((item) => item.id === id ? { ...item, [field]: value } : item);
}

function removeMilestone(id) {
  state.pendingMilestones = state.pendingMilestones.filter((item) => item.id !== id);
  render();
}

function applyImportRecord(record) {
  if (!record) return;
  state.modalOpen = true;
  state.editingContract = null;
  state.pendingFiles = [];
  state.pendingPaymentPlan = Array.isArray(record.paymentPlan) ? record.paymentPlan : [];
  state.pendingMilestones = Array.isArray(record.milestones) ? record.milestones : [];
  state.importOpen = false;
  state.importResult = null;
  state.editingContract = {
    ...record,
    amount: record.amount || '',
    taxRate: record.taxRate || 6
  };
  render();
}

async function submitImport(event, directFile = null) {
  event.preventDefault();
  const input = document.querySelector('#import-file') || document.querySelector('#inline-import-file');
  const file = directFile || input?.files?.[0];
  if (!file) return;
  state.importProgress = 0;
  render();
  try {
    const payload = { file: await fileToPayload(file, (progress) => { state.importProgress = progress; render(); }) };
    const endpoint = state.importMode === 'excel'
      ? '/api/import/excel'
      : state.importMode === 'ocr'
        ? '/api/import/ocr'
        : '/api/import/contract-file';
    const result = await api(endpoint, { method: 'POST', body: JSON.stringify(payload) });
    state.importResult = result;
    state.importProgress = 100;
    setToast('解析完成，请确认回填结果');
    render();
  } catch (error) {
    state.importProgress = 0;
    setToast(error.message, 'error');
  }
}


function openUserModal(user = null) {
  state.userModalOpen = true;
  state.editingUser = user;
  render();
}

function closeUserModal() {
  state.userModalOpen = false;
  state.editingUser = null;
  render();
}

function openRoleModal() {
  state.roleModalOpen = true;
  render();
}

function closeRoleModal() {
  state.roleModalOpen = false;
  render();
}

function openPasswordModal() {
  state.passwordModalOpen = true;
  render();
}

function closePasswordModal() {
  state.passwordModalOpen = false;
  render();
}

async function submitUserForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const permissions = state.meta.modules.filter((item) => form.getAll('permissions').includes(item));
  const payload = {
    username: form.get('username'),
    name: form.get('name'),
    role: form.get('role'),
    dept: form.get('dept'),
    enabled: form.get('enabled') === 'on',
    permissions
  };
  if (state.editingUser) {
    await api(`/api/users/${state.editingUser.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    setToast('用户资料已更新');
  } else {
    const data = await api('/api/users', { method: 'POST', body: JSON.stringify(payload) });
    setToast(`用户已创建，默认密码：${data.defaultPassword}`);
  }
  await loadPageData();
  closeUserModal();
}

async function resetUserPassword(id) {
  const data = await api('/api/users/reset-password', { method: 'POST', body: JSON.stringify({ id }) });
  setToast(`密码已重置为 ${data.defaultPassword}`);
  await loadPageData();
}

async function submitRoleForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const permissions = state.meta.modules.filter((item) => form.getAll('permissions').includes(item));
  await api('/api/roles', {
    method: 'POST',
    body: JSON.stringify({ name: form.get('name'), scope: form.get('scope'), permissions })
  });
  await loadPageData();
  closeRoleModal();
  setToast('角色已创建');
}

async function submitPasswordForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const newPassword = form.get('newPassword');
  const confirmPassword = form.get('confirmPassword');
  if (newPassword !== confirmPassword) {
    setToast('两次输入的新密码不一致', 'error');
    return;
  }
  await api('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword: form.get('oldPassword'), newPassword })
  });
  state.user.mustChangePassword = false;
  localStorage.setItem('cms-user', JSON.stringify(state.user));
  closePasswordModal();
  setToast('密码修改成功');
}

function usersView() {
  return `
    <section class="panel fade-in">
      <div class="panel-head"><h3>用户管理</h3><div class="toolbar"><button class="secondary" data-action="open-role-modal">新建角色</button><button class="primary" data-action="open-user-modal">新建账号</button></div></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>账号</th><th>姓名</th><th>角色</th><th>部门</th><th>状态</th><th>首次改密</th><th>操作</th></tr></thead><tbody>
      ${state.users.map((user) => `<tr><td>${user.username}</td><td>${user.name}</td><td>${user.role}</td><td>${user.dept || '-'}</td><td><span class="tag ${user.enabled ? 'green' : 'red'}">${user.enabled ? '启用' : '禁用'}</span></td><td><span class="tag ${user.mustChangePassword ? 'gold' : 'green'}">${user.mustChangePassword ? '待修改' : '已完成'}</span></td><td><button class="secondary" data-action="edit-user" data-id="${user.id}">编辑</button> <button class="ghost" data-action="reset-user-password" data-id="${user.id}">重置密码</button></td></tr>`).join('')}
      </tbody></table></div>
    </section>`;
}

function rolesView() {
  return `
    <section class="panel fade-in">
      <div class="panel-head"><h3>权限角色</h3><div class="toolbar"><button class="primary" data-action="open-role-modal">新建角色</button></div></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>角色</th><th>数据范围</th><th>模块权限</th></tr></thead><tbody>
      ${state.roles.map((role) => `<tr><td>${role.name}</td><td>${role.scope}</td><td>${(role.permissions || []).join('、')}</td></tr>`).join('')}
      </tbody></table></div>
    </section>`;
}

function userModal() {
  if (!state.userModalOpen) return '';
  const user = state.editingUser || {};
  return `
  <div class="modal-mask"><div class="modal fade-in"><div class="panel-head"><h3>${state.editingUser ? '编辑账号' : '新建账号'}</h3><button class="ghost" data-action="close-user-modal">关闭</button></div>
  <form id="user-form" class="form-grid">
    <div class="modal-grid three-cols">
      <div><label>账号</label><input name="username" value="${user.username || ''}" ${state.editingUser ? 'disabled' : ''} required /></div>
      <div><label>姓名</label><input name="name" value="${user.name || ''}" required /></div>
      <div><label>部门</label><input name="dept" value="${user.dept || ''}" /></div>
      <div><label>角色</label><select name="role">${state.roles.map((role) => `<option ${user.role === role.name ? 'selected' : ''}>${role.name}</option>`).join('')}</select></div>
      <div><label>默认密码规则</label><input value="账号+@123456" disabled /></div>
      <div><label>账号启用</label><div class="checkbox-line"><input type="checkbox" name="enabled" ${user.enabled === false ? '' : 'checked'} /> 启用</div></div>
    </div>
    <div><label>模块权限</label><div class="permission-grid">${(state.meta?.modules || []).map((module) => `<label class="permission-item"><input type="checkbox" name="permissions" value="${module}" ${(user.permissions || []).includes(module) ? 'checked' : ''}/> ${module}</label>`).join('')}</div></div>
    <div class="form-actions"><button class="primary" type="submit">保存账号</button><button class="secondary" type="button" data-action="close-user-modal">取消</button></div>
  </form></div></div>`;
}

function roleModal() {
  if (!state.roleModalOpen) return '';
  return `
  <div class="modal-mask"><div class="modal fade-in"><div class="panel-head"><h3>新建角色</h3><button class="ghost" data-action="close-role-modal">关闭</button></div>
  <form id="role-form" class="form-grid">
    <div class="modal-grid">
      <div><label>角色名称</label><input name="name" required /></div>
      <div><label>数据范围</label><input name="scope" value="仅本人数据" required /></div>
    </div>
    <div><label>模块权限</label><div class="permission-grid">${(state.meta?.modules || []).map((module) => `<label class="permission-item"><input type="checkbox" name="permissions" value="${module}" /> ${module}</label>`).join('')}</div></div>
    <div class="form-actions"><button class="primary" type="submit">保存角色</button><button class="secondary" type="button" data-action="close-role-modal">取消</button></div>
  </form></div></div>`;
}

function passwordModal() {
  if (!state.passwordModalOpen) return '';
  return `
  <div class="modal-mask"><div class="modal fade-in" style="width:min(560px,100%)"><div class="panel-head"><h3>首次登录请修改密码</h3></div>
  <form id="password-form" class="form-grid">
    <div><label>原密码</label><input name="oldPassword" type="password" required /></div>
    <div><label>新密码</label><input name="newPassword" type="password" required /></div>
    <div><label>确认新密码</label><input name="confirmPassword" type="password" required /></div>
    <div class="footer-tip">为了账号安全，首次登录必须完成一次密码修改。默认密码规则为：账号+@123456。</div>
    <div class="form-actions"><button class="primary" type="submit">立即修改密码</button></div>
  </form></div></div>`;
}

function loginView() {
  const helperText = state.loginPending
    ? '登录中...'
    : (state.loginError || '请输入账号密码后登录。');
  const helperClass = state.loginError ? 'helper helper-error' : 'helper';
  return `
    <div class="login-shell fade-in">
      <div class="login-card aurora-card">
        <section class="hero-pane hero-pane-glow">
          <div class="hero-badge">Smart Tech Division · Contract OS</div>
          <h1>智能科技分公司<br/>合同管理系统</h1>
          <p>统一承载合同起草、审批流转、履约跟踪、收付款、归档与审计留痕，让业务、法务、财务在同一套在线系统内协同闭环。</p>
          <div class="hero-grid">
            <div class="metric-chip"><strong>全流程</strong><span>起草到归档统一协同</span></div>
            <div class="metric-chip"><strong>多角色</strong><span>业务、法务、财务联动</span></div>
            <div class="metric-chip"><strong>可追踪</strong><span>节点状态与审计留痕</span></div>
            <div class="metric-chip"><strong>已上线</strong><span>服务器正式运行中</span></div>
          </div>
        </section>
        <section class="login-form-pane login-form-pane-premium">
          <div class="login-panel-head">
            <span class="eyebrow">Secure Access</span>
            <h2>欢迎登录</h2>
            <p>请输入系统账号与密码，进入智能科技分公司合同管理系统。</p>
          </div>
          <form class="form-grid" id="login-form">
            <div><label>账号</label><input name="username" placeholder="请输入账号" required /></div>
            <div><label>密码</label><input name="password" type="password" placeholder="请输入密码" required /></div>
            <div class="form-actions"><button class="primary login-submit" type="submit" ${state.loginPending ? 'disabled' : ''}>${state.loginPending ? '登录中...' : '进入系统'}</button><span class="${helperClass}" id="login-error" role="status" aria-live="polite">${helperText}</span></div>
          </form>
        </section>
      </div>
    </div>`;
}

function dashboardView() {
  const stats = state.dashboard?.stats || { totalAmount: 0, approvalPending: 0, activeContracts: 0, expiringSoon: 0, receivable: 0, riskContracts: 0 };
  const byStatus = [
    { label: '审批中', value: stats.approvalPending },
    { label: '生效中', value: stats.activeContracts },
    { label: '风险合同', value: stats.riskContracts }
  ];
  const max = Math.max(...byStatus.map((item) => item.value), 1);
  return `
    <div class="page-grid fade-in">
      <div class="stat-grid six">
        <div class="stat-card"><span>合同总额</span><strong>${formatMoney(stats.totalAmount)}</strong><small class="muted">已纳入台账合同</small></div>
        <div class="stat-card"><span>审批中</span><strong>${stats.approvalPending}</strong><small class="muted">待推进流程</small></div>
        <div class="stat-card"><span>生效合同</span><strong>${stats.activeContracts}</strong><small class="muted">履约执行中</small></div>
        <div class="stat-card"><span>到期提醒</span><strong>${stats.expiringSoon}</strong><small class="muted">年内到期</small></div>
        <div class="stat-card"><span>待回款</span><strong>${formatMoney(stats.receivable)}</strong><small class="muted">应收未收</small></div>
        <div class="stat-card"><span>风险合同</span><strong>${stats.riskContracts}</strong><small class="muted">预警 / 纠纷 / 诉讼</small></div>
      </div>
      <div class="columns-2">
        <section class="panel">
          <div class="panel-head"><h3>最新合同</h3><div class="toolbar"><button class="secondary" data-action="open-create">新建合同</button></div></div>
          <div class="table-wrap"><table class="table"><thead><tr><th>编号</th><th>名称</th><th>项目</th><th>金额</th><th>状态</th></tr></thead><tbody>
          ${(state.dashboard?.latestContracts || []).map((item) => `
            <tr>
              <td>${item.code}</td>
              <td>${item.name}</td>
              <td>${item.projectName || '-'}</td>
              <td>${formatMoney(item.amount)}</td>
              <td><span class="tag ${statusTag(item.status)}">${item.status}</span></td>
            </tr>`).join('')}
          </tbody></table></div>
        </section>
        <section class="panel">
          <h3>审批与风险趋势</h3>
          <div class="mini-chart">
            ${byStatus.map((item) => `
              <div class="chart-row">
                <span>${item.label}</span>
                <div class="chart-bar"><i style="width:${(item.value / max) * 100}%"></i></div>
                <strong>${item.value}</strong>
              </div>`).join('')}
          </div>
          <div class="footer-tip" style="margin-top:16px;">第 1 步优化继续推进中：当前版已经把合同详情、编号规则、付款节点、履约里程碑、流程链路统一到一个模型里。</div>
        </section>
      </div>
      <div class="columns-2">
        <section class="panel">
          <h3>待办审批</h3>
          <div class="columns-3">${(state.dashboard?.todoApprovals || []).map((item) => `
            <div class="list-card">
              <strong>${item.nodeName}</strong>
              <div class="muted">处理人：${item.assignee}</div>
              <div class="muted">状态：${item.status}</div>
            </div>`).join('') || '<div class="muted">暂无待办审批。</div>'}</div>
        </section>
        <section class="panel">
          <h3>高风险合同</h3>
          ${(state.dashboard?.riskTop || []).map((item) => `
            <div class="list-card compact-card">
              <strong>${item.code} · ${item.name}</strong>
              <div class="muted">风险等级：${item.riskLevel} · ${item.approvalStage}</div>
            </div>`).join('') || '<div class="muted">暂无风险合同。</div>'}
        </section>
      </div>
    </div>`;
}

function contractsView() {
  return `
    <section class="panel fade-in">
      <div class="panel-head">
        <h3>合同台账</h3>
        <div class="toolbar">
          <input id="keyword" placeholder="搜索合同编号 / 名称 / 相对方 / 项目" value="${state.filters.keyword}" />
          <select id="status-filter">
            <option value="">全部状态</option>
            ${['草稿', '待提交', '审批中', '已生效', '已驳回', '已作废', '已完结'].map((item) => `<option ${state.filters.status === item ? 'selected' : ''}>${item}</option>`).join('')}
          </select>
          <button class="ghost" data-action="filter-contracts">筛选</button>
          <button class="secondary" data-action="open-import-excel">导入 Excel/CSV</button>
          <button class="primary" data-action="open-create">新建合同</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>编号</th><th>合同信息</th><th>项目/模板</th><th>金额</th><th>流程节点</th><th>附件</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            ${state.contracts.map((item) => `
              <tr>
                <td>${item.code}</td>
                <td>${item.name}<br/><span class="muted">${item.partnerName} · ${item.ownerDept}</span></td>
                <td>${item.projectName || '-'}<br/><span class="muted">${item.templateName || '-'}</span></td>
                <td>${formatMoney(item.amount)}</td>
                <td>${item.approvalStage}<br/><span class="muted">风险：${item.riskLevel}</span></td>
                <td>${item.files?.length || 0}</td>
                <td><span class="tag ${statusTag(item.status)}">${item.status}</span></td>
                <td>
                  <button class="secondary" data-action="view-contract" data-id="${item.id}">详情</button>
                  <button class="ghost" data-action="edit-contract" data-id="${item.id}">编辑</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function approvalsView() {
  return `
    <section class="panel fade-in">
      <div class="panel-head"><h3>审批中心</h3><span class="muted">已统一成“部门审批 → 法务审核 → 财务审核 → 领导终审 → 电子签章”的默认主线。</span></div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>合同</th><th>审批节点</th><th>处理人</th><th>状态</th><th>意见</th><th>处理时间</th><th>操作</th></tr></thead>
          <tbody>
            ${state.approvals.map((item) => `
              <tr>
                <td>${item.contract?.code || '-'}<br/><span class="muted">${item.contract?.name || ''}</span></td>
                <td>${item.nodeName}</td>
                <td>${item.assignee}</td>
                <td><span class="tag ${statusTag(item.status)}">${item.status}</span></td>
                <td>${item.comment || '-'}</td>
                <td>${item.handledAt || '-'}</td>
                <td>${item.status === '待处理' ? `<button class="primary" data-action="approve" data-id="${item.id}">通过</button> <button class="danger" data-action="reject" data-id="${item.id}">驳回</button>` : '-'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function simpleTableView(title, rows, columns) {
  return `
    <section class="panel fade-in">
      <div class="panel-head"><h3>${title}</h3></div>
      <div class="table-wrap"><table class="table"><thead><tr>${columns.map((col) => `<th>${col.label}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${columns.map((col) => `<td>${col.render ? col.render(row) : row[col.key] || '-'}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
    </section>`;
}

function attachmentList(files, editable, source = 'modal') {
  if (!files?.length) return '<div class="muted">暂未上传附件。</div>';
  return `<div class="file-list">${files.map((file) => `
    <div class="file-item">
      <div>
        <strong>${file.name}</strong>
        <div class="muted">${fileSize(file.size)} · ${file.type || '附件'}</div>
      </div>
      <div class="toolbar compact">
        ${file.content ? `<button type="button" class="ghost" data-action="download-file" data-source="${source}" data-id="${file.id}">下载</button>` : ''}
        ${editable ? `<button type="button" class="danger" data-action="remove-file" data-id="${file.id}">移除</button>` : ''}
      </div>
    </div>`).join('')}</div>`;
}

function paymentPlanEditor() {
  return `
    <div class="sub-panel">
      <div class="panel-head"><h4>付款节点</h4><button type="button" class="secondary" data-action="add-payment-plan">新增节点</button></div>
      ${(state.pendingPaymentPlan.length ? state.pendingPaymentPlan : []).map((plan) => `
        <div class="inline-grid">
          <input data-plan-id="${plan.id}" data-field="phase" value="${plan.phase || ''}" placeholder="节点名称" />
          <select data-plan-id="${plan.id}" data-field="type"><option ${plan.type === '应收' ? 'selected' : ''}>应收</option><option ${plan.type === '应付' ? 'selected' : ''}>应付</option></select>
          <input data-plan-id="${plan.id}" data-field="percent" type="number" value="${plan.percent || 0}" placeholder="比例" />
          <input data-plan-id="${plan.id}" data-field="amount" type="number" value="${plan.amount || 0}" placeholder="金额" />
          <input data-plan-id="${plan.id}" data-field="planDate" type="date" value="${plan.planDate || ''}" />
          <button type="button" class="danger" data-action="remove-plan" data-id="${plan.id}">删除</button>
        </div>`).join('') || '<div class="muted">还没有付款节点，点击“新增节点”开始配置。</div>'}
    </div>`;
}

function milestoneEditor() {
  return `
    <div class="sub-panel">
      <div class="panel-head"><h4>履约里程碑</h4><button type="button" class="secondary" data-action="add-milestone">新增里程碑</button></div>
      ${(state.pendingMilestones.length ? state.pendingMilestones : []).map((item) => `
        <div class="inline-grid milestone-grid">
          <input data-milestone-id="${item.id}" data-field="name" value="${item.name || ''}" placeholder="里程碑名称" />
          <input data-milestone-id="${item.id}" data-field="owner" value="${item.owner || ''}" placeholder="负责人" />
          <input data-milestone-id="${item.id}" data-field="dueDate" type="date" value="${item.dueDate || ''}" />
          <select data-milestone-id="${item.id}" data-field="status"><option ${item.status === '未开始' ? 'selected' : ''}>未开始</option><option ${item.status === '执行中' ? 'selected' : ''}>执行中</option><option ${item.status === '已完成' ? 'selected' : ''}>已完成</option><option ${item.status === '异常' ? 'selected' : ''}>异常</option></select>
          <button type="button" class="danger" data-action="remove-milestone" data-id="${item.id}">删除</button>
        </div>`).join('') || '<div class="muted">还没有履约里程碑。</div>'}
    </div>`;
}

function importToolsInsideModal() {
  const result = state.importResult;
  return `
    <div class="sub-panel">
      <div class="panel-head"><h4>智能导入</h4><div class="toolbar">
        <button type="button" class="secondary" data-action="open-inline-import" data-mode="contract">解析 Word/PDF/TXT</button>
        <button type="button" class="secondary" data-action="open-inline-import" data-mode="ocr">OCR 识别</button>
      </div></div>
      <div class="upload-box">
        <input id="inline-import-file" type="file" accept="${state.importMode === 'ocr' ? '.pdf,.png,.jpg,.jpeg,.webp' : '.docx,.pdf,.txt'}" />
        <span class="muted">${state.importMode === 'ocr' ? '支持 PDF/图片。文本型 PDF 可直接识别；图片 OCR 依赖本机 OCR 能力。' : '支持 Word/PDF/TXT，解析结果会直接回填到当前新建合同。'}</span>
        ${state.importProgress ? `<div class="progress-line"><i style="width:${state.importProgress}%"></i></div><div class="muted">解析进度 ${state.importProgress}%</div>` : ''}
      </div>
      <div class="form-actions">
        <button type="button" class="ghost" data-action="run-inline-import">开始解析</button>
      </div>
      ${result ? `<div class="sub-panel import-result-box"><div class="key-grid"><div><label>合同名称</label><p>${result.record?.name || '-'}</p></div><div><label>相对方</label><p>${result.record?.partnerName || '-'}</p></div><div><label>金额</label><p>${result.record?.amount || '-'}</p></div><div><label>付款节点</label><p>${result.record?.paymentPlan?.length || 0}</p></div></div><div class="form-actions"><button type="button" class="primary" data-action="apply-import-single">回填到当前合同</button></div></div>` : ''}
    </div>`;
}

function contractModal() {
  if (!state.modalOpen) return '';
  const item = state.editingContract || {};
  return `
    <div class="modal-mask">
      <div class="modal fade-in">
        <div class="panel-head"><h3>${state.editingContract ? '编辑合同' : '新建合同'}</h3><button class="ghost" data-action="close-modal">关闭</button></div>
        <form id="contract-form">
          <div class="modal-grid three-cols">
            <div><label>合同名称</label><input name="name" value="${item.name || ''}" required /></div>
            <div><label>合同类型</label><select name="type">${['销售', '采购', '服务', '劳务', '租赁'].map((x) => `<option ${item.type === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
            <div><label>合同状态</label><select name="status">${['草稿', '待提交', '审批中', '已生效', '已驳回', '已作废', '已完结'].map((x) => `<option ${item.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
            <div><label>相对方名称</label><input name="partnerName" value="${item.partnerName || ''}" required /></div>
            <div><label>项目名称</label><input name="projectName" value="${item.projectName || ''}" /></div>
            <div><label>模板名称</label><input name="templateName" value="${item.templateName || ''}" /></div>
            <div><label>合同金额</label><input name="amount" type="number" value="${item.amount || ''}" required /></div>
            <div><label>税率</label><input name="taxRate" type="number" value="${item.taxRate || 6}" /></div>
            <div><label>币种</label><select name="currency">${['CNY', 'USD', 'EUR'].map((x) => `<option ${item.currency === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
            <div><label>归属部门</label><input name="ownerDept" value="${item.ownerDept || state.user?.dept || ''}" /></div>
            <div><label>经办人</label><input name="ownerName" value="${item.ownerName || state.user?.name || ''}" /></div>
            <div><label>相对方角色</label><input name="counterpartyRole" value="${item.counterpartyRole || ''}" /></div>
            <div><label>签订日期</label><input name="signDate" type="date" value="${item.signDate || ''}" /></div>
            <div><label>生效日期</label><input name="effectiveDate" type="date" value="${item.effectiveDate || ''}" /></div>
            <div><label>到期日期</label><input name="expireDate" type="date" value="${item.expireDate || ''}" /></div>
            <div><label>风险等级</label><select name="riskLevel">${['正常', '预警', '纠纷', '诉讼'].map((x) => `<option ${item.riskLevel === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
            <div><label>履约状态</label><select name="performanceStatus">${['未开始', '执行中', '已完成', '异常'].map((x) => `<option ${item.performanceStatus === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
            <div><label>归档状态</label><select name="archiveStatus">${['未归档', '归档中', '已归档', '已借出'].map((x) => `<option ${item.archiveStatus === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
            <div><label>签署方式</label><select name="signingMethod">${['线下签署', '电子签章', '邮寄签署'].map((x) => `<option ${item.signingMethod === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
            <div><label>合同类别</label><input name="contractCategory" value="${item.contractCategory || ''}" /></div>
            <div><label>付款状态</label><input name="paymentStatus" value="${item.paymentStatus || ''}" /></div>
          </div>
          <div><label>合同概要</label><textarea name="summary">${item.summary || ''}</textarea></div>
          <div><label>备注</label><textarea name="remark">${item.remark || ''}</textarea></div>
          ${paymentPlanEditor()}
          ${milestoneEditor()}
          ${importToolsInsideModal()}
          <div>
            <label>合同附件</label>
            <div class="upload-box">
              <input id="contract-files" type="file" multiple />
              <span class="muted">支持一次添加多个附件。大文件会先显示本地读取进度，再保存到系统。</span>
              ${state.uploadProgress ? `<div class="progress-line"><i style="width:${state.uploadProgress}%"></i></div><div class="muted">附件读取进度 ${state.uploadProgress}%</div>` : ''}
            </div>
            ${attachmentList(state.pendingFiles, true, 'modal')}
          </div>
          <div class="form-actions"><button class="primary" type="submit">${state.saving ? '保存中...' : '保存合同'}</button><button class="secondary" type="button" data-action="close-modal">取消</button></div>
        </form>
      </div>
    </div>`;
}

function importModal() {
  if (!state.importOpen) return '';
  const isExcel = state.importMode === 'excel';
  const isOcr = state.importMode === 'ocr';
  const result = state.importResult;
  return `
    <div class="modal-mask">
      <div class="modal fade-in import-modal">
        <div class="panel-head"><h3>${isExcel ? '导入 Excel/CSV 台账' : isOcr ? 'OCR 识别 PDF/图片' : '解析 Word/PDF/TXT 合同'}</h3><button class="ghost" data-action="close-import">关闭</button></div>
        <form id="import-form" class="form-grid">
          <div class="upload-box">
            <input id="import-file" type="file" accept="${isExcel ? '.xlsx,.csv' : isOcr ? '.pdf,.png,.jpg,.jpeg,.webp' : '.docx,.pdf,.txt'}" />
            <span class="muted">${isExcel ? '支持 .xlsx / .csv，按表头自动映射字段与节点。' : isOcr ? '支持 PDF/图片。当前机器可直接解析文本型 PDF；图片 OCR 需要后续补本机 OCR 引擎。' : '支持 .docx / .pdf / .txt，自动抽取合同关键信息、付款节点和履约节点并回填。'}</span>
          </div>
          <div class="form-actions"><button class="primary" type="submit">开始解析</button></div>
        </form>
        ${result ? (isExcel ? `<div class="sub-panel"><h4>识别结果</h4><div class="table-wrap"><table class="table"><thead><tr><th>合同名称</th><th>相对方</th><th>金额</th><th>付款节点</th><th>履约节点</th><th>操作</th></tr></thead><tbody>${(result.records || []).map((row, index) => `<tr><td>${row.name || '-'}</td><td>${row.partnerName || '-'}</td><td>${row.amount || '-'}</td><td>${row.paymentPlan?.length || 0}</td><td>${row.milestones?.length || 0}</td><td><button class="secondary" data-action="apply-import-record" data-index="${index}">回填到表单</button></td></tr>`).join('')}</tbody></table></div></div>` : `<div class="sub-panel"><h4>识别结果</h4><div class="key-grid"><div><label>合同名称</label><p>${result.record?.name || '-'}</p></div><div><label>相对方</label><p>${result.record?.partnerName || '-'}</p></div><div><label>金额</label><p>${result.record?.amount || '-'}</p></div><div><label>签订日期</label><p>${result.record?.signDate || '-'}</p></div><div><label>付款节点</label><p>${result.record?.paymentPlan?.length || 0}</p></div><div><label>履约节点</label><p>${result.record?.milestones?.length || 0}</p></div></div><p class="detail-summary">${result.record?.summary || ''}</p><div class="form-actions"><button class="primary" data-action="apply-import-single" type="button">回填到新建合同</button></div></div>`) : ''}
      </div>
    </div>`;
}

function detailDrawer() {
  if (!state.detailOpen || !state.contractDetail) return '';
  const item = state.contractDetail;
  return `
    <div class="modal-mask side-mask">
      <div class="drawer fade-in">
        <div class="panel-head"><h3>${item.code} · ${item.name}</h3><button class="ghost" data-action="close-detail">关闭</button></div>
        <div class="detail-grid">
          <div class="detail-card"><span>合同状态</span><strong class="tag ${statusTag(item.status)}">${item.status}</strong></div>
          <div class="detail-card"><span>风险等级</span><strong class="tag ${statusTag(item.riskLevel)}">${item.riskLevel}</strong></div>
          <div class="detail-card"><span>审批节点</span><strong>${item.approvalStage}</strong></div>
          <div class="detail-card"><span>合同金额</span><strong>${formatMoney(item.amount)}</strong></div>
        </div>
        <div class="sub-panel"><h4>基础信息</h4><div class="key-grid">
          <div><label>相对方</label><p>${item.partnerName}</p></div>
          <div><label>项目名称</label><p>${item.projectName || '-'}</p></div>
          <div><label>模板</label><p>${item.templateName || '-'}</p></div>
          <div><label>签署方式</label><p>${item.signingMethod || '-'}</p></div>
          <div><label>签订日期</label><p>${item.signDate || '-'}</p></div>
          <div><label>到期日期</label><p>${item.expireDate || '-'}</p></div>
        </div><p class="detail-summary">${item.summary || '暂无概要。'}</p></div>
        <div class="sub-panel"><h4>审批链路</h4><div class="timeline">${(item.approvals || []).map((row, index) => `<div class="timeline-item"><em>${index + 1}</em><div><strong>${row.nodeName}</strong><div class="muted">${row.assignee} · ${row.status}${row.comment ? ` · ${row.comment}` : ''}</div></div></div>`).join('') || '<div class="muted">暂无审批记录。</div>'}</div></div>
        <div class="sub-panel"><h4>付款计划</h4><div class="table-wrap"><table class="table"><thead><tr><th>节点</th><th>类型</th><th>金额</th><th>计划日期</th></tr></thead><tbody>${(item.paymentPlan || []).map((row) => `<tr><td>${row.phase}</td><td>${row.type}</td><td>${formatMoney(row.amount)}</td><td>${row.planDate || '-'}</td></tr>`).join('') || '<tr><td colspan="4">暂无付款计划</td></tr>'}</tbody></table></div></div>
        <div class="sub-panel"><h4>履约里程碑</h4><div class="table-wrap"><table class="table"><thead><tr><th>里程碑</th><th>负责人</th><th>计划时间</th><th>状态</th></tr></thead><tbody>${(item.milestones || []).map((row) => `<tr><td>${row.name}</td><td>${row.owner || '-'}</td><td>${row.dueDate || '-'}</td><td><span class="tag ${statusTag(row.status)}">${row.status}</span></td></tr>`).join('') || '<tr><td colspan="4">暂无履约里程碑</td></tr>'}</tbody></table></div></div>
        <div class="sub-panel"><h4>合同附件</h4>${attachmentList(item.files || [], false, 'detail')}</div>
      </div>
    </div>`;
}

function renderApp() {
  const pageContent = {
    dashboard: dashboardView(),
    contracts: contractsView(),
    approvals: approvalsView(),
    partners: simpleTableView('合作方管理', state.partners, [
      { label: '名称', key: 'name' },
      { label: '类型', key: 'type' },
      { label: '统一信用代码', key: 'creditCode' },
      { label: '联系人', key: 'contact' },
      { label: '电话', key: 'phone' },
      { label: '风险级别', render: (row) => `<span class="tag ${statusTag(row.riskLevel)}">${row.riskLevel}</span>` }
    ]),
    templates: simpleTableView('合同模板', state.templates, [
      { label: '模板名称', key: 'name' },
      { label: '分类', key: 'category' },
      { label: '版本', key: 'version' },
      { label: '状态', render: (row) => `<span class="tag ${statusTag(row.status)}">${row.status}</span>` },
      { label: '维护部门', key: 'owner' }
    ]),
    payments: simpleTableView('收付款计划', state.payments, [
      { label: '合同编号', key: 'contractCode' },
      { label: '类型', key: 'type' },
      { label: '期次', key: 'phase' },
      { label: '金额', render: (row) => formatMoney(row.amount) },
      { label: '计划日期', key: 'planDate' },
      { label: '状态', render: (row) => `<span class="tag ${statusTag(row.status)}">${row.status}</span>` }
    ]),
    reminders: simpleTableView('提醒预警', state.reminders, [
      { label: '提醒标题', key: 'title' },
      { label: '提醒日期', key: 'remindDate' },
      { label: '渠道', key: 'channel' },
      { label: '状态', render: (row) => `<span class="tag ${statusTag(row.status)}">${row.status}</span>` }
    ]),
    archive: simpleTableView('归档借阅', state.archive, [
      { label: '合同编号', key: 'contractCode' },
      { label: '存放位置', key: 'location' },
      { label: '电子归档', key: 'electronicStatus' },
      { label: '纸质归档', key: 'physicalStatus' },
      { label: '借阅状态', key: 'borrowStatus' }
    ]),
    logs: simpleTableView('审计日志', state.logs, [
      { label: '类型', key: 'type' },
      { label: '操作人', key: 'operator' },
      { label: '对象', key: 'target' },
      { label: '详情', key: 'detail' },
      { label: '时间', key: 'createdAt' }
    ]),
    users: usersView(),
    roles: rolesView()
  }[state.page];

  const navItems = [['dashboard', '驾驶舱'], ['contracts', '合同台账'], ['approvals', '审批中心'], ['partners', '合作方'], ['templates', '模板中心'], ['payments', '收付款'], ['reminders', '提醒预警'], ['archive', '归档借阅'], ['logs', '审计日志'], ['users', '用户管理'], ['roles', '权限角色']]
    .filter(([key]) => (state.user?.permissions || []).includes(key) || state.user?.role === '超级管理员');

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><small>Smart Tech Division</small><h2 style="margin:8px 0 0;">智能科技分公司合同管理系统</h2></div>
        <div class="nav-group">
          ${navItems.map(([key, label]) => `<button class="nav-item ${state.page === key ? 'active' : ''}" data-nav="${key}">${label}</button>`).join('')}
        </div>
      </aside>
      <main class="main-pane">
        <div class="topbar">
          <div>
            <h1>${({ dashboard: '经营驾驶舱', contracts: '合同起草与管理', approvals: '合同审批流程', partners: '合作方档案', templates: '模板与法务管控', payments: '收付款与发票', reminders: '消息提醒与预警', archive: '归档与借阅', logs: '审计与操作留痕', users: '用户管理', roles: '角色权限管理' })[state.page]}</h1>
            <p>当前阶段先把业务闭环和数据结构统一，下一阶段再切换到 Vue3 + SpringBoot + MySQL 的正式生产技术栈。</p>
          </div>
          <div class="user-card">
            <strong>${state.user.name}</strong>
            <div class="muted">${state.user.role} · ${state.user.dept}</div>
            <div class="muted">数据范围：${state.user.scope}</div>
            <div style="margin-top:10px;" class="toolbar"><button class="ghost" data-action="open-password-modal">修改密码</button><button class="ghost" data-action="logout">退出登录</button></div>
          </div>
        </div>
        ${pageContent}
      </main>
      ${contractModal()}
      ${userModal()}
      ${roleModal()}
      ${passwordModal()}
      ${detailDrawer()}
      ${state.toast ? `<div class="toast toast-${state.toast.type}">${state.toast.message}</div>` : ''}
    </div>`;
}

function bindEvents() {
  document.querySelector('#login-form')?.addEventListener('submit', handleLogin);
  document.querySelectorAll('[data-nav]').forEach((btn) => btn.addEventListener('click', () => { state.page = btn.dataset.nav; render(); }));
  document.querySelectorAll('[data-action="logout"]').forEach((btn) => btn.addEventListener('click', logout));
  document.querySelectorAll('[data-action="open-user-modal"]').forEach((btn) => btn.addEventListener('click', () => openUserModal()));
  document.querySelectorAll('[data-action="edit-user"]').forEach((btn) => btn.addEventListener('click', () => openUserModal(state.users.find((item) => item.id === btn.dataset.id))));
  document.querySelectorAll('[data-action="reset-user-password"]').forEach((btn) => btn.addEventListener('click', () => resetUserPassword(btn.dataset.id)));
  document.querySelectorAll('[data-action="open-role-modal"]').forEach((btn) => btn.addEventListener('click', openRoleModal));
  document.querySelectorAll('[data-action="open-password-modal"]').forEach((btn) => btn.addEventListener('click', openPasswordModal));
  document.querySelectorAll('[data-action="close-user-modal"]').forEach((btn) => btn.addEventListener('click', closeUserModal));
  document.querySelectorAll('[data-action="close-role-modal"]').forEach((btn) => btn.addEventListener('click', closeRoleModal));
  document.querySelectorAll('[data-action="open-create"]').forEach((btn) => btn.addEventListener('click', () => openModal()));
  document.querySelectorAll('[data-action="open-import-excel"]').forEach((btn) => btn.addEventListener('click', () => openImport('excel')));
  document.querySelectorAll('[data-action="open-import-word"]').forEach((btn) => btn.addEventListener('click', () => { state.importMode = 'contract'; openModal(); }));
  document.querySelectorAll('[data-action="open-import-ocr"]').forEach((btn) => btn.addEventListener('click', () => { state.importMode = 'ocr'; openModal(); }));
  document.querySelectorAll('[data-action="close-modal"]').forEach((btn) => btn.addEventListener('click', closeModal));
  document.querySelectorAll('[data-action="close-detail"]').forEach((btn) => btn.addEventListener('click', closeDetail));
  document.querySelector('#contract-form')?.addEventListener('submit', submitContractForm);
  document.querySelector('#user-form')?.addEventListener('submit', submitUserForm);
  document.querySelector('#role-form')?.addEventListener('submit', submitRoleForm);
  document.querySelector('#password-form')?.addEventListener('submit', submitPasswordForm);
  document.querySelector('#contract-files')?.addEventListener('change', handleFileSelect);
  document.querySelectorAll('[data-action="edit-contract"]').forEach((btn) => btn.addEventListener('click', () => {
    const item = state.contracts.find((contract) => contract.id === btn.dataset.id);
    openModal(item);
  }));
  document.querySelectorAll('[data-action="view-contract"]').forEach((btn) => btn.addEventListener('click', () => openDetail(btn.dataset.id)));
  document.querySelectorAll('[data-action="approve"]').forEach((btn) => btn.addEventListener('click', () => handleApproval(btn.dataset.id, '通过')));
  document.querySelectorAll('[data-action="reject"]').forEach((btn) => btn.addEventListener('click', () => handleApproval(btn.dataset.id, '驳回')));
  document.querySelectorAll('[data-action="filter-contracts"]').forEach((btn) => btn.addEventListener('click', async () => {
    state.filters.keyword = document.querySelector('#keyword')?.value || '';
    state.filters.status = document.querySelector('#status-filter')?.value || '';
    await loadPageData();
    render();
  }));
  document.querySelectorAll('[data-action="remove-file"]').forEach((btn) => btn.addEventListener('click', () => removePendingFile(btn.dataset.id)));
  document.querySelectorAll('[data-action="download-file"]').forEach((btn) => btn.addEventListener('click', () => {
    const source = btn.dataset.source;
    const list = source === 'detail' ? (state.contractDetail?.files || []) : state.pendingFiles;
    const file = list.find((item) => item.id === btn.dataset.id);
    if (file) downloadAttachment(file);
  }));
  document.querySelectorAll('[data-action="add-payment-plan"]').forEach((btn) => btn.addEventListener('click', addPaymentPlan));
  document.querySelectorAll('[data-action="remove-plan"]').forEach((btn) => btn.addEventListener('click', () => removePaymentPlan(btn.dataset.id)));
  document.querySelectorAll('[data-action="add-milestone"]').forEach((btn) => btn.addEventListener('click', addMilestone));
  document.querySelectorAll('[data-action="remove-milestone"]').forEach((btn) => btn.addEventListener('click', () => removeMilestone(btn.dataset.id)));
  document.querySelectorAll('[data-action="apply-import-record"]').forEach((btn) => btn.addEventListener('click', () => applyImportRecord(state.importResult?.records?.[Number(btn.dataset.index)])));
  document.querySelectorAll('[data-action="apply-import-single"]').forEach((btn) => btn.addEventListener('click', () => applyImportRecord(state.importResult?.record)));
  document.querySelectorAll('[data-action="open-inline-import"]').forEach((btn) => btn.addEventListener('click', () => { state.importMode = btn.dataset.mode; state.importResult = null; state.importProgress = 0; render(); }));
  document.querySelectorAll('[data-action="run-inline-import"]').forEach((btn) => btn.addEventListener('click', async () => {
    const input = document.querySelector('#inline-import-file');
    const file = input?.files?.[0];
    if (!file) { setToast('请先选择要解析的文件', 'error'); return; }
    const fakeEvent = { preventDefault() {} };
    const tempForm = document.createElement('form');
    await submitImport(fakeEvent, file);
  }));
  document.querySelectorAll('[data-plan-id]').forEach((input) => input.addEventListener('input', (event) => updatePaymentPlan(event.target.dataset.planId, event.target.dataset.field, event.target.value)));
  document.querySelectorAll('[data-milestone-id]').forEach((input) => input.addEventListener('input', (event) => updateMilestone(event.target.dataset.milestoneId, event.target.dataset.field, event.target.value)));
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

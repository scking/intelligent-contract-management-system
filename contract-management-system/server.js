import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(dataDir, 'uploads');
const dbFile = path.join(dataDir, 'db.json');
const importScript = path.join(__dirname, 'scripts', 'parse_import.py');
const port = Number(process.env.PORT || 3060);

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

function now() {
  return new Date().toISOString();
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function buildCode(sequence, year = new Date().getFullYear()) {
  return `HT-${year}-${String(sequence).padStart(4, '0')}`;
}

function buildApprovalFlow(ownerName = '经办人') {
  return [
    { nodeName: '部门审批', assignee: '部门负责人', status: '待处理', comment: '' },
    { nodeName: '法务审核', assignee: '法务专员', status: '待处理', comment: '' },
    { nodeName: '财务审核', assignee: '财务经理', status: '待处理', comment: '' },
    { nodeName: '领导终审', assignee: '总经理', status: '待处理', comment: '' },
    { nodeName: '电子签章', assignee: ownerName, status: '待处理', comment: '' }
  ];
}

function buildContract(body, sessionUser, db, current = {}) {
  const sequence = db.contracts.length + 1;
  const approvalStage = body.status === '审批中' ? '部门审批' : body.approvalStage || current.approvalStage || '待提交';
  return {
    id: current.id || makeId('ct'),
    code: body.code || current.code || buildCode(sequence),
    name: body.name || current.name || '',
    type: body.type || current.type || '销售',
    amount: Number(body.amount ?? current.amount ?? 0),
    taxRate: Number(body.taxRate ?? current.taxRate ?? 6),
    currency: body.currency || current.currency || 'CNY',
    status: body.status || current.status || '草稿',
    partnerId: body.partnerId || current.partnerId || '',
    partnerName: body.partnerName || current.partnerName || '',
    ownerDept: body.ownerDept || current.ownerDept || sessionUser.dept,
    ownerName: body.ownerName || current.ownerName || sessionUser.name,
    signDate: body.signDate || current.signDate || '',
    effectiveDate: body.effectiveDate || current.effectiveDate || '',
    expireDate: body.expireDate || current.expireDate || '',
    templateName: body.templateName || current.templateName || '销售合同标准版',
    projectName: body.projectName || current.projectName || '',
    approvalStage,
    riskLevel: body.riskLevel || current.riskLevel || '正常',
    performanceStatus: body.performanceStatus || current.performanceStatus || '未开始',
    paymentStatus: body.paymentStatus || current.paymentStatus || '待维护',
    archiveStatus: body.archiveStatus || current.archiveStatus || '未归档',
    counterpartyRole: body.counterpartyRole || current.counterpartyRole || '乙方',
    signingMethod: body.signingMethod || current.signingMethod || '线下签署',
    contractCategory: body.contractCategory || current.contractCategory || '标准合同',
    summary: body.summary || current.summary || '',
    remark: body.remark || current.remark || '',
    files: Array.isArray(body.files) ? body.files : current.files || [],
    paymentPlan: Array.isArray(body.paymentPlan) ? body.paymentPlan : current.paymentPlan || [],
    milestones: Array.isArray(body.milestones) ? body.milestones : current.milestones || [],
    createdAt: current.createdAt || now(),
    updatedAt: now()
  };
}

const seed = {
  users: [
    {
      id: 'u-admin',
      username: 'admin',
      passwordHash: hashPassword('Admin@123456'),
      name: '系统管理员',
      role: '超级管理员',
      dept: '总经办',
      scope: '全部数据'
    },
    {
      id: 'u-legal',
      username: 'legal',
      passwordHash: hashPassword('Legal@123456'),
      name: '法务专员',
      role: '法务',
      dept: '法务部',
      scope: '全公司'
    },
    {
      id: 'u-finance',
      username: 'finance',
      passwordHash: hashPassword('Finance@123456'),
      name: '财务经理',
      role: '财务',
      dept: '财务部',
      scope: '金额相关'
    }
  ],
  partners: [
    {
      id: 'p-001',
      name: '杭州云象科技有限公司',
      type: '客户',
      creditCode: '91330100MA2CLOUD88',
      legalPerson: '王林',
      contact: '陈楠',
      phone: '13800001111',
      tags: ['重点客户', '年度框架'],
      address: '杭州市滨江区网商路 88 号',
      riskLevel: '低',
      createdAt: now()
    },
    {
      id: 'p-002',
      name: '上海启航供应链有限公司',
      type: '供应商',
      creditCode: '91310101SHIP9001',
      legalPerson: '赵敏',
      contact: '徐航',
      phone: '13900002222',
      tags: ['核心供应商'],
      address: '上海市浦东新区张江路 66 号',
      riskLevel: '中',
      createdAt: now()
    }
  ],
  templates: [
    {
      id: 'tpl-001',
      name: '销售合同标准版',
      category: '销售',
      version: 'V3.2',
      status: '启用',
      owner: '法务部',
      placeholders: ['甲方', '乙方', '合同金额', '签订日期', '履约期限'],
      updatedAt: now()
    },
    {
      id: 'tpl-002',
      name: '采购合同标准版',
      category: '采购',
      version: 'V2.1',
      status: '启用',
      owner: '法务部',
      placeholders: ['采购方', '供应商', '税率', '付款节点'],
      updatedAt: now()
    }
  ],
  contracts: [
    {
      id: 'ct-001',
      code: 'HT-2026-0001',
      name: '云平台年度服务合同',
      type: '销售',
      amount: 860000,
      taxRate: 6,
      currency: 'CNY',
      status: '审批中',
      partnerId: 'p-001',
      partnerName: '杭州云象科技有限公司',
      ownerDept: '销售中心',
      ownerName: '李川',
      signDate: '2026-03-20',
      effectiveDate: '2026-04-01',
      expireDate: '2027-03-31',
      templateName: '销售合同标准版',
      projectName: '云平台续费项目',
      approvalStage: '财务审核',
      riskLevel: '正常',
      performanceStatus: '未开始',
      paymentStatus: '待收款',
      archiveStatus: '未归档',
      counterpartyRole: '乙方',
      signingMethod: '电子签章',
      contractCategory: '标准合同',
      summary: '企业云平台 1 年 SaaS 服务及驻场支持。',
      remark: '重点客户，需关注续签节点。',
      paymentPlan: [
        { id: 'plan-001', phase: '首付款', percent: 40, amount: 344000, planDate: '2026-04-10', type: '应收' },
        { id: 'plan-002', phase: '尾款', percent: 60, amount: 516000, planDate: '2026-10-10', type: '应收' }
      ],
      milestones: [
        { id: 'ms-001', name: '项目启动', owner: '交付经理', dueDate: '2026-04-05', status: '未开始' },
        { id: 'ms-002', name: '验收完成', owner: '客户项目经理', dueDate: '2026-06-30', status: '未开始' }
      ],
      files: [
        { id: 'f-001', name: '合同正文.docx', type: '原件', uploadedAt: now() }
      ],
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: 'ct-002',
      code: 'HT-2026-0002',
      name: '仓储设备采购合同',
      type: '采购',
      amount: 320000,
      taxRate: 13,
      currency: 'CNY',
      status: '已生效',
      partnerId: 'p-002',
      partnerName: '上海启航供应链有限公司',
      ownerDept: '采购部',
      ownerName: '何静',
      signDate: '2026-02-15',
      effectiveDate: '2026-02-20',
      expireDate: '2026-09-30',
      templateName: '采购合同标准版',
      projectName: '仓储升级项目',
      approvalStage: '已完成',
      riskLevel: '预警',
      performanceStatus: '执行中',
      paymentStatus: '部分付款',
      archiveStatus: '已归档',
      counterpartyRole: '供应商',
      signingMethod: '线下签署',
      contractCategory: '采购合同',
      summary: '仓储自动分拣设备采购及安装调试服务。',
      remark: '设备到货后注意质保期和验收记录。',
      paymentPlan: [
        { id: 'plan-003', phase: '预付款', percent: 30, amount: 96000, planDate: '2026-02-25', type: '应付' },
        { id: 'plan-004', phase: '到货款', percent: 50, amount: 160000, planDate: '2026-04-05', type: '应付' },
        { id: 'plan-005', phase: '质保金', percent: 20, amount: 64000, planDate: '2026-10-30', type: '应付' }
      ],
      milestones: [
        { id: 'ms-003', name: '设备到货', owner: '仓储主管', dueDate: '2026-03-28', status: '已完成' },
        { id: 'ms-004', name: '安装验收', owner: '采购经理', dueDate: '2026-04-15', status: '执行中' }
      ],
      files: [
        { id: 'f-002', name: '签署版.pdf', type: '扫描件', uploadedAt: now() }
      ],
      createdAt: now(),
      updatedAt: now()
    }
  ],
  approvals: [
    {
      id: 'ap-001',
      contractId: 'ct-001',
      nodeName: '部门审批',
      assignee: '张总',
      status: '通过',
      comment: '合同金额合理，同意提交法务。',
      createdAt: now(),
      handledAt: now()
    },
    {
      id: 'ap-002',
      contractId: 'ct-001',
      nodeName: '法务审核',
      assignee: '法务专员',
      status: '通过',
      comment: '条款无重大风险，建议保留违约责任条款。',
      createdAt: now(),
      handledAt: now()
    },
    {
      id: 'ap-003',
      contractId: 'ct-001',
      nodeName: '财务审核',
      assignee: '财务经理',
      status: '待处理',
      comment: '',
      createdAt: now(),
      handledAt: ''
    },
    {
      id: 'ap-004',
      contractId: 'ct-001',
      nodeName: '领导终审',
      assignee: '总经理',
      status: '待处理',
      comment: '',
      createdAt: now(),
      handledAt: ''
    },
    {
      id: 'ap-005',
      contractId: 'ct-001',
      nodeName: '电子签章',
      assignee: '李川',
      status: '待处理',
      comment: '',
      createdAt: now(),
      handledAt: ''
    }
  ],
  payments: [
    {
      id: 'pay-001',
      contractId: 'ct-001',
      contractCode: 'HT-2026-0001',
      type: '应收',
      phase: '首付款',
      amount: 300000,
      planDate: '2026-04-10',
      actualDate: '',
      status: '待收',
      remark: '签约后 10 个工作日内收取。'
    },
    {
      id: 'pay-002',
      contractId: 'ct-002',
      contractCode: 'HT-2026-0002',
      type: '应付',
      phase: '设备到货款',
      amount: 160000,
      planDate: '2026-04-05',
      actualDate: '2026-03-28',
      status: '已付',
      remark: '设备到货验收后付款。'
    }
  ],
  reminders: [
    {
      id: 'rm-001',
      contractId: 'ct-001',
      title: '财务审核待办提醒',
      remindDate: '2026-03-30',
      channel: '站内信',
      status: '待发送'
    },
    {
      id: 'rm-002',
      contractId: 'ct-002',
      title: '合同到期前 30 天提醒',
      remindDate: '2026-08-31',
      channel: '邮件',
      status: '待发送'
    }
  ],
  archive: [
    {
      id: 'ar-001',
      contractId: 'ct-002',
      contractCode: 'HT-2026-0002',
      location: 'A区-3柜-2层',
      electronicStatus: '已归档',
      physicalStatus: '已入柜',
      borrowStatus: '在库',
      archivedBy: '法务专员',
      archivedAt: now()
    }
  ],
  logs: [
    {
      id: 'log-001',
      type: '登录',
      operator: 'admin',
      target: '系统',
      detail: '初始化系统管理员账号。',
      createdAt: now()
    }
  ],
  sessions: {}
};

function ensureDb() {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify(seed, null, 2), 'utf8');
  }
}

function migrateDb(db) {
  db.sessions ||= {};
  db.contracts = (db.contracts || []).map((contract, index) => ({
    currency: 'CNY',
    templateName: contract.type === '采购' ? '采购合同标准版' : '销售合同标准版',
    projectName: contract.projectName || '',
    counterpartyRole: contract.type === '采购' ? '供应商' : '乙方',
    signingMethod: contract.signingMethod || '线下签署',
    contractCategory: contract.contractCategory || '标准合同',
    remark: contract.remark || '',
    paymentPlan: contract.paymentPlan || [],
    milestones: contract.milestones || [],
    code: contract.code || buildCode(index + 1),
    ...contract
  }));
  return db;
}

function loadDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  return migrateDb(db);
}

function saveDb(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
}

function sendJson(res, code, msg, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  });
  res.end(JSON.stringify({ code, msg, data, timestamp: Date.now() }));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const typeMap = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png'
  };
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  res.writeHead(200, { 'Content-Type': typeMap[ext] || 'text/plain; charset=utf-8' });
  fs.createReadStream(filePath).pipe(res);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 8 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function getSession(req, db) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const session = db.sessions[token];
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.userId);
  if (!user) return null;
  return { token, user };
}

function addLog(db, type, operator, target, detail) {
  db.logs.unshift({
    id: `log-${Date.now()}`,
    type,
    operator,
    target,
    detail,
    createdAt: now()
  });
  db.logs = db.logs.slice(0, 500);
}

function contractStats(db) {
  const totalAmount = db.contracts.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const approvalPending = db.contracts.filter((item) => item.status === '审批中').length;
  const activeContracts = db.contracts.filter((item) => item.status === '已生效').length;
  const expiringSoon = db.contracts.filter((item) => item.expireDate && item.expireDate <= '2026-12-31').length;
  const receivable = db.payments
    .filter((item) => item.type === '应收' && item.status !== '已收')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const riskContracts = db.contracts.filter((item) => ['预警', '纠纷', '诉讼'].includes(item.riskLevel)).length;
  return { totalAmount, approvalPending, activeContracts, expiringSoon, receivable, riskContracts };
}

function ensureApprovalChain(db, contract) {
  const rows = db.approvals.filter((item) => item.contractId === contract.id);
  if (rows.length) return;
  for (const node of buildApprovalFlow(contract.ownerName)) {
    db.approvals.push({
      id: makeId('ap'),
      contractId: contract.id,
      nodeName: node.nodeName,
      assignee: node.assignee,
      status: node.nodeName === '部门审批' ? '待处理' : '待处理',
      comment: node.comment,
      createdAt: now(),
      handledAt: ''
    });
  }
}

function nextPendingApproval(db, contractId) {
  return db.approvals.find((item) => item.contractId === contractId && item.status === '待处理');
}

function saveBase64Upload(file) {
  const matches = String(file.content || '').match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid upload payload');
  const ext = path.extname(file.name || '') || '';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const target = path.join(uploadDir, filename);
  fs.writeFileSync(target, Buffer.from(matches[2], 'base64'));
  return target;
}

function runImport(mode, file) {
  const filePath = saveBase64Upload(file);
  const result = spawnSync('python3', [importScript, mode, filePath], { encoding: 'utf8' });
  const parsed = JSON.parse(result.stdout || '{}');
  if (result.status !== 0) {
    throw new Error(parsed.error || result.stderr || 'Import parser failed');
  }
  return parsed;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, 'ok', {});
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const db = loadDb();

  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const user = db.users.find(
        (item) => item.username === body.username && item.passwordHash === hashPassword(body.password || '')
      );
      if (!user) {
        return sendJson(res, 401, '用户名或密码错误', null, 401);
      }
      const token = crypto.randomBytes(16).toString('hex');
      db.sessions[token] = { userId: user.id, createdAt: now() };
      addLog(db, '登录', user.username, '系统', '用户登录系统');
      saveDb(db);
      return sendJson(res, 200, '登录成功', {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          dept: user.dept,
          scope: user.scope
        }
      });
    } catch (error) {
      return sendJson(res, 500, error.message, null, 500);
    }
  }

  const session = getSession(req, db);
  if (url.pathname.startsWith('/api/') && url.pathname !== '/api/auth/login' && !session) {
    return sendJson(res, 401, '未登录或会话已失效', null, 401);
  }

  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    return sendJson(res, 200, '成功', { user: session.user });
  }

  if (url.pathname === '/api/dashboard' && req.method === 'GET') {
    return sendJson(res, 200, '成功', {
      stats: contractStats(db),
      latestContracts: db.contracts.slice(0, 5),
      todoApprovals: db.approvals.filter((item) => item.status === '待处理').slice(0, 5),
      reminders: db.reminders.slice(0, 5),
      riskTop: db.contracts.filter((item) => item.riskLevel !== '正常').slice(0, 5)
    });
  }

  if (url.pathname === '/api/contracts' && req.method === 'GET') {
    const keyword = (url.searchParams.get('keyword') || '').trim();
    const status = url.searchParams.get('status') || '';
    let rows = [...db.contracts];
    if (keyword) {
      rows = rows.filter((item) => `${item.code}${item.name}${item.partnerName}${item.projectName}`.includes(keyword));
    }
    if (status) {
      rows = rows.filter((item) => item.status === status);
    }
    rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return sendJson(res, 200, '成功', rows);
  }

  if (url.pathname.startsWith('/api/contracts/') && req.method === 'GET') {
    const id = url.pathname.split('/').pop();
    const contract = db.contracts.find((item) => item.id === id);
    if (!contract) return sendJson(res, 404, '合同不存在', null, 404);
    return sendJson(res, 200, '成功', {
      ...contract,
      approvals: db.approvals.filter((item) => item.contractId === id),
      payments: db.payments.filter((item) => item.contractId === id),
      archive: db.archive.find((item) => item.contractId === id) || null,
      reminders: db.reminders.filter((item) => item.contractId === id)
    });
  }

  if (url.pathname === '/api/contracts' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const contract = buildContract(body, session.user, db);
      db.contracts.unshift(contract);
      if (contract.status === '审批中') {
        ensureApprovalChain(db, contract);
      }
      for (const plan of contract.paymentPlan) {
        db.payments.unshift({
          id: makeId('pay'),
          contractId: contract.id,
          contractCode: contract.code,
          type: plan.type || '应收',
          phase: plan.phase || '付款节点',
          amount: Number(plan.amount || 0),
          planDate: plan.planDate || '',
          actualDate: '',
          status: plan.type === '应付' ? '待付' : '待收',
          remark: '来自合同付款计划自动生成'
        });
      }
      if (contract.expireDate) {
        db.reminders.unshift({
          id: makeId('rm'),
          contractId: contract.id,
          title: `${contract.code} 到期提醒`,
          remindDate: contract.expireDate,
          channel: '站内信',
          status: '待发送'
        });
      }
      addLog(db, '新增合同', session.user.username, contract.code, `创建合同 ${contract.name}`);
      saveDb(db);
      return sendJson(res, 200, '创建成功', contract);
    } catch (error) {
      return sendJson(res, 500, error.message, null, 500);
    }
  }

  if (url.pathname.startsWith('/api/contracts/') && req.method === 'PUT') {
    try {
      const id = url.pathname.split('/').pop();
      const body = await parseBody(req);
      const index = db.contracts.findIndex((item) => item.id === id);
      if (index === -1) return sendJson(res, 404, '合同不存在', null, 404);
      const updated = buildContract(body, session.user, db, db.contracts[index]);
      db.contracts[index] = updated;
      if (updated.status === '审批中') {
        ensureApprovalChain(db, updated);
      }
      addLog(db, '更新合同', session.user.username, updated.code, `更新合同 ${updated.name}`);
      saveDb(db);
      return sendJson(res, 200, '更新成功', updated);
    } catch (error) {
      return sendJson(res, 500, error.message, null, 500);
    }
  }

  if (url.pathname === '/api/partners' && req.method === 'GET') {
    return sendJson(res, 200, '成功', db.partners);
  }

  if (url.pathname === '/api/templates' && req.method === 'GET') {
    return sendJson(res, 200, '成功', db.templates);
  }

  if (url.pathname === '/api/approvals' && req.method === 'GET') {
    const rows = db.approvals.map((item) => ({
      ...item,
      contract: db.contracts.find((contract) => contract.id === item.contractId) || null
    }));
    return sendJson(res, 200, '成功', rows);
  }

  if (url.pathname === '/api/approvals/action' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const approval = db.approvals.find((item) => item.id === body.id);
      if (!approval) return sendJson(res, 404, '审批记录不存在', null, 404);
      approval.status = body.status;
      approval.comment = body.comment || '';
      approval.handledAt = now();
      const contract = db.contracts.find((item) => item.id === approval.contractId);
      if (contract) {
        if (body.status === '通过') {
          const upcoming = nextPendingApproval(db, contract.id);
          if (upcoming && upcoming.id === approval.id) {
            upcoming.status = '通过';
          }
          const nextOne = nextPendingApproval(db, contract.id);
          contract.approvalStage = nextOne ? nextOne.nodeName : '已完成';
          contract.status = nextOne ? '审批中' : '已生效';
        } else if (body.status === '驳回') {
          contract.status = '已驳回';
          contract.approvalStage = approval.nodeName;
          contract.riskLevel = '预警';
        }
        contract.updatedAt = now();
      }
      addLog(db, '审批处理', session.user.username, contract?.code || approval.id, `审批${body.status}`);
      saveDb(db);
      return sendJson(res, 200, '处理成功', approval);
    } catch (error) {
      return sendJson(res, 500, error.message, null, 500);
    }
  }

  if (url.pathname === '/api/import/excel' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = runImport('excel', body.file || {});
      return sendJson(res, 200, '解析成功', result);
    } catch (error) {
      return sendJson(res, 500, error.message, null, 500);
    }
  }

  if (url.pathname === '/api/import/contract-file' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = runImport('contract', body.file || {});
      return sendJson(res, 200, '解析成功', result);
    } catch (error) {
      return sendJson(res, 500, error.message, null, 500);
    }
  }

  if (url.pathname === '/api/import/ocr' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = runImport('ocr', body.file || {});
      return sendJson(res, 200, '识别成功', result);
    } catch (error) {
      return sendJson(res, 500, error.message, null, 500);
    }
  }

  if (url.pathname === '/api/payments' && req.method === 'GET') {
    return sendJson(res, 200, '成功', db.payments);
  }

  if (url.pathname === '/api/reminders' && req.method === 'GET') {
    return sendJson(res, 200, '成功', db.reminders);
  }

  if (url.pathname === '/api/archive' && req.method === 'GET') {
    return sendJson(res, 200, '成功', db.archive);
  }

  if (url.pathname === '/api/logs' && req.method === 'GET') {
    return sendJson(res, 200, '成功', db.logs);
  }

  if (url.pathname === '/api/meta' && req.method === 'GET') {
    return sendJson(res, 200, '成功', {
      roles: ['超级管理员', '系统管理员', '业务经办人', '部门负责人', '法务', '财务', '管理层', '审批人'],
      contractStatus: ['草稿', '待提交', '审批中', '已生效', '已驳回', '已作废', '已完结'],
      contractTypes: ['销售', '采购', '服务', '劳务', '租赁'],
      riskLevels: ['正常', '预警', '纠纷', '诉讼'],
      archiveStatus: ['未归档', '归档中', '已归档', '已借出'],
      performanceStatus: ['未开始', '执行中', '已完成', '异常'],
      signingMethod: ['线下签署', '电子签章', '邮寄签署'],
      currency: ['CNY', 'USD', 'EUR']
    });
  }

  const staticPath = url.pathname === '/' ? path.join(publicDir, 'index.html') : path.join(publicDir, url.pathname);
  if (staticPath.startsWith(publicDir) && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    return sendFile(res, staticPath);
  }
  return sendFile(res, path.join(publicDir, 'index.html'));
});

server.listen(port, () => {
  console.log(`Contract Management System running at http://127.0.0.1:${port}`);
});

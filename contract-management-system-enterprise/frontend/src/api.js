const mockDelay = (data, ms = 120) => new Promise((resolve) => setTimeout(() => resolve(data), ms));

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

export async function fetchContracts() {
  return mockDelay(contracts.map(({ paymentPlans, milestones, approvals, summary, ...rest }) => rest));
}

export async function fetchContractDetail(code) {
  return mockDelay(contracts.find((item) => item.code === code) || contracts[0]);
}

export async function fetchImportPreview() {
  return mockDelay(importPreview);
}

export async function fetchImportCapabilities() {
  return mockDelay({
    excel: true,
    docx: true,
    pdf: true,
    ocrImage: false,
    note: '图片 OCR 需要在部署机安装 OCR 引擎或接入专门识别服务。'
  });
}

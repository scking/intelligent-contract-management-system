export function statusClass(status) {
  if (['审批中', '预警', '待处理'].includes(status)) return 'gold';
  if (['已生效', '已完成', '通过'].includes(status)) return 'green';
  return 'teal';
}

export function formatMoney(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

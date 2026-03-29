import { formatMoney, statusClass } from '../utils.js';

export default {
  props: {
    contracts: { type: Array, required: true },
    selectedCode: { type: String, default: '' }
  },
  emits: ['pick'],
  methods: { formatMoney, statusClass },
  template: `
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
          <tr v-for="item in contracts" :key="item.code" @click="$emit('pick', item.code)" :class="['row-clickable', { 'row-active': item.code === selectedCode }]">
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
  `
};

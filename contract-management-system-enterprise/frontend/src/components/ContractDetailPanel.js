import { formatMoney, statusClass } from '../utils.js';

export default {
  props: {
    contract: { type: Object, required: true }
  },
  methods: { formatMoney, statusClass },
  template: `
    <article class="panel side detail-panel">
      <small>Contract Detail</small>
      <h3>{{ contract.name }}</h3>
      <p>{{ contract.summary }}</p>
      <div class="detail-meta">
        <div><label>合同编号</label><strong>{{ contract.code }}</strong></div>
        <div><label>相对方</label><strong>{{ contract.partnerName }}</strong></div>
        <div><label>项目</label><strong>{{ contract.projectName }}</strong></div>
        <div><label>金额</label><strong>{{ formatMoney(contract.amount) }}</strong></div>
      </div>
      <div class="sub-block">
        <h4>审批链路</h4>
        <div class="timeline-item" v-for="node in contract.approvals" :key="node.nodeName">
          <em :class="['tag', statusClass(node.status)]">{{ node.status }}</em>
          <div>
            <strong>{{ node.nodeName }}</strong>
            <span>{{ node.assignee }} {{ node.comment ? '· ' + node.comment : '' }}</span>
          </div>
        </div>
      </div>
      <div class="sub-block">
        <h4>付款节点</h4>
        <div class="mini-row" v-for="plan in contract.paymentPlans" :key="plan.phase">
          <span>{{ plan.phase }} · {{ plan.type }}</span>
          <strong>{{ formatMoney(plan.amount) }}</strong>
        </div>
      </div>
      <div class="sub-block">
        <h4>履约节点</h4>
        <div class="mini-row" v-for="node in contract.milestones" :key="node.name">
          <span>{{ node.name }}</span>
          <strong>{{ node.dueDate }}</strong>
        </div>
      </div>
    </article>
  `
};

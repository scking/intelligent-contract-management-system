import { formatMoney } from '../utils.js';

export default {
  props: {
    items: { type: Array, required: true }
  },
  methods: { formatMoney },
  template: `
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
          <tr v-for="item in items" :key="item.name">
            <td>{{ item.name }}</td>
            <td>{{ item.partnerName }}</td>
            <td>{{ formatMoney(item.amount) }}</td>
            <td>{{ item.paymentPlanCount }}</td>
            <td>{{ item.milestoneCount }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  `
};

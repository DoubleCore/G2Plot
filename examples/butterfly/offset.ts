import { Chart } from '@antv/g2';

const data = [
  { category: 'A', value: 10, wing: 'left' },
  { category: 'A', value: 15, wing: 'right' },
  { category: 'B', value: 20, wing: 'left' },
  { category: 'B', value: 25, wing: 'right' },
  { category: 'C', value: 18, wing: 'left' },
  { category: 'C', value: 22, wing: 'right' },
  { category: 'D', value: 25, wing: 'left' },
  { category: 'D', value: 30, wing: 'right' },
  { category: 'E', value: 15, wing: 'left' },
  { category: 'E', value: 20, wing: 'right' },
];

const chart = new Chart({
  container: 'container',
  autoFit: true,
});

chart.options({
  type: 'interval',
  data,
  encode: {
    x: 'category',
    y: 'value',
    color: 'wing',
  },
  // 调整翅膀间偏移，防止相邻类别 bar 重叠
  style: {
    offset: 12,
  },
});

chart.render();
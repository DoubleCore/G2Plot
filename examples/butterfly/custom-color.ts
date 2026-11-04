import { Chart } from '@antv/g2';

const data = [
  { category: 'A', value: 10, wing: 'left' },
  { category: 'A', value: 15, wing: 'right' },
  { category: 'B', value: 20, wing: 'left' },
  { category: 'B', value: 25, wing: 'right' },
  { category: 'C', value: 18, wing: 'left' },
  { category: 'C', value: 22, wing: 'right' },
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
  // 自定义翅膀颜色：left 用 '#5B8FF9'（蓝色），right 用 '#5AD8A6'（绿色）
  scale: {
    color: {
      range: ['#5B8FF9', '#5AD8A6'],
    },
  },
});

chart.render();
import { Chart } from '@antv/g2';

/**
 * 预聚合瓦片密度图
 * 场景：后端已按固定网格聚合好计数（如 SQL GROUP BY），前端不再需要对原始点分箱
 * 要点：直接用 rect + encode.x/x1/y/y1 画出每格的四个边界，color 映射计数；
 *      不要再套 transform bin，否则会对已聚合的行二次分箱，count 全是 1；
 *      各区间宽度可以不等（按业务分档），瓦片大小随之变化
 */

// 后端聚合结果：距离分档 × 时长分档 的骑行次数
const distanceEdges = [0, 2, 4, 6, 9, 13];
const durationEdges = [0, 10, 20, 30, 45, 60];
const rideCounts = [
  [42, 18, 3, 0, 0],
  [26, 55, 21, 4, 0],
  [5, 32, 48, 12, 1],
  [1, 9, 26, 31, 6],
  [0, 2, 8, 19, 14],
];

const data = rideCounts
  .flatMap((row, distanceIndex) =>
    row.map((rides, durationIndex) => ({
      distanceFrom: distanceEdges[distanceIndex],
      distanceTo: distanceEdges[distanceIndex + 1],
      durationFrom: durationEdges[durationIndex],
      durationTo: durationEdges[durationIndex + 1],
      rides,
    })),
  )
  .filter((d) => d.rides > 0);

const chart = new Chart({
  container: 'container',
  autoFit: true,
});

chart.options({
  type: 'rect',
  data,
  encode: {
    x: 'distanceFrom',
    x1: 'distanceTo',
    y: 'durationFrom',
    y1: 'durationTo',
    color: 'rides',
  },
  scale: { color: { type: 'sequential', palette: 'YlOrRd' } },
  style: { inset: 1 },
  axis: {
    x: { title: '骑行距离（km）' },
    y: { title: '骑行时长（min）' },
  },
  legend: { color: { position: 'bottom', title: '骑行次数' } },
});

chart.render();

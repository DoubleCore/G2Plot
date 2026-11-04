import { Chart } from '@antv/g2';

/**
 * 瓦片密度图 + 品牌视觉定制
 * 场景：需要在同一套视觉规范里长期使用，要求分箱粒度固定、配色可控、读数口径清晰
 * 要点：thresholdsX / thresholdsY 固定分箱数量保证多张图可比；
 *      自定义色阶用 scale.color.range（数组），palette 只接受调色板名字符串；
 *      tooltip 用 channel: 'color' 读分箱后的计数，不要读原始行的字段
 */

// 固定种子生成骑行记录：通勤短途为主，周末长距离为次
const random = (() => {
  let seed = 20260202;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
})();

const data = Array.from({ length: 1200 }, () => {
  const isCommute = random() < 0.72;
  const distance = isCommute ? 0.8 + random() * 3.5 : 4 + random() * 9;
  const speed = isCommute ? 11 + random() * 5 : 9 + random() * 4; // km/h
  return {
    distance: Number(distance.toFixed(2)),
    duration: Number(((distance / speed) * 60 + random() * 3).toFixed(1)),
  };
});

const chart = new Chart({
  container: 'container',
  autoFit: true,
});

chart.options({
  type: 'rect',
  data,
  transform: [
    { type: 'bin', color: 'count', thresholdsX: 20, thresholdsY: 16 },
  ],
  encode: { x: 'distance', y: 'duration' },
  scale: {
    color: {
      // 不写 type：给出 range 数组时 G2 会按多段线性插值处理
      range: ['#e8f1ff', '#5b8ff9', '#1d39c4'],
    },
  },
  style: { inset: 1, radius: 2 },
  title: {
    title: '骑行距离 × 时长分布',
    subtitle: '格子颜色越深，该区间内的骑行次数越多',
    align: 'left',
  },
  axis: {
    x: { title: '骑行距离（km）' },
    y: { title: '骑行时长（min）' },
  },
  legend: {
    color: {
      position: 'bottom',
      title: '骑行次数',
      labelFormatter: (d: number) => `${d} 次`,
    },
  },
  tooltip: {
    items: [
      {
        channel: 'color',
        name: '骑行次数',
        valueFormatter: (v) => `${v} 次`,
      },
    ],
  },
});

chart.render();

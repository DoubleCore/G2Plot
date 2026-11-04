import { Chart } from '@antv/g2';

/**
 * 单色瓦片密度图
 * 场景：只有一个主色（品牌色）、不需要色阶图例，也方便叠在底图或卡片背景上
 * 要点：把计数映射到 opacity 而不是 color——transform 里写 opacity: 'count'；
 *      颜色用 style.fill 固定，legend: false 关掉色阶图例
 */

// 咖啡店顾客：早高峰以外带为主，下午多为久坐办公（固定种子，结果可复现）
const random = (() => {
  let seed = 20260303;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
})();

const data = Array.from({ length: 900 }, () => {
  const isMorning = random() < 0.55;
  const hour = isMorning ? 7.5 + random() * 3.5 : 12 + random() * 8;
  const stay = isMorning ? 5 + random() * 15 : 20 + random() * 60;
  return {
    hour: Number(hour.toFixed(1)),
    stay: Number(stay.toFixed(0)),
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
    { type: 'bin', opacity: 'count', thresholdsX: 20, thresholdsY: 16 },
  ],
  encode: { x: 'hour', y: 'stay' },
  scale: { opacity: { range: [0.06, 1] } },
  style: { fill: '#5B8FF9', inset: 0.5, radius: 1 },
  legend: false,
  axis: {
    x: { title: '到店时刻（时）' },
    y: { title: '停留时长（min）' },
  },
});

chart.render();

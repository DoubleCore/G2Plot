import { Chart } from '@antv/g2';

/**
 * 基础瓦片密度图
 * 场景：大量二维散点重叠严重时，把平面切成等宽网格，用颜色深浅表示每格样本数
 * 要点：type: 'rect' + transform: [{ type: 'bin', color: 'count' }]
 *      bin 会自动算出每格的 x/x1/y/y1 边界与 count，不需要手动聚合数据
 */

// 共享单车骑行记录：短途通勤为主，周末长距离骑行较少（固定种子，结果可复现）
const random = (() => {
  let seed = 20260101;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
})();

const data = Array.from({ length: 800 }, () => {
  const isCommute = random() < 0.75;
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
    { type: 'bin', color: 'count', thresholdsX: 24, thresholdsY: 18 },
  ],
  encode: { x: 'distance', y: 'duration' },
  scale: { color: { type: 'sequential', palette: 'Blues' } },
  style: { inset: 0.5 },
});

chart.render();

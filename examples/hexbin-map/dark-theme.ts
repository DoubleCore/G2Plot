import { Chart } from '@antv/g2';

/**
 * 暗色大屏：夜间骑行热点
 * 场景：大屏监控夜间订单分布，需要暗色背景 + 高对比度色阶
 * 要点：theme: 'classicDark' 一次性适配坐标轴/图例/标题文字；
 *       自定义色阶用 scale.color.range（数组），低值贴近背景色、高值用亮色；
 *       title 必须是对象，主标题写在 title.title
 */

interface RidePoint {
  lng: number;
  lat: number;
}

interface HexBin {
  lng: number;
  lat: number;
  orderCount: number;
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = seededRandom(20261104);
const hubs = [
  { lng: 116.46, lat: 39.91 }, // 国贸
  { lng: 116.31, lat: 39.98 }, // 中关村
  { lng: 116.47, lat: 40.0 }, // 望京
  { lng: 116.4, lat: 39.88 }, // 天坛
];

const orders: RidePoint[] = Array.from({ length: 2200 }, () => {
  const hub = hubs[Math.floor(random() * hubs.length)];
  return {
    lng: hub.lng + (random() + random() - 1) * 0.05,
    lat: hub.lat + (random() + random() - 1) * 0.04,
  };
});

function hexbin(points: RidePoint[], radius: number): HexBin[] {
  const dx = Math.sqrt(3) * radius;
  const dy = 1.5 * radius;
  const bins = new Map<string, HexBin>();

  for (const { lng, lat } of points) {
    const row = Math.round(lat / dy);
    const col = Math.round(lng / dx - (row & 1) / 2);
    const key = `${col},${row}`;
    const bin = bins.get(key);
    if (bin) {
      bin.orderCount += 1;
    } else {
      bins.set(key, {
        lng: (col + (row & 1) / 2) * dx,
        lat: row * dy,
        orderCount: 1,
      });
    }
  }

  return [...bins.values()];
}

const chart = new Chart({
  container: 'container',
  autoFit: true,
});

chart.options({
  type: 'point',
  data: hexbin(orders, 0.012),
  theme: 'classicDark',
  encode: { x: 'lng', y: 'lat', color: 'orderCount', shape: 'hexagon', size: 24 },
  scale: {
    // 低值贴近深色背景，高值用亮黄，保证暗色下的可读性
    color: { type: 'sequential', range: ['#1b3a5c', '#2f7fbf', '#7fd3ff', '#ffe38a'] },
  },
  style: { lineWidth: 1, stroke: '#0c1622' },
  axis: {
    x: {
      title: '经度',
      labelFill: '#9fb0c4',
      titleFill: '#c7d3e3',
      gridStroke: 'rgba(255,255,255,0.12)',
      gridLineDash: [4, 4],
    },
    y: {
      title: '纬度',
      labelFill: '#9fb0c4',
      titleFill: '#c7d3e3',
      gridStroke: 'rgba(255,255,255,0.12)',
      gridLineDash: [4, 4],
    },
  },
  legend: {
    color: { position: 'top', title: '订单数', itemLabelFill: '#c7d3e3', titleFill: '#c7d3e3' },
  },
  title: {
    title: '夜间骑行热点',
    subtitle: '颜色越亮，该蜂窝格内的夜间订单越集中',
    align: 'left',
  },
});

chart.render();

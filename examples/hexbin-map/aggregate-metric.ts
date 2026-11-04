import { Chart } from '@antv/g2';

/**
 * 六边形分箱 + 指标聚合
 * 场景：除了点数，还想知道每个热点区域的业务指标（如平均客单价、平均时长）
 * 要点：分箱时同时累加 amount 并除以订单数得到 avgAmount，再把 avgAmount 映射到颜色；
 *       orderCount 仍保留在数据里，通过 tooltip 展示，避免只看到颜色丢了样本量
 */

interface RideOrder {
  lng: number;
  lat: number;
  amount: number;
}

interface HexBin {
  lng: number;
  lat: number;
  orderCount: number;
  avgAmount: number;
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = seededRandom(3893);
const hubs = [
  { lng: 116.46, lat: 39.91 }, // 国贸
  { lng: 116.31, lat: 39.98 }, // 中关村
  { lng: 116.47, lat: 40.0 }, // 望京
];

const orders: RideOrder[] = Array.from({ length: 1800 }, () => {
  const hub = hubs[Math.floor(random() * hubs.length)];
  return {
    lng: hub.lng + (random() + random() - 1) * 0.05,
    lat: hub.lat + (random() + random() - 1) * 0.04,
    // 3 ~ 30 元，长距离订单更偏向高价
    amount: Math.round((3 + random() * 27) * 100) / 100,
  };
});

/** 六边形分箱，同时统计订单数与客单价均值 */
function hexbin(points: RideOrder[], radius: number): HexBin[] {
  const dx = Math.sqrt(3) * radius;
  const dy = 1.5 * radius;
  const bins = new Map<
    string,
    { lng: number; lat: number; orderCount: number; totalAmount: number }
  >();

  for (const { lng, lat, amount } of points) {
    const row = Math.round(lat / dy);
    const col = Math.round(lng / dx - (row & 1) / 2);
    const key = `${col},${row}`;
    const bin = bins.get(key);
    if (bin) {
      bin.orderCount += 1;
      bin.totalAmount += amount;
    } else {
      bins.set(key, {
        lng: (col + (row & 1) / 2) * dx,
        lat: row * dy,
        orderCount: 1,
        totalAmount: amount,
      });
    }
  }

  return [...bins.values()].map(({ lng, lat, orderCount, totalAmount }) => ({
    lng,
    lat,
    orderCount,
    avgAmount: Math.round((totalAmount / orderCount) * 10) / 10,
  }));
}

const chart = new Chart({
  container: 'container',
  autoFit: true,
});

chart.options({
  type: 'point',
  data: hexbin(orders, 0.012),
  encode: { x: 'lng', y: 'lat', color: 'avgAmount', shape: 'hexagon', size: 22 },
  scale: { color: { type: 'sequential', palette: 'Blues' } },
  style: { lineWidth: 1, stroke: '#ffffff' },
  axis: { x: { title: '经度' }, y: { title: '纬度' } },
  legend: { color: { position: 'right', title: '平均客单价（元）' } },
  tooltip: {
    title: '蜂窝格聚合指标',
    items: [
      { field: 'orderCount', name: '订单数' },
      { field: 'avgAmount', name: '平均客单价', valueFormatter: (v: number) => `${v} 元` },
    ],
  },
});

chart.render();

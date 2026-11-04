import { Chart } from '@antv/g2';

/**
 * 基础六边形分箱密度图（hexbin）
 * 场景：1500 条共享单车取车点，原始散点严重重叠，用蜂窝格子聚合出热点区域
 * 要点：G2 没有内置 hexbin，先在数据层按六边形网格分箱（每格统计订单数），
 *       再用 point + shape: 'hexagon' 绘制；颜色用 sequential 顺序色阶映射格子内订单数
 */

interface OrderPoint {
  lng: number;
  lat: number;
}

interface HexBin {
  lng: number;
  lat: number;
  orderCount: number;
}

// 固定种子的线性同余随机数，保证示例数据每次运行一致
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = seededRandom(20260401);
const hubs = [
  { lng: 116.46, lat: 39.91 }, // 国贸
  { lng: 116.31, lat: 39.98 }, // 中关村
  { lng: 116.47, lat: 40.0 }, // 望京
];

// 围绕 3 个商圈生成三角形分布的点：中心密、边缘疏
const orders: OrderPoint[] = Array.from({ length: 1500 }, () => {
  const hub = hubs[Math.floor(random() * hubs.length)];
  return {
    lng: hub.lng + (random() + random() - 1) * 0.05,
    lat: hub.lat + (random() + random() - 1) * 0.04,
  };
});

/**
 * 六边形分箱：radius 为六边形外接圆半径，单位与 lng/lat 相同
 * dx / dy 分别是相邻六边形中心的水平 / 垂直间距
 */
function hexbin(points: OrderPoint[], radius: number): HexBin[] {
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
  encode: { x: 'lng', y: 'lat', color: 'orderCount', shape: 'hexagon', size: 22 },
  scale: { color: { type: 'sequential', palette: 'YlOrRd' } },
  // 白色细描边把相邻格子分开
  style: { lineWidth: 1, stroke: '#ffffff' },
  axis: { x: { title: '经度' }, y: { title: '纬度' } },
  legend: { color: { position: 'right', title: '订单数' } },
  tooltip: {
    title: '取车热点',
    items: [
      { field: 'lng', name: '经度', valueFormatter: (v: number) => v.toFixed(2) },
      { field: 'lat', name: '纬度', valueFormatter: (v: number) => v.toFixed(2) },
      { field: 'orderCount', name: '订单数' },
    ],
  },
});

chart.render();

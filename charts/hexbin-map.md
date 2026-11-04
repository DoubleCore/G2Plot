# Hexbin Map 六边形分箱图

> 组件用途：把密集的二维点聚合到蜂窝状六边形网格，用颜色表达每格的点数量或聚合指标，适合看热点分布而非单点精确位置。

## 何时使用

- 二维点云密度：共享单车取车点、门店客流、GPS 采样点，原始散点重叠成一团
- 关注「热点区域」而非单点值：想知道哪片区域的订单最集中
- 点数量大（几百到几万），直接画散点已经看不出分布
- 经纬度或任意二维数值（页面坐标、传感器读数）都适用

## 何时不用

- 点数不多、需要看两个变量的相关性 → 用 scatter 散点图
- 两个类别维度交叉的规则矩阵 → 用 heatmap 热力图（`type: 'cell'`）
- 单点精确坐标很重要（如定位某家门店）→ 散点 + tooltip，不要分箱
- 时间趋势 → 用 line 折线图
- 有行政区边界的地理地图 → 用带 GeoJSON 的地图方案，分箱会掩盖边界

## 数据要求

- 长表，**每行一个原始点**（不是聚合后的格子），见 [数据模式](../references/data-patterns.md)
- `x` / `y` 字段：连续数值（number），如 `lng` / `lat`、`pageX` / `pageY`
- 聚合字段（可选）：数值，用于把格内的 `sum` / `mean` 映射成颜色
- 两个字段量纲尽量接近；经纬度在小范围内可直接分箱，跨大范围先投影（如 Web Mercator）或归一化，否则格子会被拉伸
- 分箱半径 `radius` 是**数据单位**，不是像素；一般让横向落在 15~25 个格子

## 基础实现（G2 v5）

G2 v5 没有内置的 hexbin mark，`transform: [{ type: 'bin' }]` 是矩形分箱。六边形分箱在数据层完成：

1. 按蜂窝网格把每个点吸附到最近的六边形中心，统计每格点数
2. 用 `point` + `encode.shape: 'hexagon'` 把每个格子画成六边形，`color` 映射点数

```ts
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
```

六边形 marker 画在像素空间：格子间距由 `radius`（数据单位）决定，格子大小由 `encode.size`（px，外接圆半径）决定，两者不会自动对齐。按画布宽度调 `size`（约为相邻六边形中心像素间距的 0.5~0.7 倍），留少量缝隙比大面积重叠更耐看。

## 常见变体

| 变体 | 关键改动 | 完整案例 |
|---|---|---|
| 聚合指标着色 | 分箱时累计 `amount`，`color` 映射 `avgAmount`，`orderCount` 放进 tooltip | [aggregate-metric.ts](../examples/hexbin-map/aggregate-metric.ts) |
| 暗色大屏 | `theme: 'classicDark'` + `scale.color.range` 自定义色阶 + 坐标轴/图例文字色 | [dark-theme.ts](../examples/hexbin-map/dark-theme.ts) |
| 颜色 + 大小双通道 | `encode` 同时映射 `color` 与 `size` | 见下方片段 |

双通道核心差异（`size` 用 `sqrt` 比例尺，避免大值视觉过重）：

```ts-snippet
chart.options({
  type: 'point',
  data: bins, // hexbin 聚合结果，每行一个格子
  encode: { x: 'lng', y: 'lat', color: 'orderCount', size: 'orderCount', shape: 'hexagon' },
  scale: {
    color: { type: 'sequential', palette: 'YlOrRd' },
    size: { type: 'sqrt', range: [6, 26] },
  },
});
```

## 样式自定义

| 定制项 | 写法 | 说明 |
|---|---|---|
| 六边形大小 | `encode: { size: 22 }` | px，外接圆半径；与分箱半径、画布宽度一起调 |
| 格子描边 | `style: { lineWidth: 1, stroke: '#ffffff' }` | 分隔相邻格子；暗色背景换成深色 |
| 填充透明度 | `style: { fillOpacity: 0.9 }` | 降低透明度可缓解重叠 |
| 顺序色阶 | `scale: { color: { type: 'sequential', palette: 'YlOrRd' } }` | 常用 `'YlOrRd'` / `'Blues'` / `'Viridis'` |
| 自定义颜色 | `scale: { color: { type: 'sequential', range: ['#e8f4ff', '#0050b3'] } }` | `palette` 只接受名字字符串，数组必须用 `range` |
| 空心格子 | `encode: { shape: 'hollowHexagon' }` | 颜色作用于描边，适合叠加在其他图层上 |
| 图例 | `legend: { color: { position: 'right', title: '订单数' } }` | 连续色阶图例建议带标题说明单位 |
| 坐标轴 | `axis: { x: { title: '经度' } }` | 网格线用 `gridStroke` / `gridLineDash` |
| 内置主题 | `theme: 'classicDark'` | 一行适配暗色大屏 |

tooltip 建议同时给出格内点数和坐标，避免只看到颜色丢掉样本量：

```ts-snippet
tooltip: {
  title: '蜂窝格聚合指标',
  items: [
    { field: 'orderCount', name: '订单数' },
    { field: 'avgAmount', name: '平均客单价', valueFormatter: (v) => `${v} 元` },
  ],
},
```

## 易错点（v4 → v5）

| ❌ 错误（幻觉高发） | ✅ 正确 |
|---|---|
| `type: 'hexbin'`（G2 v5 无此 mark，白屏/报错） | `type: 'point'` + `encode: { shape: 'hexagon' }`，分箱在数据层完成 |
| 把原始散点直接交给 chart，指望自动分箱 | 先聚合成「每行一个六边形」，再渲染 |
| 用 `transform: [{ type: 'bin' }]` 当六边形分箱 | `bin` 输出矩形区间 `x/x1`、`y/y1`，是二维直方图；六边形需自己分箱 |
| `encode: { size: '22' }`（字符串被当字段名） | `encode: { size: 22 }`（数字才是常量） |
| `scale: { color: { palette: ['#fff', '#f00'] } }` | 数组用 `range`，`palette` 只接受调色板名字符串 |
| 数值密度用分类色阶 | 用 `scale: { color: { type: 'sequential' } }` |
| 分箱半径按像素估算 | `radius` 与 x/y 同单位（经纬度就是度） |
| 经纬度跨大范围直接分箱 | 先投影或归一化，否则格子被拉伸 |
| `.position('lng*lat')`（v4 链式） | `.encode('x', 'lng').encode('y', 'lat')` 或 `chart.options({ encode })` |
| `new Hexbin('container', { xField, yField })`（G2Plot v2） | `new Chart({ container })` + `chart.options(spec)` |

更多对照见 [v4-to-v5-migration.md](../references/v4-to-v5-migration.md)。

## 完整案例

每个案例的元信息（场景与关键配置），代码均通过 `npm run validate` 校验：

| 案例 | 场景 | 关键配置 |
|---|---|---|
| [basic.ts](../examples/hexbin-map/basic.ts) | 共享单车取车点热点，最简起步 | 数据层六边形分箱 + `shape: 'hexagon'` + `palette: 'YlOrRd'` |
| [aggregate-metric.ts](../examples/hexbin-map/aggregate-metric.ts) | 蜂窝格内的平均客单价（指标聚合） | 分箱时累计 `amount`，`color: 'avgAmount'`，tooltip 带 `orderCount` |
| [dark-theme.ts](../examples/hexbin-map/dark-theme.ts) | 暗色大屏夜间骑行热点 | `theme: 'classicDark'`、`scale.color.range`、`axis.labelFill`、`legend.position: 'top'` |

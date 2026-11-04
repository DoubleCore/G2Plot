# Flow Map 流向地图

> 组件用途：在地理底图上展示起点到终点的流向、路径与流量，适用于物流、迁徙和 OD（Origin-Destination）分析。

## 何时使用

- 展示人员、货物或资金在地理位置之间的流动
- 强调流动的起点、终点与方向，而不只是各地区的数值大小
- 需要同时比较线路方向、流量大小或线路类别
- 已有起终点经纬度，或可关联到节点经纬度的 OD 数据

## 何时不用

- 只展示各行政区域的数值高低 → 用 choropleth 分级设色地图
- 只展示离散地点的位置或密度 → 用 point 散点地图或 heatmap 热力图
- 只表达阶段间的数量流转、不涉及地理位置 → 用 sankey 桑基图
- 只有起点或终点一侧的位置，无法构成空间连线

## 数据要求

- 流向数据每行一条线路，包含 `sourceLng`、`sourceLat`、`targetLng`、`targetLat` 四个数值字段
- `source` / `target`：可选的起点、终点名称，用于 tooltip 或标签
- `volume`：可选的数值字段，通过 `style.lineWidth` 回调映射线宽
- `routeType`：可选的类别字段，通过 `encode.color` 区分线路类型
- 底图使用自包含的 GeoJSON `Feature` 或 `FeatureCollection`；经纬度与底图需采用一致的坐标系
- 如果原始数据只有节点 ID，先关联节点经纬度，生成上述四个坐标字段；不要远程请求未提供的地图数据

## 基础实现（G2 v5）

```ts
/**
 * 基础流向地图
 * 场景：在区域底图上展示仓库之间有方向的物流线路
 * 要点：geoView 组合 geoPath 底图与 link 连线；x/y 分别绑定起终点经纬度字段数组
 */
import { Chart } from '@antv/g2';

// 简化的园区 GeoJSON 底图，实际使用时可替换为真实行政区或地图数据
const regions = [
  {
    type: 'Feature',
    properties: { name: '西北区' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 20], [20, 20], [20, 40], [0, 40], [0, 20]]],
    },
  },
  {
    type: 'Feature',
    properties: { name: '东北区' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[20, 20], [40, 20], [40, 40], [20, 40], [20, 20]]],
    },
  },
  {
    type: 'Feature',
    properties: { name: '西南区' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]]],
    },
  },
  {
    type: 'Feature',
    properties: { name: '东南区' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[20, 0], [40, 0], [40, 20], [20, 20], [20, 0]]],
    },
  },
];

const flows = [
  { source: '滨江仓', target: '云谷仓', sourceLng: 8, sourceLat: 30, targetLng: 32, targetLat: 30, volume: 120 },
  { source: '滨江仓', target: '山城仓', sourceLng: 8, sourceLat: 30, targetLng: 8, targetLat: 10, volume: 80 },
  { source: '山城仓', target: '海港仓', sourceLng: 8, sourceLat: 10, targetLng: 32, targetLat: 10, volume: 150 },
  { source: '云谷仓', target: '海港仓', sourceLng: 32, sourceLat: 30, targetLng: 32, targetLat: 10, volume: 60 },
  { source: '海港仓', target: '滨江仓', sourceLng: 32, sourceLat: 10, targetLng: 8, targetLat: 30, volume: 100 },
];

const chart = new Chart({
  container: 'container',
  autoFit: true,
});

chart.options({
  type: 'geoView',
  coordinate: { type: 'mercator' },
  children: [
    {
      type: 'geoPath',
      data: regions,
      style: { fill: '#F5F7FA', stroke: '#CBD5E1', lineWidth: 1 },
      tooltip: false,
    },
    {
      type: 'link',
      data: flows,
      encode: {
        x: ['sourceLng', 'targetLng'],
        y: ['sourceLat', 'targetLat'],
      },
      style: {
        stroke: '#5B8FF9',
        lineWidth: 2,
        strokeOpacity: 0.75,
        arrow: true,
        arrowSize: 8,
      },
      tooltip: {
        title: (d) => `${d.source} → ${d.target}`,
        items: [{ field: 'volume', name: '运输量', valueFormatter: (v) => `${v} 吨` }],
      },
    },
  ],
});

chart.render();
```

## 常见变体

| 变体 | 关键改动 | 完整案例 |
|---|---|---|
| 流量映射线宽 | `style.lineWidth` 使用 `(d) => ...` 回调 | [weighted.ts](../examples/flow-map/weighted.ts) |
| 线路类型分色 | `encode` 增加 `color: 'routeType'` | [weighted.ts](../examples/flow-map/weighted.ts) |
| 节点与名称标签 | children 叠加 `point`，配置 `labels` | [weighted.ts](../examples/flow-map/weighted.ts) |
| 有向线路 | `style` 设置 `arrow: true` 与 `arrowSize` | [basic.ts](../examples/flow-map/basic.ts) |

流量加权与分色核心差异：

```ts-snippet
{
  type: 'link',
  data: flows,
  encode: {
    x: ['sourceLng', 'targetLng'],
    y: ['sourceLat', 'targetLat'],
    color: 'routeType',
  },
  scale: { color: { range: ['#5B8FF9', '#F6BD16'] } },
  style: {
    lineWidth: (d: { volume: number }) => 1 + (d.volume / 150) * 4,
    arrow: true,
    arrowSize: 8,
  },
}
```

叠加仓库节点与标签：

```ts-snippet
{
  type: 'point',
  data: hubs,
  encode: { x: 'longitude', y: 'latitude', shape: 'point', size: 6 },
  style: { fill: '#FFFFFF', stroke: '#334155', lineWidth: 2 },
  labels: [
    {
      text: 'name',
      position: 'top',
      style: { fill: '#1E293B', fontSize: 11 },
    },
  ],
}
```

## 样式自定义

| 定制项 | 写法 | 说明 |
|---|---|---|
| 地图投影 | `coordinate: { type: 'mercator' }` | 配置在 `geoView` 上 |
| 底图填充与边界 | `geoPath.style: { fill: '#F5F7FA', stroke: '#CBD5E1' }` | 底图通常关闭 tooltip |
| 固定线路颜色 | `style: { stroke: '#5B8FF9' }` | 单一线路类别时使用 |
| 流量映射线宽 | `style: { lineWidth: (d) => 1 + d.volume / 50 }` | 按业务量级缩放，避免极粗或极细 |
| 方向箭头 | `style: { arrow: true, arrowSize: 8 }` | 箭头指向终点 |
| 线路透明度 | `style: { strokeOpacity: 0.75 }` | 线路密集时降低遮挡 |
| 线路分类色板 | `scale: { color: { range: ['#5B8FF9', '#F6BD16'] } }` | 配合 `encode.color` 使用 |
| 图例位置 | `legend: { color: { position: 'top' } }` | `'top'` / `'bottom'` / `'left'` / `'right'` |
| 节点标签 | `labels: [{ text: 'name', position: 'top' }]` | 配置在叠加的 `point` 上 |

线路 tooltip 同时展示起终点与流量：

```ts-snippet
tooltip: {
  title: (d) => `${d.source} → ${d.target}`,
  items: [{ field: 'volume', name: '运输量', valueFormatter: (v) => `${v} 吨` }],
},
```

## 易错点（v4 → v5）

| ❌ 错误（幻觉高发） | ✅ 正确 |
|---|---|
| `type: 'flowMap'` | 使用 `type: 'geoView'`，children 组合 `geoPath` 与 `link` |
| `import { FlowMap } from '@antv/g2plot'` | `import { Chart } from '@antv/g2'` |
| `new FlowMap('container', { sourceField, targetField })` | `new Chart({ container })` + `chart.options(spec)` |
| `chart.source(flows)`（v4） | 在各 mark 上配置 `data: flows` |
| `encode: { x: 'sourceLng', y: 'sourceLat' }` | `x: ['sourceLng', 'targetLng']`，`y: ['sourceLat', 'targetLat']` |
| `style: { width: (d) => d.volume }` | 使用 `style.lineWidth` 回调映射流量 |
| `encode: { size: 'volume' }`（用于 link 线宽） | 使用 `style.lineWidth` 回调映射流量 |
| `projection: { type: 'mercator' }` | 在 `geoView` 上配置 `coordinate: { type: 'mercator' }` |
| 只提供起终点名称，没有经纬度 | 先关联节点坐标，生成四个数值坐标字段 |
| 使用远程 GeoJSON 作为唯一数据来源 | 示例内联 GeoJSON；业务代码明确数据来源并保持坐标系一致 |

更多通用对照见 [v4-to-v5-migration.md](../references/v4-to-v5-migration.md)。

## 完整案例

每个案例的元信息（场景与关键配置），代码均通过 `npm run validate` 校验：

| 案例 | 场景 | 关键配置 |
|---|---|---|
| [basic.ts](../examples/flow-map/basic.ts) | 在区域底图上展示有方向的物流线路 | `geoView` + `geoPath`/`link`、`encode.x/y` 字段数组、`arrow` |
| [weighted.ts](../examples/flow-map/weighted.ts) | 比较线路流量、区分运输类型并标出仓库 | `style.lineWidth` 回调、`encode.color`、`point` + `labels` |

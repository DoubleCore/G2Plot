# Choropleth 分级统计地图

> 组件用途：把行政区等地理区域的数值映射为颜色，展示指标的空间分布与区域差异。

## 何时使用

- 区域指标分布：各省人口、各市销售额、各区投诉率
- 数据已按国家、省、市、行政区等固定地理边界聚合，每个区域一个数值
- 关注高低值集聚区与空间格局，而不是区域间的精确名次

## 何时不用

- 无序类别间精确比较或排名 → 用 column 柱状图 / bar 条形图
- 展示经纬度散点或点密度 → 用 scatter 散点图 / heatmap 渐变热力图；区域填色不等于点密度
- 只画行政边界、不按数值着色 → 用基础 `geoPath` 地图，不属于 choropleth
- 展示同一区域随时间的变化 → 用 line 折线图

## 数据要求

- 需要两份数据：GeoJSON 区域边界 + 业务指标长表；业务长表见 [数据模式](../references/data-patterns.md)
- GeoJSON：`FeatureCollection`，每个 Feature 提供 `Polygon` / `MultiPolygon` 几何和稳定的区域键（如 `properties.name`）
- 业务表：每行一个区域，包含区域键和数值字段；数值必须是 number，字符串数字先 `Number()` 转换
- 本组件的 `geoPath` 使用 `data.value = geoJSON.features`；不要把整个 `FeatureCollection` 或普通业务表直接交给它
- 用 `data.transform` 中的 `join` 关联两份数据：`on` 左侧用 `(feature) => feature.properties.name` 读取嵌套键，右侧写业务表区域字段，`select` 选择要补充的指标
- 两侧区域键应唯一且完全一致（注意“北京”与“北京市”等差异）；未匹配是缺失数据，不要擅自补 0

## 基础实现（G2 v5）

顺序色阶适合非负、单向变化的指标。以下案例使用自包含的简化 GeoJSON，无需远程请求：

```ts
/**
 * 基础分级统计地图
 * 场景：用颜色深浅比较示例市四个城区的周末客流量。
 * 要点：geoPath 消费 GeoJSON features；data.transform.join 按 properties.name 关联业务指标。
 */
import { Chart } from '@antv/g2';

interface DistrictFeature {
  properties: { name: string };
}

// 自包含的简化城区边界；真实项目可替换为完整 GeoJSON。
const districtGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '老城区' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.4, 31.18],
            [121.48, 31.18],
            [121.48, 31.26],
            [121.4, 31.26],
            [121.4, 31.18],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: '高新区' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.48, 31.18],
            [121.56, 31.18],
            [121.56, 31.26],
            [121.48, 31.26],
            [121.48, 31.18],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: '滨江区' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.4, 31.1],
            [121.48, 31.1],
            [121.48, 31.18],
            [121.4, 31.18],
            [121.4, 31.1],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: '经开区' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.48, 31.1],
            [121.56, 31.1],
            [121.56, 31.18],
            [121.48, 31.18],
            [121.48, 31.1],
          ],
        ],
      },
    },
  ],
};

const districtMetrics = [
  { districtName: '老城区', weekendVisitors: 9600 },
  { districtName: '高新区', weekendVisitors: 15200 },
  { districtName: '滨江区', weekendVisitors: 12800 },
  { districtName: '经开区', weekendVisitors: 7200 },
];

const chart = new Chart({
  container: 'container',
  autoFit: true,
});

chart.options({
  type: 'geoPath',
  data: {
    value: districtGeoJSON.features,
    transform: [
      {
        type: 'join',
        join: districtMetrics,
        on: [
          (feature: DistrictFeature) => feature.properties.name,
          'districtName',
        ],
        select: ['weekendVisitors'],
      },
    ],
  },
  coordinate: { type: 'mercator' },
  encode: { color: 'weekendVisitors' },
  scale: {
    color: { type: 'sequential', palette: 'Blues', unknown: '#f0f0f0' },
  },
  style: { stroke: '#fff', lineWidth: 1 },
  tooltip: {
    title: (feature: DistrictFeature) => feature.properties.name,
    items: [
      {
        field: 'weekendVisitors',
        name: '周末客流量',
        valueFormatter: (value: number) => `${value.toLocaleString()} 人次`,
      },
    ],
  },
});

chart.render();
```

## 常见变体

| 变体 | 关键改动 | 完整案例 |
|---|---|---|
| 顺序色阶 | `scale.color` 使用 `type: 'sequential'` 与单色渐变，适合人口、销量等非负指标 | [basic.ts](../examples/choropleth/basic.ts) |
| 正负发散 + 缺失区域 | `palette: 'RdBu'` + 对称 `domain`；`join.unknown` 与 `scale.color.unknown` 标出缺失 | [diverging.ts](../examples/choropleth/diverging.ts) |

增长率、温差、距平等同时包含正负值时，用发散色阶并固定对称范围：

```ts-snippet
scale: {
  color: {
    type: 'sequential',
    palette: 'RdBu',
    domain: [-10, 10],
    unknown: '#e5e5e5',
  },
},
```

业务表未覆盖所有 GeoJSON 区域时，同时在 `join` 中声明缺失值：

```ts-snippet
{
  type: 'join',
  join: districtMetrics,
  on: [(feature) => feature.properties.name, 'districtName'],
  select: ['revenueGrowth'],
  unknown: null,
}
```

## 样式自定义

| 定制项 | 写法 | 说明 |
|---|---|---|
| 顺序色阶 | `scale: { color: { type: 'sequential', palette: 'Blues' } }` | 也可选 `Greens` / `YlOrRd` 等 |
| 自定义渐变色 | `scale: { color: { type: 'sequential', range: ['#eff6ff', '#08306b'] } }` | 颜色数组放 `range`，不要放 `palette` |
| 发散色阶 | `scale: { color: { palette: 'RdBu', domain: [-10, 10] } }` | 正负指标使用对称 domain，让 0 居中 |
| 固定色阶范围 | `scale: { color: { domain: [0, 100] } }` | 多期或多图比较时保持颜色含义一致 |
| 区域边界 | `style: { stroke: '#fff', lineWidth: 1 }` | 用浅色细分隔相邻区域 |
| 缺失区域颜色 | `scale: { color: { unknown: '#e5e5e5' } }` | 与 `join.unknown: null` 配合，不使用 0 冒充 |
| 图例位置 | `legend: { color: { position: 'bottom' } }` | 连续色阶图例放在底部 |
| 地图投影 | `coordinate: { type: 'mercator' }` | 区域地图常用；世界地图可用 `'naturalEarth1'` / `'orthographic'` |

Tooltip 标题从 GeoJSON 属性读取，指标项从 join 后的字段读取：

```ts-snippet
tooltip: {
  title: (feature) => feature.properties.name,
  items: [
    {
      field: 'weekendVisitors',
      name: '周末客流量',
      valueFormatter: (value) => `${value.toLocaleString()} 人次`,
    },
  ],
},
```

## 易错点（v4 → v5）

| ❌ 错误（幻觉高发） | ✅ 正确 |
|---|---|
| `type: 'choropleth'` / `type: 'map'`（G2 没有这些 mark） | `type: 'geoPath'` + `encode.color` 映射区域数值 |
| `new Choropleth('container', {...})`（G2Plot v2） | `new Chart({ container })` + `chart.options(spec)` |
| `chart.source(data)`、`.position('x*y')` | `chart.options({ data })`、`encode: { color: 'metric' }` |
| 顶层 `geoPath` 的 `data.value` 传整个 `FeatureCollection` | `data.value = geoJSON.features` |
| 把业务指标数组直接作为 `geoPath.data` | GeoJSON features 提供边界，业务表通过 `data.transform` 的 `join` 补充指标 |
| `on: ['properties.name', 'districtName']`（字符串不能读取嵌套属性） | `on: [(feature) => feature.properties.name, 'districtName']` |
| 把 `join` 写在 `geoPath` 根级或 mark 级 `transform` | 写在 `data.transform` 中 |
| `encode: { color: 'districtName' }` | `color` 映射 join 进来的数值字段，如 `weekendVisitors` |
| 未匹配区域补 0 | `join.unknown: null` + `scale.color.unknown` 显示缺失，避免把“未知”误画成最低值 |
| `scale: { color: { palette: ['#eff6ff', '#08306b'] } }` | `palette` 用色板名字符串；颜色数组用 `range` |
| 用固定 `style.fill` 覆盖所有区域 | 数值着色交给 `encode.color` + `scale.color`，`style` 只设置边界等通用样式 |

更多对照见 [v4-to-v5-migration.md](../references/v4-to-v5-migration.md)。

## 完整案例

每个案例的元信息（场景与关键配置），代码均通过 `npm run validate` 校验：

| 案例 | 场景 | 关键配置 |
|---|---|---|
| [basic.ts](../examples/choropleth/basic.ts) | 各城区周末客流量的空间分布 | `geoPath` + 内联 GeoJSON features + `data.transform.join` + `Blues` 顺序色阶 |
| [diverging.ts](../examples/choropleth/diverging.ts) | 各城区营收同比增长与未上报区域 | `RdBu` + 对称 `domain` + `join.unknown` + `scale.color.unknown` |

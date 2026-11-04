# Tile Density 瓦片密度图

> 组件用途：把二维平面切成等宽网格（瓦片），用颜色深浅表示每格内的样本数量，用于观察大量散点聚集在哪些区间。

## 何时使用

- 二维散点过密、糊成一团：骑行距离 × 时长、客单价 × 购买件数、用户活跃天数 × 消费额
- 关注「聚集区间」而不是单点数值：两个连续指标的联合分布、A/B 实验的二维落点
- 样本量较大（建议 ≥ 200 条），需要先分箱再统计
- 想直接读出「这个区间里有多少条样本」——颜色即计数

## 何时不用

- 两轴都是类别 → 用 [heatmap 热力图](heatmap.md)（`type: 'cell'` 矩阵）
- 想要连续平滑的密度晕染（点云热力）→ 用 `heatmap`（`type: 'heatmap'`，高斯核密度）
- 需要看清每个点的精确位置、识别离群点 → 用 [scatter 散点图](scatter.md)
- 单变量分布 → 用 [column 柱状图](column.md) 的直方图形态（只对 x 分箱）
- 数据量 < 100 → 散点更直接，分箱后大部分瓦片是空的

## 数据要求

- 长表数据，每行一个观测点，见 [数据模式](../references/data-patterns.md)
- `x` / `y` 字段：**连续数值**（number）；分类字段会被当成数值轴，结果没有意义
- **不要预先聚合**：`bin` 会自己统计每格条数并生成 `count`；已经由后端按网格聚合好的数据走 [pre-aggregated.ts](../examples/tile-density/pre-aggregated.ts) 的 `x1/y1` 写法
- 数值字段必须是 `number`，字符串数字先 `Number()` 转换
- 极端长尾数据（如客单价 1 ~ 100000）先裁剪或取对数，等宽分箱会把 99% 的样本挤在第一格

## 基础实现（G2 v5）

瓦片密度图 = `type: 'rect'` + mark 级 `transform: [{ type: 'bin' }]`。`bin` 会为每格算出四个边界（`x` / `x1` / `y` / `y1`）和计数（`count`），再把 `count` 映射到颜色。

```ts
import { Chart } from '@antv/g2';

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
```

`transform` 里的 `color: 'count'` 是**聚合表达式**：分箱后把每格的样本条数算出来，写到 `color` 通道上。想改用透明度表达密度，就把键换成 `opacity: 'count'`（见 [single-hue.ts](../examples/tile-density/single-hue.ts)）。

## 常见变体

| 变体 | 关键改动 | 完整案例 |
|---|---|---|
| 品牌配色 + 固定分箱粒度 | `thresholdsX/thresholdsY` + `scale.color.range` + tooltip 读 `channel: 'color'` | [custom-style.ts](../examples/tile-density/custom-style.ts) |
| 后端已聚合的网格 | 跳过 `bin`，用 `encode.x1 / y1` 直接给格子边界 | [pre-aggregated.ts](../examples/tile-density/pre-aggregated.ts) |
| 单色深浅（无图例） | `transform: [{ type: 'bin', opacity: 'count' }]` + `style.fill` + `legend: false` | [single-hue.ts](../examples/tile-density/single-hue.ts) |

固定分箱粒度，保证多张图之间格子可比：

```ts-snippet
transform: [{ type: 'bin', color: 'count', thresholdsX: 20, thresholdsY: 16 }],
```

预聚合数据的核心差异（`rides` 已经是计数，不要再分箱）：

```ts-snippet
encode: {
  x: 'distanceFrom',
  x1: 'distanceTo',
  y: 'durationFrom',
  y1: 'durationTo',
  color: 'rides',
},
```

## 样式自定义

| 定制项 | 写法 | 说明 |
|---|---|---|
| 分箱粒度 | `transform: [{ type: 'bin', thresholdsX: 20, thresholdsY: 16 }]` | 数字是**分箱个数**，不是步长 |
| 顺序色阶 | `scale: { color: { type: 'sequential', palette: 'Blues' } }` | `Blues` / `Greens` / `YlOrRd` |
| 自定义色阶 | `scale: { color: { range: ['#e8f1ff', '#1d39c4'] } }` | 给 `range` 数组时不要写 `type: 'sequential'`，它会被内置插值器覆盖；不写 `type` 时 G2 按 `range` 推成线性多段插值 |
| 固定色阶范围 | `scale: { color: { domain: [0, 40] } }` | 多图对比时统一色阶，避免「最深色」含义不一致 |
| 瓦片间距 | `style: { inset: 1 }` | px，0 为无缝 |
| 瓦片圆角 | `style: { radius: 2 }` | |
| 单色深浅 | `transform: [{ type: 'bin', opacity: 'count' }]` + `style: { fill: '#5B8FF9' }` | 不产生色阶图例，适合叠底图 |
| 透明度值域 | `scale: { opacity: { range: [0.06, 1] } }` | 配合 `opacity: 'count'`，最小值留一点底 |
| 坐标轴标题 | `axis: { x: { title: '骑行距离（km）' } }` | y 轴同理 |
| 图例位置 | `legend: { color: { position: 'bottom' } }` | `'top'` / `'bottom'` / `'left'` / `'right'` |
| 图例刻度文案 | `legend: { color: { labelFormatter } }` | 分箱计数是数值，可用回调加单位（如「次」） |
| 关闭图例 | `legend: false` | 单色方案或嵌入大屏时常用 |
| 图表标题 | `title: { title: '…', subtitle: '…', align: 'left' }` | `title` 必须是对象，不能直接写字符串 |

tooltip 要读**分箱后的计数**，用 `channel: 'color'`（或 `'opacity'`），不要读原始行字段：

```ts-snippet
tooltip: {
  items: [
    { channel: 'color', name: '骑行次数', valueFormatter: (v) => `${v} 次` },
  ],
},
```

## 易错点（v4 → v5）

| ❌ 错误（幻觉高发） | ✅ 正确 |
|---|---|
| `transform` 写进 `data.transform` | `bin` 是 **mark 级 transform**，与 `data` / `encode` 同级 |
| `transform: { type: 'bin' }`（对象） | `transform: [{ type: 'bin' }]`（数组） |
| 用 `type: 'cell'` 做连续二维分箱 | `cell` 两轴是 `band` 比例尺，数值会被当类别逐格铺开；连续二维用 `rect` + `bin` |
| 用 `type: 'heatmap'` 代替 | `heatmap` 是高斯核密度，边界模糊；要清晰等宽瓦片用 `rect` + `bin` |
| 数据已是网格计数还套 `bin` | 二次分箱后 `count` 全是 1；改用 `encode.x1 / y1` |
| `labels: [{ text: 'count' }]` 标计数 | 分箱后 datum 仍是原始行，取不到聚合值；改用 `tooltip.items` 的 `channel: 'color'` |
| `encode.color` 再映射一个类别字段 | `bin` 默认 `groupChannels: ['color']`，会按类别各自分箱、瓦片互相重叠；要分组对比请用 `type: 'view'` 的小倍数图 |
| 把 `thresholdsX` 当分箱步长 | 它是分箱**个数**；要固定步长先在上游按步长取整再分箱 |
| `scale.color` 同时写 `type: 'sequential'` 和 `range` 数组 | sequential 的颜色来自 `palette` 内置插值器，`range` 会被忽略；自定义数组用不带 `type` 的 `range`，内置色板用 `type: 'sequential'` + `palette` |
| `scale: { color: { palette: ['#e8f1ff', '#1d39c4'] } }` | `palette` 只接受调色板名字符串，传数组会 TS 报错且白屏；数组用 `range` |
| `type: 'tile'` / `chart.tile()`（不存在） | G2 v5 没有 tile mark；瓦片密度 = `rect` mark + `bin` transform |
| `new Heatmap('container', { type: 'grid' })`（G2Plot v2） | `new Chart({ container })` + `chart.options({ type: 'rect', … })` |

更多对照见 [v4-to-v5-migration.md](../references/v4-to-v5-migration.md)。

## 完整案例

每个案例的元信息（场景与关键配置），代码均通过 `npm run validate` 校验：

| 案例 | 场景 | 关键配置 |
|---|---|---|
| [basic.ts](../examples/tile-density/basic.ts) | 骑行距离 × 时长分布，最简起步 | `type: 'rect'` + `bin` + `palette: 'Blues'` |
| [custom-style.ts](../examples/tile-density/custom-style.ts) | 品牌配色、固定分箱、带单位的图例与 tooltip | `thresholdsX/Y`、`scale.color.range`、`tooltip.items` |
| [pre-aggregated.ts](../examples/tile-density/pre-aggregated.ts) | 后端已按不等宽网格聚合，直接画格子 | `encode.x1/y1`，不使用 `bin` |
| [single-hue.ts](../examples/tile-density/single-hue.ts) | 单色深浅、无图例，适合叠底图 | `bin` 的 `opacity: 'count'` + `style.fill` |

# Butterfly 蝴蝶图

> 组件用途：用于展示两类数据在各类别维度下的对称分布， resembling butterfly wings（蝴蝶翅膀状展开）。

## 何时使用

- 两类数据的对称对比：男女比例在不同年龄段的分布、不同年份两组指标的并行变化
- 需要在同一视野内展示两组数据的相对规模和分布情况
- 类别维度较少（≤ 6 个），关注两组数据的相对差异而非精确数值

## 何时不用

- 时间序列趋势变化 → 用 line 折线图
- 单类别数值对比 → 用 column 柱状图
- 占比/构成 → 用 pie 饼图
- 两个数值变量的相关性 → 用 scatter 散点图
- 类别较多（≥ 8 个），蝴蝶翅膀会重叠拥挤，难以阅读

## 数据要求

- 长表数据，每行一个数据点
- `category` 字段：类别字符串（如 'A', 'B', 'C'）；蝴蝶图的每个类别是一个“翅膀分组”
- `value` 字段：数值（number）；决定翅膀的伸展长度
- `wing` 字段：分类标识（如 'left' / 'right'，或 '上' / '下'），用于 `encode.color` 分成两组翅膀
- 同一类别下应同时存在两个 wing 的数据点（即每个 category 两行数据，左右两个翅膀）

**数据模式示例**：
```ts
const data = [
  { category: 'A', value: 10, wing: 'left' },
  { category: 'A', value: 15, wing: 'right' },
  { category: 'B', value: 20, wing: 'left' },
  { category: 'B', value: 25, wing: 'right' },
  { category: 'C', value: 18, wing: 'left' },
  { category: 'C', value: 22, wing: 'right' },
];
```

## 基础实现（G2 v5）

蝴蝶图通过 `type: 'interval'` 在线性坐标系中，利用 `y` 正负值分布在中心两侧，形成左右对称的翅膀效果。

```ts
import { Chart } from '@antv/g2';

const data = [
  { category: 'A', value: 10, wing: 'left' },
  { category: 'A', value: 15, wing: 'right' },
  { category: 'B', value: 20, wing: 'left' },
  { category: 'B', value: 25, wing: 'right' },
  { category: 'C', value: 18, wing: 'left' },
  { category: 'C', value: 22, wing: 'right' },
];

const chart = new Chart({
  container: 'container',
  autoFit: true,
});

chart.options({
  type: 'interval',
  data,
  encode: {
    x: 'category',
    y: 'value',
    color: 'wing',
  },
  // 将 y=0 置为中心，翅膀向两侧延展
  // y 轴会自动包含 0，翅膀从中心向外延伸
  // 如需自定义偏移，可配 scale.y.range 或 axis.y.position
});

chart.render();
```

## 常见变体

| 变体 | 关键改动 | 完整案例 |
|---|---|---|
| 多类别 | 每个类别同时展示 left/right 两个翅膀（默认） | [basic.ts](./basic.ts) |
| 受控偏移 | `style: { offset: 8 }` 调整翅膀间距，防止重叠 | [offset.ts](./offset.ts) |
| 颜色自定义 | `scale: { color: { range: ['#5B8FF9', '#5AD8A6'] } }` | [custom-color.ts](./custom-color.ts) |
| 数值标签 | `labels: [{ text: 'value', position: 'outside' }]` 显示数值 | [with-label.ts](./with-label.ts) |
| 主题切换 | `theme: 'dark'` / `'classicDark'` 适配暗色场景 | — |

### 多系列核心差异（数据需含 `wing` 字段）

```ts-snippet
chart.options({
  type: 'interval',
  data,
  encode: {
    x: 'category',
    y: 'value',
    color: 'wing',
  },
});
```

## 样式自定义

常用视觉定制项（以下写法均经 `@antv/g2` ^5 类型校验）：

| 定制项 | 写法 | 说明 |
|---|---|---|
| 翅膀颜色 palette | `scale: { color: { range: ['#5B8FF9', '#5AD8A6'] } }` | left/wing1 与 right/wing2 的颜色配置 |
| 翅膀粗细 | `style: { lineWidth: 3 }` | bar 的边框/填充粗细 |
| 翅膀间距 | `style: { offset: 8 }` | bar 之间的间距（像素），防止类别重叠 |
| 中心线位置 | `axis: { y: { position: 'center' } }` | 将 y 轴位置置中，形成精确对称 |
| 数值标签 | `labels: [{ text: 'value', position: 'top' }]` | upper wing 标签位于翅膀上方，lower wing 位于下方 |
| 关闭翅膀间分隔 | `axis: false` | 移除坐标轴，纯视觉展示翅膀形状 |

### 组件文字样式命名规律

`titleXxx`（图表标题）、`labelXxx`（数据标签）、`axisXxx`（坐标轴）——如 `axis.y.titleFill`、`label.valueFontSize`。

### 内置主题

`theme: 'light' | 'dark' | 'classic' | 'classicDark'`，一行切换整体配色。暗色场景用 `'classicDark'`，坐标轴、图例、标题的文字颜色自动适配，无需逐个设置。

数据标签与 tooltip 格式化，完整示例见 [with-label.ts](../examples/butterfly/with-label.ts)。

## 易错点（v4 → v5）

| ❌ 错误（幻觉高发） | ✅ 正确 |
|---|---|
| `.position('category*value')` | `.encode('x', 'category').encode('y', 'value')` |
| `import { Butterfly } from '@antv/g2plot'` | `import { Chart } from '@antv/g2'`（蝴蝶图无专用组件，用 interval + encode 实现） |
| `new Butterfly('container', {...})` | `new Chart({ container })` + `chart.options(spec)` |
| `wingField: 'wing'`（v2/v3 配置） | `encode: { color: 'wing' }` |
| `connectNulls: true`（属性不存在） | 默认 `connect: false` 在 `null` 处断开；置 `true` 跨断点连线 |
| `chart.source(data)`（v4） | `chart.options({ data })` |
| 将 `value` 直接当类别用 | `y` 必须为数值型；类别用 `x`，否则翅膀长度无意义 |

更多对照见 [v4-to-v5-migration.md](../references/v4-to-v5-migration.md)。

## 完整案例

每个案例的元信息（场景与关键配置），代码均通过 `npm run validate` 校验：

| 案例 | 场景 | 关键配置 |
|---|---|---|
| [basic.ts](../examples/butterfly/basic.ts) | 最基础的蝴蝶图，展示左右翅膀对比 | `encode: { x: 'category', y: 'value', color: 'wing' }` |
| [offset.ts](../examples/butterfly/offset.ts) | 调整翅膀间距，防止类别重叠 | `style: { offset: 8 }` + 增大类别间间距 |
| [custom-color.ts](../examples/butterfly/custom-color.ts) | 自定义翅膀颜色配色方案 | `scale: { color: { range: [...] } }` |
| [with-label.ts](../examples/butterfly/with-label.ts) | 数值标签展示，位置外侧显示 | `labels: [{ text: 'value', position: 'outside' }]` |
| [dark-theme.ts](../examples/butterfly/dark-theme.ts) | 暗色主题蝴蝶图 | `theme: 'classicDark'` + 适配色彩 |

> 备注：蝴蝶图适合类别 ≤ 6 个的场景。类别过多时建议改用柱状图或散点图，以免翅膀重叠导致阅读混乱。
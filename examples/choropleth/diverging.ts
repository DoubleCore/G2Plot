/**
 * 发散色阶分级统计地图
 * 场景：比较示例市各城区的营收同比增长率，并标出暂未上报的区域。
 * 要点：RdBu 色阶配对称 domain；join 与 scale 分别声明缺失值和缺失区域颜色。
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

// 经开区暂未上报，不能用 0 代替缺失的增长率。
const districtMetrics = [
  { districtName: '老城区', revenueGrowth: -5.2 },
  { districtName: '高新区', revenueGrowth: 8.4 },
  { districtName: '滨江区', revenueGrowth: 3.1 },
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
        select: ['revenueGrowth'],
        unknown: null,
      },
    ],
  },
  coordinate: { type: 'mercator' },
  encode: { color: 'revenueGrowth' },
  scale: {
    color: {
      type: 'sequential',
      palette: 'RdBu',
      domain: [-10, 10],
      unknown: '#e5e5e5',
    },
  },
  style: { stroke: '#fff', lineWidth: 1 },
  tooltip: {
    title: (feature: DistrictFeature) => feature.properties.name,
    items: [
      {
        field: 'revenueGrowth',
        name: '营收同比增长',
        valueFormatter: (value: number | null) =>
          value === null
            ? '暂无数据'
            : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
      },
    ],
  },
});

chart.render();

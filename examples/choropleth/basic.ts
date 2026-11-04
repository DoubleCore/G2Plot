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

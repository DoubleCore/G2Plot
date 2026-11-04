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

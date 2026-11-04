/**
 * 流量加权流向地图
 * 场景：比较不同线路的物流量，并区分运输类型、标出仓库节点
 * 要点：style.lineWidth 回调映射流量，encode.color 区分类型，point 叠加节点与标签
 */
import { Chart } from '@antv/g2';

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

const hubs = [
  { name: '滨江仓', longitude: 8, latitude: 30 },
  { name: '云谷仓', longitude: 32, latitude: 30 },
  { name: '山城仓', longitude: 8, latitude: 10 },
  { name: '海港仓', longitude: 32, latitude: 10 },
];

const flows = [
  { source: '滨江仓', target: '云谷仓', sourceLng: 8, sourceLat: 30, targetLng: 32, targetLat: 30, volume: 120, routeType: '干线' },
  { source: '滨江仓', target: '山城仓', sourceLng: 8, sourceLat: 30, targetLng: 8, targetLat: 10, volume: 80, routeType: '支线' },
  { source: '山城仓', target: '海港仓', sourceLng: 8, sourceLat: 10, targetLng: 32, targetLat: 10, volume: 150, routeType: '干线' },
  { source: '云谷仓', target: '海港仓', sourceLng: 32, sourceLat: 30, targetLng: 32, targetLat: 10, volume: 60, routeType: '支线' },
  { source: '海港仓', target: '滨江仓', sourceLng: 32, sourceLat: 10, targetLng: 8, targetLat: 30, volume: 100, routeType: '干线' },
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
        color: 'routeType',
      },
      scale: { color: { range: ['#5B8FF9', '#F6BD16'] } },
      style: {
        lineWidth: (d: { volume: number }) => 1 + (d.volume / 150) * 4,
        strokeOpacity: 0.75,
        arrow: true,
        arrowSize: 8,
      },
      legend: { color: { position: 'top', title: '运输类型' } },
      tooltip: {
        title: (d) => `${d.source} → ${d.target}`,
        items: [{ field: 'volume', name: '运输量', valueFormatter: (v) => `${v} 吨` }],
      },
    },
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
      tooltip: { items: [{ field: 'name', name: '仓库' }] },
    },
  ],
});

chart.render();

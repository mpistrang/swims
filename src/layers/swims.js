import L from 'leaflet';

import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import 'leaflet.featuregroup.subgroup';

import { YEAR_COLORS } from '../config.js';

export const swimsCluster = L.markerClusterGroup({
  showCoverageOnHover: false,
  chunkedLoading: true,
});

const MONTH_INDEX = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function monthNumber(month) {
  if (month == null) return 0;
  return MONTH_INDEX[String(month).trim().toLowerCase()] ?? 0;
}

function bindPopup(feature, layer) {
  if (!feature.properties) return;
  const { number, month, day, year } = feature.properties;
  layer.bindPopup(`<p>Swim: ${number} - ${month} ${day}, ${year}</p>`);
}

function markerStyle(color) {
  return {
    radius: 5,
    fillColor: color,
    color,
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };
}

function tallyYears(features) {
  const counts = {};
  for (const f of features) {
    const year = f?.properties?.year;
    if (year == null) continue;
    counts[year] = (counts[year] || 0) + 1;
  }
  const sortedYears = Object.keys(counts).map(Number).sort((a, b) => a - b);
  return { sortedYears, yearCounts: counts };
}

function chronoCompare(a, b) {
  const pa = a.properties || {};
  const pb = b.properties || {};
  if (pa.year !== pb.year) return (pa.year || 0) - (pb.year || 0);
  const ma = monthNumber(pa.month);
  const mb = monthNumber(pb.month);
  if (ma !== mb) return ma - mb;
  if ((pa.day || 0) !== (pb.day || 0)) return (pa.day || 0) - (pb.day || 0);
  return (pa.number || 0) - (pb.number || 0);
}

export function buildYearLayers(featureCollection) {
  const features = Array.isArray(featureCollection?.features)
    ? featureCollection.features
    : [];
  const { sortedYears, yearCounts } = tallyYears(features);

  const yearLayers = {};
  const yearColors = {};

  sortedYears.forEach((year, i) => {
    const color = YEAR_COLORS[i % YEAR_COLORS.length];
    yearColors[year] = color;
    yearLayers[year] = L.featureGroup.subGroup(swimsCluster);
  });

  const chronological = [];

  features.forEach((feature) => {
    const year = feature?.properties?.year;
    const yearLayer = yearLayers[year];
    if (!yearLayer) return;

    const coords = feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return;
    const [lon, lat] = coords;

    const marker = L.circleMarker([lat, lon], markerStyle(yearColors[year]));
    bindPopup(feature, marker);
    yearLayer.addLayer(marker);

    chronological.push({ marker, yearLayer, feature });
  });

  chronological.sort((a, b) => chronoCompare(a.feature, b.feature));

  return {
    yearLayers,
    sortedYears,
    yearColors,
    yearCounts,
    chronological,
  };
}

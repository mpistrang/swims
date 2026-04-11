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

function uniqueSortedYears(features) {
  const years = new Set();
  for (const f of features) {
    const year = f?.properties?.year;
    if (year != null) years.add(year);
  }
  return [...years].sort();
}

export function buildYearLayers(featureCollection) {
  const features = Array.isArray(featureCollection?.features)
    ? featureCollection.features
    : [];
  const sortedYears = uniqueSortedYears(features);

  const yearLayers = {};
  const yearColors = {};

  sortedYears.forEach((year, i) => {
    const color = YEAR_COLORS[i % YEAR_COLORS.length];
    yearColors[year] = color;

    const geojsonLayer = L.geoJSON(featureCollection, {
      filter: (feature) => feature.properties?.year === year,
      onEachFeature: bindPopup,
      pointToLayer: (_feature, latlng) => L.circleMarker(latlng, markerStyle(color)),
    });

    yearLayers[year] = L.featureGroup.subGroup(swimsCluster).addLayer(geojsonLayer);
  });

  return { yearLayers, sortedYears, yearColors };
}

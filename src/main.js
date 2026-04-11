import L from 'leaflet';

import './style.css';
import { INITIAL_CENTER, INITIAL_ZOOM } from './config.js';
import { fetchSwims } from './data.js';
import { grayscale, streets } from './layers/base.js';
import { swimsCluster, buildYearLayers } from './layers/swims.js';
import { installYearFilter } from './controls/year-filter.js';

const map = L.map('map', {
  center: INITIAL_CENTER,
  zoom: INITIAL_ZOOM,
  layers: [grayscale, swimsCluster],
});

async function init() {
  const data = await fetchSwims();
  const yearData = buildYearLayers(data);

  yearData.sortedYears.forEach((year) => yearData.yearLayers[year].addTo(map));

  installYearFilter(map, {
    ...yearData,
    baseLayers: { Grayscale: grayscale, Streets: streets },
    defaultBaseLayer: 'Grayscale',
  });

  map.fitBounds(swimsCluster.getBounds());
}

init().catch((err) => console.error('Failed to initialize map:', err));

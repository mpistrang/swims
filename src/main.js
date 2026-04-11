import L from 'leaflet';

import './style.css';
import { INITIAL_CENTER, INITIAL_ZOOM } from './config.js';
import { fetchSwims } from './data.js';
import { grayscale, streets } from './layers/base.js';
import { swimsCluster, buildYearLayers } from './layers/swims.js';
import { installYearFilter } from './controls/year-filter.js';
import { installTimeline } from './controls/timeline.js';

const map = L.map('map', {
  center: INITIAL_CENTER,
  zoom: INITIAL_ZOOM,
  layers: [grayscale, swimsCluster],
});

async function init() {
  const data = await fetchSwims();
  const yearData = buildYearLayers(data);

  yearData.sortedYears.forEach((year) => yearData.yearLayers[year].addTo(map));

  let timeline;

  const yearFilter = installYearFilter(map, {
    ...yearData,
    baseLayers: { Grayscale: grayscale, Streets: streets },
    defaultBaseLayer: 'Grayscale',
    onTimelineClick: () => timeline?.toggle(),
  });

  timeline = installTimeline(map, {
    chronological: yearData.chronological,
    onEnter: () => {
      yearFilter.setLocked(true);
      yearFilter.setTimelineActive(true);
      // Force all year subgroups onto the map so timeline can render any feature.
      yearData.sortedYears.forEach((year) => {
        const layer = yearData.yearLayers[year];
        if (!map.hasLayer(layer)) map.addLayer(layer);
      });
    },
    onExit: () => {
      // Restore year visibility to whatever the filter says should be shown.
      const active = yearFilter.getActiveYears();
      yearData.sortedYears.forEach((year) => {
        const layer = yearData.yearLayers[year];
        const shouldShow = active.has(year);
        if (shouldShow && !map.hasLayer(layer)) map.addLayer(layer);
        else if (!shouldShow && map.hasLayer(layer)) map.removeLayer(layer);
      });
      yearFilter.setTimelineActive(false);
      yearFilter.setLocked(false);
    },
  });

  map.fitBounds(swimsCluster.getBounds());
}

init().catch((err) => console.error('Failed to initialize map:', err));

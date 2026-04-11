import L from 'leaflet';

function yearLabel(year, color) {
  return `<span style="display:inline-block;color:${color};">${year}</span>`;
}

function appendSelectionButtons(control, yearLayers, map) {
  const container = control.getContainer();
  if (!container) return;

  const wrapper = L.DomUtil.create('div', 'year-legend-controls');
  Object.assign(wrapper.style, {
    background: '#fff',
    padding: '6px',
    borderRadius: '4px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    marginTop: '6px',
  });
  wrapper.innerHTML =
    '<button id="selectAllYears" style="margin-right:6px;">Select all</button>' +
    '<button id="deselectAllYears">Deselect all</button>';
  L.DomEvent.disableClickPropagation(wrapper);

  // Append into the layers control inner list so the buttons are hidden
  // when the control is collapsed (Leaflet toggles visibility on expand).
  const inner =
    container.querySelector('.leaflet-control-layers-list') ||
    container.querySelector('.leaflet-control-layers-overlays') ||
    container;
  inner.appendChild(wrapper);

  const setAll = (visible) => {
    Object.values(yearLayers).forEach((layer) => {
      if (visible && !map.hasLayer(layer)) map.addLayer(layer);
      if (!visible && map.hasLayer(layer)) map.removeLayer(layer);
    });
    container
      .querySelectorAll('input[type="checkbox"]')
      .forEach((input) => (input.checked = visible));
  };

  wrapper.querySelector('#selectAllYears').addEventListener('click', () => setAll(true));
  wrapper.querySelector('#deselectAllYears').addEventListener('click', () => setAll(false));
}

export function installYearFilter(map, baseLayers, yearLayers, sortedYears, yearColors) {
  const control = L.control.layers(baseLayers).addTo(map);

  sortedYears.forEach((year) => {
    control.addOverlay(yearLayers[year], yearLabel(year, yearColors[year]));
  });

  appendSelectionButtons(control, yearLayers, map);

  return control;
}

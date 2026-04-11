import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { MAPBOX_STYLE_URL, MAPBOX_ATTRIBUTION } from '../config.js';

const tileOptions = {
  tileSize: 512,
  zoomOffset: -1,
  attribution: MAPBOX_ATTRIBUTION,
};

export const grayscale = L.tileLayer(MAPBOX_STYLE_URL, {
  ...tileOptions,
  id: 'mapbox/light-v9',
});

export const streets = L.tileLayer(MAPBOX_STYLE_URL, {
  ...tileOptions,
  id: 'mapbox/streets-v11',
});

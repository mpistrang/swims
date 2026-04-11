// Public Mapbox token, scoped for browser use.
export const MAPBOX_TOKEN =
  'pk.eyJ1IjoibWljaGFlbHBpc3RyYW5nIiwiYSI6ImNrb3ozOWV5NTBncXEydmxxdmc5dWhlNGEifQ.ZN7YsaG1SRwuaZ_GH00Zvg';

export const MAPBOX_STYLE_URL =
  `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;

export const MAPBOX_ATTRIBUTION =
  'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
  'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

export const INITIAL_CENTER = [30.0, 0.0];
export const INITIAL_ZOOM = 3;

// 37-entry palette. Years cycle through it; if there are more years than
// colors, the cycle repeats.
export const YEAR_COLORS = [
  '#53ff00', '#64e20b', '#75c617', '#87aa23', '#988d2f', '#aa713a', '#bb5546',
  '#cd3852', '#de1c5e', '#f0006a', '#f11761', '#f32e59', '#f54551', '#f65c48',
  '#f87440', '#fa8b38', '#fba22f', '#fdb927', '#ffd11f', '#e6d637', '#cddb50',
  '#b4e069', '#9be582', '#82ea9b', '#69efb4', '#50f4cd', '#37f9e6', '#1fffff',
  '#29e7ef', '#34cfe0', '#3fb7d1', '#4a9fc1', '#5487b2', '#5f6fa3', '#6a5793',
  '#753f84', '#802875',
];

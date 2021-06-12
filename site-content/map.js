// set up base layers
const mbAttr =
    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a> (MCP)',
  mbUrl =
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWljaGFlbHBpc3RyYW5nIiwiYSI6ImNrb3ozOWV5NTBncXEydmxxdmc5dWhlNGEifQ.ZN7YsaG1SRwuaZ_GH00Zvg";

const grayscale = L.tileLayer(mbUrl, {
  id: "mapbox/light-v9",
  tileSize: 512,
  zoomOffset: -1,
  attribution: mbAttr,
});
const streets = L.tileLayer(mbUrl, {
  id: "mapbox/streets-v11",
  tileSize: 512,
  zoomOffset: -1,
  attribution: mbAttr,
});

const colors = ['#53ff00','#64e20b','#75c617','#87aa23','#988d2f','#aa713a','#bb5546','#cd3852','#de1c5e','#f0006a','#f11761','#f32e59','#f54551','#f65c48','#f87440','#fa8b38','#fba22f','#fdb927','#ffd11f','#e6d637','#cddb50','#b4e069','#9be582','#82ea9b','#69efb4','#50f4cd','#37f9e6','#1fffff','#29e7ef','#34cfe0','#3fb7d1','#4a9fc1','#5487b2','#5f6fa3','#6a5793','#753f84','#802875',]

// set up data layers
const swims = L.markerClusterGroup({
  showCoverageOnHover: false,
  chunkedLoading: true,
});

// Set up the map with the default layers showing
const map = L.map("map", {
  center: [30.0, 0.0],
  zoom: 3,
  layers: [grayscale, swims],
});

// Layer controls
const baseLayers = {
  Grayscale: grayscale,
  Streets: streets,
};

const control = L.control.layers(baseLayers).addTo(map);

/*
Set up the popup for each feature based onthe geojson propeties
*/
function onEachFeature(feature, layer) {
  if (feature.properties) {
    const { number, month, day, year } = feature.properties;
    const popupContent = `<p>Swim: ${number} - ${month} ${day}, ${year}</p>`;
    layer.bindPopup(popupContent);
  }
}

function getSwimStyle(color) {
  return {
    radius: 5,
    fillColor: color,
    color,
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };
}

function loadData(data) {
  // get all the years
  const years = [...new Set(data.features.map(feature=>feature.properties.year))];
  years.sort()
  years.forEach((year, i)=> {
    const color = colors[i];
    // build a layer for this year only
    const geojsonLayer = L.geoJSON(data, {
      filter: function (feature) {
        return feature.properties.year === year;
      },
      onEachFeature,
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, getSwimStyle(color));
      },
    });
    const thisYear = L.featureGroup.subGroup(swims).addLayer(geojsonLayer);
    control.addOverlay(
      thisYear,
      `<div style="display:inline-block;color:${color};"">${year}<div>`
    );
    thisYear.addTo(map);
  })

  map.fitBounds(swims.getBounds());
}

/*
Load the geojson from the file and add it to the swims layer
*/
$.getJSON("swims.geojson", function (data) {
  loadData(data);
});

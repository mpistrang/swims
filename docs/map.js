// set up base layers
const mbAttr =
    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
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

// set up data layers
const swims = L.markerClusterGroup({
  showCoverageOnHover: false,
  chunkedLoading: true 
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

L.control.layers(baseLayers).addTo(map);

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

// shared syle for each point
const swimsStyle = {
  radius: 5,
  fillColor: "#ff7800",
  color: "#000",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8,
};

function loadData(data) {
  const geojsonLayer = L.geoJSON(data, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, swimsStyle);
    },
  });
  swims.addLayer(geojsonLayer);
  map.fitBounds(swims.getBounds());
}

/*
Load the geojson from the file and add it to the swims layer
*/
$.getJSON("swims.geojson", function (data) {
  loadData(data);
});

# Swims

Swimming!

Hosted on https://davidswims.onrender.com/

# Tech/Tools

- [Leaflet](https://leafletjs.com/)
- [Leaflet.MarkerCluster](https://github.com/Leaflet/Leaflet.markercluster)
- [Leaflet.FeatureGroup.SubGroup](https://github.com/ghybs/Leaflet.FeatureGroup.SubGroup)
- [Mapbox](https://www.mapbox.com/)
- [Render](https://render.com/)
- [Docker](https://www.docker.com/)
- [Nginx](https://www.nginx.com/)

# Run Locally

Use docker to avoid serving off the file system, plus a custom default nginx config.

`docker run -it --rm -d -p 8084:80 --name swims -v $PWD/site-content:/usr/share/nginx/html -v $PWD/nginx.conf:/etc/nginx/conf.d/default.conf nginx`
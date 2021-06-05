# Swims

Swimming!

Hosted on https://davidswims.onrender.com/

# Run Locally

Use docker to avoid serving off the file system, plus a custom default nginx config.

`docker run -it --rm -d -p 8084:80 --name swims -v $PWD/site-content:/usr/share/nginx/html -v $PWD/nginx.conf:/etc/nginx/conf.d/default.conf nginx`
# Swims

Swimming!

# Github Pages

https://mpistrang.github.io/swims/

# Run Locally

Use docker to avoid serving off the file system

`docker run -it --rm -d -p 8084:80 --name swims -v $PWD/docs:/usr/share/nginx/html -v $PWD/nginx.conf:/etc/nginx/conf.d/default.conf nginx`
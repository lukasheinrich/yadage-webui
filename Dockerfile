#FROM nginx:latest
#ADD . /usr/share/nginx/html

FROM kyma/docker-nginx

# Example if you wanna swap the default server file.
COPY ./nginx.conf /etc/nginx/sites-enabled/default

COPY static/ /var/www

CMD 'nginx'

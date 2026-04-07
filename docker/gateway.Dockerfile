FROM nginx:alpine

COPY docker/gateway.conf /etc/nginx/conf.d/default.conf

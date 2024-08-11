FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /etc/nginx/ssl

RUN apk add openssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx-selfsigned.key \
    -out /etc/nginx/ssl/nginx-selfsigned.crt \
    -subj "/C=KR/ST=Seoul/L=Seoul/O=42Network/OU=42Seoul/CN=sj_server"

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

# 평가시 이걸로 수정할 것
# FROM nginx:alpine

# COPY . /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/nginx.conf

# RUN mkdir -p /etc/nginx/ssl

# RUN apk add openssl && \
#     openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#     -keyout /etc/nginx/ssl/nginx-selfsigned.key \
#     -out /etc/nginx/ssl/nginx-selfsigned.crt \
#     -subj "/C=KR/ST=Seoul/L=Seoul/O=42Network/OU=42Seoul/CN=sj_server"

# EXPOSE 80 443

# CMD ["nginx", "-g", "daemon off;"]
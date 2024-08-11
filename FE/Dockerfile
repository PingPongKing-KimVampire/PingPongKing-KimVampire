FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /etc/nginx/ssl

RUN apk add openssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx-selfsigned.key \
    -out /etc/nginx/ssl/nginx-selfsigned.crt \
    -subj "/C=KR/ST=Seoul/L=Seoul/O=42Network/OU=42Seoul/CN=sj_server"

# 외부에 있는 경우
# COPY ./ssl/fullchain.pem /etc/nginx/ssl/fullchain.pem
# COPY ./ssl/privkey.pem /etc/nginx/ssl/privkey.pem

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

# FROM nginx:alpine

# COPY . /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/nginx.conf

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]
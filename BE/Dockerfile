FROM node:22-alpine

WORKDIR /usr/src/app

RUN npm i -g @nestjs/cli

# 스크립트 파일 복사
COPY start.sh ./start.sh
# 실행 권한 부여
RUN chmod +x ./start.sh


WORKDIR /usr/src/app/pingpong

CMD ["/usr/src/app/start.sh"]
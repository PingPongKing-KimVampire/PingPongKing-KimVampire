FROM node:22-alpine

WORKDIR /usr/src/app

RUN npm i -g @nestjs/cli

# 스크립트 파일 복사
COPY infinite.sh ./infinite.sh
# 실행 권한 부여
RUN chmod +x ./infinite.sh


WORKDIR /usr/src/app/pingpong

CMD ["/usr/src/app/infinite.sh"]
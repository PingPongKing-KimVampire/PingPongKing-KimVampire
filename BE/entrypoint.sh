#!/bin/sh

# 데이터베이스가 완전히 준비될 때까지 기다림
echo "Waiting for postgres..."

while ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; do
  sleep 1
done

echo "PostgreSQL started"

# 마이그레이션 생성 및 수행
python manage.py makemigrations
python manage.py migrate

# Daphne 서버 시작
exec "$@"

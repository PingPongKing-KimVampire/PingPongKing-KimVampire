FROM python:3.9-alpine

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install psycopg2-binary
# RUN python ./pingpong/manage.py migrate
RUN apk add --no-cache gcc musl-dev libffi-dev \
	&& pip install -r requirements.txt

COPY . /app/

WORKDIR /app/pingpong

RUN python manage.py makemigrations lobby
RUN python manage.py migrate lobby


CMD ["daphne", "-b", "0.0.0.0", "-p", "3001", "kimVampire.asgi:application"]
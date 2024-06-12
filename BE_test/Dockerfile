FROM python:3.9-alpine

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN apk add --no-cache gcc musl-dev libffi-dev \
	&& pip install -r requirements.txt

COPY . /app/

WORKDIR /app/pingpong

CMD ["daphne", "-b", "0.0.0.0", "-p", "3001", "pingpong.asgi:application"]
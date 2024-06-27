FROM python:3.9-alpine

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN apk add --no-cache gcc musl-dev libffi-dev postgresql-dev libpq postgresql-client \
	&& pip install -r requirements.txt

COPY . /app/

COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

WORKDIR /app/pingpong

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["daphne", "-b", "0.0.0.0", "-p", "3001", "kimVampire.asgi:application"]

up: down
	docker-compose up --build

background-up: down
	docker-compose up --build -d

down:
	docker-compose down

.PHONY: down up

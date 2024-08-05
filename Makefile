DATA_DIR = ./BE/data_db
ENV = DATA_PATH=${DATA_DIR}

up: down create-dir
	$(ENV) docker-compose up --build

background-up: down create-dir
	$(ENV) docker-compose up --build -d

down:
	docker-compose down -v

clean:
	rm -rf $(DATA_DIR)

create-dir:
	mkdir -p $(DATA_DIR)

.PHONY: down clean create-dir up

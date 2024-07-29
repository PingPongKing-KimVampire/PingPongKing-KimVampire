DATA_DIR = ./BE/data_db
ENV = DATA_PATH=${DATA_DIR}

up: down clean create-dir
	$(ENV) docker-compose up --build

down:
	docker-compose down -v

clean:
	rm -rf $(DATA_DIR)

create-dir:
	mkdir -p $(DATA_DIR)

.PHONY: down clean create-dir up

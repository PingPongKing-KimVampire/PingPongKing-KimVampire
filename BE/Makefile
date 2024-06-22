DATA_DIR = ../db_data
ENV = DATA_PATH=${DATA_PATH}

up: down clean create-dir
	docker compose up --build

down:
	docker compose down -v

clean:
	rm -rf $(DATA_DIR)

create-dir:
	mkdir -p $(DATA_DIR)

.PHONY: down clean create-dir up

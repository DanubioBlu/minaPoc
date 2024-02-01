include .env

.PHONY: up down stop build

default: up

current_dir = $(shell pwd)

build:
	docker-compose -f docker-compose.yml -f docker-compose.${MODE}.yml  build
up:
	@echo "Starting up containers for for $(PROJECT_NAME)..."
	docker-compose -f docker-compose.yml -f docker-compose.${MODE}.yml up -d --remove-orphans

down: stop

stop:
	@echo "Stopping containers for $(PROJECT_NAME)..."
	@docker-compose -f docker-compose.yml  stop

SHELL := /bin/bash
SPECIES ?= Delphinus delphis
START ?= 2023-01-01
END ?= 2025-12-31

.PHONY: up down restart ps collections demo-data metrics backup admin-dev admin-watch

up:
	docker compose -f infra/docker-compose.yml up -d

down:
	docker compose -f infra/docker-compose.yml down -v

restart:
	docker compose -f infra/docker-compose.yml restart

ps:
	docker compose -f infra/docker-compose.yml ps

collections:
	curl -s http://localhost:5080/collections | jq -r '.collections[].id'

demo-data:
	python scripts/fetch_obis_demo.py --scientificname "$(SPECIES)" --start $(START) --end $(END) --size 1000 --out infra/pygeoapi/localdata/occurrences.geojson
	docker compose -f infra/docker-compose.yml restart pygeoapi
	@echo "OK: /collections/occurrences/items"
	curl -s "http://localhost:5080/collections/occurrences/items?limit=3&f=json" | jq -r '.features[].properties.scientificName'

metrics:
	python scripts/collect_metrics.py

backup:
	./scripts/backup_minio.sh backups

admin-dev:
	@echo "🚀 Iniciando BGAPP Admin em modo desenvolvimento..."
	./start_admin_dev.sh

admin-watch:
	@echo "👀 Iniciando BGAPP Admin com auto-reload..."
	./watch_and_reload.sh

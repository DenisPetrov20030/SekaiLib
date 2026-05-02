API_DIR := api
PROJECT := $(API_DIR)/SekaiLib.csproj

.PHONY: migrate db-update db-reset db-backup db-restore docker-up docker-down docker-reset

migrate:
ifndef name
	$(error name is required: make migrate name=AddSomething)
endif
	cd $(API_DIR) && dotnet ef migrations add $(name) --project SekaiLib.csproj

db-update:
	cd $(API_DIR) && dotnet ef database update --project SekaiLib.csproj

db-reset:
	cd $(API_DIR) && dotnet ef database drop --force --project SekaiLib.csproj
	cd $(API_DIR) && dotnet ef database update --project SekaiLib.csproj

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

docker-reset:
	docker compose down -v
	docker compose up -d --build

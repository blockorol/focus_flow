.PHONY: generate check-backend check-frontend hash-password migrate-up migrate-status migrate-down

generate:
	npm run generate
check-backend:
	npm run check:backend
check-frontend:
	npm run check:frontend
hash-password:
	npm run hash-password
migrate-up:
	npm run migrate:up
migrate-status:
	npm run migrate:status
migrate-down:
	npm run migrate:down

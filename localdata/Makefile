

.PHONY: start

default: up

current_dir = $(shell pwd)

start:
	node node_modules/experimental-offchain-zkapp-storage/build/src/server/storageServer.js

start-d:
	pm2 start node_modules/experimental-offchain-zkapp-storage/build/src/server/storageServer.js --name "tree storage"

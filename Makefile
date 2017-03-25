.PHONY: run

run_locally:
	@export `$(cat .env)` > /dev/null
	./node_modules/nodemon/bin/nodemon.js bot.js

all:
	npm install
	npm run build
	npm run flow-check
	npm run test


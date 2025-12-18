.PHONY: install compile test package

install:
	npm install

compile:
	npm run compile

test:
	npm test

package: install
	npx @vscode/vsce package

clean:
	rm -rf out dist *.vsix

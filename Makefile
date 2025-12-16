.PHONY: install compile test package

install:
	npm install

compile:
	npm run compile

test:
	npm test

package:
	npm install -g @vscode/vsce
	vsce package

clean:
	rm -rf out dist *.vsix

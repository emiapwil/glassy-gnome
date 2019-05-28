SCHEMA_DIR=glassygnome@emiapwil/schemas/
EXTENSION_DIR=~/.local/share/gnome-shell/extensions/
SHELL:=/bin/bash

package: lint deploy
	pushd glassygnome@emiapwil && zip glassygnome@emiapwil.zip -r ./* --exclude \*.swp && popd

schema: $(SCHEMA_DIR)/org.gnome.shell.extensions.glassy-gnome.gschema.xml
	glib-compile-schemas $(SCHEMA_DIR)

deploy: schema clean
	rsync -avz glassygnome@emiapwil --exclude '*.swp' $(EXTENSION_DIR)

clean:
	@rm -f glassygnome@emiapwil/glassygnome@emiapwil.zip

install: package
	gnome-shell-extension-tool -d glassygnome@emiapwil
	rm -rf ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil
	cp -r ./glassygnome@emiapwil ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil
	gnome-shell-extension-tool -e glassygnome@emiapwil

@PHONY: lint
lint:
	npx eslint -c ./.eslintrc.js ./glassygnome@emiapwil/*.js
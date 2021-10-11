SCHEMA_DIR=glassygnome@emiapwil/schemas/
EXTENSION_DIR=~/.local/share/gnome-shell/extensions/
SHELL:=/bin/bash

publish: lint package

package: schema
	zip glassygnome@emiapwil.zip -r glassygnome@emiapwil/* --exclude \*.swp 

schema: $(SCHEMA_DIR)/org.gnome.shell.extensions.glassy-gnome.gschema.xml
	glib-compile-schemas $(SCHEMA_DIR)

install: package
	- gnome-extensions disable -q glassygnome@emiapwi
	gnome-extensions install --force glassygnome@emiapwil.zip
	gnome-extensions enable glassygnome@emiapwil

@PHONY: lint
lint:
	npx eslint -c ./.eslintrc.js ./glassygnome@emiapwil/*.js

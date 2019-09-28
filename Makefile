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
	gnome-extensions disable glassygnome@emiapwil
	rm -rf $(EXTENSION_DIR)/glassygnome@emiapwil
	cp -r ./glassygnome@emiapwil $(EXTENSION_DIR)/glassygnome@emiapwil
	gnome-extensions enable glassygnome@emiapwil

@PHONY: lint
lint:
	npx eslint -c ./.eslintrc.js ./glassygnome@emiapwil/*.js

SCHEMA_DIR=glassygnome@emiapwil/schemas/
EXTENSION_DIR=~/.local/share/gnome-shell/extensions/

package: deploy
	pushd glassygnome@emiapwil && zip glassygnome@emiapwil.zip -r ./* --exclude \*.swp && popd

schema: $(SCHEMA_DIR)/org.gnome.shell.extensions.glassy-gnome.gschema.xml
	glib-compile-schemas $(SCHEMA_DIR)

deploy: schema clean
	rsync -avz glassygnome@emiapwil --exclude '*.swp' $(EXTENSION_DIR)

clean:
	@rm -f glassygnome@emiapwil/glassygnome@emiapwil.zip

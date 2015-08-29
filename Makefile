
package: deploy
	pushd glassygnome@emiapwil && zip glassygnome@emiapwil.zip -r ./* --exclude \*.swp && popd

deploy: clean
	rsync -avz glassygnome@emiapwil --exclude '*.swp' ~/.local/share/gnome-shell/extensions/

clean:
	@rm -f glassygnome@emiapwil/glassygnome@emiapwil.zip

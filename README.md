# Glassy GNOME

A gnome-shell extension to enable window transparency.

# Usage

Put `glassygnome@emiapwil` to the extension folder (Mine is
`~/.local/share/gnome-shell/extensions`).

Put `glassygnome` into the *user's data directory* (Mine is `~/.local/share`).

Edit the `glassygnome/config.json` like in the
[example](glassygnome/config.json):

~~~
{
	"filters": [
		{
			"patterns": ["Terminal"],
			"active_opacity": 80,
			"inactive_opacity": 50,
		},
		{
			"patterns": [".*"],
			"active_opacity": 95,
			"inactive_opacity": 80,
		}
	]
}
~~~

To configure the behaviour of the transparency, first you should define a list
of patterns and the expected opacity that will be set for those which match the
patterns.

# Features in the Future

- A GUI for settings and use the settings schema instead of a configuration file
- Dynamic/Customized opacity
- Shortcut bindings

# Workarounds

The configuration file is read every time the extension updates the opacity, so
it is possible to use a JSON program to modify the values dynamically.

Also shortcuts to enable/disable the extension can be implemented with a simple
script:

~~~
# Enable glassy-gnome globally
gnome-shell-extension-tool -e glassygnome@emiapwil

# Disable glassy-gnome globally
gnome-shell-extension-tool -d glassygnome@emiapwil
~~~

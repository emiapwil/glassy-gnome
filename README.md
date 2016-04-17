# Glassy GNOME

A gnome-shell extension to enable window transparency.

# Usage

Put `glassygnome@emiapwil` to the extension folder (Mine is
`~/.local/share/gnome-shell/extensions`).

## Window Filters

The window filters are tuples in the following format: `(patterns,
active_opacity, inactive_opacity, step)`.

There are two default filters that come with the extension: one is matched
against `Terminal` and the other is wildcard `.*`.

Since there is no GUI to manage the filters at the moment, people can use
`gsettings` to modify them.  For example, the following code inserts a new rule
for *Firefox*:

~~~{.bash}
gsettings --schemadir ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil/schemas \
          set org.gnome.shell.extensions.glassy-gnome filters \
	      "[
              (['Terminal'], byte 0x50, byte 0x32, byte 0x0a),
	          (['Firefox'], byte 0x5f, byte 0x50, byte 0x0a),
	          (['.*'], byte 0x5f, byte 0x50, byte 0x05)
          ]"
~~~

If you are not certain what the regex should look like, it is possible to use
`xwininfo` to see all names of the windows.  Or you can use the [*looking glass
tool*](looking-glass), which is quite useful.

The valid range of `active_opacity`/`inactive_opacity`/`step` are 0~100 (0x00~0x64).
If a given value is larger than 100, it will be treated as 100.

[looking-glass]: https://wiki.gnome.org/Projects/GnomeShell/LookingGlass

## Shortcuts to manipulate the opacity of the active window

Currently I use `<Super>0`/`<Super>9`/`<Super>8` to increase/decrease/reset the
opacity of the active window.

It *SHOULD* be possible to use `gsettings` to modify the shortcuts too but I
haven't tested this.

It is worth pointing out that the changes will not be recorded after the window
is closed.  I might consider adding this as a future feature.

## Auto start

The default value of `auto-start` is `true`.  It *SHOULD* be possible to change
the value to `false` but again I haven't tested it yet.

## Indicator in the status bar

An indicator is put in the status bar with a single letter "G" and the style
class "glassygnome-indicator".  The opacity of the letter is identical to the
opacity of the active window.

## Known Bugs

### Extra key strokes on fully opaque/transparent windows

> If I hit Super+0 for a fully opaque window, say, three times, I need to hit
> Super+9 four times until the window starts becoming transparent.

See [Issue 1][issue-1].

Thanks [@krlmlr](https://github.com/krlmlr) for pointing out the bug.

[issue-1]: https://github.com/emiapwil/glassy-gnome/issues/1

### Not functioning properly with *always-on-top* windows

If a window is sticked to the top (by enabling "always on top"), the opacity of
the normal windows in the same workspace will not change when they loss/obtain
the focus.

See [Issue 2][issue-2].

Thanks [@ipaq3870](https://github.com/ipaq3870) for providing the solution.

[issue-2]: https://github.com/emiapwil/glassy-gnome/issues/2

# Features in the Future

- A GUI for settings
- (DONE) Use the settings schema instead of a configuration file
- (DONE) Shortcut bindings
- (DONE) Dynamic/Customized opacity

# References

[This post][schema usage] is an excellent guide to how to use schemas to store
the configurations.

[schema usage]: http://www.mibus.org/2013/02/15/making-gnome-shell-plugins-save-their-config/

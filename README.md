# Glassy GNOME

A gnome-shell extension to enable window transparency.

# Installation

## Copy the extension to the extension folder manually

Put `glassygnome@emiapwil` to the extension folder (Mine is
`~/.local/share/gnome-shell/extensions`).

## Build from source

Clone this repository and run `make`.

The extension will be compiled and put to folder
`~/.local/share/gnome-shell/extensions`.  You might have to replace the
`EXTENSION_DIR` with the path to the GNOME extensions on your own system.

## Download from extensions.gnome.org

The extension has been uploaded to
[extensions.gnome.org](https://extensions.gnome.org/extension/982/glassy-gnome/).
You can download the extension there.

# Usage

It takes two steps to use glassy GNOME after installation:

- Configure your transparency rules (i.e., window filters) before use
- Configure the window transparency using hot keys
  - Increase opacity of the current window: `<Super> + .`
  - Decrease opacity of the current window: `<Super> + ,`
  - Reset opacity of the current window: `<Super> + '`
  - Toggle the glassy effect of the current window: ``<Super> + ` ``

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

Currently `<Super>,`/`<Super>.`/`<Super>'` are used to increase/decrease/reset the
opacity of the active window, and `<Super>\`` is used to toggle the opacity of
the current window.

There are five shortcuts available for glassy-gnome.  Except the four mentioned
above, you can also toggle both the global glassy effect.  The key binding for
this functionality, however, is not set when you first install the extension.
You can use the following command to set up the shortcuts:

~~~{.bash}
gsettings --schemadir ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil/schemas \
          set org.gnome.shell.extensions.glassy-gnome toggle-glassy-global-key "['<Super>t']"

gsettings --schemadir ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil/schemas \
          set org.gnome.shell.extensions.glassy-gnome toggle-glassy-window-key "['<Super>grave']"

gsettings --schemadir ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil/schemas \
          set org.gnome.shell.extensions.glassy-gnome dec-opacity-key "['<Super>comma']"

gsettings --schemadir ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil/schemas \
          set org.gnome.shell.extensions.glassy-gnome inc-opacity-key "['<Super>period']"

gsettings --schemadir ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil/schemas \
          set org.gnome.shell.extensions.glassy-gnome reset-opacity-key "['<Super>apostrophe']"
~~~

## Auto start

The default value of `auto-start` is `true`.  It *SHOULD* be possible to change
the value to `false` but again I haven't tested it yet.

## Indicator in the status bar

An indicator is put in the status bar with a single letter "G" and the style
class "glassygnome-indicator".  The opacity of the letter is identical to the
opacity of the active window.

### Toggle the Indicator

This feature is included since version 11 and is tested on GNOME 3.18.

People may find the indicator useless and want to disable it.  You can do so by
typing the following command:

~~~
gsettings --schemadir ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil/schemas \
          set org.gnome.shell.extensions.glassy-gnome hide-indicator true
~~~

You can also re-enable the indicator:

~~~
gsettings --schemadir ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil/schemas \
          set org.gnome.shell.extensions.glassy-gnome hide-indicator false
~~~

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

### Increase the opacity for special windows

Some special windows require more opacity, for example, the menus and tool bars
for the browser.  An option named the `mix-ratio` is introduced which will be
used to compute the "mixed" opacity for certain windows.  See [Issue 4][issue 4]
for details.  The option is a byte, ranging from 0 to 255.

The opacity is computed as (slightly different from the implementation but
should be enough to demonstrate how it works):

~~~
ratio = mix_ratio * 100 / 256
new_opacity = (original_opacity * (100 - ratio) + OPAQUE * ratio) / 100
~~~

Generally speaking, the opacity increases as the `mix-ratio` grows. A
`mix-ratio` of 255 means the window will be completely opaque.  The default
value is 0 because of my personal favor, you can use the following command to
set the `mix-ratio`:

~~~
gsettings --schemadir ~/.local/share/gnome-shell/extensions/glassygnome@emiapwil/schemas \
          set org.gnome.shell.extensions.glassy-gnome mix-ratio 128
~~~

Thanks [@ipaq3870](https://github.com/ipaq3870) for pointing out the bug and
providing the basic solution.

[issue-4]: https://github.com/emiapwil/glassy-gnome/issues/4

### The opacity for new window is not correct

The opacity of a new window is always 255 (fully opaque).  It is (probably)
caused because glassy sets the opacity before the window is prepared to respond
to events.

See [Issue 6][issue-6].

[issue-6]: https://github.com/emiapwil/glassy-gnome/issues/6

### Hot keys clash

The old hot keys for this extension is overriden by the 'dock-to-dash' extension. To still use the default key bindings, follow the instructions in [this link](http://ubuntuhandbook.org/index.php/2019/05/disable-super-num-function-keys-in-ubuntu-18-04-19-04/).

# Features in the Future

- A GUI for settings
- A CLI tool for settings
- (DONE) Use the settings schema instead of a configuration file
- (DONE) Shortcut bindings
- (DONE) Dynamic/Customized opacity

# References

[This post][schema usage] is an excellent guide to how to use schemas to store
the configurations.

[schema usage]: http://www.mibus.org/2013/02/15/making-gnome-shell-plugins-save-their-config/

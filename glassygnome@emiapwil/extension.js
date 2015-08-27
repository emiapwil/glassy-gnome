
const GLib = imports.gi.GLib;
const OPAQUE = 255;
const TRANSPARENT = 0;

let settings, activated;
let on_window_created, on_restacked;

function glassify() {
	global.get_window_actors().forEach(function(win) {
		if (!activated) {
			win.set_opacity(OPAQUE);
			return;
		}
		var opacity_percentage = 100;
		var win_name = win.get_meta_window().get_wm_class();
		var is_active = win.get_meta_window().has_focus();

		var matched = false;
		global.log('[glassy-gnome] processing ' + win_name);
		global.log('[glassy-gnome] ' + settings.filters.toSource());
		for (var i in settings.filters) {
			if (matched)
				break;
			var filter = settings.filters[i];

			for (var j in filter.patterns) {
				var pattern = filter.patterns[j];
				var regex = '^' + pattern + '$';

				global.log(win_name + ' matches ' + regex);
				if (win_name.match(regex)) {
					opacity_percentage = (is_active ? filter.active_opacity : filter.inactive_opacity);
					matched = true;
					break;
				}
			}
		}

		var opacity = Math.floor(opacity_percentage * OPAQUE / 100);
		win.set_opacity(opacity);
	});
}

function load_config() {
	var file_path = GLib.get_user_data_dir() + "/glassygnome/config.json";
	var result = GLib.file_get_contents(file_path);

	if (result[0]) {
		settings = eval('(' + result[1] + ')');
	}
}

function update() {
	load_config();
	glassify();
}

function init() {
	global.log("[glassy-gnome]: initialized");
	activated = false;
}

function enable() {
	global.log("[glassy-gnome]: test step 1");
	activated = true;

	on_window_created = global.display.connect('window-created', update);
	on_restacked = global.screen.connect('restacked', update);

	global.log("[glassy-gnome]: test step 2");
	update();
	global.log("[glassy-gnome]: test step 3");
}

function disable() {
	activated = false;

	global.display.disconnect(on_window_created);
	global.screen.disconnect(on_restacked);

	glassify();
}

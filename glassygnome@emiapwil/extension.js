
const Main           = imports.ui.main;
const Shell          = imports.gi.Shell;
const ExtensionUtils = imports.misc.extensionUtils;
const Glassy         = ExtensionUtils.getCurrentExtension();
const Convenience    = Glassy.imports.convenience;
const Indicator      = Glassy.imports.indicator;
//TODO const Preference     = Glassy.imports.preference;
const GLib           = imports.gi.GLib;
const Meta           = imports.gi.Meta;

const OPAQUE      = 255;
const TRANSPARENT = 0;

const toggle_key        = 'toggle-glassy-global-key';
const toggle_window_key = 'toggle-glassy-window-key';
const inc_key           = 'inc-opacity-key';
const dec_key           = 'dec-opacity-key';
const reset_key         = 'reset-opacity-key';

var settings, filters, activated;

var on_window_created, on_restacked, on_focused;

var setting_signals;

var indicator = Indicator.Indicator();

function glassy_log(text) {
    global.log('[glassy-gnome]: ' + text);
}

function is_active_window(win) {
    let active_workspace_index = global.screen.get_active_workspace_index();
    let meta_win = win.get_meta_window();
    let workspace_index = meta_win.get_workspace().index();
    return meta_win.has_focus() && (workspace_index == active_workspace_index);
}

function get_active_window() {
    let active_windows = global.get_window_actors().filter(function(win) {
        return is_active_window(win);
    });
    return (active_windows.length > 0 ? active_windows[0] : null);
}

function configure_glassy_window(meta_win) {
    if (meta_win.glassy == null) {
        meta_win.glassy = {
            enabled:    true,
            filter:     null,
            offset:     0
        };
    }
    for (let i in filters) {
        let filter = filters[i];
        for (let j in filter.patterns) {
            let pattern = filter.patterns[j];
            if (meta_win.get_wm_class().match('^' + pattern + '$')) {
                meta_win.glassy.filter = filter;
                return;
            }
        }
    }
}

function test_glassy_window(meta_win) {
    if (meta_win.glassy == null) {
        configure_glassy_window(meta_win);
    }
}

function reconfigure_windows() {
    global.get_window_actors().forEach(function (win) {
        configure_glassy_window(win.get_meta_window());
    });
}

function update_opacity(win, opacity) {
    win.set_opacity(opacity);

    if (!is_active_window(win)) {
        return;
    }

    indicator.set_opacity(opacity);
}

function glassify() {
    global.get_window_actors().forEach(function(win) {
        if (!activated) {
            update_opacity(win, OPAQUE);
            return;
        }
        let meta_win = win.get_meta_window();

        test_glassy_window(meta_win);

        let glassy = meta_win.glassy;
        let win_name = meta_win.get_wm_class();
        let is_active = meta_win.has_focus();

        if ((glassy.filter == null) || (!glassy.enabled)) {
            update_opacity(win, OPAQUE);
            return;
        }

        let filter = glassy.filter;
        let opacity_percentage = (is_active ? filter.active_opacity
                                            : filter.inactive_opacity);
        opacity_percentage += glassy.offset;
        opacity_percentage = regulate(opacity_percentage);

        let opacity = Math.floor(opacity_percentage * OPAQUE / 100);
        update_opacity(win, opacity);
    });
}

function regulate(opacity_percentage) {
    return Math.max(0, Math.min(100, opacity_percentage));
}

function reload_filters() {
    let _filters = settings.get_value('filters');
    filters = [];

    for (let i = 0; i < _filters.n_children(); ++i) {
        let _filter = _filters.get_child_value(i);

        let _patterns = _filter.get_child_value(0).get_strv();
        let _active_opacity = _filter.get_child_value(1).get_byte();
        let _inactive_opacity = _filter.get_child_value(2).get_byte();
        let _step = _filter.get_child_value(3).get_byte();

        let filter = {
            patterns:           _patterns,
            active_opacity:     regulate(_active_opacity),
            inactive_opacity:   regulate(_inactive_opacity),
            step:               regulate(_step)
        };
        filters.push(filter);
    }
}

function toggle_glassy_global() {
    activated = !activated;

    glassify();
}

function toggle_glassy_window() {
    let win = get_active_window();
    if (win != null) {
        let meta_win = win.get_meta_window();
        test_glassy_window(meta_win);

        if (activated) {
            meta_win.glassy.enabled = !meta_win.glassy.enabled;
        }
    }

    glassify();
}

function test_opacity_overflow(opacity) {
    return (opacity >= 100);
}

function test_opacity_underflow(opacity) {
    return (opacity <= 0);
}

function increase_window_opacity() {
    let win = get_active_window();
    if (win != null) {
        let meta_win = win.get_meta_window();

        test_glassy_window(meta_win);

        let glassy = meta_win.glassy;

        if (activated && glassy.enabled && glassy.filter) {
            if (!test_opacity_overflow(glassy.offset + glassy.filter.active_opacity)) {
                glassy.offset += glassy.filter.step;
            }
        }
    }

    glassify();
}

function decrease_window_opacity() {
    let win = get_active_window();
    if (win != null) {
        let meta_win = win.get_meta_window();

        test_glassy_window(meta_win);

        let glassy = meta_win.glassy;

        if (activated && glassy.enabled && glassy.filter) {
            if (!test_opacity_underflow(glassy.offset + glassy.filter.active_opacity)) {
                glassy.offset -= glassy.filter.step;
            }
        }
    }

    glassify();
}

function reset_window_opacity() {
    let win = get_active_window();
    if (win != null) {
        let meta_win = win.get_meta_window();
        test_glassy_window(meta_win);

        if (activated && meta_win.glassy.enabled) {
            meta_win.glassy.offset = 0;
        }
    }

    glassify();
}

function _add_keybinding(key, func) {
    if (Main.wm.addKeybinding) {
        Main.wm.addKeybinding(key, settings, Meta.KeyBindingFlags.NONE,
                              Shell.ActionMode.ALL, func);
    } else {
        global.display.add_keybinding(key, settings, Meta.KeyBindingFlags.NONE, func);
    }
    glassy_log("Successfully add key binding for " + key);
}

function _remove_keybinding(key) {
    if (Main.wm.removeKeybinding) {
        Main.wm.removeKeybinding(key);
    } else {
        global.display.remove_keybinding(key);
    }
}

function bind_shortcuts() {
    _add_keybinding(toggle_key, toggle_glassy_global);
    _add_keybinding(toggle_window_key, toggle_glassy_window);
    _add_keybinding(inc_key, increase_window_opacity);
    _add_keybinding(dec_key, decrease_window_opacity);
    _add_keybinding(reset_key, reset_window_opacity);
}

function unbind_shortcuts() {
    _remove_keybinding(toggle_key);
    _remove_keybinding(toggle_window_key);
    _remove_keybinding(inc_key);
    _remove_keybinding(dec_key);
    _remove_keybinding(reset_key);
}

function init() {
    settings = null;

    indicator.init();

    glassy_log("initialized");
}

function update_settings() {
    if (settings != null) {
        unbind_shortcuts();
    }

    settings = Convenience.getSettings();

    reload_filters();
    reconfigure_windows();

    bind_shortcuts();
}

function connect_signals() {
    setting_signals = [];

    setting_signals.push(settings.connect('changed::filters', update_settings));
    setting_signals.push(settings.connect('changed::' + toggle_key, update_settings));
    setting_signals.push(settings.connect('changed::' + toggle_window_key, update_settings));
    setting_signals.push(settings.connect('changed::' + inc_key, update_settings));
    setting_signals.push(settings.connect('changed::' + dec_key, update_settings));
    setting_signals.push(settings.connect('changed::' + reset_key, update_settings));
}

function disconnect_signals() {
    setting_signals.forEach(function (signal) {
        if (signal) {
            settings.disconnect(signal);
        }
    });
    setting_signals = []
}

function create_label() {
    indicator.enable();
}

function destroy_label() {
    indicator.disable();
}

function enable() {
    update_settings();
    activated = settings.get_boolean('auto-start');

    on_window_created = global.display.connect('window-created', glassify);
    on_restacked = global.screen.connect('restacked', glassify);
    on_focused = global.display.connect('notify::focus-window', glassify);

    connect_signals();
    create_label();

    glassify();

    glassy_log("enabled");
}

function disable() {
    activated = false;

    destroy_label();
    disconnect_signals();

    global.display.disconnect(on_window_created);
    global.screen.disconnect(on_restacked);

    glassify();

    glassy_log("disabled");
}

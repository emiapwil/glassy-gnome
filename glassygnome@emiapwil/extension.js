
var Main = imports.ui.main;
var Shell = imports.gi.Shell;
var ExtensionUtils = imports.misc.extensionUtils;
var Glassy = ExtensionUtils.getCurrentExtension();
var Convenience = Glassy.imports.convenience;
var Indicator = Glassy.imports.indicator;
//TODO const Preference     = Glassy.imports.preference;
var GLib = imports.gi.GLib;
var Meta = imports.gi.Meta;

var OPAQUE = 255;
var TRANSPARENT = 0;

// setting key names
var AUTO_START = 'auto-start';
var OPAQUE_FULLSCREEN = 'opaque-fullscreen';
var FILTERS = 'filters';
var TOGGLE_KEY = 'toggle-glassy-global-key';
var TOGGLE_WINDOW_KEY = 'toggle-glassy-window-key';
var INC_KEY = 'inc-opacity-key';
var DEC_KEY = 'dec-opacity-key';
var RESET_KEY = 'reset-opacity-key';
var HIDE_INDICATOR = 'hide-indicator';
var MIX_RATIO = 'mix-ratio';

var window_type_map = {
    0: 'NORMAL',           // Meta.WindowType.NORMAL
    1: 'DESKTOP',          // Meta.WindowType.DESKTOP
    2: 'DOCK',             // Meta.WindowType.DOCK
    3: 'DIALOG',           // Meta.WindowType.DIALOG
    4: 'MODAL_DIALOG',     // Meta.WindowType.MODAL_DIALOG
    5: 'TOOLBAR',          // Meta.WindowType.TOOLBAR
    6: 'MENU',             // Meta.WindowType.MENU
    7: 'UTILITY',          // Meta.WindowType.UTILITY
    8: 'SPLASHSCREEN',     // Meta.WindowType.SPLASHSCREEN
    9: 'DROPDOWN_MENU',    // Meta.WindowType.DROPDOWN_MENU
    10: 'POPUP_MENU',       // Meta.WindowType.POPUP_MENU
    11: 'TOOLTIP',          // Meta.WindowType.TOOLTIP
    12: 'NOTIFICATION',     // Meta.WindowType.NOTIFICATION
    13: 'COMBO',            // Meta.WindowType.COMBO
    14: 'DND',              // Meta.WindowType.DND
    15: 'OVERRIDE_OTHER'    // Meta.WindowType.OVERRIDE_OTHER
};

var window_type_to_be_mixed = [
    Meta.WindowType.SPLASHSCREEN,
    Meta.WindowType.DROPDOWN_MENU,
    Meta.WindowType.POPUP_MENU,
    Meta.WindowType.TOOLTIP,
    Meta.WindowType.OVERRIDE_OTHER
];

var settings, filters, activated, opaque_fullscreen;

var signals;

var indicator = Indicator.Indicator();

var MAX_MIX_RATIO = 256;
var mix_ratio;

function glassy_log(text) {
    global.log('[glassy-gnome]: ' + text);
}

var active_workspace_index;

function is_active_window(win) {
    const active_workspace_index = global.screen ?
        // mutter < 3.29
        global.screen.get_active_workspace_index():
        // mutter >= 3.29
        global.workspace_manager.get_active_workspace_index();

    const meta_win = win.get_meta_window();
    const workspace_index = meta_win.get_workspace().index();
    global.log("fullscreen?" + meta_win.get_wm_class() + ": " + meta_win.is_fullscreen());
    return meta_win.has_focus() && (workspace_index == active_workspace_index);
}

function get_active_window() {
    let active_windows = global.get_window_actors().filter(function (win) {
        return is_active_window(win);
    });
    return (active_windows.length > 0 ? active_windows[0] : null);
}

function find_filter(window_class) {
    for (let i in filters) {
        let filter = filters[i];
        for (let j in filter.patterns) {
            let pattern = filter.patterns[j];
            if (window_class.match('^' + pattern + '$')) {
                return filter;
            }
        }
    }
    return null;
}

function configure_glassy_window(meta_win) {
    if (meta_win.glassy == null) {
        meta_win.glassy = {
            enabled: true,
            filter: null,
            offset: 0
        };
    }
    let window_class = meta_win.get_wm_class() || '';

    meta_win.glassy.filter = find_filter(window_class);
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
    if ((win.opacity == null) || (win.opacity != opacity)) {
        win.set_opacity(opacity);
    }

    if (!is_active_window(win)) {
        return;
    }

    indicator.set_opacity(opacity);
}

function regulate(opacity_percentage, win_type) {
    win_type = win_type || Meta.WindowType.NORMAL;
    if (window_type_to_be_mixed.indexOf(win_type) != -1) {
        let mixed = opacity_percentage * (MAX_MIX_RATIO - mix_ratio) + 100 * mix_ratio;
        opacity_percentage = mixed / MAX_MIX_RATIO;
    }
    return Math.max(0, Math.min(100, opacity_percentage));
}

function glassify() {
    global.get_window_actors().forEach(function (win) {
        if (!activated) {
            update_opacity(win, OPAQUE);
            return;
        }

        let meta_win = win.get_meta_window();

        test_glassy_window(meta_win);

        let glassy = meta_win.glassy;
        let win_name = meta_win.get_wm_class();
        let is_active = meta_win.has_focus();
        let win_type = meta_win.get_window_type() || Meta.WindowType.NORMAL;

        if ((glassy.filter == null) || (!glassy.enabled)) {
            update_opacity(win, OPAQUE);
            return;
        }

        if ((opaque_fullscreen) && (meta_win.is_fullscreen())) {
            update_opacity(win, OPAQUE);
            return;
        }

        let filter = glassy.filter;
        let opacity_percentage = (is_active ? filter.active_opacity
            : filter.inactive_opacity);
        opacity_percentage += glassy.offset;
        opacity_percentage = regulate(opacity_percentage, win_type);

        let opacity = Math.floor(opacity_percentage * OPAQUE / 100);
        update_opacity(win, opacity);
    });
}

function reload_filters() {
    let _filters = settings.get_value(FILTERS);
    filters = [];

    for (let i = 0; i < _filters.n_children(); ++i) {
        let _filter = _filters.get_child_value(i);

        let _patterns = _filter.get_child_value(0).get_strv();
        let _active_opacity = _filter.get_child_value(1).get_byte();
        let _inactive_opacity = _filter.get_child_value(2).get_byte();
        let _step = _filter.get_child_value(3).get_byte();

        let filter = {
            patterns: _patterns,
            active_opacity: regulate(_active_opacity),
            inactive_opacity: regulate(_inactive_opacity),
            step: regulate(_step)
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
        Main.wm.addKeybinding(key, settings,
                              Meta.KeyBindingFlags.PER_WINDOW,
                              Shell.ActionMode.ALL, func);
    } else {
        global.display.add_keybinding(key, settings, Meta.KeyBindingFlags.NONE, func);
    }
    glassy_log('Successfully add key binding for ' + key);
}

function _remove_keybinding(key) {
    if (Main.wm.removeKeybinding) {
        Main.wm.removeKeybinding(key);
    } else {
        global.display.remove_keybinding(key);
    }
}

function bind_shortcuts() {
    _add_keybinding(TOGGLE_KEY, toggle_glassy_global);
    _add_keybinding(TOGGLE_WINDOW_KEY, toggle_glassy_window);
    _add_keybinding(INC_KEY, increase_window_opacity);
    _add_keybinding(DEC_KEY, decrease_window_opacity);
    _add_keybinding(RESET_KEY, reset_window_opacity);
}

function unbind_shortcuts() {
    _remove_keybinding(TOGGLE_KEY);
    _remove_keybinding(TOGGLE_WINDOW_KEY);
    _remove_keybinding(INC_KEY);
    _remove_keybinding(DEC_KEY);
    _remove_keybinding(RESET_KEY);
}

function init() {
    settings = null;

    glassy_log('initialized');
}

function update_settings() {
    if (settings != null) {
        unbind_shortcuts();
    }

    settings = Convenience.getSettings();

    opaque_fullscreen = settings.get_boolean(OPAQUE_FULLSCREEN);
    mix_ratio = settings.get_value(MIX_RATIO).get_byte();
    reload_filters();
    reconfigure_windows();

    bind_shortcuts();
}

function connect_signal(obj, signal, handler) {
    var _signal = obj.connect(signal, handler);
    if (_signal) {
        signals.push([obj, _signal]);
    }
}

function disconnect_signals() {
    signals.forEach(function (signal) {
        var obj = signal[0], sig = signal[1];
        if (sig) {
            obj.disconnect(sig);
        }
    });
    signals = [];
}

function create_label() {
    var hidden = settings.get_boolean(HIDE_INDICATOR) || false;
    if (!hidden) {
        indicator.init();
        indicator.enable();
    }
}

function destroy_label() {
    indicator.disable();
    indicator.destroy();
}

function update_label() {
    var hidden = settings.get_boolean(HIDE_INDICATOR) || false;
    if (!hidden) {
        create_label();
    } else {
        destroy_label();
    }
}

function asynchronous_glassify() {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, glassify);
}

function enable() {
    update_settings();
    activated = settings.get_boolean(AUTO_START) || true;

    signals = [];

    // signals for window events
    connect_signal(global.display, 'window-created', asynchronous_glassify);
    if (global.screen) {
        // mutter < 3.29
        connect_signal(global.screen, 'restacked', glassify);
    } else {
        // mutter >= 3.29
        connect_signal(global.display, 'restacked', glassify);
    }
    connect_signal(global.display, 'notify::focus-window', glassify);

    // signals for settings
    connect_signal(settings, 'changed::' + OPAQUE_FULLSCREEN, update_settings);
    connect_signal(settings, 'changed::' + FILTERS, update_settings);
    connect_signal(settings, 'changed::' + TOGGLE_KEY, update_settings);
    connect_signal(settings, 'changed::' + TOGGLE_WINDOW_KEY, update_settings);
    connect_signal(settings, 'changed::' + INC_KEY, update_settings);
    connect_signal(settings, 'changed::' + DEC_KEY, update_settings);
    connect_signal(settings, 'changed::' + RESET_KEY, update_settings);
    connect_signal(settings, 'changed::' + HIDE_INDICATOR, update_label);
    connect_signal(settings, 'changed::' + MIX_RATIO, update_settings);

    create_label();

    glassify();

    glassy_log('enabled');
}

function disable() {
    activated = false;

    destroy_label();
    disconnect_signals();

    glassify();

    glassy_log('disabled');
}

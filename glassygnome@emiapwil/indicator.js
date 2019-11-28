const Clutter        = imports.gi.Clutter;
const Main           = imports.ui.main;
const PanelMenu      = imports.ui.panelMenu;
const St             = imports.gi.St;

function Indicator() {

    var indicator, label;

    function init() {
        if (indicator) {
            return;
        }

        indicator = new PanelMenu.Button();
        Main.panel.addToStatusArea('glassygnome_indicator', indicator);
    }

    function is_enabled() {
        return (label != null);
    }

    function enable() {
        if (label) {
            return;
        }

        label = new St.Label({
            text: 'G',
            style_class: 'glassygnome-indicator',
            y_align: Clutter.ActorAlign.CENTER
        });

        indicator.actor.add_actor(label);
    }

    function disable() {
        if (label) {
            label.destroy();
            label = null;
        }
    }

    function destroy() {
        if (indicator) {
            indicator.destroy();
            indicator = null;
        }
    }

    function set_opacity(opacity) {
        if (label) {
            label.set_opacity(opacity);
        }
    }

    return {
        init:           init,
        destroy:        destroy,
        enable:         enable,
        disable:        disable,
        set_opacity:    set_opacity
    };
}

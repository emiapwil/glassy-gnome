const Clutter        = imports.gi.Clutter;
const Main           = imports.ui.main;
const PanelMenu      = imports.ui.panelMenu;
const St             = imports.gi.St;

function Indicator() {

    var indicator, label;

    function init() {
        indicator = new PanelMenu.Button();
        Main.panel.addToStatusArea('glassygnome_indicator', indicator);
    }

    function enable() {
        label = new St.Label({
            text: 'G',
            style_class: "glasygnome-indicator",
            y_align: Clutter.ActorAlign.CENTER
        });

        indicator.actor.add_actor(label);
    }

    function disable() {
        label.destroy();
    }

    function set_opacity(opacity) {
        if (label) {
            label.set_opacity(opacity);
        }
    }

    return {
        init:           init,
        enable:         enable,
        disable:        disable,
        set_opacity:    set_opacity,
    };
}

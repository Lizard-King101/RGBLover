const fs = require('fs');
const path = require('path');
const {
    parse,
    stringify,
    assign 
  } = require('comment-json');

var time = {
    last: 0,
    now: 0,
    deltaTime: 0
};
var scheme = {
    name: "RGBLover",
    foreground: "",
    var_settings: {
        foreground: {
            hue: 0,
            saturation: 1,
            lightness: .5,
        },
        cursorColor: {
            hue: 0,
            saturation: 1,
            lightness: 0.5
          },
        black: {
            hue: 0.5,
            saturation: 1,
            lightness: 0.5
        },
        green: {
            hue: 0.5,
            saturation: 1,
            lightness: 0.5
        },
        yellow: {
            hue: 0.75,
            saturation: 1,
            lightness: 0.5
        },
        selectionBackground: {
            hue: 0.5,
            saturation: 1,
            lightness: 0.5
        }
    },
    background: "#1b1b1b",
    frames: 16,
    speed: 1
};
var scheme_index = null;
var settings_data = null;
var settings_path = null;

var var_settings = null;

function Loop() {
    time.now = new Date().getTime();
    // CODE RUN

    for(let var_string of Object.keys(var_settings)){
        let settings = var_settings[var_string];
        settings.hue += (scheme.speed / 10000) * time.deltaTime;
        settings.hue = settings.hue % 1;
    }
    saveScheme();

    // END CODE
    if(time.last) time.deltaTime = time.now - time.last;
    time.last = time.now;
}

function Initialize() {
    let packages = path.join(process.env.APPDATA, '..', 'local', 'Packages');
    let originalFile = null;
    fs.readdir(packages, (err, files) => {
        if(err) {console.error(err); return}
        for(file of files) {
            if(file.includes('Microsoft.WindowsTerminal')) {
                settings_path = path.join(packages, file, 'LocalState', 'settings.json');
                originalFile = path.join(packages, file, 'LocalState', 'original_settings.json');
                break;
            }
        }
        fs.readFile(settings_path, {encoding: 'utf-8'}, (err, data) => {
            if(err) {console.log(err); return;}
            settings_data = parse(data.toString());
            scheme_index = settings_data.schemes.map(s => s.name).indexOf('RGBLover');
            console.log('SCHEME INDEX', scheme_index);
            settings_data.profiles.list[settings_data.profiles.list.map(l => l.guid).indexOf(settings_data.defaultProfile)].colorScheme = "RGBLover"
            if(scheme_index < 0){
                settings_data.schemes.push(scheme);
                scheme_index = settings_data.schemes.length - 1;
                var_settings = JSON.parse(JSON.stringify(scheme.var_settings));
                saveScheme(originalFile);
            } else {
                scheme = settings_data.schemes[scheme_index];
                var_settings = JSON.parse(JSON.stringify(scheme.var_settings));
                console.log(scheme);
                saveScheme();
            }

            setInterval(Loop, 1000 / scheme.frames);
        })
    })
}


function saveScheme(path = null) {
    setVars();
    settings_data.schemes[scheme_index] = scheme;
    let data = path ? stringify(settings_data, null, 2) : JSON.stringify(settings_data);
    fs.writeFileSync(path ? path : settings_path, data);
}

function setVars() {
    let var_keys = Object.keys(var_settings);
    for(var_string of var_keys){
        let vars = var_settings[var_string];
        let [r,g,b] = hslToRgb(vars.hue, vars.saturation, vars.lightness);
        let hex = rgbToHex(r,g,b);
        scheme[var_string] = hex;
    }
}

function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

Initialize();
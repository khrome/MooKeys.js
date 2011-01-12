var MooKeys = {
    registry :[],
    interval : 1000,
    active : null,
    register : function(keysequence){
        this.registry.push(keysequence);
    },
    results : {},
    report : function(id, parseFunc){
        if(MooKeys.results[id] && MooKeys.results[id].length > 0){
            var res = parseFunc(MooKeys.results[id].clone());
            var evnt;
            if (document.createEventObject){
                var evt = document.createEventObject();
                evnt = document.fireEvent('cardSwipe',evt)
            }else{
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent(event, true, true ); // event type,bubbling,cancelable
                !document.dispatchEvent(evt);
                evnt = evt
            }
            evnt.swipe = res;
            MooKeys.results[id].empty();
            document.fireEvent('cardSwipe', [evnt]);
        }
    },
    dateStack : [],
    eventStack : [],
    keyStack : [],
    keypress : function(keyEvent){
        var now = new Date().getTime();
        while(MooKeys.dateStack.length != 0 && MooKeys.dateStack[0] + MooKeys.interval < now){
            MooKeys.eventStack.shift();
            MooKeys.dateStack.shift();
            MooKeys.keyStack.shift();
        }
        MooKeys.eventStack.push(keyEvent);
        MooKeys.dateStack.push(now);
        MooKeys.keyStack.push(String.fromCharCode(keyEvent.code));
        var str = MooKeys.keyStack.join('');
        var subs;
        MooKeys.registry.each(function(sequence){
            if(sequence.containedIn){
                subs = sequence.containedIn(str);
                if(subs && subs.length){ //scan for a sequence
                    if(MooKeys.results[sequence.id]) MooKeys.results[sequence.id].combine(subs);
                    else MooKeys.results[sequence.id] = subs;
                    MooKeys.report.delay(400, this, [sequence.id, sequence.processResults]);
                    MooKeys.eventStack.empty();
                    MooKeys.dateStack.empty();
                    MooKeys.keyStack.empty();
                }
            }
            if(sequence.wasPressed){
                if(sequence.wasPressed(keyEvent)){
                    if(sequence.callback) sequence.callback(keyEvent);
                }
            }
        });
    },
    on : function(){
        if(this.active == null){
            document.addEvent('keypress', MooKeys.keypress);
            this.active = true;
        }else{
            this.active = true;
        }
    },
    off : function(){
        this.active = false;
    }
};

var MooKeyPattern = new Class({
    pattern : null,
    callback : null,
    id : null,
    shift_nums : { "`":"~", "1":"!", "2":"@", "3":"#", "4":"$", "5":"%", "6":"^", "7":"&", "8":"*", "9":"(", "0":")", "-":"_", "=":"+", ";":":", "'":"\"", ",":"<", ".":">", "/":"?", "\\":"|" },
    special_keys : { 'esc':27, 'escape':27, 'tab':9, 'space':32, 'return':13, 'enter':13, 'backspace':8, 'scrolllock':145, 'scroll_lock':145, 'scroll':145, 'capslock':20, 'caps_lock':20, 'caps':20, 'numlock':144, 'num_lock':144, 'num':144,  'pause':19, 'break':19,  'insert':45, 'home':36, 'delete':46, 'end':35, 'pageup':33, 'page_up':33, 'pu':33, 'pagedown':34, 'page_down':34, 'pd':34, 'left':37, 'up':38, 'right':39, 'down':40, 'f1':112, 'f2':113, 'f3':114, 'f4':115, 'f5':116, 'f6':117, 'f7':118, 'f8':119, 'f9':120, 'f10':121, 'f11':122, 'f12':123 },
    initialize : function(pattern, callback){
        this.pattern = pattern;
        this.id = this.uuid();
        this.callback = callback;
        var default_options = {
			'type':'keydown',
			'propagate':false,
			'disable_in_input':false,
			'target':document,
			'keycode':false
		}
		if(!this.opt) this.opt = default_options;
		else {
			for(var dfo in default_options) {
				if(typeof this.opt[dfo] == 'undefined') this.opt[dfo] = default_options[dfo];
			}
		}
    },
    wasPressed : function(event){
        // this code is long descendent from http://www.openjs.com/scripts/events/keyboard_shortcuts/
        // but you can still note the overlap
        var modifiers = {
            shift: { wanted:false, pressed:false},
            ctrl : { wanted:false, pressed:false},
            alt  : { wanted:false, pressed:false},
            meta : { wanted:false, pressed:false}	//Meta is Mac specific
        };
        var character = String.fromCharCode(event.code);
        if(event.code == 188) character = ",";
        if(event.code == 190) character = ".";
        if(event.control) modifiers.ctrl.pressed = true;
        if(event.shift) modifiers.shift.pressed = true;
        if(event.alt) modifiers.alt.pressed = true;
        if(event.meta) modifiers.meta.pressed = true;
        var keys = this.pattern.split("+");
        var kp = 0;
        for(var i=0; k=keys[i],i<keys.length; i++) {
            switch(k){
                case 'ctrl':
                case 'control':
                    modifiers.ctrl.wanted = true;
                    break;
                case 'shift':
                    modifiers.shift.wanted = true;
                    break;
                case 'alt':
                case 'opt':
                case 'option':
                    modifiers.alt.wanted = true;
                    break;
                case 'meta':
                case 'apple':
                case 'command':
                case '◆':
                case '⌘':
                case '':
                    modifiers.meta.wanted = true;
                    break;
                default:
                    if(this.opt['keycode']){
                        if(this.opt['keycode'] == code) kp--;
                    }else{
                        if(this.shift_nums[character] && event.shift) { //Still allow 'shift+[int]'
                            character = this.shift_nums[character];
                            if(character != k) kp--;
                        }
                    }
            }
            kp++;
        }
        if(
            kp == keys.length &&
            modifiers.ctrl.pressed == modifiers.ctrl.wanted &&
            modifiers.shift.pressed == modifiers.shift.wanted &&
            modifiers.alt.pressed == modifiers.alt.wanted &&
            modifiers.meta.pressed == modifiers.meta.wanted
        ){
            this.callback(event);
            if(!this.opt['propagate']) { //Stop the event
                event.stopPropagation();
                return false;
            }
        }
    },
    processResults : function(results){
        return results;
    },
    uuid : function(){
        var s = [];
        var hexDigits = "0123456789ABCDEF";
        for (var i = 0; i < 32; i++)  s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        s[12] = "4";
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);
        return s.join("");
    }
});

var MooKeySequence = new Class({
    pattern : null,
    callback : null,
    id : null,
    initialize : function(regex, callback){
        this.pattern = regex;
        this.id = this.uuid();
        this.callback = callback;
    },
    containedIn : function(str){
        if(this.pattern instanceof Array){
            var result = [];
            var temp;
            this.pattern.each(function(pattern){
                temp = str.match(pattern);
                if(temp) result.combine(temp);
            });
            return result;
        } else return str.match(this.pattern);
    },
    processResults : function(results){
        return results;
    },
    uuid : function(){
        var s = [];
        var hexDigits = "0123456789ABCDEF";
        for (var i = 0; i < 32; i++)  s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        s[12] = "4";
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);
        return s.join("");
    }
});

Element.Events.cardSwipe = {
        base : 'keypress',
        condition: function(event) {
            return event.swipe; // alt key?
        }
    };

var MooCreditSwipe = new Class({
    Extends : MooKeySequence,
    initialize : function(callback){
        this.pattern = [
            /%B[0-9]{16}\^[A-Z ]+\/[A-Z ]+\^[0-9]{23}\?/mi,
            /;[0-9]{16}=[0-9]{20}\?/mi
        ];
        this.id = this.uuid();
        this.callback = callback;
    },
    processResults : function(incoming){
        var results = {};
        var something = false;
        incoming.each(function(result){
            if(result.substring(0,1) == '%'){
                var parts = result.substring(2,result.length-2).split('^');
                results.account = parts[0];
                if(parts[1].indexOf('/') != -1){
                    var last = parts[1].substring(0, parts[1].indexOf('/'));
                    last = last.substring(0,1).toUpperCase()+last.substring(1, last.length).toLowerCase();
                    results.last_name = last;
                    var first = parts[1].substring(parts[1].indexOf('/')+1, parts[1].length);
                    if(first.indexOf(' ') != -1){
                        results.middle_initial = first.substring(first.indexOf(' ')+1, first.length);
                        first = first.substring(0, first.indexOf(' '));
                    }
                    first = first.substring(0,1).toUpperCase()+first.substring(1, first.length).toLowerCase();
                    results.first_name = first;
                    results.name = first+' '+last;
                }else results.name = parts[1];
                results.exp_year = parts[2].substring(0, 2);
                results.exp_month = parts[2].substring(2, 4);
                something = true;
            }
            if(result.substring(0,1) == ';'){
                var parts = result.substring(1,result.length-1).split('=');
                results.account = parts[0];
                results.exp_year = parts[1].substring(0, 2);
                results.exp_month = parts[1].substring(2, 4);
                something = true;
            }
        });
        if(something) return results;
        else return incoming;
        //return incoming;
    }
});


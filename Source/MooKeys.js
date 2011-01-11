var MooKeys = {
    registry :[],
    interval : 1000,
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
            subs = sequence.containedIn(str);
            if(subs && subs.length){
                if(MooKeys.results[sequence.id]) MooKeys.results[sequence.id].combine(subs);
                else MooKeys.results[sequence.id] = subs;
                MooKeys.report.delay(400, this, [sequence.id, sequence.processResults]);
                MooKeys.eventStack.empty();
                MooKeys.dateStack.empty();
                MooKeys.keyStack.empty();
            }
        });
    },
    on : function(){
        document.addEvent('keypress', MooKeys.keypress);
    }
};

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


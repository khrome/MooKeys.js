MooKeys.js
===========

Is a keycommand utility which provides a multi-key keystroke recognizer as well as a pattern scanner for quickly typed words or machine fed input (such as a magstripe reader or MICR reader), as well as an implementation of the 'cardSwipe' event for magnetic card readers in the browser.

How to use
----------

To use a magnetic swipe, you just need to attach a listener to the document:

    MooKeys.on();
    MooKeys.register(new MooCreditSwipe());
    document.addEvent('cardSwipe', function(event){
        // manipulate event.swipe here
    });
    
To define a key sequence:

    MooKeys.register(new MooKeyPattern('meta+s', function(){
        // implement save here!
    }));
    
To make your own scanner, just define it's regex:

    MooKeys.register(new MooKeySequence(/help/i, function(event){
        // provide some help!
    }));
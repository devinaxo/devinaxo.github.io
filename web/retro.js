/* The only script the retro site needs: a hit counter that counts visits in
   localStorage, so the odometer in the footer actually goes up on a real
   visit instead of being a screenshot of a number. Everything else on the
   page is static HTML, like it should be.

   It also keeps the links back to the desktop from nesting desktops inside
   each other, see initDesktopLinks below.

   If localStorage is unavailable (private mode, file:// in some browsers) the
   counter just falls back to its markup value. */
(function () {
    'use strict';

    var KEY = 'devinaxo.web.hits';
    var SEED = 13371337; // the number the page ships with

    // Set when the desktop says hello, which means this copy of the page is
    // the one loaded inside its Netscape window
    var inDesktopWindow = false;
    function pad(value) {
        var out = String(value);
        while (out.length < 8) {
            out = '0' + out;
        }
        return out;
    }

    function bump() {
        var hits = SEED;
        try {
            var stored = parseInt(window.localStorage.getItem(KEY), 10);
            if (!isNaN(stored) && stored >= SEED) {
                hits = stored + 1;
            } else {
                hits = SEED + 1;
            }
            window.localStorage.setItem(KEY, String(hits));
        } catch (err) {
            hits = SEED;
        }
        return hits;
    }

    function render(value) {
        var digits = document.querySelectorAll('[data-counter-digit]');
        if (!digits.length) {
            return;
        }
        var text = pad(value);
        for (var i = 0; i < digits.length; i++) {
            digits[i].textContent = text.charAt(i) || '0';
        }
    }

    function init() {
        var counter = document.querySelector('[data-counter]');
        if (!counter) {
            return;
        }
        var hits = bump();
        counter.setAttribute('title', hits + ' visits');
        render(hits);
        var readout = document.querySelector('[data-counter-text]');
        if (readout) {
            readout.textContent = hits.toLocaleString('en-US');
        }
    }

    /* Links marked data-desktop point back at the Windows 98 desktop. Inside
       the Netscape window following one would load a whole desktop into the
       page frame, which would then load this site into its own browser
       window, which would load a desktop again: a desktop inside a desktop
       inside a desktop, forever. So instead of following the link, the page
       asks the desktop to open the window it wanted and stays where it is.

       Opened on its own, at /web/, there is no desktop window to ask, the
       page is never introduced, and the links do the normal thing.

       The introduction is a handshake in both directions: the page says
       hello and the desktop answers, and the page asks again for a few
       seconds in case it asked before the desktop was listening, because
       either of the two can finish loading first. */
    function initDesktopLinks() {
        var origin = window.location.origin;
        // A file:// page has a "null" origin, which is not a usable
        // targetOrigin, so fall back to the permissive one there
        if (!origin || origin === 'null') {
            origin = '*';
        }

        var framed = window.parent !== window;

        function sayHello() {
            if (!framed) {
                return;
            }
            window.parent.postMessage({
                type: 'devinaxo:desktop-hello'
            }, origin);
        }

        window.addEventListener('message', function (e) {
            if (e.data && e.data.type === 'devinaxo:desktop-hello') {
                inDesktopWindow = true;
            }
        });

        var links = document.querySelectorAll('a[data-desktop]');
        Array.prototype.forEach.call(links, function (link) {
            link.addEventListener('click', function (e) {
                if (!inDesktopWindow) {
                    return; // let the href do its job
                }
                e.preventDefault();
                window.parent.postMessage({
                    type: 'devinaxo:desktop',
                    open: link.getAttribute('data-desktop')
                }, origin);
            });
        });

        if (framed) {
            sayHello();
            var tries = 0;
            var retry = setInterval(function () {
                if (inDesktopWindow || ++tries > 20) {
                    clearInterval(retry);
                    return;
                }
                sayHello();
            }, 250);
        }
    }

    function initAll() {
        init();
        initDesktopLinks();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();

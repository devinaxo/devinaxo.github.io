/* The guestbook form, which is the one piece of this site that talks to
   something. It sends through the very same EmailJS service and template as
   the Contact Me window on the Windows 98 desktop, so every entry lands in
   the same inbox and neither form needs its own credentials.

   The template was written for a mail compose window, with three variables:
   remittent (who it is from), subject, and message. A guestbook entry is not
   quite those three things, so the visible form asks for name, e-mail and
   homepage as well, and on submit the entry is packed into the three the
   template knows about. The extra fields ride along untouched: EmailJS only
   fills in what the template mentions.

   Entries are not stored anywhere. They arrive as mail and get pasted into
   guestbook.html by hand, which is why the "previous visitors" list down
   there only changes when I am feeling nostalgic. */
(function () {
    'use strict';

    var SERVICE_ID = 'service_vzrlfd8';
    var TEMPLATE_ID = 'template_g90oli5';
    var RESET_AFTER = 4000;

    var IDLE = 'Post it';
    var SENDING = 'Sending...';
    var SENT = 'Thanks for signing!';
    var FAILED = 'Something went wrong...';

    function init() {
        var form = document.getElementById('guestbook-form');
        if (!form || !window.emailjs) {
            return;
        }

        var button = document.getElementById('gb-send');
        var status = document.getElementById('gb-status');
        var name = document.getElementById('gb-name');
        var email = document.getElementById('gb-email');
        var homepage = document.getElementById('gb-homepage');
        var message = document.getElementById('gb-message');
        var remittent = document.getElementById('gb-remittent');
        var subject = document.getElementById('gb-subject');
        var body = document.getElementById('gb-body');
        var entry = trim(message.value);

        function trim(value) {
            return (value || '').replace(/^\s+|\s+$/g, '');
        }

        // A page with a trailing slash or a bare host is a link worth keeping
        // as typed; anything else gets the scheme so it is still a link when
        // it shows up in a mail client
        function homepageLink(value) {
            var url = trim(value);
            if (!url) return '';
            return /^(https?:)?\/\//i.test(url) || /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(url)
                ? url
                : 'http://' + url;
        }

        function say(text) {
            if (status) status.textContent = text;
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var who = trim(name.value) || 'Anonymous';
            var from = trim(email.value);
            var page = homepageLink(homepage.value);
            var entry = trim(message.value);

            // The Cc line is the closest thing the template has to a "from",
            // so use the address when there is one and the name when there
            // is not: the entry is always attributable either way
            remittent.value = from || who;
            subject.value = 'Guestbook entry from ' + who;

            var lines = [entry, ''];
            lines.push('--');
            lines.push('Name: ' + who);
            if (from) lines.push('E-mail: ' + from);
            if (page) lines.push('Homepage: ' + page);
            lines.push('');
            lines.push('Sent from the guestbook at http://www.devinaxo.com/web/guestbook.html');
            body.value = lines.join('\n');

            button.textContent = SENDING;
            button.disabled = true;
            say('Sending your entry...');

            window.emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form).then(function () {
                button.textContent = SENT;
                say('Your entry is on its way to my inbox. I read every one, and I publish them by hand, so it may take a while.');
                form.reset();
                window.setTimeout(function () {
                    button.textContent = IDLE;
                }, RESET_AFTER);
            }, function (err) {
                // The entry is left in the form on purpose: nobody should have
                // to retype a message because a network blinked
                button.textContent = IDLE;
                say(FAILED + ' Nothing was sent, and your message is still in the box above. If it keeps happening, mail me at gar.la.ignacio@gmail.com.');
                if (window.console && window.console.error) {
                    window.console.error('guestbook: emailjs said no', err);
                }
            }).then(function () {
                button.disabled = false;
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

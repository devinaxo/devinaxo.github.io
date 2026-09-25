function updateTime(){
    let d = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    document.getElementById('time').innerText = d;
}
var players = {};
function onYouTubeIframeAPIReady() {
    $('iframe').each(function() {
        var iframeId = $(this).attr('id');
        players[iframeId] = new YT.Player(iframeId);
    });
}

$(document).ready(function(){
    updateTime();
    setInterval(updateTime, 1000);

    // Windows are dragged by their title bar, but in the stacked
    // layout they sit in the normal document flow, so dragging is
    // disabled there and any inline position left over from a resize is
    // cleared so the windows fall back into place.
    var mqStacked = window.matchMedia('(max-width: 820px)');
    var mqTouch = window.matchMedia('(hover: none)');

    // On pointer-sized screens the folder windows float free of the page
    // flow, each with its own spot, so opening one never pushes another
    // around. The stacked layout keeps them in flow instead.
    var cascade = {
        win1: { top: 0, left: 0 },
        win2: { top: 56, left: 56 },
        win5: { top: 112, left: 112 },
        win6: { top: 168, left: 168 },
        win7: { top: 224, left: 224 }
    };

    // Windows that keep a fit-content width: the listings are as wide as
    // their content and never run out of room. The rest get a calc() width,
    // because fit-content is a shrink-to-fit and also depends on how much
    // room is left to the right of the window, which made them visibly
    // grow and shrink while being dragged. A percentage in calc() resolves
    // against .centered, which does not move, so those stay consistent.
    var fitContentWindows = { win1: true, win2: true };

    function mountFolder(winId, winEl){
        var pos = cascade[winId];
        if (!pos || mqStacked.matches) return;
        // Already floating (and possibly dragged somewhere): leave it alone
        if (winEl[0].style.position === 'absolute') return;
        winEl.css({
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            width: fitContentWindows[winId] ? 'fit-content' :
                'calc(100% - ' + pos.left + 'px)'
        });
    }

    // Clicking (or opening) a window brings it to the front. win3/win4 live
    // inside fixed wrappers that form their own stacking contexts, so those
    // wrappers are what get raised.
    var zTop = 10;

    function raiseWindow(winEl){
        var frame = winEl.closest('.portfolio-window, .address-window');
        zTop += 1;
        (frame.length ? frame : winEl).css('z-index', zTop);
    }

    function syncDraggable(){
        if (mqStacked.matches) {
            $('.window').draggable('disable').css({
                top: '', left: '', right: '', width: '', height: '',
                position: ''
            });
            $('.centered > .window').resizable('disable');
            $('.centered > .window .ui-resizable-handle').hide();
        } else {
            $('.window').draggable('enable');
            $('.centered > .window').resizable('enable');
            $('.centered > .window .ui-resizable-handle').show();
            // Back from the stacked layout: float the open folders again
            $.each(cascade, function(winId){
                var winEl = $('#' + winId);
                if (winEl.is(':visible')) {
                    mountFolder(winId, winEl);
                }
            });
        }
    }

    $( ".window" ).draggable({ handle: ".title-bar" });

    $('.centered > .window').resizable({
        handles: 'e, s, se',
        minWidth: 320,
        minHeight: 150
    });

    syncDraggable();
    if (typeof mqStacked.addEventListener === 'function') {
        mqStacked.addEventListener('change', syncDraggable);
    } else if (typeof mqStacked.addListener === 'function') {
        mqStacked.addListener(syncDraggable);
    }

    const notme = $('#notme');
    $('#cc-btn').on('click', function(){
        if(notme.attr('type') == 'email'){
            notme.attr('type', 'text');
            notme.attr('placeholder', 'Name (Click button to change Cc signature)');
        }else{
            notme.attr('type', 'email');
            notme.attr('placeholder', 'E-mail (Click button to change Cc signature)');
        }
        notme.val('');
    });

    notme.keypress(function(e){
        if(notme.attr('type') == 'text'){
            if(String.fromCharCode(e.keyCode).match(/[^a-zA-Z áéíóú ÁÉÍÓÚ]/gi)) return false;
        }
    });

    const clickableSpots = $('.clickable-folder, .clickable-window');
    let currWin;

    function selectIcon(spot){
        spot.css('background-color', 'gray');
        clickableSpots.not(spot).each(function(){
            $(this).css('background-color', 'transparent');
        })
    }

    // Taskbar task for each window; My Info's button ships in the HTML
    var taskInfo = {
        win1: { label: 'Projects', icon: 'img/directory_closed-4.png' },
        win2: { label: 'Multimedia', icon: 'img/directory_closed-4.png' },
        win3: { label: 'My Info', icon: 'img/help_book_cool-4.png' },
        win4: { label: 'Contact Me', icon: 'img/envelope_closed-0.png' },
        win5: { label: 'Imaging', icon: 'img/images/image_old_jpeg-0.png' },
        win6: { label: 'experiences.txt', icon: 'img/notepad_file-2.png' },
        win7: { label: 'MS-DOS Prompt', icon: 'img/ms_dos-1.png' }
    };

    function ensureTask(winId){
        if ($('.task-btn[data-window="' + winId + '"]').length) {
            return;
        }
        var info = taskInfo[winId];
        if (!info) return;
        $('<button type="button" class="task-btn"' +
          ' aria-pressed="true" data-window="' + winId + '">' +
          '<img src="' + info.icon + '" alt=""> ' + info.label +
          '</button>').appendTo('#task-buttons');
    }

    function removeTask(winId){
        $('.task-btn[data-window="' + winId + '"]').remove();
    }

    // A window's taskbar button and desktop icon mirror its visibility:
    // pressed / open image while shown, popped out / closed image while
    // hidden (minimized or closed)
    function syncWindowState(winId){
        var visible = $('#' + winId).is(':visible');
        $('.task-btn[data-window="' + winId + '"]')
            .attr('aria-pressed', visible ? 'true' : 'false');
        clickableSpots.filter(function(){
            return $(this).data('window') == winId;
        }).each(function(){
            setIconImage($(this), visible);
        });
    }

    // Win98-style first open: the window frame appears at once, then its
    // contents paint in piece by piece. Closing the window (as opposed to
    // minimizing it) arms the animation again for the next open.
    var firstOpened = {};
    var loadTimers = {}; // pending paints per window, so an interrupted
                         // run can be cancelled cleanly

    function simulateFirstLoad(winId, winEl, wipe){
        if (firstOpened[winId]) return;
        firstOpened[winId] = true;

        // Cancel still-pending paints from an interrupted earlier run
        $.each(loadTimers[winId] || [], function(index, id){
            clearTimeout(id);
        });
        loadTimers[winId] = [];

        var parts = [];
        var delays = [];
        var i;
        if (winId === 'win1' || winId === 'win2') {
            // Empty list panel first, then the header row, then the rows
            // painting in one by one like a listview filling up
            parts = winEl.find('.sunken-panel, thead tr').get()
                .concat(winEl.find('tbody tr').get());
            delays = [150, 280];
            for (i = 2; i < parts.length; i++) {
                delays.push(320 + (i - 2) * 30);
            }
        } else if (winId === 'win4') {
            // Form fields appear one after another, in random order
            parts = winEl.find('.address-form > *').get();
            for (i = parts.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var swap = parts[i];
                parts[i] = parts[j];
                parts[j] = swap;
            }
            for (i = 0; i < parts.length; i++) {
                delays.push(100 + i * 110);
            }
        } else if (winId === 'win6') {
            // Notepad: the file paints in a couple of lines at a time,
            // like a slow disk, and ends up exactly as it was
            var ta = winEl.find('.notepad-text');
            if (!ta.length) return;
            if (ta.data('fullText') === undefined) {
                ta.data('fullText', ta.val());
            }
            var rows = String(ta.data('fullText')).split('\n');
            var chunk = 2;
            ta.val('');
            for (i = 0; i * chunk < rows.length; i++) {
                (function(step){
                    loadTimers[winId].push(setTimeout(function(){
                        ta.val(rows.slice(0, Math.min(rows.length,
                            (step + 1) * chunk)).join('\n'));
                        ta[0].scrollTop = 0;
                    }, 150 + step * 45));
                })(i);
            }
            return;
        } else if (winId === 'win7') {
            // MS-DOS Prompt: the console types out its boot and greeting,
            // then the prompt itself wakes up. Reopening an already used
            // console keeps the scrollback; a Refresh (wipe) reboots it.
            var out = winEl.find('#dos-output');
            var line = winEl.find('.dos-line');
            if (!out.length) return;
            if (out.data('greeting') === undefined) {
                out.data('greeting', out.children().map(function(){
                    return $(this).text();
                }).get());
            }
            line.css('visibility', 'hidden');
            if (wipe) {
                out.empty().removeData('booted');
            }
            if (out.data('booted')) {
                loadTimers[winId].push(setTimeout(function(){
                    line.css('visibility', '');
                }, 120));
                return;
            }
            out.empty();
            var stream = [
                '',
                'Starting MS-DOS...',
                '',
                'HIMEM is testing extended memory...done.',
                ''
            ].concat(out.data('greeting')).join('\n');
            var bootEl = $('<div>').appendTo(out);
            var chars = Math.max(1, Math.round(stream.length / 60));
            for (i = 0; i * chars < stream.length; i++) {
                (function(step){
                    loadTimers[winId].push(setTimeout(function(){
                        bootEl.text(stream.slice(0, (step + 1) * chars));
                        out.scrollTop(out[0].scrollHeight);
                    }, 200 + step * 24));
                })(i);
            }
            loadTimers[winId].push(setTimeout(function(){
                out.data('booted', true);
                line.css('visibility', '');
                if (out.closest('.window').is(':visible')) {
                    $('#dos-input').focus();
                }
            }, 200 + Math.ceil(stream.length / chars) * 24 + 80));
            return;
        } else {
            return;
        }

        if (!parts.length) return;
        // visibility (not display): the layout stays exactly in place, so
        // the window paints into its final geometry with no jumping
        $(parts).css('visibility', 'hidden');
        $.each(parts, function(index){
            var el = this;
            loadTimers[winId].push(setTimeout(function(){
                el.style.visibility = '';
            }, delays[index]));
        });
    }

    function showWindow(winId){
        var winEl = $('#' + winId);
        winEl.show();
        if (winEl.hasClass('window')) {
            winEl.css('display', 'flex');
        }
        ensureTask(winId);
        syncWindowState(winId);
        mountFolder(winId, winEl);
        raiseWindow(winEl);
        simulateFirstLoad(winId, winEl);
        // In the stacked layout the window opens below the icons, so bring it into view
        if (mqStacked.matches && winEl.length && winEl[0].scrollIntoView) {
            winEl[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return winEl;
    }

    function hideWindow(winId){
        var winEl = $('#' + winId);
        winEl.hide();
        var iframe = winEl.find('iframe');
        if (iframe.length && iframe[0].contentWindow) {
            iframe[0].contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'pauseVideo',
                args: ''
            }), '*');
        }
    }

    function setIconImage(spot, open){
        var iconId = spot.data('icon');
        var src = open ? spot.data('icon-open') : spot.data('icon-closed');
        if (iconId && src) {
            $('#' + iconId).attr('src', src);
        }
    }

    // Windows open independently: opening one never closes another, and a
    // folder's icon stays open while its own window is open
    function openFolder(folder){
        folder.css('background-color', 'transparent');
        showWindow(folder.data('window'));
    }

    function openSpot(spot){
        if (spot.hasClass('clickable-folder')) {
            openFolder(spot);
        } else {
            showWindow(spot.data('window'));
        }
    }

    clickableSpots.on('click', function(){
        selectIcon($(this));
        // Touch devices don't reliably fire dblclick, so open on a single tap
        if (mqTouch.matches) {
            openSpot($(this));
        }
    })

    clickableSpots.on('dblclick', function(){
        openSpot($(this));
    })

    $('.window-close').on('click', function(){
        currWin = $(this).data('window');
        hideWindow(currWin);
        // Closing removes the window's task; minimizing keeps it
        removeTask(currWin);
        syncWindowState(currWin);
        // Closing arms the first-load animation again; minimizing doesn't
        delete firstOpened[currWin];
        // Closing the MS-DOS Prompt also wipes the console (output and the
        // half-typed command), so the next open boots from scratch.
        // Minimizing leaves everything on screen.
        if (currWin === 'win7') {
            $('#dos-output').empty().removeData('booted');
            $('#dos-input').val('');
        }
        // Clear the highlight of the icon that opened the closed window
        clickableSpots.filter(function(){
            return $(this).data('window') == currWin;
        }).css('background-color', 'transparent');
    })

    $('.window-minimize').on('click', function(){
        currWin = $(this).data('window');
        hideWindow(currWin);
        syncWindowState(currWin);
    })

    // Taskbar buttons restore/minimize their window, like Win98 tasks
    $(document).on('click', '.task-btn', function(){
        currWin = $(this).data('window');
        var win = $('#' + currWin);
        if (win.is(':visible')) {
            hideWindow(currWin);
        } else {
            showWindow(currWin);
        }
        syncWindowState(currWin);
    })

    // Touching anywhere in a window (including starting a drag) raises it
    $(document).on('mousedown', '.window', function(){
        raiseWindow($(this));
    })

    // Menu bars: clicking a title (File, Edit, ...) opens its dropdown,
    // clicking it again or anything outside the menu bar closes them
    function closeMenus(){
        $('.menu-group.open').removeClass('open');
    }

    $(document).on('click', '.menu-item', function(){
        var group = $(this).closest('.menu-group');
        var wasOpen = group.hasClass('open');
        closeMenus();
        if (!wasOpen) {
            group.addClass('open');
        }
    });

    $(document).on('click', '.menu-entry', function(){
        closeMenus();
        var action = $(this).data('action');
        var winEl = $(this).closest('.window');
        if (action === 'close') {
            winEl.find('.window-close').first().trigger('click');
        } else if (action === 'refresh') {
            // Replays the window's first-load animation
            var winId = winEl.attr('id');
            delete firstOpened[winId];
            simulateFirstLoad(winId, winEl, true);
        } else if (action === 'send') {
            var sendBtn = document.getElementById('button');
            if (sendBtn) sendBtn.click();
        } else if (action === 'about') {
            showWindow('win3');
        }
    });

    $(document).on('click', function(e){
        if (!$(e.target).closest('.menu-bar').length) {
            closeMenus();
        }
    });

    // MS-DOS Prompt: a fake console with commands, easter eggs and
    // command history on the arrow keys (type HELP to get started)
    var dosHistory = [];
    var dosHistIdx = 0;

    function dosPrint(lines){
        var out = $('#dos-output');
        $.each(lines, function(i, line){
            $('<div>').text(line === '' ? '\u00a0' : line).appendTo(out);
        });
        out.scrollTop(out[0].scrollHeight);
    }

    // Prints rows as a div with two fixed columns: [0] is the command/name
    // in the left column, [1] the description on the right. The left column
    // is sized to the longest entry so every row starts at the same place.
    function dosPrintCols(rows){
        var out = $('#dos-output');
        var w = 1;
        $.each(rows, function(i, row){
            w = Math.max(w, (row[0] || '').length);
        });
        w += 2;
        $.each(rows, function(i, row){
            $('<div class="dos-row">')
                .append($('<span class="dos-col-a">').text(row[0] || '')
                    .css('width', w + 'ch'))
                .append($('<span class="dos-col-b">').text(row[1] || ''))
                .appendTo(out);
        });
        out.scrollTop(out[0].scrollHeight);
    }

    // Prints rows with one fixed column per cell: every column is as wide
    // as its longest entry (+2ch), the last one takes what is left. Used
    // by DIR, whose listing has name / size / date / time / long name.
    function dosPrintTable(rows){
        var out = $('#dos-output');
        var cols = 0;
        $.each(rows, function(i, row){
            cols = Math.max(cols, row.length);
        });
        var widths = [];
        for (var c = 0; c < cols; c++){
            var w = 1;
            $.each(rows, function(i, row){
                w = Math.max(w, (row[c] || '').length);
            });
            widths.push(w + 2);
        }
        $.each(rows, function(i, row){
            var line = $('<div class="dos-row">');
            for (var c = 0; c < cols; c++){
                var cell = $('<span class="dos-col-a">').text(row[c] || '');
                if (c < cols - 1){
                    cell.css('width', widths[c] + 'ch');
                }
                line.append(cell);
            }
            line.appendTo(out);
        });
        out.scrollTop(out[0].scrollHeight);
    }

    // The NACHO easter egg: ASCII art printed verbatim as one block
    var dosArt = `===
               *+=++++=
                ---===++*+===++++++++*************++
                 --=====*+***++++++++******###+-==++*++
                 =---=*==##*++++++++++++*****====+++**+++
                  ::--+*+++++++++++++++**#%*#===+++++***+++
                  -:++*+++++++++++++++++*+*##+===+*+==#*+++=
                  ==+++*++++++++**+++++++++++===-=*+==***+++++
                  ++++**+==+++***++++++++++===+++=*+==+#*+++++++
                 +=+***+=====+*++++++++++++++=++===+==***++++++++
                ++++*+++=====+*+++++==+++++++++++*+++****++++++++++
               *++++*+++==-===++=========++++++++*++*++*++++++++++++
               ++++==+%%%%===+===--===---==+++++==+++=+++++++++++++++
               *===-:+=%@#==++==---+=%*%%++++++++==+++++++++++++++++++
               +==-::=++*+++++==+*%%%%#=:::--======++==++++==+++++++++++
               ++==--=++*********+-----::...:-=====++===++===++++++++++++
              *++=====+*******+++=-::::.....::--==============++++++====+=
            +++++++==+******+++==-:..........::--=============++++++=====++
           +++++++++#******+==----:...........::--============++++=========+
         *++++++++++%%%%%%*+-----:.............::-=========++++++++======+===
        +====+++***#%%%#%%%#-:-:-:::::.......::::--======+++++++++=======++==+
       +=====++***#+@%%%%**=--::::++-:.......:::---======++++++++========*#==+
       =---==++**##*++##**+=----=*=-:.......:::----====++++++++++=======+#**==
      =----==++**####+=*#**+====::::.......:::----===+++++++++=========++*-++*
     =----===+**####**+------::::.........:::---===+++++++++++=========++++=+=
   +=-----==++*####****+--::::::::.....:::::--==++++++++++==================++
 =-::::-===+*#%###****+++=--::::::::..::::-=+++++++++++=====---=-====+======+*
=------+#***********+==++===--:::::::::-===++++++++====----------===+=======+*+
======**++++*******+=--===---:--::::::::--=======---------------=+*=+=======++.
+=====%**#++**#*++*+=---===-:::::::::::::--==-----:::---------+*##*++*========
+====+=*####**#*+++++=----==--:::::::::::-------::::----==+***##+=-=*+=======+
==+==++*#%%#*##*++===+=--::-++---:::::::::---::::::--+********=============++
     =+#%%###%%*+++++===--:-%%%#+-:::::::::::::::==+***++**-----==========+
               *++++++++==+#%%%%-==+=-::::::-=++******=----:::---========
               **+++++++===+%@*---:------------:::------:::::::---======+
                ***+++======%@#-:::::::---:::::::::::::::::..::---=====++
                  **+===========-:::::::::::::::::::.::::::::::--=======
                   #+++======--+---:::::::::::::::::::::::::-==+========
                     **++++====+#+=-:::::-----==========--:--===========
                                           ++++++++++++++++=============
                                              +++++===++++++==========
                                            +==++======++++========++
                                           =-===+=====++++==+==+*+
                                        ==----===-===+**
                                       ===+-==-----=*
                                      ==+==--==---=
                                     %#*##==+%+--
                                       %####+**`;


    var dosFiles = {
        'readme.txt': [
            'Thanks for reading me.',
        ],
        'autoexec.bat': [
            '@ECHO OFF',
            'PROMPT $P$G',
            'PATH=C:\\DOS;C:\\WINDOWS',
            'TEMP=C:\\TEMP',
            'SET PORTFOLIO=DEVINAXO',
            ''
        ]
    };
    var notepadText = $('#win6 .notepad-text').val() || '';
    dosFiles['experiences.txt'] = notepadText.split(/\r?\n/);
    dosFiles['experience.txt'] = dosFiles['experiences.txt'];

    function dosRun(raw){
        var out = $('#dos-output');
        var echoEl = $('<div>').text('C:\\>' + raw).appendTo(out);
        var scrollEl = null;

        var cmd = raw.trim();
        if (cmd) {
            dosHistory.push(cmd);
        }
        dosHistIdx = dosHistory.length;

        var parts = cmd.toLowerCase().split(/\s+/);
        var head = parts[0];

        switch (head) {
        case '':
            // Empty line
            break;
        case 'help':
            dosPrint([
                'For more information on a specific command, type HELP command-name'
            ]);
            dosPrintCols([
                ['CLS', 'Clears the screen.'],
                ['COLOR', 'Changes the text color (try COLOR 0A).'],
                ['DATE', 'Displays the current date.'],
                ['DIR', 'Lists the contents of this portfolio.'],
                ['ECHO', 'Prints text back at you.'],
                ['EXIT', 'Quits the MS-DOS Prompt.'],
                ['LINKEDIN', 'Opens LinkedIn in a new tab.'],
                ['MORE', 'Prints a file (try MORE readme.txt).'],
                ['PING', 'Pings a host.'],
                ['TIME', 'Displays the current time.'],
                ['TREE', 'Displays the directory tree.'],
                ['TWITTER', 'Opens Twitter in a new tab.'],
                ['VER', 'Displays the Windows version.'],
                ['WHOAMI', 'Tells you who you are.']
            ]);
            dosPrint([
                '',
                'Type EXIT to quit the MS-DOS Prompt. Find the cool ones first though.'
            ]);
            break;
        case 'cls':
            out.empty();
            break;
        case 'ver':
            dosPrint([
                '',
                'Nacho(R) Windows 98',
                '   [Version 4.10.1998]',
                ''
            ]);
            break;
        case 'dir':
            dosPrint([
                '',
                ' Volume in drive C has no label',
                ' Volume Serial Number is 1981-1998',
                '',
                ' Directory of C:\\',
                ''
            ]);
            dosPrintTable([
                ['.', '<DIR>', '09-25-26', '12:00a', '.'],
                ['..', '<DIR>', '09-25-26', '12:00a', '..'],
                ['GATODEX', '<DIR>', '09-25-26', '12:00a', 'GATODEX'],
                ['REVISOR', '<DIR>', '09-25-26', '12:00a', 'REVISOR-ORTOGRAFICO'],
                ['FARMRPG', '<DIR>', '09-25-26', '12:00a', 'FARM-RPG-AUTOMATION'],
                ['APRETALO', '<DIR>', '09-25-26', '12:00a', 'APRETALO-MATI'],
                ['METODOS', '<DIR>', '09-25-26', '12:00a', 'NUMERICAL-METHODS'],
                ['EXPERIENC TXT', '1,337', '09-25-26', '12:00a', 'EXPERIENCES.TXT'],
                ['README TXT', '640', '09-25-26', '12:00a', 'README.TXT'],
                ['AUTOEXEC BAT', '37', '09-25-26', '12:00a', 'AUTOEXEC.BAT'],
                ['COMMAND COM', '93,890', '09-25-26', '12:00a', 'COMMAND.COM']
            ]);
            dosPrint([
                '        8 file(s)        96,211 bytes',
                '        5 dir(s)  69,606,604 bytes free',
                ''
            ]);
            break;
        case 'date':
            dosPrint(['Current date is ' + new Date().toDateString(), '']);
            break;
        case 'time':
            var now = new Date();
            dosPrint([
                'Current time is ' + now.toTimeString().slice(0, 8) +
                    '.' + ('0' + now.getMilliseconds()).slice(-2),
                ''
            ]);
            break;
        case 'echo':
            dosPrint([raw.trim().replace(/^echo\s*/i, ''), '']);
            break;
        case 'whoami':
            dosPrint(['Lila', '']);
            break;
        case 'whoislila':
        case 'whoslila':
            dosPrint(['Lila... Please. I beg you, let me back in...', '']);
            break;
        case 'tree':
            dosPrint([
                'C:.\\',
                '+-- GATODEX',
                '+-- REVISOR',
                '+-- FARM-RPG-AUTOMATION',
                '+-- APRETALO-MATI',
                '+-- NUMERICAL-METHODS',
                '+-- EXPERIENCES.TXT',
                '+-- README.TXT',
                ''
            ]);
            break;
        case 'color':
            var dosColors = {
                '3': '#00aaaa', '6': '#aa5500', '7': '#aaaaaa',
                '8': '#555555', '9': '#5555ff', 'a': '#55ff55',
                'b': '#55ffff', 'c': '#ff5555', 'd': '#ff55ff',
                'e': '#ffff55', 'f': '#ffffff'
            };
            var code = (parts[1] || '').slice(-1);
            if (dosColors[code]) {
                $('#win7 .window-body').css('color', dosColors[code]);
            } else {
                dosPrint(['Invalid parameter. Try COLOR 0A, COLOR 0E or COLOR 07.', '']);
            }
            break;
        case 'ping':
            var host = parts[1] || 'localhost';
            dosPrint([
                '',
                'Pinging ' + host + ' [127.0.0.1] with 32 bytes of data:',
                '',
                'Reply from 127.0.0.1: bytes=32 time<10ms TTL=128',
                'Reply from 127.0.0.1: bytes=32 time<10ms TTL=128',
                'Reply from 127.0.0.1: bytes=32 time<10ms TTL=128',
                'Reply from 127.0.0.1: bytes=32 time<10ms TTL=128',
                '',
                'Ping statistics for 127.0.0.1:',
                '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)',
                ''
            ]);
            break;
        case 'win':
            dosPrint(['Okay, you have won!', '']);
            break;
        case 'sudo':
            dosPrint(['Wrong, you dummy.', '']);
            break;
        case 'format':
            dosPrint([
                '',
                'Yeah you wish',
                ''
            ]);
            break;
        case 'linkedin':
            dosPrint(['Opening LinkedIn...', '']);
            window.open('https://www.linkedin.com/in/devinacho/', '_blank');
            break;
        case 'twitter':
        case 'x':
            dosPrint(['Opening Twitter...', '']);
            window.open('https://twitter.com/devinachoes', '_blank');
            break;
        case 'devinaxo':
        case 'devinacho':
        case 'nacho':
            $('<pre class="dos-art">').text(dosArt.replace(/\r/g, '')).appendTo(out);
            scrollEl = echoEl;
            break;
        case 'about':
            dosPrint(['you like it?', '']);
            break;
        case 'more':
            var fileArg = parts.slice(1).join(' ');
            if (!fileArg) {
                dosPrint([
                    'Usage: MORE filename',
                    'Available files: README.TXT, EXPERIENCES.TXT, AUTOEXEC.BAT',
                    ''
                ]);
            } else if (dosFiles[fileArg]) {
                dosPrint(dosFiles[fileArg]);
            } else {
                dosPrint([fileArg.toUpperCase() + ' File not found', '']);
            }
            break;
        case 'cd':
            dosPrint(['Maybe later.', '']);
            break;
        case 'exit':
            $('#win7 .window-close').trigger('click');
            break;
        default:
            dosPrint(['Bad command or file name.', '']);
        }

        if (scrollEl) {
            out[0].scrollTop += scrollEl[0].getBoundingClientRect().top -
                out[0].getBoundingClientRect().top;
        } else {
            out.scrollTop(out[0].scrollHeight);
        }
    }

    $('#dos-input').on('keydown', function(e){
        if (e.key === 'Enter') {
            var raw = this.value;
            this.value = '';
            dosRun(raw);
        } else if (e.key === 'ArrowUp') {
            if (dosHistIdx > 0) {
                dosHistIdx -= 1;
                this.value = dosHistory[dosHistIdx];
                e.preventDefault();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (dosHistIdx < dosHistory.length - 1) {
                dosHistIdx += 1;
                this.value = dosHistory[dosHistIdx];
            } else {
                dosHistIdx = dosHistory.length;
                this.value = '';
            }
        }
    });

    $('#win7 .window-body').on('click', function(e){
        if (!mqTouch.matches && !$(e.target).is('input')) {
            $('#dos-input').focus();
        }
    });

    $(document).ready(function() {
        // Handle icon-based modal triggers (existing functionality)
        $('[data-trigger-modal]:not(tr)').each(function() {
            var $iconSpot = $(this);
            var $image = $iconSpot.find('img');
            var modalId = $image.attr('id').replace('image', 'modal');
            var $modal = $('#' + modalId);
            var $modalImg = $modal.find('.modal-content');
            var hqImage = $image.attr('alt');
            var closeId = $image.attr('id').replace('image', 'close');
            var $closeBtn = $('#' + closeId);
            var $iframeContainer = $modal.find('.iframe-container');
            var iframeHtml = $iframeContainer.length ? $iframeContainer.html() : '';

            $iconSpot.on('dblclick', function() {
                $modal.show();
                $modalImg.attr('src', hqImage);
            });
            $closeBtn.on('click', function() {
                $modal.hide();
                if ($iframeContainer.length && iframeHtml) {
                    $iframeContainer.html(iframeHtml);
                }
            });
            $iconSpot.on('click', function() {
                $iconSpot.css('background-color', 'unset');
            });
        });

        var viewerMedia = {
            modal01: {
                kind: 'image',
                src: 'img/images/shantien.png',
                title: 'shantien.png - Imaging',
                task: 'shantien.png',
                icon: 'img/images/image_old_jpeg-0.png'
            },
            modal02: {
                kind: 'image',
                src: 'img/images/sniff.jpg',
                title: 'sniff.jpg - Imaging',
                task: 'sniff.jpg',
                icon: 'img/images/image_old_jpeg-0.png'
            },
            modal03: {
                kind: 'video',
                src: 'https://www.youtube.com/embed/t38tMHRHRco?enablejsapi=1&rel=0',
                title: 'Depression nap - Media Player',
                task: 'Depression nap',
                icon: 'img/images/media_player_file-2.png'
            },
            modal04: {
                kind: 'image',
                src: 'img/images/literally_me.png',
                title: 'literally_me.png - Imaging',
                task: 'literally_me.png',
                icon: 'img/images/image_old_jpeg-0.png'
            },
        };

        function openViewer(item){
            var body = $('#viewer-body');
            if (item.kind === 'image') {
                body.html('<img class="viewer-img" src="' + item.src +
                    '" alt="' + item.title + '">');
            } else {
                body.html(
                    '<div class="iframe-container">' +
                    '<iframe src="' + item.src +
                    '" title="YouTube video player" frameborder="0"' +
                    ' allow="accelerometer; autoplay; clipboard-write;' +
                    ' encrypted-media; gyroscope; picture-in-picture; web-share"' +
                    ' referrerpolicy="strict-origin-when-cross-origin"' +
                    ' allowfullscreen></iframe></div>'
                );
            }
            $('#viewer-title').text(item.title);
            $('#viewer-icon').attr('src', item.icon);
            showWindow('win5');
            $('.task-btn[data-window="win5"]')
                .html('<img src="' + item.icon + '" alt=""> ' + item.task);
        }

        $('tr[data-trigger-modal]').on('click', function(e) {
            e.preventDefault();
            var item = viewerMedia[$(this).data('modal-id')];
            if (item) {
                openViewer(item);
            }
        });
    });

    const btn = document.getElementById('button');
    document.getElementById('contact-form').addEventListener('submit', function(event) {
        event.preventDefault();
        btn.innerHTML = '<img src="img/address_book_card.png" alt="" class="address-sendicon"> Sending...';
        const serviceID = 'service_vzrlfd8';
        const templateID = 'template_g90oli5';
        emailjs.sendForm(serviceID, templateID, this).then(() => {
            btn.innerHTML = '<img src="img/address_book_card.png" alt="" class="address-sendicon"> Thanks for contacting me!';
            $('#contact-form')[0].reset();
            setInterval(() => {
                btn.innerHTML = '<img src="img/address_book_card.png" alt="" class="address-sendicon"> Send';
            }, 2000);
            }, (err) => {
                btn.innerHTML = '<img src="img/address_book_card.png" alt="" class="address-sendicon"> Something went wrong...';
                alert(JSON.stringify(err));
        });
    });
});

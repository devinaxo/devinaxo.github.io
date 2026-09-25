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
        win5: { top: 112, left: 112 }
    };

    function mountFolder(winId, winEl){
        var pos = cascade[winId];
        if (!pos || mqStacked.matches) return;
        // Already floating (and possibly dragged somewhere): leave it alone
        if (winEl[0].style.position === 'absolute') return;
        winEl.css({
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            // width: 'calc(100% - ' + pos.left + 'px)',
            width: 'fit-content'
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
        win1: { label: 'Projects', icon: 'img/directory_closed_cool-0.png' },
        win2: { label: 'Multimedia', icon: 'img/directory_closed_cool-0.png' },
        win3: { label: 'My Info', icon: 'img/help_book_cool-4.png' },
        win4: { label: 'Contact Me', icon: 'img/envelope_closed-0.png' },
        win5: { label: 'Imaging', icon: 'img/images/image_old_jpeg-0.png' }
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

    function simulateFirstLoad(winId, winEl){
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
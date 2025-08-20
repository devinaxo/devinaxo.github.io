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

    $( ".window" ).draggable({ handle: ".title-bar" });

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

    const clickableFolders = $('.clickable-folder');
    let currWin;
    let currIcon;
    clickableFolders.on('click', function(){
        $(this).css('background-color', 'gray');
        clickableFolders.not(this).each(function(){
            $(this).css('background-color', 'transparent');
        })
    })

    clickableFolders.on('dblclick', function(){
        $('.needs-closing').hide();
        $('.image-folder').each(function(){
            $(this).attr('src', 'img/directory_closed_cool-0.png');
        })
        $(this).css('background-color', 'transparent');
        currWin = $(this).data('window');
        $('#' + currWin).show();
        currIcon = $(this).data('icon');
        $('#' + currIcon).attr('src', 'img/directory_open_cool-0.png');
    })

    $('.window-close').on('click', function(){
        currWin = $(this).data('window');
        $('#' + currWin).hide();
        currIcon = $(this).data('icon');
        $('#' + currIcon).attr('src', 'img/directory_closed_cool-0.png');
    })

    $('.window-minimize').on('click', function(){
        currWin = $(this).data('window');
        $('#' + currWin).hide();
        currIcon = $(this).data('icon');
        $('#' + currIcon).attr('src', 'img/portfolio-btn.png');
    })
    $('#portfolio-btn').on('click', function(){
        currWin = $(this).data('window');
        $('#' + currWin).show();
        currIcon = $(this).data('icon');
        $('#' + currIcon).attr('src', 'img/portfolio-btn-pressed.png');
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

        // Handle table row modal triggers (new functionality)
        $('tr[data-trigger-modal]').each(function() {
            var $row = $(this);
            var modalId = $row.data('modal-id');
            var $modal = $('#' + modalId);
            var $modalImg = $modal.find('.modal-content');
            var $closeBtn = $modal.find('.close');
            var $iframeContainer = $modal.find('.iframe-container');
            var iframeHtml = $iframeContainer.length ? $iframeContainer.html() : '';
            
            // Set image sources based on modal ID
            var imageSrc = '';
            if (modalId === 'modal01') {
                imageSrc = 'img/images/shantien.png';
            } else if (modalId === 'modal02') {
                imageSrc = 'img/images/sniff.jpg';
            }
            
            $row.on('click', function(e) {
                e.preventDefault();
                $modal.show();
                if (imageSrc) {
                    $modalImg.attr('src', imageSrc);
                }
            });
            
            $closeBtn.on('click', function() {
                $modal.hide();
                if ($iframeContainer.length && iframeHtml) {
                    $iframeContainer.html(iframeHtml);
                }
            });
        });

        // Handle modal close when clicking outside
        $('.modal').on('click', function(e) {
            if (e.target === this) {
                $(this).hide();
                var $iframeContainer = $(this).find('.iframe-container');
                if ($iframeContainer.length) {
                    var iframeHtml = $iframeContainer.data('original-html') || $iframeContainer.html();
                    $iframeContainer.html(iframeHtml);
                }
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
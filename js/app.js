function updateTime(){
    let d = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    document.getElementById('time').innerText = d;
}
function start(){
    updateTime();
    setInterval(updateTime, 1000);
    $( ".window" ).draggable({ handle: ".title-bar" });
    
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
}
function highlight(div){
    div.style.backgroundColor = 'gray';
}
function openFolder(folder){
    folder.parentNode.style.backgroundColor = 'unset';
    let winId = folder.id.replace('icon', 'win');
    document.getElementById(winId).style.display = "block";
    folder.src = 'img/directory_open_cool-0.png';
    if(winId.endsWith('1')){
        winId = winId.replace('1', '2');
        document.getElementById(winId).style.display = "none";
        document.getElementById(winId.replace('win', 'icon')).src = 'img/directory_closed_cool-0.png';
    }else{
        winId = winId.replace('2', '1');
        document.getElementById(winId).style.display = "none";
        document.getElementById(winId.replace('win', 'icon')).src = 'img/directory_closed_cool-0.png';
    }
}
function closeFolder(closeButton){
    let winId = closeButton.parentNode.parentNode.parentNode.id;
    let folderId = winId.replace('win', 'icon');
    document.getElementById(winId).style.display = "none";
    document.getElementById(folderId).src = 'img/directory_closed_cool-0.png';
}
function manipulateWindow(opt){
    switch(opt){
        case 1: //close
            document.getElementById('win3').style.display = 'none';
            document.getElementById('portfolio-btn').src = 'img/portfolio-btn.png';
            break;
        case 2: //open
            document.getElementById('win3').style.display = 'block';
            document.getElementById('portfolio-btn').src = 'img/portfolio-btn-pressed.png';
            break;
    }
}

function triggerModal(image){
    //unset gray color
    image.parentNode.style.backgroundColor = 'unset';
    // Get the modal
    var modal = document.getElementById(image.id.replace("image", "modal"));

    // Get the image and insert it inside the modal
    var img = document.getElementById(image.id);
    var modalImg = document.getElementById(image.id.replace("image", "img"));
    var hqImage = image.alt;
    img.ondblclick = function(){
        modal.style.display = "block";
        modalImg.src = hqImage;
    }

    // Get the <span> element that closes the modal
    var span = document.getElementById(image.id.replace("image", "close"));

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() { 
    modal.style.display = "none";
    }
}
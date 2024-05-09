var d, pw = 'win3', pb = 'portfolio-btn';

function updateTime(){
    d = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    document.getElementById('time').innerText = d;
}
function start(){
    updateTime();
    setInterval(updateTime, 1000);
    $( ".window" ).draggable({ handle: ".title-bar" });
    $( ".icon-spot" ).draggable();
    $( ".undraggable" ).draggable('disable');
}
function highlight(div){
    div.style.backgroundColor = 'gray';
}
function openFolder(folder){
    //Draggable window
    $( ".window" ).draggable({ handle: ".title-bar" });

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
            document.getElementById(pw).style.display = 'none';
            document.getElementById(pb).src = 'img/portfolio-btn.png';
            break;
        case 2: //open
            document.getElementById(pw).style.display = 'block';
            document.getElementById(pb).src = 'img/portfolio-btn-pressed.png';
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
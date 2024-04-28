var d, pw = 'win3', pb = 'portfolio-btn';

function updateTime(){
    d = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    document.getElementById('time').innerText = d;
}
function start(){
    updateTime();
    setInterval(updateTime, 1000);
}
function openFolder(folder){
    let winId = folder.id.replace('icon', 'win');
    document.getElementById(winId).style.display = "block";
    folder.src = 'img/opened-folder.png'
}
function closeFolder(closeButton){
    let winId = closeButton.parentNode.parentNode.parentNode.id;
    let folderId = winId.replace('win', 'icon')
    document.getElementById(winId).style.display = "none";
    document.getElementById(folderId).src = 'img/folder.png'
}
function manipulateWindow(code){
    switch(code){
        case 1:
            document.getElementById(pw).style.display = 'none';
            document.getElementById(pb).style.display = 'block';
            break;
        case 2:
            document.getElementById(pw).style.display = 'block';
            document.getElementById(pb).style.display = 'none';
            break;
    }
}
var d;

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
function folderInactive(folder){

}

function closeFolder(closeButton){
    let winId = closeButton.parentNode.parentNode.parentNode.id;
    let folderId = winId.replace('win', 'icon')
    document.getElementById(winId).style.display = "none";
    document.getElementById(folderId).src = 'img/folder.png'
}

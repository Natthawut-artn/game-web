window.onload = init;

function init(){
    let hear = document.getElementById('hear')
    hear.onclick = pop;

    initcommentpopup()
}

function pop(){
    let hear = document.getElementById('hear')

    hear.src = "CSS/Pictures/Backgrounds/here1.png";
    setTimeout(() => {
        hear.src = "CSS/Pictures/Backgrounds/here2.png";
    }, 250);
}

function initcommentpopup(){
    let popups = document.querySelectorAll('.b')
    for(i = 0 ; i < popups.length ; i++){
        let index = i
        popups[i].onclick = () => showpopup(index)
    }
}

function showpopup(index){
    let popup = document.getElementById('comment-popup')
    popup.style.display = 'flex'

    let cancel = document.getElementById('cancel')
    cancel.addEventListener('click',() =>{
        popup.style.display = 'none'
    })
    let submit = document.getElementById('submit')
    submit.addEventListener('click',() =>{
        popup.style.display = 'none'
    })
}
window.onload = init;

function init(){
    let hear = document.getElementById('hear')
    hear.onclick = pop;
}

function pop(){
    let hear = document.getElementById('hear')

    hear.src = "CSS/Pictures/Backgrounds/here1.png";
    setTimeout(() => {
        hear.src = "CSS/Pictures/Backgrounds/here2.png";
    }, 250);
}

console.log('MS File entered')

let alpha = 0.5;
let toggle = true;

//Function to alert if there was an error in lock change
const lockChangeAlert = (e) => {
    console.log("lock change alert entered")
}


const onUpdatePosition = (e, cursor) => {
    let curposX = parseFloat(cursor.style.left.slice(0, -2));
    let curposY = parseFloat(cursor.style.bottom.slice(0, -2));
    let newPosX = (e.movementX + curposX).toString + 'px'
    let newPosY = (e.movementY + curposY).toString + 'px'
    cursor.style.left = newPosX
    cursor.style.right = newPosY
}

const getLock = () =>{
    let pointerCage = document.createElement("canvas");
    let body = document.querySelector("body");
    body.prepend(pointerCage);

    pointerCage.requestPointerLock = pointerCage.requestPointerLock || pointerCage.mozRequestPointerLock || pointerCage.webkitRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

    //Adds event listner for error in PointerLock lock chhange
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

    pointerCage.requestPointerLock();

    //Creates cutome cursor DOM element 
    let cursor = document.createElement("div");
    cursor.setAttribute('id', 'cursor');
    body.prepend(cursor);

    const updatePosition = (e) => {onUpdatePosition(e, cursor)}; 
    document.addEventListener("mousemove", updatePosition(cursor), false);
}

//If the cursor setting is activated lock the cursor, else unlock it 
const activateCursor = () => {
    if (toggle){
        document.addEventListener("keypress", getLock)  

    }
}

window.addEventListener('load', activateCursor);
//pointerCage.addEventListener("click", activateLock);
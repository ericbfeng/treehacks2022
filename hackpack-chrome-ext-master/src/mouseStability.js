/*

Future work: 

    1) Bound the cursor values to the window
    2) Move cursor on scroll

*/


// Hyper parameters

let alpha = 0.1; // Range: 0 < alpha < 1, Func: used for rolling exp avrg algo (not the main algo) (can ignore this)
let toggleKey = 'a'; // Range: any key, Func: used to set key that starts mouse stability
let rollingLen = 50; // Range: 1 <= rollingLen < inf, Func: used in main algo, Realistic Range 19 < rollingLen < 101
let enlarger = false; // Turns on and off the button enlarger
let enlargeFactor = 2; // Sets the factor at which to scale buttons and inputs 

//Global Parameters

let rAvgX = []; // Keeps track of prev X velocities 
let rAvgY = []; // Keeps track of prev Y velocities

let cX = 0; // Tracks change in X
let cY = 0; // Tracks change in Y
let aX = 0; // Tracks absolute postion of cursor on the x axis
let aY = 0; // Tracks absolute postion of cursor on the y axis

let prevElem = null; // Current cursor element
let prevLoadElm = null; // Tracks loading animation over cursor

let prvElmOvr = null; // Tracks last element to be hovered over by artifical cursor
let prevLoadSize = 0; // Tracks how long the current element has been hovered over 
let maxLoadSize = 15; // Sets load time

let clickables = []; //Finds all clickabled in the DOM 

let toggle = false; // Tracks whether or not the cursor is caged

let frameSpeed = 10; // Sets the frame rate for the cursor load animation




/*
    This first section deals with controlling size of input panels and clickables
*/


var head = document.head || document.getElementsByTagName('head')[0];
var myStyle = document.createElement('style');
var myStyle_innerHTML_Enlarger = "";
var myStyle_innerHTML_Enlarger_MS = "";


var background_color = "white";
var color = "black";
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    background_color = "black";
    color = "white";
}


// todo make scaling a variable
myStyle_innerHTML_Enlarger += "button:hover{transform: scale(" + enlargeFactor + ", "+ enlargeFactor + ") !important; border-radius: 0px !important; " +
    "border: 1px ridge black !important; position: relative !important; z-index: 100000; color: " + color + " !important; " +
    "background-color: " + background_color + " !important;} ";
myStyle_innerHTML_Enlarger += "a:hover{transform: scale("+ (enlargeFactor * 100) +"%) !important; transform-origin: 25% !important; border-radius: 0px !important; " +
    "border: 1px ridge black !important; position: relative !important; z-index: 100000; color: " + color + " !important; " +
    "background-color: " + background_color + " !important; display: inline-block !important; white-space: nowrap !important; " +
    "padding: 1em !important; margin: 0 -1em !important; width: min-content !important;} ";
myStyle_innerHTML_Enlarger += "input:hover{transform: scale(" + enlargeFactor + ", "+ enlargeFactor + ") !important; transform-origin: 25% !important; border-radius: 0px !important; " +
    "border: 1px ridge black !important; background-color: " + background_color + " !important; position: relative !important; " +
    "z-index: 100000; color: " + color + " !important;} ";
myStyle_innerHTML_Enlarger += ".TremouseClickable:hover{transform: scale(" + enlargeFactor + ", "+ enlargeFactor + ") !important; transform-origin: left !important; " +
    "border-radius: 0px !important; border: 1px ridge black !important; background-color: " + background_color + " !important;" +
    " position: relative !important; z-index: 100000; color: " + color + " !important;} ";


myStyle_innerHTML_Enlarger_MS += "button.activate{transform: scale(" + enlargeFactor + ", "+ enlargeFactor + ") !important; border-radius: 0px !important; " +
    "border: 1px ridge black !important; position: relative !important; z-index: 100000; color: " + color + " !important; " +
    "background-color: " + background_color + " !important;} ";
myStyle_innerHTML_Enlarger_MS += "a.activate{transform: scale(" +  (enlargeFactor * 100) + "%) !important; transform-origin: 25% !important; border-radius: 0px !important; " +
    "border: 1px ridge black !important; position: relative !important; z-index: 100000; color: " + color + " !important; " +
    "background-color: " + background_color + " !important; display: inline-block !important; white-space: nowrap !important; " +
    "padding: 1em !important; margin: 0 -1em !important; width: min-content !important;} ";
myStyle_innerHTML_Enlarger_MS += "input.activate{transform: scale(" + enlargeFactor + ", "+ enlargeFactor + ") !important; transform-origin: 25% !important; border-radius: 0px !important; " +
    "border: 1px ridge black !important; background-color: " + background_color + " !important; position: relative !important; " +
    "z-index: 100000; color: " + color + " !important;} ";
myStyle_innerHTML_Enlarger_MS += ".TremouseClickable.activate{transform: scale(" + enlargeFactor + ", "+ enlargeFactor + ") !important; transform-origin: left !important; " +
    "border-radius: 0px !important; border: 1px ridge black !important; background-color: " + background_color + " !important;" +
    " position: relative !important; z-index: 100000; color: " + color + " !important;} ";




if (enlarger){
    myStyle.innerHTML= myStyle_innerHTML_Enlarger ;
    head.appendChild(myStyle);      
}



//Below is functionality for Mouse Stability and Click Hover Bar


// Sets up the "Cage" to trap and hide real cursor 
let buttonCage =  document.createElement("button");
buttonCage.setAttribute('id', 'cage');
let body = document.querySelector("body");
body.prepend(buttonCage);

// When toggleKey is pressed the mouse stability is activated
//This is necessary since the API doesn't allow access to this information unless the user consents in some way
function lock(e){
    if (e.key === toggleKey){
        buttonCage.requestPointerLock();
    }  
}

// Gets all clickable elements in the DOM
var getAllClickable = function(curnode, gathered) {
    if (typeof curnode.onclick === 'function' || (curnode.tagName && ["a", "input", "button"].includes(curnode.tagName.toLowerCase()))){
            gathered.push(curnode);
        }
    curnode.childNodes.forEach(function(child) {getAllClickable(child, gathered)});
}

getAllClickable(document.documentElement, clickables);

// Sets up API requests
buttonCage.requestPointerLock = buttonCage.requestPointerLock ||  buttonCage.mozRequestPointerLock;
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

// Adds core event listners
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
document.addEventListener('keypress', lock);
document.addEventListener('load', getAllClickable);

// Is called when mouse stability is turned on or off
function lockChangeAlert() {
    if (document.pointerLockElement === buttonCage ||
        document.mozPointerLockElement === buttonCage) {
      console.log('The pointer lock status is now locked');
      // Adds event listner that gives mouse postion data
      toggle = true;

      if (enlarger){
            let mystyle = document.querySelector('style')
            myStyle.innerHTML = myStyle_innerHTML_Enlarger_MS
      }


      document.addEventListener("mousemove", updatePosition, false);
    } else {
      console.log('The pointer lock status is now unlocked');  
      if (prevElem !== null) {
          prevElem.remove();
      }  
      if (prevLoadElm !== null){
          prevLoadElm.remove();
      }
      toggle = false;

      if (enlarger){
        let mystyle = document.querySelector('style')
        myStyle.innerHTML = myStyle_innerHTML_Enlarger
      }

      if (!enlarger){
          let mystyle = document.querySelector('style');
          if (myStyle !== undefined && myStyle !== null){
            myStyle.remove();
          }
      }

      document.removeEventListener("mousemove", updatePosition, false);
    }
  }


// expAvrg algo (not main algo)
const expAvrg = (pos) => {
    cX = (alpha * pos.movementX) + ((1 - alpha) * cX);
    cY = (alpha * pos.movementY) + ((1 - alpha) * cY)
}

// Shifted sigmoid function
const sigShift = (val) => {
    return 1 / (1 + Math.exp(-(val - 1)))
}


// Calcs new postions based ona rolling average and their variances 
const rolArv = (pos) => {
    const reducer = (accumulator, curr) => accumulator + curr;
    if (rAvgX.length < rollingLen){
        rAvgX.unshift(pos.movementX);
        rAvgY.unshift(pos.movementY);
        mX = rAvgX.reduce(reducer) / rAvgX.length;
        mY = rAvgY.reduce(reducer) / rAvgY.length;
        vX = rAvgX.map((k) => {return Math.abs(k - mX)});
        vY = rAvgY.map((k) => {return Math.abs(k - mY)});
        cX = (sigShift((vX.reduce(reducer) / vX.length)) * mX);
        cY = (sigShift((vY.reduce(reducer) / vY.length)) * mY);
    } else{
        rAvgX.unshift(pos.movementX);
        rAvgY.unshift(pos.movementY);
        rAvgX.pop();
        rAvgY.pop();
        mX = rAvgX.reduce(reducer) / rollingLen;
        mY = rAvgY.reduce(reducer) / rollingLen;
        vX = rAvgX.map((k) => {return Math.abs(k - mX)});
        vY = rAvgY.map((k) => {return Math.abs(k - mY)});
        cX = (sigShift((vX.reduce(reducer) / vX.length)) * mX);
        cY = (sigShift((vY.reduce(reducer) / vY.length)) * mY);
    }
}

const func = rolArv; // Algo that is being used. Default rolArg. Another option is expAvrg


// Called by the setInterval. Records and animates how long an element has been hovered over
// by the artifical cursor. Clicks if it hovers long enough
const checkClick = () => {
    let x = aX;
    let y = aY;
    if (toggle){
        let elemHovers = document.elementsFromPoint(x, y);
        var elemHover = null;
        elemHovers.forEach((val) => {
            if(clickables.includes(val)){
                elemHover = val
            }   
        });

        if ((elemHover !==  prvElmOvr) && (prvElmOvr !== null)){
            if (prvElmOvr.classList.contains("activate")){
                prvElmOvr.classList.remove("activate");
            }
        } 


        if (elemHover !== null && clickables.includes(elemHover)){
            console.log('elem is clickable');
            if (elemHover === prvElmOvr){
                if (!elemHover.classList.contains("activate")) elemHover.className += "activate";

                prevLoadSize = prevLoadSize + 0.05;

                if (prevLoadSize > maxLoadSize){
                    elemHover.click();
                    prevLoadSize = 0;
                } 

                let bar = document.createElement('div');
                bar.setAttribute('id', 'cursorLoad');
                bar.style.height = prevLoadSize + 'px';

                if (prevLoadElm !== null) prevLoadElm.remove();
                prevLoadElm = bar;

                let body = document.querySelector('#myCursor');
                body.append(bar);      
            } 
        }else{
            prevLoadSize = 0;
            if (prevLoadElm !== null) prevLoadElm.remove();
            prevLoadElm = null;
        }
        prvElmOvr = elemHover;
    }
}



// Updates cursor postion
function updatePosition(e) {

    let cursor = document.createElement('div');
    cursor.setAttribute('id', 'myCursor');

    let coord = func(e);

    cX = cX / 2;
    cY = cY / 2;
    
    aX = aX + cX
    aY = aY + cY;


    //These bounds need fixing
    if (aX < 0) {aX = 0};
    if (aY < 0) {aY = 0};
    //if (aX > window.innerWidth) {aX = window.innerWidth};
    //if (aY > window.innerHeight) {aY = window.innerHeight};

    
    cursor.style.left = aX + 'px';
    cursor.style.top = aY + 'px';

    if (prevElem !== null) {
        prevElem.remove();
    }

    prevElem = cursor;

    let body = document.querySelector('body');
    body.prepend(cursor);

}

// Sets the interval for checking what is to be clicked on 
var id = setInterval(checkClick, frameSpeed);
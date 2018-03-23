/*
Build a pomodoro (i.e. tomato) timer the fullfills the following criteria:
1. Can start a 25 minute timer that goes off every 25 minutes and also set a 5 minute break period after that
2. I can reset the clock
3. I can customize the length of each pomodoro
*4.  I can pause the clock
*5.  clock gives a visual indicator of elapsed time, such as filling up slowly
*6. makes an alarm sound at each transition between break and work.  (this probably cannot be added to codepen.io version)
Note: accomplish fill by setting background: linear-gradient(color %, color %) with % being equal and going from 100 to 0 inside of a setInterval.  To get the total interval and the amount the percentage decreases by, we must use the time that the clock is set for.  see this for example: http://codepen.io/kevinweber/pen/QwgKMX

TO DO:
- add ability to adjust time for period that is not currently running but not for currently running without pausing (or auto pause on adjust)
- add 'pause to adjust time' or somethig like that when clicking on control buttons while clock is running.  Have it fade in and out.
- fine-tune css and make more responsive
- use setInterval instead of setTimeout?
*/
var clock = (function(){
var myClock = {};

var soundSetUp = false,
soundSrc = 'audio/6de6332f09e1f5c02156eabd1272bfe1_Alarm01.ogg'; /*'https://ia801201.us.archive.org/24/items/6de6332f09e1f5c02156eabd1272bfe1Alarm01/6de6332f09e1f5c02156eabd1272bfe1_Alarm01.ogg'*/

var workTime = 1,
breakTime = 1,
clockTime = workTime * 60, //represents starting time in seconds
currentTime = clockTime,  //represent current time in seconds
systemStartTime,
systemCurrentTime,
systemPreviousTime,
clockTimePaused = true,
clockTimerEventId,
clockFillEventId,
clockPeriod = 'work',
clockFace,
clockFaceTime,
clockFaceLabel,
controlWorkTime,
controlBreakTime,
clockBackColor;



/* 
  
  workTimeInMinutes
  breakTimeInMinutes 
  currentModeStartTimeInMinutes

  var clockTime = { 
    clockDisplayTimeMinutes,
    clockDisplayTimeSeconds,  
    clockStartTimeInSeconds: currentModeStartTimeInMinutes * 60,  
    clockCurrentTimeInSeconds: currentModeStartTimeInMinutes * 60,               
    systemClockTimeStart: Date.now(),     
    systemClockTimeCurrentTick: Date.now(),
    systemClockTimePreviousTick: Date.now(),
  }
  

*/

//variables to hold sound effects
//var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var fxAlarm = new Audio();

//formats time from total seconds to minutes:seconds format
function formatClockTime(time){
var minutes = Math.floor(time / 60);
var seconds = time % 60;
minutes = minutes.toString();
seconds = seconds.toString();
minutes.length < 2 ? minutes = '0' + minutes : minutes;
seconds.length < 2 ? seconds = '0' + seconds : seconds;
return minutes + ":" + seconds;
}

//changes between work time and break time
function changeTimePeriod(){

    systemStartTime = Date.now();
    systemCurrentTime = systemStartTime;
    systemPreviousTime = systemStartTime;

    if(clockPeriod === 'work'){
    clockPeriod = 'break';
    clockFaceLabel.text('Break');
    clockTime = breakTime * 60;
    currentTime = clockTime;
    }
    else{
    clockPeriod = 'work';
    clockFaceLabel.text('Session');
    clockTime = workTime * 60;
    currentTime = clockTime;
    }
}
/*
Fills the clock background-color with a gradient depending on
% of total time elapsed
*/
function setClockFill(fillColor, backColor){
    if(!fillColor)  fillColor = '#C04B2E';
    if(!backColor)  backColor = clockBackColor;
    var currentTimeInSeconds = clockTime - (( systemCurrentTime - systemStartTime) / 1000);
    var fillPercent = ( (100/ (clockTime) ) ) * currentTimeInSeconds;
    // var fillPercent = ( ( 100 / (systemStartTime) )  * ( (systemCurrentTime) ) );

    // console.log('fill percent is:' + fillPercent + ' | current time in seconds: ' + currentTimeInSeconds);

    clockFace.css('background', 'linear-gradient(' + backColor + ' ' + fillPercent + '%, ' + fillColor + ' ' + fillPercent + '%)');
}
/*
Updates the clock time and plays an alarm with 2 seconds left, then switchs time
mode to work/break
*/
function clockUpdate( ){
    systemCurrentTime = Date.now();

    if(currentTime === 0){
        changeTimePeriod();
    }
    else if (currentTime === 2){        
        fxAlarm.play();        
    }

    if ( (systemCurrentTime - systemPreviousTime) >= 1000){
        systemPreviousTime = systemCurrentTime;	
        currentTime -= 1;
        clockFaceTime.text(formatClockTime(currentTime));
    }

    setClockFill();
    clockTimerEventId = window.setTimeout(clockUpdate, 100);
}

/*
Starts the clock and also sets up fxAlarm to get
around issue with sound not starting on mobile devices without user interaction.
*/

function startClock( ){

    systemStartTime = Date.now();

    if(!soundSetUp){
        fxAlarm.play();
        fxAlarm.src = soundSrc;
        soundSetUp = true;
    }
        systemCurrentTime = Date.now();
        systemPreviousTime = systemCurrentTime;
        clockUpdate( );
}

// Stops clock by clearing update fuction from setTimeout queue.
function stopClock( ){
window.clearTimeout(clockTimerEventId);
}

// Updates break time
function breakTimeUpdate(){
controlBreakTime.text(breakTime);
if(clockPeriod === 'break'){ //update clock face time if in break timer
clockTime = breakTime * 60;
currentTime = clockTime;
setClockFill();
clockFaceTime.text(formatClockTime(currentTime));
}
}

// Updates work time
function workTimeUpdate(){
controlWorkTime.text(workTime);
if(clockPeriod === 'work'){ //update clock face time if in work timer
clockTime = workTime * 60;
currentTime = clockTime;
setClockFill();
clockFaceTime.text(formatClockTime(currentTime));
}
}

//intialize with id for clockTime, clockLabel, controlWorkTime, and controlBreakTime
myClock.init = function( ){
clockFace = $(arguments[0]);
clockFaceTime = $(arguments[1]);
clockFaceLabel = $(arguments[2]);
controlBreakTime = $(arguments[3]);
controlWorkTime = $(arguments[4]);
clockFaceTime.text(formatClockTime(currentTime));
clockFaceLabel.text('Session');
controlWorkTime.text(workTime);
controlBreakTime.text(breakTime);
clockBackColor = clockFace.css('background-color');
}

//increases work time
myClock.addWorkTime = function ( ) {
if(workTime < 60 && clockTimePaused){
workTime += 1;
workTimeUpdate();
}
};

//decreases work time
myClock.minusWorkTime = function ( ) {
if(workTime > 1 && clockTimePaused){
workTime -= 1;
workTimeUpdate();
}
};

//increases break time
myClock.addBreakTime = function ( ) {
if(breakTime < 60 && clockTimePaused){
breakTime += 1;
breakTimeUpdate();
}
};

//decreases breaktime
myClock.minusBreakTime = function ( ) {
if(breakTime > 0 && clockTimePaused){
breakTime -= 1;
breakTimeUpdate();
}
};

myClock.reset = function(){
//1. if clock is running, pause it
if(!clockTimePaused){
clockTimePaused = true;
stopClock();
}

//reset time variables
clockTime = workTime * 60;
currentTime = clockTime;
systemStartTime = systemCurrentTime = systemPreviousTime = Date.now();
clockPeriod = 'work';

//set clock face
clockFaceTime.text(formatClockTime(currentTime));
clockFaceLabel.text('Session');
setClockFill();

};

//Starts and stops clock depending on current state
myClock.start = function ( ) {
if(clockTimePaused){
clockTimePaused = false;
startClock( );
}
else{
clockTimePaused = true;
stopClock( );
}
};

return myClock;  //return clock object with public methods
})();

//click effect for buttons
function buttonClick(buttonID){
console.log(buttonID);
var button = $('#' + buttonID);
button.toggleClass('clicked');
window.setTimeout(function(){
button.toggleClass('clicked');
}, 250);
}

//Main application
$("document").ready(function(){
//intialize the clock
clock.init('#clock', '#clock #time', '#clock #period', '#break-control .time', '#work-control .time');

//event to handle pause/start on clock
$('#clock').on('click', function(event){
clock.start('#clock #time');
});
//events to handle incrementing/decrementing time on controls
$('.minus').on('click', function(event){
var target = event.currentTarget.parentElement.id;
console.log(event);
if(target === 'break-control'){
clock.minusBreakTime();
}
else if(target === 'work-control'){
clock.minusWorkTime();
}
buttonClick(event.currentTarget.id);
});
$('.plus').on('click', function(event){
var target = event.currentTarget.parentElement.id;
if(target === 'break-control'){
clock.addBreakTime();
}
else if(target === 'work-control'){
clock.addWorkTime();
}
buttonClick(event.currentTarget.id);
});

$('#reset').on('click', function(event){
clock.reset();
buttonClick('reset');
});
}); //end of on ready
//# sourceURL=pen.js

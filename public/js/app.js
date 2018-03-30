
//shim for requestAnimationFrame
if(window.requestAnimationFrame === undefined){
    window.requestAnimationFrame = function requestAnimationFrame(fn){
        return window.setTimeout(fn, 16);
    }

    window.cancelAnimationFrame = function cancelAnimationFrame(timeoutId){
        return window.clearTimeout(timeoutId);
    }
}

//clock application
var clock = (function(){
    
    var myClock = {};

    /////////////////////////////////////////////////////////////////////////////
    /*     CLOCK DISPLAY DEFAULTS                                              */
    ///////////////////////////////////////////////////////////////////////////// 
    var workTime = 25;
    var breakTime = 5;
    var clockBackColor = '#1D3043';
    var clockFillColor = '#C04B2E';

    /////////////////////////////////////////////////////////////////////////////
    /*     CLOCK SOUND SETTINGS                                                */
    ///////////////////////////////////////////////////////////////////////////// 
    var soundSetUp = false;
    var soundSrc = 'public/audio/6de6332f09e1f5c02156eabd1272bfe1_Alarm01.ogg'; 
    var fxAlarm = new Audio();
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? true : false; 

    /////////////////////////////////////////////////////////////////////////////
    /*     CLOCK INTERFACE ELEMENTS                                            */
    ///////////////////////////////////////////////////////////////////////////// 
    var clockFace;
    var clockFaceTime;
    var clockFaceLabel;
    var controlWorkTime;
    var controlBreakTime;

    /////////////////////////////////////////////////////////////////////////////
    /*     CLOCK STATE                                                         */
    ///////////////////////////////////////////////////////////////////////////// 
    var clockStartTimeInSeconds = workTime * 60; //represents starting time in seconds
    var currentTime = clockStartTimeInSeconds;  //represent current time in seconds
    var systemStartTime;
    var systemCurrentTime;
    var systemPreviousTime;
    var clockTimePaused = false; //this fires when pause button is pressed
    var clockTimeTicking = false; //this fires whenever the clock starts ticking
    var clockTimerEventId;
    var clockFillEventId;
    var clockPeriod = 'work';
    
    /////////////////////////////////////////////////////////////////////////////
    /*     CLOCK PUBLIC METHODS                                                */
    ///////////////////////////////////////////////////////////////////////////// 
 
    //intialize clock with id for clockStartTimeInSeconds, clockLabel, controlWorkTime, 
    //and controlBreakTime
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

    //Starts and stops clock depending on current state
    myClock.toggleTimer = function() {         
        if(!getIsClockTicking()){            
            this.start();
        } 
        else  {              
            this.pause();
        }
    };

    //Starts the clock and also sets up fxAlarm to get
    //around issue with sound not starting on mobile devices without user interaction.
    myClock.start = function(){
        if(getIsClockPaused()){                        
            systemCurrentTime = Date.now();
            systemStartTime += systemCurrentTime - systemPreviousTime;
            systemPreviousTime = systemCurrentTime;    
        } else {            
            if(!soundSetUp){
                if(isMobile){
                    fxAlarm.play();
                }                
                fxAlarm.src = soundSrc;
                soundSetUp = true;                               
            }
            resetSystemTime();
        }

        clockTimePaused = false
        clockTimeTicking = true;
    
        clockUpdate();                                            
    }

    //pause currently ticking clock
    myClock.pause = function () {
        if(clockTimeTicking && !clockTimePaused){
            clockTimePaused = true;
            clockTimeTicking = false;
            systemPreviousTime = Date.now();
            window.cancelAnimationFrame(clockTimerEventId);
        }        
    }

    // Stops clock by clearing update fuction from setTimeout queue.
    myClock.stop = function () {
        clockTimePaused = false;
        clockTimeTicking = false;
        resetSystemTime();
        window.cancelAnimationFrame(clockTimerEventId);
    }

    //resets clock time and stops clock from ticking
    myClock.reset = function(){           
        this.stop();
        //reset display time variables
        clockStartTimeInSeconds = workTime * 60;
        currentTime = clockStartTimeInSeconds;
        // systemStartTime = systemCurrentTime = systemPreviousTime = Date.now();
        resetSystemTime();
        clockPeriod = 'work';

        //set clock face
        clockFaceTime.text(formatClockTime(currentTime));
        clockFaceLabel.text('Session');
        setClockFill();
    };

    //increase clock's work time by one minute
    myClock.addWorkTime = function ( ) {
        if(workTime < 60 && getIsClockStopped()){
        workTime += 1;
        workTimeUpdate();
        }
    };

    //decrease clock's work time by one minute
    myClock.minusWorkTime = function ( ) {
        if(workTime > 1 && getIsClockStopped()){
            workTime -= 1;
            workTimeUpdate();
        }
    };

    //increases clock's break time by one minute
    myClock.addBreakTime = function ( ) {
        if(breakTime < 60 && getIsClockStopped()){
            breakTime += 1;
            breakTimeUpdate();
        }
    };

    //decrease clock's break time by one minute
    myClock.minusBreakTime = function ( ) {
        if(breakTime > 0 && getIsClockStopped()){
            breakTime -= 1;
            breakTimeUpdate();
        }
    };


    /////////////////////////////////////////////////////////////////////////////
    /*     CLOCK PRIVATE METHODS                                               */
    ///////////////////////////////////////////////////////////////////////////// 
    
    //Updates the clock time, plays an alarm with 2 seconds left, AND then switchs time
    //mode to work/break
    function clockUpdate() {
        systemCurrentTime = Date.now();

        if(currentTime === 0){
            changeTimePeriod();
        }
        else if (currentTime === 2){        
            fxAlarm.play();        
        }
        //calculate a timestamp so that we only update the clock
        //display every tick of 1000 milliseconds (1 second)
        if ( (systemCurrentTime - systemPreviousTime) >= 1000){
            systemPreviousTime = systemCurrentTime;	
            currentTime -= 1;
            clockFaceTime.text(formatClockTime(currentTime));
        }
        setClockFill();
        // clockTimerEventId = window.setTimeout(clockUpdate, 16);
        clockTimerEventId = window.requestAnimationFrame(clockUpdate);
    }

    /*
    Fills the clock background-color with a gradient depending on
    % of total time elapsed
    */
    function setClockFill(){
        var currentTimeRemainingInSeconds = clockStartTimeInSeconds - (( systemCurrentTime - systemStartTime) / 1000);        
        // percent filled is currentTimeRemainingInSeconds / total clockStartTimeInSeconds in seconds.  Then multiply by 100 to convert from fraction to percent
        var fillPercent = ((currentTimeRemainingInSeconds / clockStartTimeInSeconds) * 100);        
        clockFace.css('background', 'linear-gradient(' + clockBackColor + ' ' + fillPercent + '%, ' + clockFillColor + ' ' + fillPercent + '%)');
    }
     
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
        resetSystemTime();
        if(clockPeriod === 'work'){
            clockPeriod = 'break';
            clockFaceLabel.text('Break');
            clockStartTimeInSeconds = breakTime * 60;
            currentTime = clockStartTimeInSeconds;
        }
        else{
            clockPeriod = 'work';
            clockFaceLabel.text('Session');
            clockStartTimeInSeconds = workTime * 60;
            currentTime = clockStartTimeInSeconds;
        }
    }

    function resetSystemTime(){
        systemStartTime = systemCurrentTime = systemPreviousTime = Date.now();
    }

    function getIsClockTicking() {
        return clockTimeTicking;
    }

    function getIsClockPaused() {
        return clockTimePaused;
    }

    function getIsClockStopped() {        
        return clockTimePaused || !clockTimeTicking;
    }
    
    // Updates break time
    function breakTimeUpdate(){
        controlBreakTime.text(breakTime);
        if(clockPeriod === 'break'){
            resetSystemTime();
            clockTimePaused = false;             
            clockStartTimeInSeconds = breakTime * 60;
            currentTime = clockStartTimeInSeconds;
            setClockFill();
            clockFaceTime.text(formatClockTime(currentTime));
        }
    }

    // Updates work time
    function workTimeUpdate(){
        controlWorkTime.text(workTime);
        if(clockPeriod === 'work'){ 
            resetSystemTime();
            clockTimePaused = false;
            clockStartTimeInSeconds = workTime * 60;
            currentTime = clockStartTimeInSeconds;
            setClockFill();
            clockFaceTime.text(formatClockTime(currentTime));
        }
    }
    
    return myClock; 
})();

//click effect for buttons
function buttonClick(buttonID){
    var button = $('#' + buttonID);
    button.toggleClass('clicked');
    window.setTimeout(function(){
        button.toggleClass('clicked');
    }, 250);
}

//Main application
$(document).ready(function(){

    clock.init('#clock', '#clock #time', '#clock #period', '#break-counter-display', '#work-counter-display');

    // $(window).blur(function(event){
    //     console.log("lost focus!");
    //     clock.pause();
    // });
    
    $(document).on("visibilitychange", function(event){
        if(this.hidden){
            clock.pause();            
        }        
    });

    //event to handle pause/start on clock
    $('#clock').on('click', function(event){
        clock.toggleTimer();
    });

    //events to handle incrementing/decrementing time on controls
    $('.minus').on('click', function(event){
        var target = event.currentTarget.parentElement.id;
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


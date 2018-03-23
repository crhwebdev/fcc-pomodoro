var clock = (function(){
    
    var myClock = {};

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
   
    /////////////////////////////////////////////////////////////////////////////
    /*     CLOCK DISPLAY DEFAULTS                                              */
    ///////////////////////////////////////////////////////////////////////////// 
    var workTime = 1;
    var breakTime = 1;
    var clockBackColor = '#1D3043';
    var clockFillColor = '#C04B2E';

    /////////////////////////////////////////////////////////////////////////////
    /*     CLOCK SOUND SETTINGS                                                */
    ///////////////////////////////////////////////////////////////////////////// 
    var soundSetUp = false;
    var soundSrc = 'audio/6de6332f09e1f5c02156eabd1272bfe1_Alarm01.ogg'; 
    /*'https://ia801201.us.archive.org/24/items/6de6332f09e1f5c02156eabd1272bfe1Alarm01/6de6332f09e1f5c02156eabd1272bfe1_Alarm01.ogg'*/

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
    var clockTime = workTime * 60; //represents starting time in seconds
    var currentTime = clockTime;  //represent current time in seconds
    var systemStartTime;
    var systemCurrentTime;
    var systemPreviousTime;
    var clockTimePaused = true;
    var clockTimerEventId;
    var clockFillEventId;
    var clockPeriod = 'work';
    
    //variables to hold sound effects
    var fxAlarm = new Audio();

    /////////////////////////////////////////////////////////////////////////////
    /*     CLOCK PUBLIC METHODS                                                */
    ///////////////////////////////////////////////////////////////////////////// 

    //intialize clock with id for clockTime, clockLabel, controlWorkTime, 
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

    //increase clock's work time
    myClock.addWorkTime = function ( ) {
        if(workTime < 60 && clockTimePaused){
        workTime += 1;
        workTimeUpdate();
        }
    };

    //decrease clock's work time
    myClock.minusWorkTime = function ( ) {
        if(workTime > 1 && clockTimePaused){
            workTime -= 1;
            workTimeUpdate();
        }
    };

    //increases clock's break time
    myClock.addBreakTime = function ( ) {
        if(breakTime < 60 && clockTimePaused){
            breakTime += 1;
            breakTimeUpdate();
        }
    };

    //decrease clock's break time
    myClock.minusBreakTime = function ( ) {
        if(breakTime > 0 && clockTimePaused){
            breakTime -= 1;
            breakTimeUpdate();
        }
    };


    //Starts and stops clock depending on current state
    myClock.start = function ( ) {
        if(clockTimePaused){
            clockTimePaused = false;
            startClock( );
        }
        else {
            clockTimePaused = true;
            stopClock( );
        }
    };

    //resets clock time and stops clock ticks
    myClock.reset = function(){
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

    /////////////////////////////////////////////////////////////////////////////
    /*     CLOCK PRIVATE METHODS                                               */
    ///////////////////////////////////////////////////////////////////////////// 

    //Starts the clock and also sets up fxAlarm to get
    //around issue with sound not starting on mobile devices without user interaction.
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
    function stopClock() {
        window.clearTimeout(clockTimerEventId);
    }

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
        clockTimerEventId = window.setTimeout(clockUpdate, 16);
    }

    
    /*
    Fills the clock background-color with a gradient depending on
    % of total time elapsed
    */
    function setClockFill(){
        
        var currentTimeInSeconds = clockTime - (( systemCurrentTime - systemStartTime) / 1000);
        var fillPercent = ( (100/ (clockTime) ) ) * currentTimeInSeconds;        
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
    
    // Updates break time
    function breakTimeUpdate(){
        controlBreakTime.text(breakTime);
        if(clockPeriod === 'break'){ 
            clockTime = breakTime * 60;
            currentTime = clockTime;
            setClockFill();
            clockFaceTime.text(formatClockTime(currentTime));
        }
    }

    // Updates work time
    function workTimeUpdate(){
        controlWorkTime.text(workTime);
        if(clockPeriod === 'work'){ 
            clockTime = workTime * 60;
            currentTime = clockTime;
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
$("document").ready(function(){

    clock.init('#clock', '#clock #time', '#clock #period', '#break-control .time', '#work-control .time');

    //event to handle pause/start on clock
    $('#clock').on('click', function(event){
        clock.start('#clock #time');
    });

    //events to handle incrementing/decrementing time on controls
    $('.minus').on('click', function(event){
        var target = event.currentTarget.parentElement.id;
        // console.log(event);
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


// ==UserScript==
// @name         lams
// @namespace    https://github.com/klsjadhf/lams_userscript
// @version      1.10
// @description  change lams video speed and download video button
// @author       klsjadhf
// @homepage     https://github.com/klsjadhf/lams_userscript
// @updateURL    https://github.com/klsjadhf/lams_userscript/raw/master/lams.user.js
// @downloadURL  https://github.com/klsjadhf/lams_userscript/raw/master/lams.user.js
// @match        http*://presentur.ntu.edu.sg/aculearn-idm/v8/studio/embed.asp*
// @match        http*://lams.ntu.edu.sg/lams/tool/lanb11/learning/learner.do*
// @grant        GM_download
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict'

    // console.log(GM_listValues().map(GM_getValue));
    console.log("tampermonkey script running on " + window.location.hostname);

    var videoOnLoadAdded = false;

    if(document.URL.match(/https:\/\/lams\.ntu\.edu\.sg\/lams\/tool\/lanb11\/learning\/learner\.do/)){
        //if user pressed key in wrong window, send to iframe
        document.addEventListener("keydown", (keydownEvent) =>{
            GM_setValue("pressedKey", getPressedkey(keydownEvent));
            // console.log(GM_getValue("pressedKey").pressedKey);
        });
    }
    else if(document.URL.match(/https:\/\/presentur\.ntu\.edu\.sg\/aculearn-idm\/v8\/studio\/embed\.asp/)){
        //get keypress from lams window
        GM_addValueChangeListener("pressedKey", function(name, old_value, new_value, remote) {
            if(remote){
                // console.log("changed to " + new_value.pressedKey);
                onKeypress(new_value);
                GM_setValue("pressedKey", ""); //clear pressed key
            }
        });
    }

    var observer = new MutationObserver(function(){
        // console.log("DOM changed");

        //get video name from main site
        if(document.URL.match(/https:\/\/lams\.ntu\.edu\.sg\/lams\/tool\/lanb11\/learning\/learner\.do/)){
            // console.log(document.URL.match(/https:\/\/lams.ntu.edu.sg\/lams\/tool\/lanb11\/learning\/learner.do*/));
            var videoNamePath = ".panel-body > .panel"
            var videoNameElem = document.querySelector(videoNamePath);
            if( document.querySelector(".panel-body") !== null){
                var name = videoNameElem.innerText.trim()
                // console.log(name.indexOf("\n"));
                if(name.indexOf("\n") !== -1){ //get only first sentence
                    name = name.slice(0, name.indexOf("\n"));
                }
                // console.log(name);
                GM_setValue("videoName", name);
            }

            //set focus back to video every 500ms(workaround for fullscreen)
            if(document.querySelector("iframe") && !videoOnLoadAdded){
                window.setInterval( ()=>document.querySelector("iframe").focus(), 500);
            }
        }

        //for video player in iframe
        else if(document.URL.match(/https:\/\/presentur\.ntu\.edu\.sg\/aculearn-idm\/v8\/studio\/embed\.asp/)){
            //remove annoying box
            if(document.querySelector("#div_index") !== null){
                // console.log(document.querySelector("#div_index").style.width);
                document.querySelector("#div_index").style.width = "0px";
                document.querySelector("#div_index").style.height = "0px";
                document.querySelector("#div_index").style.visibility = "hidden";
                document.querySelector("#div_index").style.opacity = "0";
            }

            //video
            if(document.querySelector("#Video1_html5_api") !== null){
                if (videoOnLoadAdded === false){
                    videoOnLoadAdded = true;
                    document.querySelector("#Video1_html5_api").addEventListener("canplay", video1Onload);
                }
            }
        }
    });
    observer.observe(document, {childList: true, subtree: true});

    function video1Onload(){
        var video1Src = "";
        var videoName = GM_getValue("videoName", "video.mp4");
        var videoElem = document.querySelector("#Video1_html5_api");

        // console.log(videoName.indexOf(":"));

        while(videoName.indexOf(":") !== -1){ //remove colons
            var newStr = videoName.slice(0, videoName.indexOf(":"));
            newStr += videoName.slice(videoName.indexOf(":")+1, videoName.length);
            videoName = newStr
        }
        videoName += ".mp4";
        
        console.log("video1 canplay");
        console.log(videoName);
        
        video1Src = videoElem.src;
        console.log("video1 src: " + video1Src);

        //add container for buttons
        var buttonContainer = document.createElement("div");
        buttonContainer.id = "buttonContainer";
        buttonContainer.style = `
            position: absolute;
            z-index: 10;
            top: 0px;
            right: 0px;
            opacity: .5;
            background-color: black;   
            visibility: visible;
        `;
        document.querySelector("body").appendChild(buttonContainer);

        var buttonCSS = `
            background: none;
            color: white;
            border: 0;
            margin: 0px;
        `;

        // //open video source button
        // var videoSrcBtn = document.createElement("button");
        // videoSrcBtn.id = "videoSrcBtn";
        // videoSrcBtn.style = buttonCSS;
        // videoSrcBtn.innerHTML = "src";
        // videoSrcBtn.addEventListener("click", function(){
        //     window.open(video1Src, '_blank');
        // });
        // buttonContainer.appendChild(videoSrcBtn);

        //download video button
        var downloadBtn = document.createElement("button");
        downloadBtn.id = "downloadBtn";
        downloadBtn.style = buttonCSS;
        downloadBtn.innerHTML = "Download";
        downloadBtn.addEventListener("click", function(){
            GM_download({url:video1Src, name:videoName});
        });
        buttonContainer.appendChild(downloadBtn);

        //show video speed
        var videoSpdDis = document.createElement("p");
        videoSpdDis.id = "videoSpdDis";
        videoSpdDis.style = buttonCSS;
        videoSpdDis.style.textAlign = "right";
        videoSpdDis.style.marginRight = "6px";
        videoSpdDis.innerHTML = "Speed: " + videoElem.playbackRate.toFixed(1);
        buttonContainer.appendChild(videoSpdDis);
        videoElem.addEventListener("ratechange", ()=>{ //update playback rate 
            videoSpdDis.innerHTML = "Speed: " + videoElem.playbackRate.toFixed(1); 
        });

        //detect key press
        document.addEventListener("keydown", (keydownEvent)=>{
            onKeypress(getPressedkey(keydownEvent));
        });

        document.querySelector(".arv_fullscreenButton").addEventListener("click", ()=>{
            // console.log("exit fullscreen");
            if(IsFullScreen()) arvplayer.exitFullscreen();
        });

        document.querySelector("#Video1_html5_api").removeEventListener("canplay", video1Onload);
    }

    function onKeypress(keyInfo){
        var videoElem = document.querySelector("#Video1_html5_api");
        var newTime;

        // console.log("pressed " + keyInfo.pressedKey);

        if(!keyInfo.repeat){ //keys that should not press and hold
            //play/pause
            if(keyInfo.pressedKey === "p" || keyInfo.pressedKey === "P"){
                document.querySelector(".vjs-play-control").click();
                console.log("play/pause video");
            }
            //slow down
            else if(keyInfo.pressedKey === ","){
                arvplayer.playbackRate(fracPlusSub("-", arvplayer.playbackRate(), 0.5));
                console.log("slow coarse " + arvplayer.playbackRate());
            }
            //speed up
            else if(keyInfo.pressedKey === "."){
                arvplayer.playbackRate(fracPlusSub("+", arvplayer.playbackRate(), 0.5));
                console.log("fast coarse " + arvplayer.playbackRate());
            }
            //set saved playback speed
            else if(keyInfo.pressedKey === "s" || keyInfo.pressedKey === "S"){
                // console.log(videojs.getPlayers());
                arvplayer.playbackRate(2);
                // videoElem.playbackRate = 2;
                console.log("custom speed " + arvplayer.playbackRate());
            }
            //mute/unmute
            else if(keyInfo.pressedKey === "m" || keyInfo.pressedKey === "M"){
                arvplayer.muted(!arvplayer.muted());
                // document.querySelector(".vjs-mute-control").click();
                console.log("mute " + arvplayer.muted());
            }
            //toggle fullscreen
            else if(keyInfo.pressedKey === "f" || keyInfo.pressedKey === "F"){
                // console.log(IsFullScreen());
                // arvplayer.isFullscreen(!arvplayer.isFullscreen());
                if(IsFullScreen()) arvplayer.exitFullscreen();
                else document.querySelector(".arv_fullscreenButton").click();
                console.log("fullscreen");
            }
            //toggle hide extra stuff
            else if(keyInfo.pressedKey === "h" || keyInfo.pressedKey === "H"){
                if(document.querySelector("#buttonContainer").style.visibility === "visible"){
                    document.querySelector("#buttonContainer").style.visibility = "hidden";
                }
                else{
                    document.querySelector("#buttonContainer").style.visibility = "visible";
                }
                console.log("hide buttons " + document.querySelector("#buttonContainer").style.visibility);
            }
        }
        //allowed press and hold
        //slow down fine
        if(keyInfo.pressedKey === "<"){
            arvplayer.playbackRate(fracPlusSub("-", arvplayer.playbackRate(), 0.1));
            console.log("slow fine " + arvplayer.playbackRate());
        }
        //speed up fine
        else if(keyInfo.pressedKey === ">"){
            arvplayer.playbackRate(fracPlusSub("+", arvplayer.playbackRate(), 0.1));
            console.log("fast fine " + arvplayer.playbackRate());
        }
        //rewind
        else if(keyInfo.pressedKey === "ArrowLeft"){
            // console.log("rewind prev " + videoElem.currentTime);
            // newTime = fracPlusSub("-", videoElem.currentTime, 10)
            // if(newTime <= 0) videoElem.currentTime = 0;
            // else videoElem.currentTime = newTime;
            // console.log("rewind " + videoElem.currentTime);
            newTime = fracPlusSub("-", arvplayer.currentTime(), 3)
            if(newTime <= 0) arvplayer.currentTime(0);
            else arvplayer.currentTime(newTime);
            console.log("rewind " + arvplayer.currentTime());
        }
        //foward
        else if(keyInfo.pressedKey === "ArrowRight"){
            // console.log("foward prev " + videoElem.currentTime);
            // newTime = fracPlusSub("+", videoElem.currentTime, 10)
            // if(newTime >= videoElem.duration) videoElem.currentTime = videoElem.duration;
            // else videoElem.currentTime = newTime;
            // console.log("foward " + videoElem.currentTime);
            newTime = fracPlusSub("+", arvplayer.currentTime(), 3)
            if(newTime >= arvplayer.duration()) arvplayer.currentTime(arvplayer.duration());
            else arvplayer.currentTime(newTime);
            console.log("foward " + arvplayer.currentTime());
        }
        //volume up
        else if(keyInfo.pressedKey === "ArrowUp"){
            arvplayer.volume(fracPlusSub("+", parseFloat(arvplayer.volume()), 0.05));
            console.log("volume up " + arvplayer.volume());
        }
        //volume down
        else if(keyInfo.pressedKey === "ArrowDown"){
            arvplayer.volume(fracPlusSub("-", parseFloat(arvplayer.volume()), 0.05));
            console.log("volume down " + arvplayer.volume());
        }
    }

    function getPressedkey(keydownEvent){
        var keyInfo = {
            pressedKey: keydownEvent.key,
            repeat: keydownEvent.repeat,
            modifier: ""
        }

        if(keydownEvent.altKey) keyInfo.modifier="Alt";
        else if(keydownEvent.ctrlKey) keyInfo.modifier="Control";
        else if(keydownEvent.metaKey) keyInfo.modifier="OS";
        else if(keydownEvent.shiftKey) keyInfo.modifier="Shift";
        else keyInfo.modifier="";

        // console.log("modifier: "+keyInfo.modifier);

        return keyInfo;
    }

    //more accurate addition and subtraction of floating point 
    function fracPlusSub(sign, val1, val2){
        if(sign === "+"){
            return ((val1*100 + val2*100)/100).toFixed(2);
        }
        else if(sign === "-"){
            return ((val1*100 - val2*100)/100).toFixed(2);
        }
        else return 0.0;
    }
})();

/*
localStorage.getItem('arvplayer-playbackRate');
localStorage.setItem('arvplayer-playbackRate',i+1);
var arv_rate_list
set_arvRate(player);
function set_arvRate(player)
hideIndeximg()
player.pause();

btn zindex 10
position relative
*/

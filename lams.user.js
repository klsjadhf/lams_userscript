// ==UserScript==
// @name         lams
// @namespace    https://github.com/klsjadhf/lams_userscript
// @version      1.3.4
// @description  change lams video speed and download video button
// @author       klsjadhf
// @homepage     https://github.com/klsjadhf/lams_userscript
// @updateURL    https://github.com/klsjadhf/lams_userscript/releases/latest/download/lams.user.js
// @downloadURL  https://github.com/klsjadhf/lams_userscript/releases/latest/download/lams.user.js
// @match        http*://presentur.ntu.edu.sg/aculearn-idm/v8/studio/embed.asp*
// @match        http*://lams.ntu.edu.sg/lams/*
// @match        http*://ntulearn.ntu.edu.sg/webapps/blackboard/content/listContent.jsp*
// @match        http*://*.ntu.edu.sg/aculearn-me/v9/studio/play.asp*
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

    if(document.URL.match(/https:\/\/lams\.ntu\.edu\.sg\/lams/)){
        //if user pressed key in wrong window, send to iframe
        document.addEventListener("keydown", (keydownEvent) =>{
            switch(keydownEvent.key){
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowUp":
                case "ArrowDown":
                case " ":
                    keydownEvent.preventDefault(); //prevent scrolling
                default:
                    break;
            }
            GM_setValue("pressedKey", getPressedkey(keydownEvent));
            // console.log(GM_getValue("pressedKey").pressedKey);
        });
    }
    else if(document.URL.match(/https:\/\/presentur\.ntu\.edu\.sg\/aculearn-idm\/v8\/studio\/embed\.asp/) || document.URL.match(/ntu\.edu\.sg\/aculearn-me\/v9\/studio\/play\.asp/)){
        console.log("in vid player");
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
        if(document.URL.match(/https:\/\/lams\.ntu\.edu\.sg\/lams/)){
            // console.log(document.URL.match(/https:\/\/lams.ntu.edu.sg\/lams\/tool\/lanb11\/learning\/learner.do*/));
            var videoNamePath = ".panel-body > .panel"
            var videoNameElem = document.querySelector(videoNamePath);
            if( document.querySelector(".panel-body") !== null){
                var vidname = txtBiggestFont();
                console.log("vidname: " + vidname);
                GM_setValue("videoName", vidname);
            }

            //set focus back to video every 500ms(workaround for fullscreen)
            if(document.querySelector("iframe") && !videoOnLoadAdded){
                document.getElementsByTagName("iframe")[0].setAttribute("allowfullscreen", "yes");
                window.setInterval( ()=>document.querySelector("iframe").focus(), 500);
            }
        }

        //for video player in iframe
        else if(document.URL.match(/https:\/\/presentur\.ntu\.edu\.sg\/aculearn-idm\/v8\/studio\/embed\.asp/) || document.URL.match(/ntu\.edu\.sg\/aculearn-me\/v9\/studio\/play\.asp/)){
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
                    console.log("add canplay listener");
                    videoOnLoadAdded = true;
                    document.querySelector("#Video1_html5_api").addEventListener("canplay", video1Onload);
                }
            }
        }
        else if(document.URL.match(/https:\/\/ntulearn\.ntu\.edu\.sg\/webapps\/blackboard\/content\/listContent\.jsp/)){
            var aList = document.getElementsByTagName("a");
            for (var link of aList){
                console.log(link.href);
                if(link.href.match(/https:\/\/presentur\.ntu\.edu\.sg\/aculearn-idm\/v8\/studio\/embed\.asp/) || link.href.match(/\/webapps\/Acu-AcuLe@rn-BB5dcb73f79ba4c\/am\/start_play_studio\.jsp/)){
                    console.log(link.text);
                    link.addEventListener("click", getLinkName);
                    link.addEventListener("auxclick", getLinkName); //for middle click
                }
            }
        }
    });
    observer.observe(document, {childList: true, subtree: true});

    function getLinkName(){
        console.log("vidname: " + this.text);
        GM_setValue("videoName", this.text);
    }

    function video1Onload(){
        var video1Src = "";
        var videoName = GM_getValue("videoName", "video.mp4");
        var videoElem = document.querySelector("#Video1_html5_api");

        // console.log(videoName.indexOf(":"));

        if (videoName.length == 0){
            videoName = "video.mp4";
        }
        else{
            videoName = videoName.replace(/[*/:<>?\\|]/g, s =>
                String.fromCharCode(s.charCodeAt(0) + 0xFF00 - 0x20));
            videoName += ".mp4";
        }
        
        console.log("video1 canplay");
        console.log(videoName);
        
        video1Src = videoElem.src;
        console.log("video1 src: " + video1Src);

        //add container for buttons
        var buttonContainer = document.createElement("div");
        buttonContainer.id = "buttonContainer";
        buttonContainer.style = `
            box-sizing: border-box;
            position: absolute;
            z-index: 10;
            top: 0px;
            right: 0px;
            opacity: .3;
            background-color: black;   
            visibility: visible;
            display: grid;
            grid-gap = 2px;
        `;
        document.querySelector("body").appendChild(buttonContainer);

        var buttonCSS = `
            background: none;
            color: white;
            border: 0;
            margin: 0px;
            padding: 0px;
            text-align: center;
            grid-row-start: 1;
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

        //container for video speed controls
        var speedContainer = document.createElement("div");
        speedContainer.id = "speedContainer";
        speedContainer.style = `
            display: grid;
            grid-gap: 2px;
        `;
        buttonContainer.appendChild(speedContainer);

        //show video speed
        var videoSpdDis = document.createElement("span");
        videoSpdDis.id = "videoSpdDis";
        videoSpdDis.style = buttonCSS;
        videoSpdDis.style.fontSize = "1.1em";
        // videoSpdDis.style.textAlign = "right";
        // videoSpdDis.style.marginRight = "6px";
        videoSpdDis.innerHTML = videoElem.playbackRate.toFixed(1);
        speedContainer.appendChild(videoSpdDis);
        videoElem.addEventListener("ratechange", ()=>{ //update playback rate 
            videoSpdDis.innerHTML = videoElem.playbackRate.toFixed(1); 
        });

        //slow down button
        var slowBtn = document.createElement("button");
        slowBtn.id = "slowBtn";
        slowBtn.style = buttonCSS;
        slowBtn.style.backgroundColor = "white";
        slowBtn.style.color = "black";
        slowBtn.style.borderRadius = "3px";
        slowBtn.innerHTML = "&#x2796;";
        slowBtn.addEventListener("click", function(){
            onKeypress({
                pressedKey: ",",
                repeat: false,
                modifier: ""});
            // console.log("slow");
        });
        speedContainer.insertBefore(slowBtn, videoSpdDis);

        //speed up button
        var fastBtn = document.createElement("button");
        fastBtn.id = "fastBtn";
        fastBtn.style = buttonCSS;
        fastBtn.style.backgroundColor = "white";
        fastBtn.style.color = "black";
        fastBtn.style.borderRadius = "3px";
        fastBtn.innerHTML = "&#x2795;";
        fastBtn.addEventListener("click", function(){
            onKeypress({
                pressedKey: ".",
                repeat: false,
                modifier: ""});
            // console.log("fast");
        });
        speedContainer.appendChild(fastBtn);

        //detect key press
        document.addEventListener("keydown", (keydownEvent)=>{
            switch(keydownEvent.key){
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowUp":
                case "ArrowDown":
                case " ":
                    keydownEvent.preventDefault(); //prevent scrolling
                default:
                    break;
            }
            onKeypress(getPressedkey(keydownEvent));
        });
        document.addEventListener("keyup", (keyupEvent)=>{ //prevent button press
            switch(keyupEvent.key){
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowUp":
                case "ArrowDown":
                case " ":
                    keyupEvent.preventDefault(); //prevent scrolling
                default:
                    break;
            }
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
            if(keyInfo.pressedKey === "p" || keyInfo.pressedKey === "P" || keyInfo.pressedKey === " "){
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
            newTime = fracPlusSub("-", arvplayer.currentTime(), 5)
            if(newTime <= 0) arvplayer.currentTime(0);
            else arvplayer.currentTime(newTime);
            console.log("rewind " + arvplayer.currentTime());
        }
        //foward
        else if(keyInfo.pressedKey === "ArrowRight"){
            newTime = fracPlusSub("+", arvplayer.currentTime(), 5)
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

    //returns text on page with biggest font size
    function txtBiggestFont(){
        var xpath = "//*[contains(@class, 'panel-body')]/text()";
        var textNodes = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE,null); //get all text nodes
        var result = textNodes.iterateNext();
        var maxFont = 0;
        var maxFontElm;
        while (result) {
            var fontsize = parseInt(window.getComputedStyle(result.parentElement).fontSize);
            if(fontsize > maxFont){
                // console.log(result.parentElement);
                maxFont = fontsize;
                maxFontElm = result.parentElement;
            }
            result = textNodes.iterateNext();
        }
        var name = maxFontElm.innerText.trim();
        if(name.indexOf("\n") !== -1){ //get only first sentence
            name = name.slice(0, name.indexOf("\n"));
        }
        return name;
    }
})();
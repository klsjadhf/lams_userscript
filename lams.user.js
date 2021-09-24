// ==UserScript==
// @name         lams
// @namespace    https://github.com/klsjadhf/lams_userscript
// @version      1.5.0
// @description  change lams video speed and download video button
// @author       klsjadhf
// @homepage     https://github.com/klsjadhf/lams_userscript
// @updateURL    https://github.com/klsjadhf/lams_userscript/releases/latest/download/lams.user.js
// @downloadURL  https://github.com/klsjadhf/lams_userscript/releases/latest/download/lams.user.js
// @match        http*://presentur.ntu.edu.sg/aculearn-idm/v8/studio/embed.asp*
// @match        http*://lams.ntu.edu.sg/lams/*
// @match        http*://ntulearn.ntu.edu.sg/webapps/blackboard/content/listContent.jsp*
// @match        http*://*.ntu.edu.sg/aculearn-me/v9/studio/play.asp*
// @match        http*://api.sg.kaltura.com/*
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
    var vidPlayerType = "none";
    var kaltura_iframe = null;
    var kDoc = null;

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
            // var videoNameElem = document.querySelector(videoNamePath);
            if( document.querySelector(".panel-body") !== null){
                var vidname = txtBiggestFont();
                console.log("vidname: " + vidname);
                GM_setValue("videoName", vidname);
            }

            // for new kaltura based videos
            if (document.getElementById("kaltura_player_1595401760_ifp")){
                console.log("found kaltura iframe")

                kaltura_iframe = document.getElementById("kaltura_player_1595401760_ifp").contentWindow;

                kDoc = kaltura_iframe.document;
                var vid = kDoc.getElementsByTagName("video")[0];

                // console.log("vid");
                // console.log(vid);

                if ( (videoOnLoadAdded === false) && vid){
                    vidPlayerType = "kaltura"

                    console.log("add video load listener");
                    videoOnLoadAdded = true;
                    // vid.addEventListener("loadstart", kaltura_onLoad);
                    vid.addEventListener("loadstart", videoOnload);

                    window.setInterval( ()=>vid.focus(), 500);
                }
            }

            //set focus back to video every 500ms(workaround for fullscreen)
            else if(document.querySelector("iframe") && !videoOnLoadAdded){
                document.getElementsByTagName("iframe")[0].setAttribute("allowfullscreen", "yes");
                window.setInterval( ()=>{
                    document.querySelector("iframe").focus();
                    console.log("set focus")
                }, 500);
            }
        }

        // another variant of kaltura
        else if (document.URL.match(/https:\/\/api\.sg\.kaltura\.com/)){
            console.log("kaltura 2")
            kaltura_iframe = window;
            kDoc = document;

            var vid = kDoc.getElementsByTagName("video")[0];
            // console.log("vid");
            // console.log(vid);

            if ( (videoOnLoadAdded === false) && vid){
                vidPlayerType = "kaltura"

                console.log("add video load listener");
                videoOnLoadAdded = true;
                // vid.addEventListener("loadstart", kaltura_onLoad);
                vid.addEventListener("loadstart", videoOnload);

                window.setInterval( ()=>vid.focus(), 500);
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
                    vidPlayerType = "arvplayer"

                    console.log("add canplay listener");
                    videoOnLoadAdded = true;
                    document.querySelector("#Video1_html5_api").addEventListener("canplay", videoOnload);
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
    
    var videoSrc = "";
    var videoName = "video.mp4";
    var videoElem;
    var vidPlayer;
    var vidDoc;

    function videoOnload(){
        // var video1Src = "";
        // var videoName = GM_getValue("videoName", "video.mp4");
        
        if (vidPlayerType == "arvplayer"){
            videoName = GM_getValue("videoName", "video.mp4");

            videoElem = document.querySelector("#Video1_html5_api");
            vidPlayer = arvplayer;

            if (videoName.length == 0){
                if(arv_title != null){   
                    console.log(arv_title.contentEl().firstChild.textContent);
                    videoName = arv_title.contentEl().firstChild.textContent;
                }
                else{
                    videoName = "video";
                }
            }
            videoSrc = videoElem.src;
            vidDoc = document;
        }
        else if(vidPlayerType == "kaltura"){
            // videoElem = kaltura_iframe.document.getElementById("pid_kaltura_player_1595401760");
            videoElem = kDoc.getElementsByTagName("video")[0];
            // vidPlayer = kaltura_iframe.kaltura_player_1595401760;
            vidPlayer = kDoc.getElementsByClassName("mwEmbedPlayer")[0];

            console.log(videoElem);
            console.log(vidPlayer);

            videoName = vidPlayer.kalturaPlayerMetaData.name;

            // find source with highest resolution, assume is last item in array without data-flavorid
            // with data-flavorid is playlist type
            for (let i=vidPlayer.kalturaFlavors.length-1; i>=0; i--){
                console.log(vidPlayer.kalturaFlavors[i]["data-flavorid"]);
                if (vidPlayer.kalturaFlavors[i]["data-flavorid"] === undefined){
                    videoSrc = vidPlayer.kalturaFlavors[i].src;
                    break;
                }
            }

            // stuff for selecting highest quality for playback
            // var kaltura_iframe = document.getElementById("kaltura_player_1595401760_ifp").contentWindow;
            // var vidPlayer = kaltura_iframe.kaltura_player_1595401760;
            // vidPlayer.mediaElement.sources[i];
            // vidPlayer.switchSrc()
            // vidPlayer.sendNotification("doSwitch", { flavorIndex: i });

            // disable kaltura keyboard shortcuts
            console.log("disable kaltura kb shortcut");
            vidPlayer.plugins.keyboardShortcuts.enableKeyBindings = false;
            
            vidDoc = kaltura_iframe.document;
        }

        var touch_x = 0; //for touch events
        var touch_y = 0;
        var touch_thres = 50;

        // console.log(videoName.indexOf(":"));
        
        videoName = videoName.replace(/[*/:<>?\\|]/g, s =>
            String.fromCharCode(s.charCodeAt(0) + 0xFF00 - 0x20));
        videoName += ".mp4";
        
        console.log("video canplay");
        console.log("video name " + videoName);
        
        console.log("video src: " + videoSrc);

        //add container for buttons
        var buttonContainer = vidDoc.createElement("div");
        buttonContainer.id = "buttonContainer";
        buttonContainer.style = `
            box-sizing: border-box;
            position: absolute;
            z-index: 10;
            top: 20px;
            right: 0px;
            opacity: .3;
            background-color: black;   
            visibility: visible;
            display: grid;
            grid-gap = 2px;
        `;
        vidDoc.querySelector("body").appendChild(buttonContainer);

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
        var downloadBtn = vidDoc.createElement("button");
        downloadBtn.id = "downloadBtn";
        downloadBtn.style = buttonCSS;
        downloadBtn.innerHTML = "Download";
        downloadBtn.addEventListener("click", function(){
            GM_download({url:videoSrc, name:videoName});
        });
        buttonContainer.appendChild(downloadBtn);

        //container for video speed controls
        var speedContainer = vidDoc.createElement("div");
        speedContainer.id = "speedContainer";
        speedContainer.style = `
            display: grid;
            grid-gap: 2px;
        `;
        buttonContainer.appendChild(speedContainer);

        //show video speed
        var videoSpdDis = vidDoc.createElement("span");
        videoSpdDis.id = "videoSpdDis";
        videoSpdDis.style = buttonCSS;
        videoSpdDis.style.fontSize = "1.1em";
        // videoSpdDis.style.textAlign = "right";
        // videoSpdDis.style.marginRight = "6px";
        videoSpdDis.innerHTML = videoElem.playbackRate.toFixed(1);
        speedContainer.appendChild(videoSpdDis);
        videoElem.addEventListener("ratechange", ()=>{ //update playback rate 
            videoSpdDis.innerHTML = videoElem.playbackRate.toFixed(2); 
        });

        //slow down button
        var slowBtn = vidDoc.createElement("button");
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
        var fastBtn = vidDoc.createElement("button");
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
        vidDoc.addEventListener("keydown", (keydownEvent)=>{
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
        vidDoc.addEventListener("keyup", (keyupEvent)=>{ //prevent button press
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

        //touch controls
        if (vidPlayerType == "arvplayer")
            var playElem = videoElem;
        else if(vidPlayerType == "kaltura")
            var playElem = vidPlayer;

        playElem.addEventListener("touchstart", (event)=>{
        // videoElem.addEventListener("touchstart", (event)=>{
            if(event.targetTouches.length === 1){   //check only one finger touching screen  
                // event.preventDefault(); //prevent scrolling               
                touch_x = event.touches[0].clientX;
                touch_y = event.touches[0].clientY;
                console.log("touch start");
                // console.log("x: " + String(x) + ", y: " + String(y));
            }
        });
        playElem.addEventListener("touchmove", (event)=>{
        // videoElem.addEventListener("touchmove", (event)=>{
            if(event.targetTouches.length === 1){   //check only one finger touching screen  
                event.preventDefault(); //prevent scrolling               
                var x = event.touches[0].clientX - touch_x;
                var y = event.touches[0].clientY - touch_y;
                // console.log("x: " + String(x) + ", y: " + String(y));
                if(Math.abs(x)>touch_thres && Math.abs(y)<touch_thres ){ //horizontal movement
                    var tDelta = x/100;
                    console.log("hor x: " + String(x) + ", tDelta: " + String(tDelta) + ", time: " + time_change("+", tDelta));
                }
                else if(Math.abs(y)>touch_thres && Math.abs(x)<touch_thres ){ //vertical movement
                    var vDelta = parseFloat( y/20000 );
                    console.log("ver y: " + String(y) + ", vDelta: " + String(vDelta) + ", vol: " + vol_change("-", vDelta));
                }
            }
            // console.log(event.changedTouches);
        });

        if (vidPlayerType == "arvplayer"){
            videoElem.removeEventListener("canplay", videoOnload);

            document.querySelector(".arv_fullscreenButton").addEventListener("click", ()=>{
                // console.log("exit fullscreen");
                if(IsFullScreen()) arvplayer.exitFullscreen();
            });

            // document.querySelector("#Video1_html5_api").removeEventListener("canplay", videoOnload);
        }
        else if(vidPlayerType == "kaltura"){
            videoElem.removeEventListener("loadstart", videoOnload);
        }
    }

    // change playback rate by certain amount dir + is speed up
    function rate_change(dir, amt){
        var pbRate;
        if (vidPlayerType == "arvplayer"){
            arvplayer.playbackRate(fracPlusSub(dir, arvplayer.playbackRate(), amt));
            pbRate = arvplayer.playbackRate();
        }
        else if(vidPlayerType == "kaltura" && vidPlayer.plugins.keyboardShortcuts.enableKeyBindings === false){
            var kVid_spd_btn = kaltura_iframe.document.getElementsByClassName("playbackRateSelector")[0].getElementsByTagName("button")[0];
            videoElem.playbackRate = fracPlusSub(dir, videoElem.playbackRate, amt);
            pbRate = videoElem.playbackRate;
            kVid_spd_btn.textContent = pbRate + "x";
        }
        return pbRate;
    }

    // change current video time by amount (forward/rewind)
    function time_change(dir, amt){
        var curTime;
        var newTime;

        if (vidPlayerType == "arvplayer"){
            newTime = fracPlusSub(dir, arvplayer.currentTime(), amt);
            if(newTime <= 0) arvplayer.currentTime(0);
            else if(newTime >= arvplayer.duration()) arvplayer.currentTime(arvplayer.duration());
            else arvplayer.currentTime(newTime);

            curTime = arvplayer.currentTime();
        }
        // avoid conflict with kaltura keyboard shortcuts
        else if(vidPlayerType == "kaltura" && vidPlayer.plugins.keyboardShortcuts.enableKeyBindings === false){
            newTime = fracPlusSub(dir, videoElem.currentTime, amt);
            if(newTime <= 0) videoElem.currentTime = 0;
            else if(newTime >= videoElem.duration) videoElem.currentTime = videoElem.duration;
            else videoElem.currentTime = newTime;

            curTime = videoElem.currentTime;
        }
        return curTime;
    }

    function vol_change(dir, amt){
        var vol;

        if (vidPlayerType == "arvplayer"){
            arvplayer.volume(fracPlusSub(dir, parseFloat(arvplayer.volume()), amt));
            vol = arvplayer.volume();
        }
        //avoid conflict with kaltura keyboard shortcuts
        else if(vidPlayerType == "kaltura" && vidPlayer.plugins.keyboardShortcuts.enableKeyBindings === false){
            vidPlayer.setVolume(fracPlusSub(dir, parseFloat(vidPlayer.volume), amt));
            vol = vidPlayer.volume;
        }
        return vol;
    }

    function onKeypress(keyInfo){
        // var videoElem = document.querySelector("#Video1_html5_api");
        var newTime;

        // console.log("pressed " + keyInfo.pressedKey);

        if(!keyInfo.repeat){ //keys that should not press and hold
            //play/pause
            if(keyInfo.pressedKey === "p" || keyInfo.pressedKey === "P" || keyInfo.pressedKey === " "){
                if (vidPlayerType == "arvplayer"){
                    document.querySelector(".vjs-play-control").click();
                }
                else if(vidPlayerType == "kaltura"){
                    //avoid conflict with kaltura keyboard shortcuts
                    if (keyInfo.pressedKey !== " " || vidPlayer.plugins.keyboardShortcuts.enableKeyBindings === false) 
                        vidPlayer.togglePlayback();
                }
                console.log("play/pause video");
            }
            //slow down
            else if(keyInfo.pressedKey === ","){
                console.log("slow coarse " + rate_change("-", 0.5) );
            }
            //speed up
            else if(keyInfo.pressedKey === "."){
                console.log("fast coarse " + rate_change("+", 0.5) );
            }
            //set saved playback speed
            else if(keyInfo.pressedKey === "s" || keyInfo.pressedKey === "S"){
                var pbRate = 2;

                if (vidPlayerType == "arvplayer"){
                    arvplayer.playbackRate(pbRate);
                    pbRate = arvplayer.playbackRate();
                }
                else if(vidPlayerType == "kaltura"){
                    videoElem.playbackRate = pbRate;
                    pbRate = videoElem.playbackRate;
                }
                console.log("custom speed " + pbRate);
            }
            //mute/unmute
            else if(keyInfo.pressedKey === "m" || keyInfo.pressedKey === "M"){
                var muted;

                if (vidPlayerType == "arvplayer"){
                    arvplayer.muted(!arvplayer.muted());
                    muted = arvplayer.muted();
                }
                else if(vidPlayerType == "kaltura" && vidPlayer.plugins.keyboardShortcuts.enableKeyBindings === false){
                    vidPlayer.toggleMute();
                    muted = vidPlayer.muted;
                }
                console.log("mute " + muted);
            }
            //toggle fullscreen
            else if(keyInfo.pressedKey === "f" || keyInfo.pressedKey === "F"){

                if (vidPlayerType == "arvplayer"){
                    if(IsFullScreen()) arvplayer.exitFullscreen();
                    else document.querySelector(".arv_fullscreenButton").click();
                }
                else if(vidPlayerType == "kaltura" && vidPlayer.plugins.keyboardShortcuts.enableKeyBindings === false){
                    var isFullScreen = vidPlayer.layoutBuilder.fullScreenManager.inFullScreen;
                    console.log("isFullScreen " + isFullScreen);
                    // if (isFullScreen){ //use kaltura shortcut for enter fullscreen, use this for exit fullscreen only
                        vidPlayer.toggleFullscreen();
                        // vidPlayer.layoutBuilder.fullScreenManager.restoreWindowPlayer();
                        // vidPlayer.layoutBuilder.fullScreenManager.doFullScreenPlayer();
                    // }
                }
                console.log("fullscreen");
            }
            //toggle hide extra stuff
            else if(keyInfo.pressedKey === "h" || keyInfo.pressedKey === "H"){
                if(vidDoc.querySelector("#buttonContainer").style.visibility === "visible"){
                    vidDoc.querySelector("#buttonContainer").style.visibility = "hidden";
                }
                else{
                    vidDoc.querySelector("#buttonContainer").style.visibility = "visible";
                }
                console.log("hide buttons " + vidDoc.querySelector("#buttonContainer").style.visibility);
            }
            //download video
            else if(keyInfo.pressedKey === "d" || keyInfo.pressedKey === "D"){
                GM_download({url:videoSrc, name:videoName});
                console.log("download video " + videoName + " from " + videoSrc);
            }
        }
        //allowed press and hold
        //slow down fine
        if(keyInfo.pressedKey === "<"){
            console.log("slow fine " + rate_change("-", 0.1) );
        }
        //speed up fine
        else if(keyInfo.pressedKey === ">"){
            console.log("fast fine " + rate_change("+", 0.1) );

        }
        //rewind
        else if(keyInfo.pressedKey === "ArrowLeft"){
            console.log("rewind " + time_change("-", 5));
        }
        //forward
        else if(keyInfo.pressedKey === "ArrowRight"){
            console.log("forward " + time_change("+", 5));
        }
        //volume up
        else if(keyInfo.pressedKey === "ArrowUp"){
            console.log("volume up " + vol_change("+", 0.05));
        }
        //volume down
        else if(keyInfo.pressedKey === "ArrowDown"){
            console.log("volume down " + vol_change("-", 0.05));
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
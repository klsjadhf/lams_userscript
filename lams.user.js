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
                var vid = kaltura_iframe.document.getElementById("pid_kaltura_player_1595401760");

                console.log("vid");
                console.log(vid);

                if ( (videoOnLoadAdded === false) && vid){
                    vidPlayerType = "kaltura"

                    console.log("add video load listener");
                    videoOnLoadAdded = true;
                    // vid.addEventListener("loadstart", kaltura_onLoad);
                    vid.addEventListener("loadstart", videoOnload);

                    window.setInterval( ()=>kaltura_iframe.focus(), 500);
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

    function kaltura_onLoad(){
        var videoElem = kaltura_iframe.document.getElementById("pid_kaltura_player_1595401760");
        var vidPlayer = kaltura_iframe.kaltura_player_1595401760;

        
        var vidName = vidPlayer.kalturaPlayerMetaData.name;
        var downloadUrl = "none"

        // find source with highest resolution, assume is last item in array without data-flavorid
        // with data-flavorid is playlist type
        for (let i=vidPlayer.kalturaFlavors.length-1; i>=0; i--){
            console.log(vidPlayer.kalturaFlavors[i]["data-flavorid"]);
            if (vidPlayer.kalturaFlavors[i]["data-flavorid"] === undefined){
                downloadUrl = vidPlayer.kalturaFlavors[i].src;
                break;
            }
        }

        console.log("test");
        console.log( kaltura_iframe.kalturaIframePackageData );
        console.log( videoElem.getAttribute("kentryid") );
        vidPlayer.play();
        console.log(vidName);
        console.log(downloadUrl);
        
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
            videoElem = kaltura_iframe.document.getElementById("pid_kaltura_player_1595401760");
            vidPlayer = kaltura_iframe.kaltura_player_1595401760;

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
        console.log(videoName);
        
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
            videoSpdDis.innerHTML = videoElem.playbackRate.toFixed(1); 
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
        videoElem.addEventListener("touchstart", (event)=>{
            if(event.targetTouches.length === 1){   //check only one finger touching screen  
                // event.preventDefault(); //prevent scrolling               
                touch_x = event.touches[0].clientX;
                touch_y = event.touches[0].clientY;
                console.log("touch start");
                // console.log("x: " + String(x) + ", y: " + String(y));
            }
        });
        videoElem.addEventListener("touchmove", (event)=>{
            if(event.targetTouches.length === 1){   //check only one finger touching screen  
                event.preventDefault(); //prevent scrolling               
                var x = event.touches[0].clientX - touch_x;
                var y = event.touches[0].clientY - touch_y;
                // console.log("x: " + String(x) + ", y: " + String(y));
                if(Math.abs(x)>touch_thres && Math.abs(y)<touch_thres ){ //horizontal movement
                    var newTime = arvplayer.currentTime() + (x/100);
                    if(newTime <= 0) arvplayer.currentTime(0);                    
                    else if(newTime >= arvplayer.duration()) arvplayer.currentTime(arvplayer.duration());
                    else arvplayer.currentTime(newTime);
                    console.log("hor x: " + String(x) + ", newTime: " + String(newTime) + ", time: " + String(arvplayer.currentTime()));
                }
                else if(Math.abs(y)>touch_thres && Math.abs(x)<touch_thres ){ //vertical movement
                    var new_vol = parseFloat(arvplayer.volume()) - (y/20000);
                    arvplayer.volume(new_vol);
                    console.log("ver y: " + String(y) + ", new vol: " + String(new_vol) + ", vol: "+ String(arvplayer.volume()));
                }
            }
            // console.log(event.changedTouches);
        });

        document.querySelector(".arv_fullscreenButton").addEventListener("click", ()=>{
            // console.log("exit fullscreen");
            if(IsFullScreen()) arvplayer.exitFullscreen();
        });

        document.querySelector("#Video1_html5_api").removeEventListener("canplay", videoOnload);
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
                    if (keyInfo.pressedKey !== " ") //avoid conflict with kaltura keyboard shortcuts
                        vidPlayer.togglePlayback();
                }
                console.log("play/pause video");
            }
            //slow down
            else if(keyInfo.pressedKey === ","){
                var pbRate;
                if (vidPlayerType == "arvplayer"){
                    arvplayer.playbackRate(fracPlusSub("-", arvplayer.playbackRate(), 0.5));
                    pbRate = arvplayer.playbackRate();
                }
                else if(vidPlayerType == "kaltura"){
                    videoElem.playbackRate = fracPlusSub("-", videoElem.playbackRate, 0.5);
                    pbRate = videoElem.playbackRate;
                }
                console.log("slow coarse " + pbRate);
            }
            //speed up
            else if(keyInfo.pressedKey === "."){
                var pbRate;
                if (vidPlayerType == "arvplayer"){
                    arvplayer.playbackRate(fracPlusSub("+", arvplayer.playbackRate(), 0.5));
                    pbRate = arvplayer.playbackRate();
                }
                else if(vidPlayerType == "kaltura"){
                    videoElem.playbackRate = fracPlusSub("+", videoElem.playbackRate, 0.5);
                    pbRate = videoElem.playbackRate;
                }
                console.log("fast coarse " + pbRate);
            }
            //set saved playback speed
            else if(keyInfo.pressedKey === "s" || keyInfo.pressedKey === "S"){
                // // console.log(videojs.getPlayers());
                // arvplayer.playbackRate(2);
                // // videoElem.playbackRate = 2;
                // console.log("custom speed " + arvplayer.playbackRate());

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
                // arvplayer.muted(!arvplayer.muted());
                // // document.querySelector(".vjs-mute-control").click();
                // console.log("mute " + arvplayer.muted());

                var muted;

                if (vidPlayerType == "arvplayer"){
                    arvplayer.muted(!arvplayer.muted());
                    muted = arvplayer.muted();
                }
                else if(vidPlayerType == "kaltura"){
                    vidPlayer.toggleMute();
                    muted = vidPlayer.muted;
                }
                console.log("mute " + muted);
            }
            //toggle fullscreen
            else if(keyInfo.pressedKey === "f" || keyInfo.pressedKey === "F"){
                // // console.log(IsFullScreen());
                // // arvplayer.isFullscreen(!arvplayer.isFullscreen());
                // if(IsFullScreen()) arvplayer.exitFullscreen();
                // else document.querySelector(".arv_fullscreenButton").click();

                if (vidPlayerType == "arvplayer"){
                    if(IsFullScreen()) arvplayer.exitFullscreen();
                    else document.querySelector(".arv_fullscreenButton").click();
                }
                else if(vidPlayerType == "kaltura"){
                    vidPlayer.toggleFullscreen();
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
            // arvplayer.playbackRate(fracPlusSub("-", arvplayer.playbackRate(), 0.1));
            // console.log("slow fine " + arvplayer.playbackRate());

            var pbRate;
            if (vidPlayerType == "arvplayer"){
                arvplayer.playbackRate(fracPlusSub("-", arvplayer.playbackRate(), 0.1));
                pbRate = arvplayer.playbackRate();
            }
            else if(vidPlayerType == "kaltura"){
                videoElem.playbackRate = fracPlusSub("-", videoElem.playbackRate, 0.1);
                pbRate = videoElem.playbackRate;
            }
            console.log("slow fine " + pbRate);
        }
        //speed up fine
        else if(keyInfo.pressedKey === ">"){
            // arvplayer.playbackRate(fracPlusSub("+", arvplayer.playbackRate(), 0.1));
            // console.log("fast fine " + arvplayer.playbackRate());

            var pbRate;
            if (vidPlayerType == "arvplayer"){
                arvplayer.playbackRate(fracPlusSub("+", arvplayer.playbackRate(), 0.1));
                pbRate = arvplayer.playbackRate();
            }
            else if(vidPlayerType == "kaltura"){
                videoElem.playbackRate = fracPlusSub("+", videoElem.playbackRate, 0.1);
                pbRate = videoElem.playbackRate;
            }
            console.log("fast fine " + pbRate);
        }
        //rewind
        else if(keyInfo.pressedKey === "ArrowLeft"){
            // var newTime = fracPlusSub("-", arvplayer.currentTime(), 5)
            // if(newTime <= 0) arvplayer.currentTime(0);
            // else arvplayer.currentTime(newTime);
            // console.log("rewind " + arvplayer.currentTime());

            var curTime;
            var newTime;

            if (vidPlayerType == "arvplayer"){
                newTime = fracPlusSub("-", arvplayer.currentTime(), 5);
                if(newTime <= 0) arvplayer.currentTime(0);
                else arvplayer.currentTime(newTime);

                curTime = arvplayer.currentTime();
            }
            //avoid conflict with kaltura keyboard shortcuts
            // else if(vidPlayerType == "kaltura"){
            //     newTime = fracPlusSub("-", videoElem.currentTime, 5);
            //     if(newTime <= 0) videoElem.currentTime = 0;
            //     else videoElem.currentTime = newTime;

            //     curTime = videoElem.currentTime;
            // }
            console.log("rewind " + curTime);
        }
        //forward
        else if(keyInfo.pressedKey === "ArrowRight"){
            // var newTime = fracPlusSub("+", arvplayer.currentTime(), 5)
            // if(newTime >= arvplayer.duration()) arvplayer.currentTime(arvplayer.duration());
            // else arvplayer.currentTime(newTime);
            // console.log("forward " + arvplayer.currentTime());

            var curTime;
            var newTime;
            
            if (vidPlayerType == "arvplayer"){
                newTime = fracPlusSub("+", arvplayer.currentTime(), 5);
                if(newTime >= arvplayer.duration()) arvplayer.currentTime(arvplayer.duration());
                else arvplayer.currentTime(newTime);

                curTime = arvplayer.currentTime();
            }
            //avoid conflict with kaltura keyboard shortcuts
            // else if(vidPlayerType == "kaltura"){
            //     newTime = fracPlusSub("+", videoElem.currentTime, 5);
            //     if(newTime >= videoElem.duration) videoElem.currentTime = videoElem.duration;
            //     else videoElem.currentTime = newTime;

            //     curTime = videoElem.currentTime;
            // }
            console.log("forward " + curTime);
        }
        //volume up
        else if(keyInfo.pressedKey === "ArrowUp"){
            // arvplayer.volume(fracPlusSub("+", parseFloat(arvplayer.volume()), 0.05));
            // console.log("volume up " + arvplayer.volume());

            var vol;

            if (vidPlayerType == "arvplayer"){
                arvplayer.volume(fracPlusSub("+", parseFloat(arvplayer.volume()), 0.05));
                vol = arvplayer.volume();
            }
            //avoid conflict with kaltura keyboard shortcuts
            // else if(vidPlayerType == "kaltura"){
            //     vidPlayer.setVolume(fracPlusSub("+", parseFloat(vidPlayer.volume), 0.05));
            //     vol = vidPlayer.volume;
            // }
            console.log("volume up " + vol);
        }
        //volume down
        else if(keyInfo.pressedKey === "ArrowDown"){
            // arvplayer.volume(fracPlusSub("-", parseFloat(arvplayer.volume()), 0.05));
            // console.log("volume down " + arvplayer.volume());

            var vol;

            if (vidPlayerType == "arvplayer"){
                arvplayer.volume(fracPlusSub("-", parseFloat(arvplayer.volume()), 0.05));
                vol = arvplayer.volume();
            }
            //avoid conflict with kaltura keyboard shortcuts
            // else if(vidPlayerType == "kaltura"){
            //     vidPlayer.setVolume(fracPlusSub("-", parseFloat(vidPlayer.volume), 0.05));
            //     vol = vidPlayer.volume;
            // }
            console.log("volume down " + vol);
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
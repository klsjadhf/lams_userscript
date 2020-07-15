// ==UserScript==
// @name         lams
// @namespace    https://github.com/klsjadhf/lams_userscript
// @version      0.23
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

    console.log(GM_listValues().map(GM_getValue));
    console.log("tampermonkey script running on " + window.location.hostname);

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
        //console.log("DOM changed");

        //get video name from main site
        if(document.URL.match(/https:\/\/lams\.ntu\.edu\.sg\/lams\/tool\/lanb11\/learning\/learner\.do/)){
            // console.log(document.URL.match(/https:\/\/lams.ntu.edu.sg\/lams\/tool\/lanb11\/learning\/learner.do*/));
            var videoNamePath = ".panel-body > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > strong:nth-child(1) > span:nth-child(1) > span:nth-child(1)"
            var videoNameElem = document.querySelector(videoNamePath);
            if( videoNameElem !== null){
                GM_setValue("videoName", videoNameElem.textContent);
                // console.log(videoNameElem.textContent);
            }

            //set focus back to video every 500ms(workaround for fullscreen)
            window.setInterval( ()=>document.querySelector("iframe").focus(), 500);
        }

        //for video player in iframe
        else if(document.URL.match(/https:\/\/presentur\.ntu\.edu\.sg\/aculearn-idm\/v8\/studio\/embed\.asp/)){
            //remove annoying box
            if(document.querySelector("#div_index") !== null){
                // console.log(document.querySelector("#div_index").style.width);
                if(document.querySelector("#div_index").style.width === "100%"){
                    document.querySelector("#div_index").style.width = "0px";
                }
            }

            //video
            if(document.querySelector("#Video1_html5_api") !== null){
                document.querySelector("#Video1_html5_api").addEventListener("canplay",video1Onload);
            }
        }
    });
    observer.observe(document, {childList: true, subtree: true});

    function video1Onload(){
        var video1Src = "";
        var videoName = GM_getValue("videoName", "video.mp4")

        // console.log(videoName.indexOf(":"));

        while(videoName.indexOf(":") !== -1){ //remove colons
            var newStr = videoName.slice(0, videoName.indexOf(":"));
            newStr += videoName.slice(videoName.indexOf(":")+1, videoName.length);
            videoName = newStr
        }
        videoName += ".mp4";
        
        console.log("video1 canplay");
        // console.log(videoName);
        
        video1Src = document.querySelector("#Video1_html5_api").src;
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
        `;
        document.querySelector("body").appendChild(buttonContainer);

        var buttonCSS = `
            background: none;
            color: white;
            border: 0;
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
        downloadBtn.innerHTML = "download";
        downloadBtn.addEventListener("click", function(){
            GM_download({url:video1Src, name:videoName});
        });
        buttonContainer.appendChild(downloadBtn);

        //detect key press
        document.addEventListener("keydown", (keydownEvent)=>{
            onKeypress(getPressedkey(keydownEvent));
        });
    }

    function onKeypress(keyInfo){
        console.log("pressed " + keyInfo.pressedKey);

        //play/pause
        if(keyInfo.pressedKey === "p" || keyInfo.pressedKey === "P"){
            document.querySelector(".vjs-play-control").click();
            // window.eval('document.querySelector(".vjs-play-control").click();');
            // unsafeWindow.document.querySelector(".vjs-play-control").click();
            // console.log(unsafeWindow.document.querySelector(".vjs-play-control"));
            // console.log(unsafeWindow.player.pause);
            console.log("play/pause video");
        }
        //slow down
        else if(keyInfo.pressedKey === ","){
            console.log("slow coarse");
        }
        //slow down fine
        else if(keyInfo.pressedKey === "<"){
            console.log("slow fine");
        }
        //speed up
        else if(keyInfo.pressedKey === "."){
            console.log("fast coarse");
        }
        //speed up fine
        else if(keyInfo.pressedKey === ">"){
            console.log("fast fine");
        }
        //set saved playback speed
        else if(keyInfo.pressedKey === "s" || keyInfo.pressedKey === "S"){
            console.log("custom speed");
        }
        //rewind
        else if(keyInfo.pressedKey === "ArrowLeft"){
            console.log("rewind");
        }
        //foward
        else if(keyInfo.pressedKey === "ArrowRight"){
            console.log("foward");
        }
        //volume up
        else if(keyInfo.pressedKey === "ArrowUp"){
            console.log("volume up");
        }
        //volume down
        else if(keyInfo.pressedKey === "ArrowDown"){
            console.log("volume down");
        }
        //mute/unmute
        else if(keyInfo.pressedKey === "m" || keyInfo.pressedKey === "M"){
            document.querySelector(".vjs-mute-control").click();
            // window.eval('document.querySelector(".vjs-mute-control").click();');
            // unsafeWindow.document.querySelector(".vjs-mute-control").click();
            console.log("mute");
        }
        //toggle fullscreen
        else if(keyInfo.pressedKey === "f" || keyInfo.pressedKey === "F"){
            // console.log(window.document.URL);
            // console.log(window.eval('document.fullscreenElement'));
            console.log(IsFullScreen());
            if(IsFullScreen()) arvplayer.exitFullscreen();
            else document.querySelector(".arv_fullscreenButton").click();
            // window.eval('document.exitFullscreen();');
            // unsafeWindow.arvfullscreen();
            // if(window.eval('document.fullscreenElement') !== null) window.eval('arvexitFullscreen();');
            // else window.eval('document.querySelector(".arv_fullscreenButton").click();');
            // if(window.eval('document.fullscreenElement') !== null) GM_setValue("fullscreen", true);
            // else GM_setValue("fullscreen", false);

            // console.log(GM_getValue("fullscreen"));

            console.log("fullscreen");
        }
    }

    function getPressedkey(keydownEvent){
        var keyInfo = {
            pressedKey: keydownEvent.key,
            modifier: ""
        }

        if(keydownEvent.altKey) keyInfo.modifier="Alt";
        else if(keydownEvent.ctrlKey) keyInfo.modifier="Control";
        else if(keydownEvent.metaKey) keyInfo.modifier="OS";
        else if(keydownEvent.shiftKey) keyInfo.modifier="Shift";
        else keyInfo.modifier="";

        console.log("modifier: "+keyInfo.modifier);

        return keyInfo;
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
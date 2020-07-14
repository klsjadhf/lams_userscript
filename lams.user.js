// ==UserScript==
// @name         lams
// @namespace    http://tampermonkey.net/
// @version      0.23
// @description  change lams video speed and download video button
// @author       klsjadhf
// @homepage     https://github.com/klsjadhf/lams_userscript
// @updateURL    https://github.com/klsjadhf/lams_userscript/raw/master/lams.user.js
// @downloadURL  https://github.com/klsjadhf/lams_userscript/raw/master/lams.user.js
// @match        http*://presentur.ntu.edu.sg/aculearn-idm/v8/studio/embed.asp*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict'

    console.log("tampermonkey script running");


    var observer = new MutationObserver(function(){
        console.log("DOM changed");
        
        var linkDisplayed = 0;

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
    });
    observer.observe(document, {childList: true, subtree: true});

    function video1Onload(){
        var video1Src = "";

        console.log("video1 can play");
        
        if(document.querySelector("#Video1_html5_api").src.length !== 0){
            video1Src = document.querySelector("#Video1_html5_api").src;
            console.log("video1 src: " + video1Src);
        }

        //download video button
        var videoSrcBtn = document.createElement("button");
        videoSrcBtn.id = "videoSrcBtn";
        videoSrcBtn.style.position = "relative";
        videoSrcBtn.style.zIndex = "10";
        videoSrcBtn.innerHTML = "open";
        videoSrcBtn.addEventListener("click", function(){
            window.open(video1Src, '_blank');
        });
        document.querySelector("body").appendChild(videoSrcBtn);
    }
})();

/*
localStorage.getItem('arvplayer-playbackRate');
localStorage.setItem('arvplayer-playbackRate',i+1);
var arv_rate_list
set_arvRate(player);
function set_arvRate(player)
hideIndeximg()

btn zindex 10
position relative
*/
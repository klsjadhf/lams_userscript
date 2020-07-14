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

    GM_listValues();

    console.log("tampermonkey script running on " + window.location.hostname);

    var observer = new MutationObserver(function(){
        //console.log("DOM changed");

        //get video name from main site
        if(document.URL.match(/https:\/\/lams\.ntu\.edu\.sg\/lams\/tool\/lanb11\/learning\/learner\.do/)){
            // console.log(document.URL.match(/https:\/\/lams.ntu.edu.sg\/lams\/tool\/lanb11\/learning\/learner.do*/));
            var videoNamePath = ".panel-body > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > strong:nth-child(1) > span:nth-child(1) > span:nth-child(1)"
            var videoNameElem = document.querySelector(videoNamePath);
            if( videoNameElem !== null){
                GM_setValue("videoName", videoNameElem.textContent);
                console.log(videoNameElem.textContent);
            }
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

        console.log(videoName.indexOf(":"));
        // var newStr = videoName.slice(0, videoName.indexOf(":"));
        // newStr += videoName.slice(videoName.indexOf(":")+1, videoName.length);
        // videoName = newStr
        // console.log(parseInt(videoName.slice(0, videoName.indexOf(":"))));

        while(videoName.indexOf(":") !== -1){ //remove colons
            var newStr = videoName.slice(0, videoName.indexOf(":"));
            newStr += videoName.slice(videoName.indexOf(":")+1, videoName.length);
            videoName = newStr
        }
        videoName += ".mp4";
        // videoName = videoName.slice(0, 50);
        
        console.log("video1 can play");

        console.log(videoName);
        console.log(unsafeWindow.hideIndeximg);
        
        // if(document.querySelector("#Video1_html5_api").src.length !== 0){
            video1Src = document.querySelector("#Video1_html5_api").src;
            console.log("video1 src: " + video1Src);
        // }

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

        //download video button
        var videoSrcBtn = document.createElement("button");
        videoSrcBtn.id = "videoSrcBtn";
        videoSrcBtn.style = buttonCSS;
        // videoSrcBtn.style = `
        //     position: absolute;
        //     z-index: 10;
        // `;
        // videoSrcBtn.style.position = "relative";
        // videoSrcBtn.style.zIndex = "10";
        videoSrcBtn.innerHTML = "open";
        videoSrcBtn.addEventListener("click", function(){
            window.open(video1Src, '_blank');
        });
        buttonContainer.appendChild(videoSrcBtn);

        //2nd button
        var videoSrcBtn2 = document.createElement("button");
        videoSrcBtn2.id = "videoSrcBtn2";
        videoSrcBtn2.style = buttonCSS;
        videoSrcBtn2.innerHTML = "btn2";
        videoSrcBtn2.addEventListener("click", function(){
            // GM_download(video1Src, "video");
            GM_download({url:video1Src, name:videoName});
            // window.open("https://ntume22.ntu.edu.sg", '_self');
            // var downloadLink = document.createElement("a");
            // downloadLink.setAttribute("href", video1Src);
            // downloadLink.setAttribute("download", "video.mp4");
            // downloadLink.innerHTML = "download";
            // document.body.appendChild(downloadLink);
            // downloadLink.click();
            // console.log(document);
        });
        buttonContainer.appendChild(videoSrcBtn2);

        //dosent work. cannot download from different domain
        var downloadLink = document.createElement("a");
        downloadLink.style = buttonCSS;
        downloadLink.setAttribute("href", video1Src);
        downloadLink.setAttribute("download", "video.mp4");
        downloadLink.innerHTML = "download";
        buttonContainer.appendChild(downloadLink);
        // downloadLink.click();
        // console.log(document);
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
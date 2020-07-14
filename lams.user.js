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
    'use strict';

    console.log("tampermonkey script running");


    var observer = new MutationObserver(function(){
        console.log("DOM changed");

        if(document.querySelector("#div_index") !== null){
            console.log(document.querySelector("#div_index").style.width);
            if(document.querySelector("#div_index").style.width === "100%"){
                document.querySelector("#div_index").style.width = "0px";
            }
        }
    });
    observer.observe(document, {childList: true, subtree: true});
})();
/*
localStorage.getItem('arvplayer-playbackRate');
localStorage.setItem('arvplayer-playbackRate',i+1);
var arv_rate_list
set_arvRate(player);
function set_arvRate(player)
hideIndeximg()
*/
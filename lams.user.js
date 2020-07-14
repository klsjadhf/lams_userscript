// ==UserScript==
// @name         lams
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  change lams video speed and download video button
// @author       klsjadhf
// @homepage     https://github.com/klsjadhf/lams_userscript
// @updateURL    https://github.com/klsjadhf/lams_userscript/blob/master/lams.user.js
// @downloadURL  https://github.com/klsjadhf/lams_userscript/blob/master/lams.user.js
// @match        http*://presentur.ntu.edu.sg/aculearn-idm/v8/studio/embed.asp*
// @grant        none
// @run-at document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log("hello");
    document.querySelector("#div_index").style.width = "0px";
    console.log(document);

    document.addEventListener("loadeddata", function(){
        document.querySelector("#div_index").style.width = "0px";
        alert("change width");
        //document.querySelector("#div_index").style = "";
    });
})();
/*
localStorage.getItem('arvplayer-playbackRate');
localStorage.setItem('arvplayer-playbackRate',i+1);
var arv_rate_list
set_arvRate(player);
function set_arvRate(player)
hideIndeximg()
*/
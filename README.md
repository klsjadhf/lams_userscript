# Description
Adds a download button and keyboard shortcuts to NTU LAMS videos.

# Installation
1. Install a userscript manager such as <a href="https://www.tampermonkey.net/" target="_blank">Tampermonkey</a>.
2. Open the .user.js file and click on raw or click <a href="https://github.com/klsjadhf/lams_userscript/raw/master/lams.user.js" target="_blank">here</a>.

# Keyboard shortcuts
Key | Function
----|---------
P | Play/pause
, | Decrease playabck rate by 0.5
. | Increase playback rate by 0.5
< | Increase playback rate by 0.1
\> | Increase playback rate by 0.1
S | Set playback rate to 2
M | Toggle mute
F | Toggle fullscreen
H | Toggle download button visibility
Left arrow | Rewind 3 seconds
Right arrow | Foward 3 seconds
Up arrow | Increase volume
Down arrow | Decrease volume

# Future features
- [x] Hide download button and playback speed
- [ ] Change speed without keyboard
- [ ] Set custom keyboard shortcuts and default playback rate
- [ ] Gesture support for touchscreens?
- [ ] Add pictures/video for installation guide

# Known bugs
- [x] Cannot exit fullscreen using fullscreen button due to cross origin error
- [ ] Scrolling if changing volume while not in fulllscreen

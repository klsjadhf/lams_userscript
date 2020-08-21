# Description
Adds a download button and keyboard shortcuts to NTU LAMS videos.

# Installation
1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/).
2. Open the .user.js file in latest release or click [here](https://github.com/klsjadhf/lams_userscript/releases/latest/download/lams.user.js).
3. Click install in the Tampermonkey dashboard.

# Keyboard shortcuts
Key | Function
----|---------
P, spacebar | Play/pause
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
- [x] Add support for videos in ntulearn
- [ ] Set custom keyboard shortcuts and default playback rate
- [ ] Gesture support for touchscreens?
- [ ] Add pictures/video for installation guide

# Known bugs
- [ ] Some subjects cannot get correct video name
- [x] Spacebar sometimes dosen't pause  

If having download problems with tampermonkey V4.11.6117 and firefox, go to tampermonkey settings and change config mode to advanced. Then scroll down to "download mode" and change to browser api.

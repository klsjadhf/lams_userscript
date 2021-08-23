# Description
Adds a download button and keyboard shortcuts to NTU LAMS videos.  
Fix other small problems such as cannot exit fullscreen with shortcut key

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
H | Toggle menu visibility
Left arrow | Rewind 3 seconds
Right arrow | Forward 3 seconds
Up arrow | Increase volume
Down arrow | Decrease volume
D | Download video

# Touch gestures
Slide up / down -> volume  
Slide left / right -> forward / rewind

# ToDo
- [ ] Set custom keyboard shortcuts and default playback rate
- [x] Gesture support for touchscreens (not added in kaltura)
- [ ] Add pictures/video for installation guide  
- [ ] Account for playback rate for forward/rewind
- [ ] Change kaltura to use highest resolution 
- [ ] Mouse scroll for forward/rewind

# Known bugs
- [ ] Old player based on arvplayer not maintained anymore
- [x] Some keyboard shortcuts conflict with kaltura's shortcuts
- [ ] Touch gestures not added for kaltura
- [x] Spacebar not pausing/playing in fullscreen
- [x] Wrong playback speed shown in kaltura's ui

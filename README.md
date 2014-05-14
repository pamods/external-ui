external-ui
===========

run parts of the PA ui in a browser

to use create a conf.json file in src with this kind of content:

{
	"user": "your ubernet login",
	"password": "your ubernet password",
	"couiHost": "your PA media directoy, i.e.: C:/Program Files (x86)/PA/Planetary Annihilation/stable/media/" 
}

below a quick guide on how to set this up. Once there is a release version of this there will be info on how to setup this thing easier:

Install [nodejs](http://nodejs.org/download/)

Run: npm install

Start: node server.js

Open this page in your browser:
http://127.0.0.1:8080/ui/main/game/server_browser/server_browser.html

That should show the server browser with real games.
Copy the mod from /mod into your PA mods directory ("%LOCALAPPDATA%\Uber Entertainment\Planetary Annihilation\mods") and enable it in pamm.
Setup the startpa:// protocol, just like for replays. You may use --uioptions instead if you want
Now you should be able to click join game in the browser and it will open your browser. Note that the autologin works via passing your full ubernet credentials for now. That may change to passing a session ticket, but even then: do not share the startpa:// links with anyone!
See the forums for more: https://forums.uberent.com/threads/wip-external-ui.59469/
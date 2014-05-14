external-ui
===========

run parts of the PA ui in a browser

to use create a conf.json file in src with this kind of content:

{
	"user": "your ubernet login",
	"password": "your ubernet password",
	"couiHost": "your PA media directoy, i.e.: C:/Program Files (x86)/PA/Planetary Annihilation/stable/media/" 
}

Install [nodejs](http://nodejs.org/download/)

Run: npm install

Start: node server.js

Open this page in your browser:
http://127.0.0.1:8080/ui/main/game/server_browser/server_browser.html

and it should list the games. So far that's all it does. See the forums for more: https://forums.uberent.com/threads/wip-external-ui.59469/

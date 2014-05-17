require('./lib.js');
var ubernet = require('./ubernet.js').ubernet;
var bootjson = "ui/boot.json";

var express = require('express');
var st = require("connect-static-transform");
var fs = require('fs');
var port = process.env.port || 8080;
var app = express();

var conf = JSON.parse(fs.readFileSync(__dirname + "/conf.json", {encoding: "ascii"}));

conf.pollingRate = conf.pollingRate || 3000;

var couiHost = conf.couiHost;
var uiModList = fs.readFileSync(__dirname + "/mods/ui_mod_list.js", {encoding: 'ascii'});

ubernet.login(conf.user, conf.password, function(d) {
	console.log("logged in as "+JSON.stringify(d));
	console.log("start serving page...");
	
	var contentType = function(path) {
		var types = {
			"js": "application/x-javascript",
			"html": "text/html",
			"css": "text/css"
		};
		for (x in types) {
			if (types.hasOwnProperty(x)
					&& new RegExp("^.+\."+x+"$").test(path)) {
				return types[x];
			}
		}
		return "text/plain";
	};

	var bootJson = JSON.parse(fs.readFileSync(couiHost + bootjson, {encoding: "ascii"}));

	var loadBootFile = function(type) {
		var boot = "";
		for (var i = 0; i < bootJson[type].length; i++) {
			var lib = "";
			if (type === "js" && bootJson[type][i] === "/ui/main/shared/js/coherent.js") {
				var f = fs.readFileSync(__dirname + "/coherentfake.js", {encoding: 'ascii'});
				// TODO build something to handle this via the session ticket instead?!
				var credentials = "var uberName = '"+conf.user+"'; var uberPassword = '"+conf.password+"';";
				var version = "var externalUiVersion = '"+require('../package.json').version+"';";
				var paVersion = "var gameClientVersion = '"+ubernet.getCurrentClientVersion()+"';";
				var regions = "sessionStorage['uber_net_regions'] = '"+JSON.stringify(ubernet.getRegions())+"';";
				lib = paVersion +regions + credentials + version + f;
			} else if (type === "js" && bootJson[type][i] === "/ui/main/shared/js/panel.js") {
				lib = "\n/*panel.js will not be loaded for external ui*/\n";
			} else {
				var file = couiHost + bootJson[type][i];
				lib = fs.readFileSync(file, {encoding: "ascii"});
			}
			boot = boot + "\n" + lib.replaceAll("coui://", "/");
		}
		return boot;
	};

	var bootJs = loadBootFile("js");
	var bootCss = loadBootFile("css");

	var resolvedCoui = st({
	  root: couiHost,
	  match: /.+\.js|.+\.html|.+\.css/,
	  transform: function (path, text, send) {
		var resolvedHost = text.replaceAll('coui://', '/');
	    send(resolvedHost, {'Content-Type': contentType(path)});
	  }
	});
	
	app.configure(function() {
		app.use(resolvedCoui);
		app.use("/", express.static(couiHost));
		app.use("/", express.static(__dirname + "/"));
		app.use("/ui/main/shared/js/boot.js", function(req, res) {
			res.setHeader("Content-Type", "application/x-javascript");
			res.end(bootJs);
		});
		app.use("/ui/main/shared/css/boot.css", function(req, res) {
			res.setHeader("Content-Type", "text/css");
			res.end(bootCss);
		});
		app.use("/ui/mods/ui_mod_list.js", function(req, res) {
			res.setHeader("Content-Type", "application/x-javascript");
			res.end(uiModList); // TODO support mods
		});
		
		var asyncs = [];
		app.use("/ubernet/async", function(req, res) {
			res.setHeader("Content-type", "application/json");
			var data = {
				tags: []
			};
			for (var i = 0; i < asyncs.length; i++) {
				data.tags.push(asyncs[i]);
			}
			asyncs.length = 0;
			res.end(JSON.stringify(data));
		});
		
		app.use(express.bodyParser());
		
		var gameListCache = undefined;
		var gameListTime = new Date().getTime();
		app.post("/ubernet/currentgames", function(req, res) {
			if (gameListCache === undefined || (new Date().getTime() - gameListTime) > conf.pollingRate) {
				gameListTime = new Date().getTime();
				ubernet.getCurrentGames(function(games) {
					gameListCache = JSON.stringify(games);
					asyncs.push([req.body.tx, true, gameListCache]);
				});
			} else {
				asyncs.push([req.body.tx, true, gameListCache]);
			}
			res.end("");
		});
	});
	var server = app.listen(port);
});
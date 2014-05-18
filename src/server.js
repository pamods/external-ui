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
var uiModListTxt = fs.readFileSync(__dirname + "/mods/ui_mod_list.js", {encoding: 'ascii'});

eval(uiModListTxt);

ubernet.login(conf.user, conf.password, function(d) {
	var user = d;
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
				var jabberAuth = "var jabberAuth = "+JSON.stringify({
					uber_id: user.uberId,
					jabber_token: ubernet.getSession(),
					use_ubernetdev: false
				})+";";
				var uberIdents = "var uberIdents = "+JSON.stringify({
					uber_id: user.uberId,
					uber_name: conf.user,
					display_name: user.displayName
				})+";";
				lib = uberIdents + jabberAuth + paVersion +regions + credentials + version + f;
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

	var resolvedCoui = function(r, mod) {
		return st({
			  root: r,
			  match: /.+\.js|.+\.html|.+\.css/,
			  transform: function (path, text, send) {
				var resolvedHost = text.replaceAll('coui://', '/');
				
				if (mod) {
					resolvedHost = mod(resolvedHost, path);
				}
				
			    send(resolvedHost, {'Content-Type': contentType(path)});
			  }
		});
	};
	
	// returns the text of all mods for a scene, given by the location of the js file of the scene
	var modsAsTextFor = function(loc) {
		var sceneName = loc.match(/\/([^\/]*).js$/)[1];
		var mods = scene_mod_list[sceneName];
		var result = "";
		for (var i = 0; i < mods.length; i++) {
			result = result + fs.readFileSync(__dirname + "/mods/" + mods[i], {encoding: 'ascii'});
		}
		return result;
	};
	
	app.configure(function() {
		app.use(resolvedCoui(couiHost));
		app.use("/", express.static(couiHost));
		app.use("/", express.static(__dirname + "/"));

		var loadSceneJs = function(name, loc, containerId) {
			app.use(name, function(req, res) {
				res.setHeader("Content-Type", "application/x-javascript");
				var f = fs.readFileSync(loc, {encoding: 'ascii'}).replaceAll("o;?", ""); // some weird byte order mark maybe?
				// bind only to specific dom part
				f = f.replaceAll("ko.applyBindings(model);", "ko.applyBindings(model, $('"+containerId+"')[0]);");
				// get rid of coui
				f = f.replaceAll('coui://', '/');
				// directly inject mods, so they are run in the correct context (we remove the global model after all)
				f = f.replaceAll("if(scene", "if (scene").replaceAll("if (scene_mod_list", modsAsTextFor(loc)+" if(scene_mod_list");
				// enclose the whole script in a function scope
				f = "(function() {" + f + "}());";
				res.end(f);
			});
		};
		
		loadSceneJs("/server_browser.js", couiHost+"ui/main/game/server_browser/server_browser.js", "#servers-container");
		loadSceneJs("/uberbar.js", couiHost+"ui/main/uberbar/uberbar.js", "#social-container");
		
		// due to the fact that we load the server browser and the uber bar on / level, we need
		// to make more files available on / to please relative references in those scenes
		// lets hope no conflicts arise...
		// fix errors in the PA js: it uses a reference to the global modal instead of $root for bindings
		var modelToRootFixer = function(text, path) {
			if (path.endsWith(".html")) {
				return text.replaceAll("model.", "$root.");
			} else {
				return text;
			}
		};
		
		app.use("/", resolvedCoui(couiHost+"ui/main/game/server_browser", modelToRootFixer));
		app.use("/", resolvedCoui(couiHost+"ui/main/uberbar", modelToRootFixer));
		app.use("/", resolvedCoui(couiHost+"ui/main"))

		// the above only server html, css and js, so below we server i.e. images
		app.use("/", express.static(couiHost+"ui/main/game/server_browser/"));
		app.use("/", express.static(couiHost+"ui/main/uberbar/"));
		app.use("/", express.static(couiHost+"ui/main"));
		
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
			res.end("var global_mod_list = [];var scene_mod_list = {};");
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
			// TODO this currently means that only a single page can be opened. Multiple tabs 
			// will steal each other's data
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
//					asyncs.push([req.body.tx, true, gameListCache]);
				});
			} else {
//				asyncs.push([req.body.tx, true, gameListCache]);
			}
			res.end("");
		});
		
		app.post("/ubernet/friends", function(req, res) {
			ubernet.getUbernetFriends(function(friends) {
				console.log(friends);
				asyncs.push([req.body.tx, true, JSON.stringify(friends)]);
			});
		});
	});
	var server = app.listen(port);
});
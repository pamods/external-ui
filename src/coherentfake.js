sessionStorage['build_version'] = JSON.stringify(gameClientVersion); // inserted by nodejs
sessionStorage['signed_in_to_ubernet'] = JSON.stringify(true);

function loginData() {
	// values are passed in by nodejs
	return {user: uberName, password: uberPassword};
}

function utf8_to_b64( str ) {
    return window.btoa(encodeURIComponent( escape( str )));
}

function b64_to_utf8( str ) {
    return unescape(decodeURIComponent(window.atob( str )));
}

// prevent PA from starting up multiple times by accidental clicks. 
var lastStartPARun = new Date().getTime();
function startpa(data) {
	if (new Date().getTime() - lastStartPARun > 3000) {
		lastStartPARun = new Date().getTime();
		data.login = loginData();
		document.location = "startpa://extreceive="+utf8_to_b64(JSON.stringify(data));
	}
}

engine = (function() {
	var tags = 0;
	var nextTag = function() {
		tags++;
		return tags;
	};
	
	var asyncHandlers = [];
	var asyncPoller = function() {
		if (asyncHandlers.length > 0) {
			$.getJSON("/ubernet/async", function(data) {
				if (data.tags) {
					for (var i = 0; i < data.tags.length; i++) {
						for (var j = 0; j < asyncHandlers.length; j++) {
							var asyncHandler = asyncHandlers[i];
							console.log("apply");
							console.log(data.tags[i]);
							asyncHandler.apply(asyncHandler, data.tags[i]);
						}
					}
				}
			});
		}
	};
	setInterval(asyncPoller, 250);

	var messageHandlers = [];
	
	return {
		call: function() {
			var func = arguments[0];
			var t = nextTag();
			
			var known = false;
			
			switch (func) {
			case "game.unloadPage":
				return undefined;
			case "loc.getCurrentLocale":
				return {
					then: function(f) {
						f("en-US");
					}
				};
			case "ubernet.getCurrentGames":
				$.ajax({
					dataType: "json",
					type: "POST",
					url: "/ubernet/currentgames",
					data: {tx: t}
				});
				known = true;
				break;
			case "ubernet.joinGame":
				startpa({joinGame: arguments[1], spectateGame: JSON.parse(sessionStorage['try_to_spectate'])});
				return;
			case "ubernet.getFriends":
				$.ajax({
					dataType: "json",
					type: "POST",
					url: "/ubernet/friends",
					data: {tx: t}
				});
				known = true;
				break;
			}
			
			if (!known && arguments && arguments[0] && arguments[0].indexOf("audio.") === -1) {
				console.log("unknown engine.call:");
				console.log(arguments);
			}
			return {
				then: function(h) {
					h(t);
				}
			};
		},
		on: function() {
			var func = arguments[0];
			if (func === "async_result") {
				asyncHandlers.push(arguments[1]);
			} else if (func === "process_message") {
				messageHandlers.push(arguments[1]);
			} else {
				console.log("on called");
				console.log(arguments);
			}
		},
		fakeMessage: function(message) {
			for (var i = 0; i < messageHandlers.length; i++) {
				messageHandlers[i](JSON.stringify(message));
			}
		}
	};
}());
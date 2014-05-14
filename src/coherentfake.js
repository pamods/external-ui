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

function startpa(data) {
	document.location = "startpa://extreceive="+utf8_to_b64(JSON.stringify(data));
}

engine = (function() {
	var tags = 0;
	var nextTag = function() {
		tags++;
		return tags;
	};
	
	var asyncHandler = undefined;
	
	var asyncPoller = function() {
		if (asyncHandler) {
			$.getJSON("/ubernet/async", function(data) {
				if (data.tags) {
					for (var i = 0; i < data.tags.length; i++) {
						asyncHandler.apply(asyncHandler, data.tags[i]);
					}
				}
			});
		}
	};
	
	setInterval(asyncPoller, 250);
	
	return {
		call: function() {
			var func = arguments[0];
			var t = nextTag();
			
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
				break;
			case "ubernet.joinGame":
				startpa({joinGame: arguments[1], login: loginData()});
				return;
			}
			
			console.log("engine.call:");
			console.log(arguments);
			return {
				then: function(h) {
					h(t);
				}
			};
		},
		on: function() {
			var func = arguments[0];
			if (func === "async_result") {
				asyncHandler = arguments[1];
			} else {
				console.log("on called");
				console.log(arguments);
			}
		}
	};
}());

sessionStorage['build_version'] = JSON.stringify("65588"); // TODO make this dynamic
sessionStorage['signed_in_to_ubernet'] = JSON.stringify(true);
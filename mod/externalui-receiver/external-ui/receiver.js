(function() {
	function utf8_to_b64( str ) {
	    return window.btoa(encodeURIComponent( escape( str )));
	}

	function b64_to_utf8( str ) {
	    return unescape(decodeURIComponent(window.atob( str )));
	}
	
	var receivedData = undefined;
	
	var oldSetupInfo = handlers.setup_info;
	handlers.setup_info = function(payload) {
		oldSetupInfo(payload);
		// support both startpa:// formats, prefer the newer one (which so far I do not use xD)
		var custData = payload.ui_options || payload.username;
		if (custData && custData.indexOf("startpa://") === 0) {
			custData = custData.replace("startpa://", "").replace("/", "");
			if (custData.indexOf("extreceive=") === 0) {
				var strDat = custData.substring("extreceive=".length, custData.length)
				receivedData = JSON.parse(b64_to_utf8(strDat));
				console.log("received data from external ui:");
				console.log(receivedData);
			}
		}
		
		if (receivedData && !model.hasCmdLineTicket() && !model.useSteam()
				&& receivedData.login) {
			model.uberName(receivedData.login.user);
			model.password(receivedData.login.password);
			model.authenticateWithUberNetLogin();
		}
	};
	
	model.inMainMenu.subscribe(function(v) {
		if (v && receivedData && model.signedInToUbernet()) {
			if (receivedData.spectateGame) {
				sessionStorage['try_to_spectate'] = true;
			}

			if (receivedData.joinGame) {
		        engine.asyncCall("ubernet.joinGame", receivedData.joinGame).done(function (data) {
		        	
		        	// TODO PA Stats hack for now...
		        	localStorage['lobbyId'] = encode(receivedData.joinGame);
		        	
	                console.log('ubernet.joinGame: ok');
	                // Get the data from Ubernet about the game
	                data = JSON.parse(data);
	                console.log(data);

	                if (data.Ticket && data.ServerHostname && data.ServerPort) {
	                	sessionStorage['gameTicket'] = encode(data.Ticket);
	                	sessionStorage['gameHostname'] = encode(data.ServerHostname);
	                	sessionStorage['gamePort'] = encode(data.ServerPort);

	                    // Connect
	                    engine.call('disable_lan_lookout');
	                    window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html';
	                    return; /* window.location.href will not stop execution. */
	                }
	                else {
	                    console.log('ubernet.joinGame did not return a game ticket.');
	                    transit('FAILED TO JOIN GAME');
	                }               
	            }).fail(function (data) {
	                console.log('ubernet.joinGame: failed');
	                transit('FAILED TO FIND GAME');
	            });
			}
			
			if (receivedData.createGame) {
	            engine.call('disable_lan_lookout');
	            window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?mode=start';
	            return; /* window.location.href will not stop execution. */
			}
		}
	});
}());
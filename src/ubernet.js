exports.ubernet = (function() {
	var request = require("request");
	var encReq = require("./encodedReqs.js").requester;
	var session = undefined;
	var uberId = undefined;
	var displayName = undefined;
	var clientVersion = undefined;
	
	return {
		// call this first!
		login: function(user, pass, cb) {
			request.get({url: "https://uberent.com/launcher/clientversion?titleid=4", json: true}, 
					function(error, response, body) {
				clientVersion = body;
				
				request.post({url: "https://uberent.com/GC/Authenticate", 
				      body: '{TitleId: 4, AuthMethod: "UberCredentials", UberName: "'+user+'", Password: "'+pass+'"}',
				      json: true}, function(error, response, body) {
					if (response.statusCode === 200) {
						session = body.SessionTicket;
						uberId = body.UberId;
						displayName = body.DisplayName;
						if (cb) {
							cb({uberId: uberId, displayName: displayName});
						}
					} else {
						console.log("login as "+user+" failed!");
						console.log(error);
					}
				});
			});
		},
		getCurrentGames: function(cb) {
			encReq({url: "https://uberent.com/GameAcquisition/CurrentGames",
				         headers: {"X-Authorization": session, "Accept-Encoding": "gzip"}}, 
			         function(err, data) {
			        	 if (err) {
			        		 console.log("failed to get gamelist");
			        		 console.log(err);
			        	 } else {
			        		 cb(JSON.parse(data));
			        	 }
		    });
		},
		// below are functions that return plain values, no callback required
		getCurrentClientVersion: function() {
			return clientVersion;
		},
		getCurrentUserId: function() {
			return uberId;
		},
		getCurrentUserDisplayName: function() {
			return displayName;
		}
	};
}());

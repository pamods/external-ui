exports.ubernet = (function() {
	var request = require("request");
	var session = undefined;
	var uberId = undefined;
	var displayName = undefined;

	return {
		login: function(user, pass, cb) {
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
		},
		getCurrentGames: function(cb) {
			request.get({url: "https://uberent.com/GameAcquisition/CurrentGames",
				         headers: {"X-Authorization": session},
				         json: true}, function(error, response, body) {
		       if (response.statusCode === 200) {
		    	   cb(body);
		       } else {
		    	   console.log("get current gamelist failed");
		    	   console.log(error);
		       }
	         });
		},
		getCurrentUserId: function() {
			return uberId;
		},
		getCurrentUserDisplayName: function() {
			return displayName;
		}
	};
}());

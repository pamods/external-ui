var enableMouseOnlyForInnerParts = function(dom) {
	dom.addClass("disableMouse");
	dom.children().each(function() {
		$(this).addClass("enableMouse");
	});
};

var progInfo = "PA External UI v."+externalUiVersion;
document.title = progInfo;

$(function() {
	var loadsStarted = 0;
	
	var loadBodyInto = function(src, target, cb) {
		loadsStarted++;
		$.get(src, function(x) {
			var matches = x.match(/<body.*?>[\S\s]*?<\/body>/);
			var body = $(matches[0].replaceAll("body", "div"));
			enableMouseOnlyForInnerParts(body);
			$(target).append(body);
			cb();
		});
	};
	
	var lCnt = 0;
	
	var loadComplete = function() {
		lCnt++;
		if (lCnt === loadsStarted) {
//			loadScript("/server_browser.js");
			loadScript("/uberbar.js");
			
			engine.fakeMessage({
				message_type: "uberbar_identifiers",
				payload: uberIdents 
			});
			
			engine.fakeMessage({
				message_type: "jabber_authentication",
				payload: jabberAuth
			});
			
			// "fix" for firefox. Still looks super ugly on it though.
			// It's still very very ugly and may not be useable with the uberbar
			// => no support for other browsers basically, but I guess having this doesnt hurt...
			$(function() { $('html').css('display','block'); });
		}
	};
//	loadBodyInto("/server_browser.html", '#servers-container', loadComplete);
	loadBodyInto("/uberbar.html", '#social-container', loadComplete);
});
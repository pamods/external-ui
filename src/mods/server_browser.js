(function() {
	$('.btn_back').remove();
	var progInfo = "PA External UI v."+externalUiVersion;
	$('.div_version_info_cont').text(progInfo);
	$('.container').attr("style", "margin: 0px 0px 0px 0px;");
	document.title = progInfo;
	$('head').append('<link href="/pa.ico" type="image/x-icon" rel="shortcut icon">');
	
	model.createGame = function() {
		startpa({createGame: true});
	};
	
	// fix for firefox. Still looks super ugly on it though.
	// IE shows a white screen even with this. Won't support it.
	$(function() { $('html').css('display','block'); });
}());
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
}());
(function() {
	$('.btn_back').remove();
	$('.div_version_info_cont').text(progInfo);
	$('.container').attr("style", "margin: 0px 0px 0px 0px;");
	
	model.createGame = function() {
		startpa({createGame: true});
	};
}());
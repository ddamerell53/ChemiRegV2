$(document).ready(function() {

	$('#upload_button').click(function(e){
		var viewportWidth = $(window).width();
		var defaultText = $('#upload #file_select').text();	
		
		if (viewportWidth > 1024) {
			$('.selectize-input').click(function(event){
				var filename = $('#upload #file_select').text();
				
				if (filename != defaultText) {			
					var dropdownHeight = $(this).siblings('.selectize-dropdown').height();
					var rowHeight = $('#advanced_register_options').height();
					
					if (!$('#advanced_register_options').hasClass('expanded')) {
						$('#advanced_register_options').addClass('expanded');
						$('#advanced_register_options').height(dropdownHeight + rowHeight);
					}	
				}
		  });	
		}
	});
});
//$(document).foundation();

$(document).ready(function() {
	window.extAsyncInit = function() {
	    // the Messenger Extensions JS SDK is done loading 
	    MessengerExtensions.getUserID(function success(uids) {
	    // User ID was successfully obtained. 
	        var psid = uids.psid;

	        //$("#psid").val(psid);
	  
	    }, function error(err, errorMessage) {      
	    // Error handling code
	    });

	    
	};
});

// Use this submit handler for all forms in document
$(document).on('submit', 'form', function(e) {
  // Form being submitted
  var form = e.currentTarget;
  var isSupported = $("supported").val();
  // Issue an ajax request
  $.ajax({
    url: form.action,          // the forms 'action' attribute
    type: 'POST',               // use 'PUT' (not supported in all browsers)
                               // Alt. the 'method' attribute (form.method)
    data: $(form).serialize(), // Serialize the form's fields and values
    success: function(a) {
    	if(isSupported) {
    		MessengerExtensions.requestCloseBrowser(function success() {

	    }, function error(err) {
console.log(err);
	    });
    	} else {
    		window.close();
    	}    	
	    
    },
    error: function() { window.close(); }
  });
  console.log($(form).serialize())
  // Prevent the browser from submitting the form
  e.preventDefault();
});

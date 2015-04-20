// Placed the map into the global namespace for now
// This makes it easier to experiment with its API
var map;

function initialize() {
	var mapOptions = {
  		center: { lat: 45.583234, lng: -122.733041},
  		zoom: 11,
  		mapTypeId: google.maps.MapTypeId.HYBRID
	};

	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}

var viewModel {
	points: ko.observableArray();
};

google.maps.event.addDomListener(window, 'load', initialize);
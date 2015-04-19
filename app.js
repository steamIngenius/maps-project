function initialize() {
	var mapOptions = {
  		center: { lat: 45.583234, lng: -122.733041},
  		zoom: 1
	};

	var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}

google.maps.event.addDomListener(window, 'load', initialize);
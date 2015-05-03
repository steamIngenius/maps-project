// Neighborhood map project
// referenced http://jsfiddle.net/t9wcC/
function point(name, lat, lng) {
    this.name = name;
    this.lat = ko.observable(lat);
    this.lng = ko.observable(lng);

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, lng),
        title: name,
        map: map, // global namespace
        draggable: false,
        animation: google.maps.Animation.DROP
    });
}

// Placed the map into the global namespace for now
// This makes it easier to experiment with its API from the console
var map; // it's a map -- this is a change

function initialize() {
	var mapOptions = {
  		center: { lat: 45.578766, lng: -122.724023},
  		zoom: 15,
  		mapTypeId: google.maps.MapTypeId.HYBRID
	};

	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	var viewModel = {
		points: ko.observableArray([
			new point('Western Meats', 45.579660, -122.715667),
			new point('McKenna Park', 45.581673, -122.733106),
			new point('Cha Cha Cha', 45.581943, -122.722083) ])
	};

	ko.applyBindings(viewModel);

	// Searchbox functionality
	// TODO: replace with jQuery at some point?
	// referenced: https://developers.google.com/maps/documentation/javascript/examples/places-searchbox
	var input = document.getElementById('searchbox');
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

	// Tie the input to the searchbox
	var searchBox = new google.maps.places.SearchBox(input);


	google.maps.event.addListener(searchBox, 'places_changed', function() {
		var newPlace = (searchBox.getPlaces())[0];
		console.log(newPlace);

		if (newPlace.length == 0) { return; }

		var bounds = new google.maps.LatLngBounds();

	    viewModel.points.push( new point(
	    	newPlace.name,
	    	newPlace.geometry.location.lat(),
	    	newPlace.geometry.location.lng()) );
	    // console.log(newPlace);

	    // TODO refactor into a 'center' function or use knockout custom bindings?
	    ko.utils.arrayForEach(viewModel.points(), function(point) {
	    	var pointLocation = new google.maps.LatLng(point.lat(), point.lng());
	    	bounds.extend(pointLocation);
	    });
	    map.fitBounds(bounds);
	});

	// Bias the SearchBox results towards places that are within the bounds of the
  	// current map's viewport.
  	google.maps.event.addListener(map, 'bounds_changed', function() {
    	var bounds = map.getBounds();
    	searchBox.setBounds(bounds);
    	console.log("Bounds updated.");
  	});


  	// UI for List of markers (custom control)
  	var markerListUI = document.getElementById('markerList');
  	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(markerListUI);
}

google.maps.event.addDomListener(window, 'load', initialize);

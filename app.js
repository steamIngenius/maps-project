// referenced http://jsfiddle.net/t9wcC/
function point(name, lat, lng) {
    this.name = name;
    this.lat = ko.observable(lat);
    this.lng = ko.observable(lng);

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, lng),
        title: name,
        map: map, // global namespace
        draggable: true
    });

    //if you need the poition while dragging
    google.maps.event.addListener(marker, 'drag', function() {
        var pos = marker.getPosition();
        this.lat(pos.lat());
        this.lng(pos.lng());
    }.bind(this));

    //if you just need to update it when the user is done dragging
    google.maps.event.addListener(marker, 'dragend', function() {
        var pos = marker.getPosition();
        this.lat(pos.lat());
        this.lng(pos.lng());
    }.bind(this));
}

// Placed the map into the global namespace for now
// This makes it easier to experiment with its API from the console
var map;

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
		var places = searchBox.getPlaces();
		console.log("List of places retrieved.");

		console.log(places.length);
		console.log(places[0]);

		if (places.length == 0) { return; }

		var bounds = new google.maps.LatLngBounds();
	    for (var i = 0, place; place = places[i]; i++) {
	      var image = {
	        url: place.icon,
	        size: new google.maps.Size(71, 71),
	        origin: new google.maps.Point(0, 0),
	        anchor: new google.maps.Point(17, 34),
	        scaledSize: new google.maps.Size(25, 25)
	      };

	      // Create a marker for each place.
	      var marker = new google.maps.Marker({
	        map: map,
	        icon: image,
	        title: place.name,
	        position: place.geometry.location
	      });

	      // markers.push(marker);
	      // viewModel.points.push(marker);
	      console.log(marker);
	      viewModel.points.push(new point(marker.title, marker.position.k, marker.position.D));

	      bounds.extend(place.geometry.location);
	    }

	    map.fitBounds(bounds);
	});

	// Bias the SearchBox results towards places that are within the bounds of the
  	// current map's viewport.
  	google.maps.event.addListener(map, 'bounds_changed', function() {
    	var bounds = map.getBounds();
    	searchBox.setBounds(bounds);
    	console.log("Bounds updated.");
  	});
}

google.maps.event.addDomListener(window, 'load', initialize);
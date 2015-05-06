// Neighborhood map project

// Placed the map into the global namespace for now
// This makes it easier to experiment with its API from the console
var map;

// get things moving with a Gooble maps event listener and an anonymous function
// once everything has loaded, of course
google.maps.event.addDomListener(window, 'load', function() {

	// model
	// This is a function declaration
	function point(name, lat, lng) {
	    this.name = name;
	    this.lat = ko.observable(lat);
	    this.lng = ko.observable(lng);

	    var marker = new google.maps.Marker({
	        position: new google.maps.LatLng(this.lat(), this.lng()),
	        title: name,
	        map: map, // global namespace
	        draggable: false,
	        animation: google.maps.Animation.DROP
	    });
	}

	// this is the view model (duh, look at the name)
	var viewModel = {
		initialize: function() {
			this.setupMap();
			this.setupControls();
		},
		points: ko.observableArray([]),

		addPoint: function(name, lat, lng) {
			console.log("I need to make a point here.");
			this.points.push( new point(name, lat, lng) );
		},
		setupMap: function() {
			var mapOptions = {
		  		center: { lat: 45.578766, lng: -122.724023 },
		  		zoom: 15,
		  		mapTypeId: google.maps.MapTypeId.HYBRID
			};

			map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		},
		setupControls: function() {
			// Searchbox functionality
			// TODO: replace with jQuery at some point?
			// referenced: https://developers.google.com/maps/documentation/javascript/examples/places-searchbox
			var input = document.getElementById('searchbox');
			map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

			// Tie the input view to the searchbox
			var searchBox = new google.maps.places.SearchBox(input);
			// when searchbox gets us a result, do something with it (add to points)
			google.maps.event.addListener(searchBox, 'places_changed', function() {
				var newPlace = (searchBox.getPlaces())[0];
				console.log(newPlace);

				if (newPlace.length == 0) { return; }

				var bounds = new google.maps.LatLngBounds();

			    viewModel.addPoint(
			    	newPlace.name,
			    	newPlace.geometry.location.lat(),
			    	newPlace.geometry.location.lng() );
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
	};

	// bind knockout and init
	ko.applyBindings(viewModel);
	viewModel.initialize();

  	// start off by adding a few static points to our neighborhood map
  	viewModel.addPoint('Western Meats', 45.579660, -122.715667);
  	viewModel.addPoint('McKenna Park', 45.581673, -122.733106);
  	viewModel.addPoint('Cha Cha Cha', 45.581943, -122.722083);
} );

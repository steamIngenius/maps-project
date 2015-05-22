// Neighborhood map project

// Placed the map into the global namespace for now
// This makes it easier to experiment with its API from the console
var map;

// model
// This is a function declaration
function point(name, lat, lng) {
    var self = this;

    self.name = name;
    self.lat = ko.observable(lat);
    self.lng = ko.observable(lng);
    self.images = ko.observableArray();
    self.marker = new google.maps.Marker({
        position: new google.maps.LatLng(this.lat(), this.lng()),
        title: name,
        map: map, // global namespace
        draggable: false,
        animation: google.maps.Animation.DROP
    });
    // store default icon for later retrieval
    self.oIcon = self.marker.getIcon();
    // self.infowindow = new google.maps.InfoWindow({ content: "" });
    self.showInfo = function() {
    	// center the map on the clicked marker
    	map.setCenter(self.marker.getPosition());

	    // listener for changing the icon back after window is closed
	    google.maps.event.addListener(viewModel.infowindow, 'closeclick', self.revertIcon);

    	// set infowindow to random image from self.images
		// update InfoWindow content
		if (viewModel.infowindow.currentPoint) viewModel.infowindow.currentPoint.revertIcon();

		viewModel.infowindow.currentPoint = self;
		viewModel.infowindow.setContent("<img class=\"info-image\" src=\""+self.images()[4]+"\" \\>");
    	viewModel.infowindow.open(map, self.marker);
    	self.marker.setIcon('https://www.google.com/mapfiles/marker_green.png');
    };
    self.revertIcon = function() {
    	// center the map on the clicked marker
    	map.setCenter(self.marker.getPosition());

    	self.marker.setIcon(self.oIcon);
    };

	// make ajax call to our api Flickr
	// TODO: construct URL using place
	$.ajax({
		type: 'GET',
		url: 'https://api.flickr.com/services/rest/?'+
			'method=flickr.photos.search&'+
			'api_key=90196c34360d477a22de67a766021b52&'+
			// 'format=rest&'+
			'has_geo=1&'+		// get geotagged photos
			'lat='+self.lat()+'&'+ // not sure why these are ko.observables, I'm not doing anything ui with them (yet)
			'lon='+self.lng()+'&'+
			'radius=1&'+		// photos within 1km
			'per_page=5&'+		// 5 items for each marker
			'format=json&'+ 	// Give me JSON instead of say XML
			'nojsoncallback=1', // Give me plain JSON with no callback funtion
		datatype: 'jsonp',
		success: function (data, status) {
			console.log('Success fired.');
			console.log(data);
			console.log(status);
			var photos = data.photos.photo;
			// TODO construct URLs (and make it prettier than this crap)
			for (var i = 0; i < photos.length; i++) {
				console.log(photos[i].farm);
				console.log(photos[i].server);
				console.log(photos[i].id);
				console.log(photos[i].secret);
				self.images.push(
					'https://farm'+
					photos[i].farm+
					'.staticflickr.com/'+
					photos[i].server+'/'+
					photos[i].id+'_'+
					photos[i].secret+
					'_b.jpg');
			}
		},
		error: function (message) {
			console.log('An error occurred: ');
			console.log(message);
		},
		complete: function() {
			console.log('Complete fired.');
		    // listener for clicking the marker to display infowindow
		    google.maps.event.addListener(self.marker, 'click', self.showInfo);
		}
	});
}

// this is the view model (duh, look at the name)
var viewModel = {
	initialize: function() {
		this.origin = new google.maps.LatLng(45.578766, -122.724023);
		this.setupMap();
		this.setupControls();
		this.infowindow.currentPoint = undefined;
	},
	points: ko.observableArray([]),
	infowindow: new google.maps.InfoWindow({ content: "" }),

	// accepts a google.maps.Place object
	addPoint: function(place) {
		console.log("I need to make a point here.");
		console.log(place);
		this.points.push(
			new point(place.name,
				place.geometry.location.lat(),
				place.geometry.location.lng()
			)
		);

		// this seems like a good place for our ajaxy stuff no?
		// actually, no - Addy Osmoni recommends ajax go in the model
	},
	setupMap: function() {
		var mapOptions = {
	  		center: this.origin, // { lat: 45.578766, lng: -122.724023 },
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
			// console.log(newPlace);

			if (newPlace.length == 0) { return; }

			var bounds = new google.maps.LatLngBounds();

		    viewModel.addPoint( newPlace );
		    	/* newPlace.name,
		    	newPlace.geometry.location.lat(),
		    	newPlace.geometry.location.lng() ); */
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

// get things moving with a Gooble maps event listener and an anonymous function
// once everything has loaded, of course
google.maps.event.addDomListener(window, 'load', function() {
	// bind knockout and init
	ko.applyBindings(viewModel);
	viewModel.initialize();

  	// start off by adding a few static points to our neighborhood map
  	viewModel.addPoint({
  		name: 'Western Meats',
  		geometry: {
  			location: new google.maps.LatLng(45.579660, -122.715667)
  		}
  	});

  	viewModel.addPoint({
  		name: 'McKenna Park',
  		geometry: {
  			location: new google.maps.LatLng(45.581673, -122.733106)
  		}
  	});

  	viewModel.addPoint({
  		name: 'Cha Cha Cha',
  		geometry: {
  			location: new google.maps.LatLng(45.581943, -122.722083)
  		}
  	});
} );

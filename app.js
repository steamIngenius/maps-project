// referenced http://jsfiddle.net/t9wcC/
function point(name, lat, long) {
    this.name = name;
    this.lat = ko.observable(lat);
    this.long = ko.observable(long);

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, long),
        title: name,
        map: map, // global namespace
        draggable: true
    });

    //if you need the poition while dragging
    google.maps.event.addListener(marker, 'drag', function() {
        var pos = marker.getPosition();
        this.lat(pos.lat());
        this.long(pos.lng());
    }.bind(this));

    //if you just need to update it when the user is done dragging
    google.maps.event.addListener(marker, 'dragend', function() {
        var pos = marker.getPosition();
        this.lat(pos.lat());
        this.long(pos.lng());
    }.bind(this));
}

// Placed the map into the global namespace for now
// This makes it easier to experiment with its API
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
}

google.maps.event.addDomListener(window, 'load', initialize);
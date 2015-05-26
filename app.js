// Neighborhood map project

// Placed the map into the global namespace for now
// This makes it easier to experiment with its API from the console
var map;

// model
function point(name, lat, lng) {
    var self = this;

    // data
    self.name = name;
    self.lat = ko.observable(lat);
    self.lng = ko.observable(lng);
    self.images = ko.observableArray();
    self.marker = new google.maps.Marker({
        position: new google.maps.LatLng(self.lat(), self.lng()),
        title: name,
        map: map, // global namespace
        draggable: false,
        animation: google.maps.Animation.DROP
    });
    // store default icon for later retrieval
    self.oIcon = self.marker.getIcon();

    // behavior
    self.showInfo = function() {
        // center the map on the clicked marker
        map.setCenter(self.marker.getPosition());

        // listener for changing the icon back after window is closed
        google.maps.event.addListener(viewModel.infowindow, 'closeclick', self.revertIcon);

        // set infowindow to random image from self.images
        // update InfoWindow content
        if (viewModel.infowindow.currentPoint) { viewModel.infowindow.currentPoint.revertIcon(); }

        // set the new current point
        viewModel.infowindow.currentPoint = self;
        // set the infowindow's new content
        viewModel.infowindow.setContent("<img id=\"info-image\" src=\""+self.images()[4]+"\" \\>");
        // show infowindow and change the marker's icon!
        viewModel.infowindow.open(map, self.marker);
        self.marker.setIcon('https://www.google.com/mapfiles/marker_green.png');
    };
    self.revertIcon = function() {
        // center the map on the clicked marker
        map.setCenter(self.marker.getPosition());

        self.marker.setIcon(self.oIcon);
    };

    // make ajax call to our api: Flickr
    $.ajax({
        type: 'GET',
        url: 'https://api.flickr.com/services/rest/?'+
            'method=flickr.photos.search&'+
            'api_key=90196c34360d477a22de67a766021b52&'+
            // 'format=rest&'+
            'has_geo=1&'+       // get geotagged photos
            'lat='+self.lat()+'&'+ // not sure why these are ko.observables, I'm not doing anything ui with them (yet)
            'lon='+self.lng()+'&'+
            'radius=1&'+        // photos within 1km
            'per_page=5&'+      // 5 items for each marker
            'format=json&'+     // Give me JSON instead of say XML
            'nojsoncallback=1', // Give me plain JSON with no callback funtion
        datatype: 'jsonp',
        success: function (data, status) {
            console.log('Success fired.');
            console.log(data);
            console.log(status);
            var photos = data.photos.photo;
            // construct URLs 
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

// this is the view model
var viewModel = {
    initialize: function() {
        this.origin = new google.maps.LatLng(45.578766, -122.724023);
        this.setupMap();
        this.setupControls();
        this.infowindow.currentPoint = undefined;

        // Set offline.js to run checks against google instead of the web server (default is web server's favicon.ico).
        // The last reviewer rejected my code because they didn't realize disabling your wifi means 
        // google maps is unreachable, but the local webserver is still up via loopback!
        // NOTE: The random number at the end of the url string is to prevent a locally cached copy of the 
        // image from causing offline.js to think it's getting a correct response - this was not an easy
        // solution to discover!
        Offline.options = {
            checkOnLoad: false,
            checks: {
                image: {
                    url: function() {
                        return 'https://www.google.com/mapfiles/marker_green.png?' + Math.floor(1e9*Math.random())
                    }
                },
                active: 'image'
            },
            interceptRequests: true,
            requests: true,
            game: false
        };
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
        // initially, this ran counterintuitive to my mind, but it makes a lot of sense with MVVM
    },
    setupMap: function() {
        var mapOptions = {
            center: this.origin, // { lat: 45.578766, lng: -122.724023 },
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.HYBRID
        };

        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

        google.maps.event.addDomListener(window, "resize", function() {
            var center = map.getCenter();
            google.maps.event.trigger(map, "resize");
            map.setCenter(center);

            // reopen the infowindow when the map is resized to make it responsive
            if (viewModel.infowindow.getMap()) viewModel.infowindow.open(map);
        });

        // scale image responsively according to the size of the InfoWindow
        google.maps.event.addListener(viewModel.infowindow, 'domready', function() {
            var maxHeight = $('#info-image').parent().parent().css('max-height');
            var maxWidth = $('#info-image').parent().parent().css('max-width');

            $('#info-image').css('max-height', maxHeight);
            $('#info-image').css('max-width', maxWidth);
        });
    },
    setupControls: function() {
        // Searchbox functionality
        // referenced: https://developers.google.com/maps/documentation/javascript/examples/places-searchbox
        var input = document.getElementById('searchbox');
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        // Tie the input view to the searchbox
        var searchBox = new google.maps.places.SearchBox(input);
        // when searchbox gets us a result, do something with it (add to points)
        google.maps.event.addListener(searchBox, 'places_changed', function() {
            var newPlace = (searchBox.getPlaces())[0];
            // console.log(newPlace);

            if (newPlace.length === 0) { return; }

            var bounds = new google.maps.LatLngBounds();

            viewModel.addPoint( newPlace );

            // center our map using all of our current points of interest
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
    // bind knockoutjs and init
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

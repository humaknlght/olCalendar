window["epi"] = (epi || {});

/**
 * @typedef {{start: !number, end: !number, relativeWidth: ?number, left: ?number, width: ?number, id: !string, title: !string, location: ?string, desc: ?string}}
 */
epi.Event;

/**
 * @typedef {{start: !number, end: !number, relativeWidth: !number, left: !number, top: !number, width: !number, id: !string, title: !string, location: ?string, desc: ?string}}
 */
epi.StoredEvent;

/**
 * Used to layout the day's events.
 * 
 * @param {Array.<epi.Event>} events The events that need to be displayed on the calendar.
 * @return {!Array.<epi.StoredEvent>} Contains all of the events with the correct information needed to position and display them in the calendar.
 */
epi.layOutDay = function (events) {
	'use strict';
	var grid = [],
		i,
		event,
		coord = {},
		column,
		rEvents = [],
		e;
	
	/**
	 * This function will locatate the coordinates on the calendar for the passed in event.
	 * 
	 * @param {!epi.Event} newEvent The event that is being added.
	 * @param {!number} columnIndex The current index of the column being checked.
	 * @return {{column: !number, index: !number}}
	 */
	function fun(newEvent, columnIndex) {
		var column = grid[columnIndex],
			j,
			jEvent;
		if (column) {
			for (j = 0; jEvent = column[j]; j++) {
				if (newEvent.start < jEvent.start) {
					if (newEvent.end <= jEvent.start) {
						return {column: columnIndex, index: j};
					}
					return fun(newEvent, columnIndex + 1);
				} else if (newEvent.start < jEvent.end) {
					return fun(newEvent, columnIndex + 1);
				}
			}
			return {column: columnIndex, index: j + 1};
		}
		grid[columnIndex] = [];
		return {column: columnIndex, index: 0};
	}
	
	/**
	 * This function will calculate recursively, the relative width of the passed in event.
	 * 
	 * @param {!epi.Event} newEvent The new event
	 * @param {!number} columnIndex The starting column
	 * @param {!number} relativeWidth The width compared to the other events
	 * @return {!number} The relative width
	 */
	function counter(newEvent, columnIndex, relativeWidth) {
		var column = grid[columnIndex],
			j,
			jEvent,
			max = relativeWidth,
			tmp;
		if (column) {
			for (j = 0; jEvent = column[j]; j++) {
				if ((newEvent.start <= jEvent.start && newEvent.end >= jEvent.end) || (newEvent.start >= jEvent.start && newEvent.start < jEvent.end) || (newEvent.end > jEvent.start && newEvent.end < jEvent.end)) {//
					tmp = counter(jEvent, columnIndex + 1, relativeWidth + 1);
					if (tmp > max) {
						max = tmp;	
					}
				}
			}
		}
		return max;
	}
	events.sort(function (a, b) {
		var q = a.start - b.start;
		return (q === 0) ? ((b.end - b.start) - (a.end - a.start)) : q;
	});
	for (i = 0; event = events[i]; i++) {
		if (event.end - event.start < 0) {
			events.splice(i, 1);
		} else {
			event.relativeWidth = 0;
			delete event.left;
			delete event.width;
			coord = fun(event, 0);
			column = grid[coord.column];
			column.splice(coord.index, 0, event);
			event.left = coord.column;
		}
	}
	for (i = 0; event = events[i]; i++) {
		event.relativeWidth = counter(event, 0, 0);
		event.width = 600 / event.relativeWidth;
		e = {};
		rEvents[i] = {width: event.width, left: (event.left * event.width), top: event.start, start: event.start, end: event.end, id: event.id, title: event.title, location: event.location, desc: event.desc};
	}
	return rEvents;
};

/**
 * Displays all of the events on the page.
 * 
 * @param {!Array.<epi.StoredEvent>} grid The grid of already layedout events.
 */
epi.displayGrid = function (grid) {
	'use strict';
	
	/**
	 * Converts the pass in seconds to a string in the format h:mm: AM/PM.
	 * 
	 * @param {!number} timeAsSeconds The number of seconds
	 * @return {!string} The human readable time format.
	 */
	function convertTimeToString(timeAsSeconds) {
		var hours = parseInt(timeAsSeconds / 60, 10),
			minutes = timeAsSeconds % 60,
			pm = false;
		if (hours > 12) {
			pm = true;
			hours -= 12;
		}
		if (!hours) {
			hours = 12;
		} 
		return hours + ':' + (minutes > 9 ? minutes : '0' + minutes) + (pm ? ' PM' : ' AM');
	}
	
	/**
	 * Used to make the passed in event active.
	 * 
	 * @param {!HTMLDivElement} event The div that is displaying the event.
	 * @param {!number} time The number of millsecond to wait before making the event active.
	 */
	function makeActive(event, time) {
		setTimeout(function () {
			event.className += ' active';
		}, time);
	}
	
	/**
	 * Creates the URL for the QR code that contains the events data.
	 * 
	 * @param {!epi.StoredEvent} e The event containing the data.
	 * @return {!string} The URL to embed in the QA code.
	 */
	function makeQRUrl(e) {
		/*alert("Hello");
		dojo.rawXhrPost({
		    url: 'https://www.googleapis.com/urlshortener/v1/url',
		    postData: "{longUrl:window.location.protocol + '//' + window.location.host + window.location.pathname + '?type=addsource=qr&title=' + e.title + '&details=' + event.desc + '&location=' + e.location + '&start=' + e.start + '&end=' + e.end + window.location.hash})",
		    
		    load: function(data) {
		        alert(data);
		    },
		    error: function(error) {
		       alert( "Error :" + error);
		    }
		});*/
		var url = [];
		url.push(window.location.protocol);
		url.push('//');
		url.push(window.location.host);
		url.push(window.location.pathname);
		url.push('?type=add&source=qr&title=');
		url.push(encodeURIComponent(e.title));
		if(e.desc){
			url.push('&details=');
			url.push(encodeURIComponent(e.desc));
		}
		if(e.location){
			url.push('&location=');
			url.push(encodeURIComponent(e.location));
		}
		url.push('&start=');
		url.push(encodeURIComponent(e.start.toString()));
		url.push('&end=');
		url.push(encodeURIComponent(e.end.toString()));
		url.push(window.location.hash);
		
		return url.join('');
	}
	var container = dojo.byId('eventContainer'),
		event,
		i = 0,
		div,
		neww;
	while (event = grid[i++]) {
		div = dojo.byId('e' + event.id);
		neww = !div;
		if (neww) {
			div = document.createElement('div');
		}
		div.style.left = (event.left + 10) + 'px';
		div.style.top = event.start + 'px';
		div.style.width = event.width + 'px';
		div.style.height = (event.end - event.start - 2) + 'px';
		div.setAttribute('data-start', convertTimeToString(event.start));
		div.setAttribute('data-end', convertTimeToString(event.end));
		div.innerHTML = '<div class="e"><div class="e2"><h3 class="title">' + event.title + '</h3><div class="l">' + event.location + '</div><p class="d">' + event.desc + '</p><div><img width="150" height="150" src="http://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=' + encodeURIComponent(makeQRUrl(event)) + '"/></div></div>';
		if (neww) {
			div.id = 'e' + event.id;
			div.className = 'e0 new';
			container.appendChild(div);
			makeActive(div, 75 * i);
			/*var firstLinkConnections.push(*/dojo.connect(div, 'onclick', epi, 'editEvent');//);
			dojo.removeClass(div, 'hasFocus');
		}
	}
};

/**
 * This function retreives the saved events and displays then on the page.
 */
epi.getAndDisplayGrid = function() {
	'use strict';
	dojo.byId('eventContainer').innerHTML = '';
	var savedEvents = epi.getEventsLocally(epi.activeDate);
	if (savedEvents) {
		epi.activeEvents = epi.layOutDay(savedEvents);
		epi.displayGrid(epi.activeEvents);
		dojo.addClass(dojo.byId('add'), 'show');
	} else {
		epi.activeEvents = [];
		dojo.byId('eventContainer').innerHTML = '';
	}
};

//This needs to happen unload because Modernizr.localstorage needs to be initialized.
dojo.addOnLoad(function() {
	'use strict';
	if (Modernizr.localstorage) {
		/**
		 * Stores the epi.activeEvents in local storage. The active events are stored as a string of JSON.
		 * 
		 * @param {string=} date The key to use when storing the data in local storage. epi.activeDate is used if the date parameter is missing.
		 */
		epi.storeEventsLocally = function (date) {
			localStorage[date || epi.activeDate] = dojo.toJson(epi.activeEvents);
		};
		
		/**
		 * Retrievs the events from local storage.
		 * 
		 * @param {string=} date The key to use when retrieving the data from local storage. epi.activeDate is used if the date parameter is missing.
		 * @return {?Array.<epi.StoredEvent>}
		 */
		epi.getEventsLocally = function (date) {
			return dojo.fromJson(localStorage[date || epi.activeDate]);
		};
	} else {
		/**
		 * This method will be used only if localstorage is not supported.
		 * 
		 * @param {string=} date The key to use when storing the data in local storage. epi.activeDate is used if the date parameter is missing.
		 */
		epi.storeEventsLocally = function(date) {
		};
		
		/**
		 * This method will be used only if localstorage is not supported
		 *
		 * @param {string=} date The key to use when retrieving the data from local storage. epi.activeDate is used if the date parameter is missing.
		 * @return {?Array.<epi.StoredEvent>}.
		 */
		epi.getEventsLocally = function (date) {
			return null;
		};
	}
});
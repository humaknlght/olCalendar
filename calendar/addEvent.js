var epi = (epi || {});
epi.addEvent = function (form, add) {
	"use strict";
	function parseTime(value) {
		if (!value) {
			return null;
		}
		var hours,
			d,
			time = value.match(/^(\d+)(:(\d\d))?\s*((a\.?|(p)\.?)(?:m\.?)?)?$/i); 
		if (!time) {
			return null;
		}
		hours = parseInt(time[1], 10);    
		if (hours === 12 && !time[6]) {
			hours = 0;
		} else {
			hours += (hours < 12 && time[6]) ? 12 : 0;
		}   
		d = new Date();             
		d.setHours(hours);
		d.setMinutes(parseInt(time[3], 10) || 0);
		d.setSeconds(0, 0);  
		return d;
	}
	var start = parseTime(form.start.value),
		end = parseTime(form.end.value),
		i = 0,
		id;
	if (!start) {
		return alert("Invalid Start Time");
	}
	if (!end) {
		return alert("Invalid End Time");
	}
	if (start.getHours() > end.getHours()) {
		if (end.getHours() < 12) {
			end.setHours(end.getHours() + 12);
		} else {
			return alert("The Start time cannot be greater than the end time");
		}
	} else if (start.getHours() === end.getHours()) {
		if (start.getMinutes() > end.getMinutes()) {
			return alert("The Start time cannot be greater than the end time");
		} else if (start.getMinutes() === end.getMinutes()) {
			return alert("The Start time and End time cannot be the same.");
		}
	}
	if (add) {
		epi.activeEvents.push({id: form.id.value, start: (start.getHours() * 60) + start.getMinutes(), end: (end.getHours() * 60) + end.getMinutes(), title: form.title.value, location: form.location.value, desc: form.desc.value});
	} else {
		id = form.id.value.substring(1, form.id.value.length);
		for (; i < epi.activeEvents.length; i += 1) {
			if (epi.activeEvents[i].id === id) {
				epi.activeEvents[i] = {id: id, start: (start.getHours() * 60) + start.getMinutes(), end: (end.getHours() * 60) + end.getMinutes(), title: form.title.value, location: form.location.value, desc: form.desc.value, rendered: true};
				break;
			}
		}
	}
	epi.activeEvents = epi.layOutDay(epi.activeEvents);
	epi.storeEventsLocally();
	epi.displayGrid(epi.activeEvents);
};
epi.saveEvent = function (form) {
	'use strict';
	epi.addEvent(form, form.submit.innerHTML === "Add Event");
	form.reset();
	form.id.value = new Date().getTime();
	dojo.byId('addLeg').innerHTML = 'Add New Event';
	form.submit.innerHTML = "Add Event";
};
epi.editEvent = function (event) {
	'use strict';
	dojo.query('.hasFocus').removeClass('hasFocus');
	event = event.currentTarget;
	var form = dojo.query('#add form')[0];
	dojo.byId('addLeg').innerHTML = form.submit.innerHTML = 'Edit Event';
	form.start.value = event.getAttribute('data-start');
	form.end.value = event.getAttribute('data-end');
	form.title.value = dojo.query('.title', event)[0].innerHTML;
	form.location.value = dojo.query('.l', event)[0].innerHTML;
	form.id.value = event.id;
	form.desc.value = dojo.query('.d', event)[0].innerHTML;
	dojo.addClass(event, 'hasFocus');
};
window["epi"] = (epi || {});

/**
 * This function will read the form and add the event.
 * 
 * @param {!HTMLFormElement} form This is the form where the event info is being read from.
 * @param {!boolean} add If true then the event is added, otherwise the event is being edited.
 */
epi.addEvent = function (form, add) {
	"use strict";
	
	var formElements = form.elements;
	
	/**
	 * Parses the input parameter as a date.
	 * 
	 * @param {?string} value The time input from the user
	 * @return {?Date} The date object representing the input parameter. Returns null if the input value is blank or missing.
	 */
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
	var start = parseTime(formElements['start'].value),
		end = parseTime(formElements['end'].value),
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
		epi.activeEvents.push({id: formElements["id"].value, start: (start.getHours() * 60) + start.getMinutes(), end: (end.getHours() * 60) + end.getMinutes(), title: formElements["title"].value, location: formElements["location"].value, desc: formElements["desc"].value});
	} else {
		id = formElements["id"].value.substring(1, formElements["id"].value.length);
		for (; i < epi.activeEvents.length; i += 1) {
			if (epi.activeEvents[i].id === id) {
				epi.activeEvents[i] = {id: id, start: (start.getHours() * 60) + start.getMinutes(), end: (end.getHours() * 60) + end.getMinutes(), title: formElements["title"].value, location: formElements["location"].value, desc: formElements["desc"].value, rendered: true};
				break;
			}
		}
	}
	epi.activeEvents = epi.layOutDay(epi.activeEvents);
	epi.storeEventsLocally();
	epi.displayGrid(epi.activeEvents);
};

/**
 * This function is used to save the event from the page and is called from the page.
 * 
 * @param {!HTMLFormElement} form This is the form where the event info is being read from.
 */
epi.saveEvent = function (form) {
	'use strict';
	epi.addEvent(form, form.submit.innerHTML === "Add Event");
	form.reset();
	form.id.value = new Date().getTime();
	dojo.byId('addLeg').innerHTML = 'Add New Event';
	form.submit.innerHTML = "Add Event";
};

/**
 * This function will handle an event to determine which event needs to be updated and will populate the edit form.
 * 
 * @param {!Event} event The event that triggered the edit.
 */
epi.editEvent = function (event) {
	'use strict';
	dojo.query('.hasFocus').removeClass('hasFocus');
	var target = event.currentTarget,
		formElements = dojo.query('#add form')[0].elements;
	dojo.byId('addLeg').innerHTML = formElements["submit"].innerHTML = 'Edit Event';
	formElements["start"].value = target.getAttribute('data-start');
	formElements["end"].value = target.getAttribute('data-end');
	formElements["title"].value = dojo.query('.title', target)[0].innerHTML;
	formElements["location"].value = dojo.query('.l', target)[0].innerHTML;
	formElements["id"].value = target.id;
	formElements["desc"].value = dojo.query('.d', target)[0].innerHTML;
	dojo.addClass(target, 'hasFocus');
};
var reportServerAddress = 'http://localhost:9012';
var serverAddress = 'https://abulafia.fi.muni.cz:9011';
var editStates = {"To review": 0, "Approved": 1, "Rejected": 2};

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

Array.prototype.checkAndAdd = function(name) {
    val = $.inArray(name, this);
    if(val == "-1") {
    	this.splice(0, 0, name);
    }
};

jQuery.fn.outerHTML = function(s) {
    return s
        ? this.before(s).remove()
        : jQuery("<p>").append(this.eq(0).clone()).html();
};

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function setSearchAutocomplete(input, dict) {
	input.autocomplete({
    	html: true,
    	source: function( request, response ) {
    		var items = [];
    		$.getJSON( serverAddress + "/" + encodeURIComponent(dict), { action: "queryList", word: this.term }, function( data ) {
        		$.each( data, function( key, val ) {
    	      		var item = { label: val.value + ":" + val.label, value: val.value + ":" + val.label, pwn_id: val.value, content: val.label};
        	  		items.push(item);
	        	});
    	    	response(items);
      		})
    	},
    	change: function( event, ui ) {
    		$(this).data(ui.item);
    	},
    	minLength: 2
	});
}

function applyActions(xml, actions) {
	changes = [];
	waitingModals = [];
	s = getXMLDom(xml);
	for(var i = 0; i < actions.length; i++) {
		action = actions[i];
		
		switch(action.edit_type) {
			case 0: //Addition
				addElement($(s), action, changes);
				break;
			case 1: //Modification
				modifyElement($(s), action, changes);
				break;
			case 2: //Removal
				removeElement($(s), action, changes);
				break;

		}
	}
	return $.when.apply($, waitingModals).done(function() {
		str = (new XMLSerializer()).serializeToString(s);
		this.str = str;
		this.changes = changes;
	});
}

//TODO add checks for consistency
function addElement(domElem, action, changes) {
	domElem = $(domElem).xpath("//SYNSET");
	switch(action.field_of_edit) {
		case "position":
			//TODO - not implemented yet
			break;
		case "definition":
			e = $(domElem).xpath("//DEF");
			if(e.length > 0){
				$(e).text(action.edit_value);
			} else {
				domElem.append("<DEF>" + action.edit_value + "</DEF>");
			}
			changes.push({"id": action.id, "edit_value": "", "edit_xpath": "/SYNSET/DEF", "edit_type": 0});
			break;
		case "domain":
			e = $(domElem).xpath("//DOMAIN");
			if(e.length > 0){
				$(e).text(action.edit_value);
			} else {
				domElem.append("<DOMAIN>" + action.edit_value + "</DOMAIN>");
			}
			changes.push({"id": action.id, "edit_value": "", "edit_xpath": "/SYNSET/DOMAIN", "edit_type": 0});
			break;
		case "sumo":
			e = $(domElem).xpath("//SUMO");
			if(e.length > 0){
				$(e).text(action.edit_value);
			} else {
				domElem.append("<SUMO type=''>" + action.edit_value + "</SUMO>");
			}
			changes.push({"id": action.id, "edit_value": "", "edit_xpath": "/SYNSET/SUMO", "edit_type": 0});
			break;
		case "type@sumo":
			e = $(domElem).xpath("//SUMO");
			if(e.length > 0){
				$(e).attr("type", action.edit_value);
			} else {
				domElem.append("<SUMO type='" + action.edit_value + "'></SUMO>");
			}
			changes.push({"id": action.id, "edit_value": "", "edit_xpath": "/SYNSET/SUMO/@type", "edit_type": 0});
			break;
		case "usage":
			e = domElem.xpath("//SYNSET");
			e.append(action.edit_value);
			changes.push({"id": action.id, "edit_value": "", "edit_xpath": "/SYNSET/USAGE[text()='" + e.children().last().text() + "']", "edit_type": 0});
			break;
		case "synonym":
			e = domElem.xpath("//SYNONYM");
			e.append(action.edit_value);
			changes.push({
				"id": action.id, 
				"edit_value": "", 
				"edit_xpath": "/SYNSET/SYNONYM/LITERAL[@sense='" + e.children().last().attr("sense") + "' and text()='" + e.children().last().text() + "']",
				"edit_type": 0
			});
			break;
		case "relation":
			e = domElem.xpath("//SYNSET");
			e.append(action.edit_value);
			changes.push({
				"id": action.id,
				"edit_value": "",
				"edit_xpath": "/SYNSET/ILR[@link='" + e.children().last().attr("link") + "' and @type='" + e.children().last().attr("type") + "']",
				"edit_type": 0
			});
			break;
	}
}

function modifyElement(domElem, action, changes) {
	e = domElem.xpath(action.edit_xpath);
	switch(action.field_of_edit) {
		case "position":
		case "definition":
		case "domain":
		case "sumo":
			oldValue = e.text();
			e.text(action.edit_value);
			changes.push({"id": action.id, "edit_value": oldValue, "edit_xpath": action.edit_xpath, "edit_type": 1});
			break;
		case "type@sumo":
			if(e.length == 0) {
				addElement(domElem, action, changes);
			} else {
				oldValue = e[0].value;
				e[0].value = action.edit_value;
				changes.push({"id": action.id, "edit_value": oldValue, "edit_xpath": action.edit_xpath, "edit_type": 1});
			}
			break;
		case "usage":
			if(e.length == 0) {
				waitingModals.push(editNotFoundDialog(localize("usage-not-found"), domElem, action, changes));
			} else {
				oldValue = e[0].outerHTML;
				e.replaceWith(action.edit_value);
				e = $(action.edit_value);
				newValue = e.text();
				changes.push({"id": action.id, "edit_value": oldValue, "edit_xpath": "/SYNSET/USAGE[text()='" + newValue + "']", "edit_type": 1});
			}
			break;
		case "synonym":
			if(e.length == 0) {
				waitingModals.push(editNotFoundDialog(localize("synonym-not-found"), domElem, action, changes));
			} else {
				oldValue = e[0].outerHTML;
				e.replaceWith(action.edit_value);
				e = $(action.edit_value);
				sense = e.attr("sense");
				lnote = e.attr("lnote");
				value = e.text();
				changes.push({
					"id": action.id, 
					"edit_value": oldValue, 
					"edit_xpath": "/SYNSET/SYNONYM/LITERAL[@sense='" + sense + "' and text()='" + value + "']",
					"edit_type": 1
				});
			}
			break;
		case "relation":
			if(e.length == 0) {
				waitingModals.push(editNotFoundDialog(localize("relation-not-found"), domElem, action, changes));
			} else {
				oldValue = e[0].outerHTML;
				e.replaceWith(action.edit_value);
				e = $(action.edit_value);
				type = e.attr("type");
				link = e.attr("link");
				changes.push({
					"id": action.id,
					"edit_value": oldValue,
					"edit_xpath": "/SYNSET/ILR[@link='" + link + "' and @type='" + type + "']",
					"edit_type": 1
				});
			}
			break;
	}
}

function removeElement(domElem, action, changes) {
	e = domElem.xpath(action.edit_xpath);
	switch(action.field_of_edit) {
		case "position":
		case "definition":
		case "domain":
		case "sumo":
			oldValue = e.text();
			e.text("");
			changes.push({"id": action.id, "edit_value": oldValue, "edit_xpath": action.edit_xpath, "edit_type": 2});
			//TODO - not implemented yet
			break;
		case "type@sumo":
			if(e.length == 0) {
				e = $(domElem).xpath("//SUMO");
				e.attr("type", "");
				e = $(e).xpath("@type");
			}
			oldValue = e[0].value;
			e[0].value = action.edit_value;
			changes.push({"id": action.id, "edit_value": oldValue, "edit_xpath": action.edit_xpath, "edit_type": 2});
			//TODO - not implemented yet
			break;
		case "usage":
			if(e.length == 0) {
				waitingModals.push(removeNotFoundDialog(localize("usage-not-found"), domElem, action, changes));
			} else {
				oldValue = e.outerHTML();
				e.remove();
				changes.push({"id": action.id, "edit_value": oldValue, "edit_xpath": "/SYNSET", "edit_type": 2});
			}
			break;
		case "synonym":
			if(e.length == 0) {
				waitingModals.push(removeNotFoundDialog(localize("synonym-not-found"), domElem, action, changes));
			} else {
				e.parent().find("WORD").remove();
				oldValue = e.outerHTML();
				e.remove();
				newValue = $(action.edit_value);
				sense = newValue.attr("sense");
				lnote = newValue.attr("lnote");
				value = newValue.text();
				changes.push({
					"id": action.id, 
					"edit_value": oldValue, 
					"edit_xpath": "/SYNSET/SYNONYM",
					"edit_type": 2
				});
			}
			break;
		case "relation":
			if(e.length == 0) {
				waitingModals.push(removeNotFoundDialog(localize("relation-not-found"), domElem, action, changes));
			} else {
				oldValue = e.outerHTML();
				e.remove();
				changes.push({"id": action.id, "edit_value": oldValue, "edit_xpath": "/SYNSET", "edit_type": 2});
			}
	}
}

function resolveEditType(oldString, newString) {
	//Addition
	if(oldString == undefined || oldString == "") {
		return 0;
	}
	//Removal
	if(newString == undefined || newString == "") {
		return 2;
	}
	//Editation
	return 1;
}

function updateSynset(synset, actions, meta, newState) {
	applyActions(synset, actions).done(function () {
		if(this.changes.length > 0) {
			status = "status_" + newState;
			reportData = {"edited_by": meta["edited_by"]};
			reportData[status] = this.changes;
			newSynset = this.str;
			jsoned = JSON.stringify(xmlToJSON(newSynset));
			reportData = JSON.stringify(reportData);
			feedbacks = [];
			feedbacks.push(
				$.post(serverAddress + "/" + meta.dictionary, {
					action: "save",
					id: meta.pwn_id,
					data: jsoned
				})
			);	
			feedbacks.push(
				$.post(
					reportServerAddress + "/change_status_edit/",
					reportData
				)
			);
			$.when.apply($, feedbacks).done(function() {
				alert("Synset saved!");
				for(j=0; j < changes.length; j++) {
					$("#minoredit-" + changes[j].id).remove();
				}
				if($("#edit-" + meta.id + "-minoredits").children().length == 0) {
					$("#edit-" + meta.id).remove();
				}
				lock = false;
			}).fail(function (msg) {
				console.log(msg);
				alert(localize("server-error"));
				lock = false;
			});
		} else {
			lock = false;
		}
	});
	
}

function editNotFoundDialog(question, domElem, action, changes) {
    var defer = $.Deferred();
    btns = {};
    btns[localize("not-found-dialog-button-add")] = function() {
		addElement(domElem, action, changes);
		$(this).dialog("close");
		defer.resolve("add");
	}
	btns[localize("not-found-dialog-button-nothing")] = function() {
		$(this).dialog("close");
		defer.resolve("nothing");
	}
	btns[localize("not-found-dialog-button-discard")] = function() {
		$.post(
			reportServerAddress + "/mark_deleted/",
			JSON.stringify({id: action.id})
		).done(function () {
			removeMinorEdit(action.id);
			defer.resolve("discard");
		});
		//TODO fail
		$(this).dialog("close");
	}

    $('<div>' + question + '</div>')
        .dialog({
            autoOpen: true,
            modal: true,
            title: localize("not-found-dialog-title"),
            buttons: btns,
            close: function () {
                $(this).remove();
            }
        });
    return defer.promise();
}

function removeNotFoundDialog(question, domElem, action, changes) {
    var defer = $.Deferred();
    btns = {};
	btns[localize("not-found-dialog-button-nothing")] = function() {
		$(this).dialog("close");
		defer.resolve("nothing");
	}
	btns[localize("not-found-dialog-button-discard")] = function() {
		$.post(
			reportServerAddress + "/mark_deleted/",
			JSON.stringify({id: action.id})
		).done(function () {
			removeMinorEdit(action.id);
			defer.resolve("discard");
		});
		//TODO fail
		$(this).dialog("close");
	}
    $('<div>' + question + '</div>')
        .dialog({
            autoOpen: true,
            modal: true,
            title: localize("not-found-dialog-title"),
            buttons: btns,
            close: function () {
                $(this).remove();
            }
        });
    return defer.promise();
}

function removeMinorEdit(id) {
	minoredit = $("#minoredit-" + id);
	editData = findEditParent(minoredit).data();

	editData = $.map(editData, function(value, index) {
    	return [value];
	});
	meta = editData.shift(); //Remove meta
	editData.splice(editData.length - 1, 1); //Remove prototype function

	editData = editData.filter(function(action) { return action.id != id; });
	newData = [];
	newData.push(meta);
	newData = newData.concat(editData);
	findEditParent(minoredit).removeData();
	findEditParent(minoredit).data(newData);
	$("#minoredit-" + id).remove();
	if($("#edit-" + meta.id + "-minoredits").children().length == 0) {
		$("#edit-" + meta.id).remove();
	}
}

function findMinorEditParent(node) {
	parents = node.parents();
	return parents.filter(".minoredit");
}

function findEditParent(node) {
	parents = node.parents();
	return parents.filter(".edit");
}

function initLocalesDropdown(page) {
	l = locales[curLocalization];
	for (var key in locales) {
    	// skip loop if the property is from prototype
    	if (!locales.hasOwnProperty(key)) continue;
    	l = locales[key];
    	if(l == locales[curLocalization]) {
    		$("#language-dropdown").find(".dropdown-toggle").html("<img class=\"lang-icon\" src=\"" + l["icon"] + "\">" + l["name"]);
    	} else {
    		$("#language-dropdown-langs").append("<a href=\"" + l["path"] + "/" + page + "\"><img class=\"lang-icon\" src=\"" + l["icon"] + "\">" + l["name"] + "</a>");
    	}
	}
}

function localize(key) {
	if(!(key in loc)) {
		return defaultLoc[key];
	} else {
		return loc[key];
	}
}
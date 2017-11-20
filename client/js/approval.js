var synsetPWN;
var dictionary = "";
var editTypeFilter = "";
var editFieldFilter = "";
var statusFilter = "0";


var editHTML = '<div id="edit-{id}" class="card edit"><div class="card-header" role="tab" id="headingOne"><h5 class="mb-0 row"><a id="edit-{id}-accordion" class="col-10 row" data-toggle="collapse" data-parent="#accordion" href="#edit-collapse-{id}" aria-expanded="true" aria-controls="edit-collapse-{id}"><div class="col-6">{name}</div><div class="col-3">{user}</div><div class="col-3">{date}</div></a><div class="col-2"><a id="edit-{id}-approve" class="delete btn btn-primary" href="javascript:void(0)"><img src="../../img/approve.png"></a><a id="edit-{id}-cancel" class="delete btn btn-danger" href="javascript:void(0)"><img src="../../img/cancel.png"></a><a id="edit-{id}-undo" class="delete btn btn-primary" href="javascript:void(0)"><img src="../../img/reload.png"></a><a id="edit-{id}-refresh" class="delete btn btn-primary" href="javascript:void(0)"><img src="../../img/reload.png"></a></div></h5></div><div id="edit-collapse-{id}" class="collapse" role="tabpanel"><div  id="edit-{id}-minoredits" class="card-block"></div></div></div>';
var minorEditHTML = '<div id="minoredit-{id}" class="row minoredit"><div class="col-3"><div class="badge badge-primary">{type}</div>{field}</div><div class="col-7 row"><div  id="loader-{id}" class="loader-collapse col-1"><div class="loader-small"></div></div><div class="col"><img id="info-{id}" class="info" src="../../img/info.png" style="display:none"><span id="minoredit-{id}-old" class="oldValue"></span> → <span id="minoredit-{id}-new" class="newValue">{new}</span></div></div><div class="col-2"><a id="minoredit-{id}-approve" class="approve btn btn-primary" href="javascript:void(0)"><img src="../../img/approve.png"></a><a id="minoredit-{id}-cancel" class="delete btn btn-danger" href="javascript:void(0)"><img src="../../img/cancel.png"></a><a id="minoredit-{id}-undo" class="delete btn btn-primary" href="javascript:void(0)"><img src="../../img/reload.png"></a><a id="minoredit-{id}-refresh" class="delete btn btn-primary" href="javascript:void(0)"><img src="../../img/reload.png"></a></div></div></div>';

var editations; //Synset XML
var reloadAlert = false;

var dicts;
var user;

var activeRightCard = $("#loader");

var lock = false;

$(document).ready(function () {
	init();
});

function init() {
	$.ajax({
       	method: "GET",
       	url: serverAddress + "/" + "doc?action=connect",
    }).done(function( msg ) {
    	console.log(msg);
    	initLocalesDropdown("approval.html");
       	dicts = msg.dicts;
       	user = msg.user;
       	$(".username").html(user.name);

		var dictsOptions = "";
		for (var key in dicts) {
			if(dicts[key].access == "w") {
 				dictsOptions += "<option value='" + dicts[key].code + "'>" + dicts[key].name + "</option>";
			}
		}

		$("#dictionaries-select").append(dictsOptions);
		$("#dictionaries-select").change(function() {
			dictionary = $("#dictionaries-select").val();
			setSearchAutocomplete($("#pwn-input"), dictionary);
		});
		$("#dictionaries-select").change();

		$("#edit-status-select").change(function() {
			statusFilter = $("#edit-status-select").val();
		});

		$("#edit-type-select").change(function() {
			editTypeFilter = $("#edit-type-select").val();
		});

		$("#edit-field-select").change(function() {
			editFieldFilter = $("#edit-field-select").val();
		});

		$("#btn-select").click(function(e) {
			e.preventDefault();
			onFiltersChange();	
		});			
		$("#btn-select").click();

		}).fail(function() {
			$("#loader").hide();
    		alert("Can't reach server!");
  		});
}

function onFiltersChange() {
	changeRightCard($("#loader"));
	$("#errors-accepted").hide();
	$("#errors-rejected").hide();
	$("#errors-undoed").hide();
	$("#errors-offline").hide();
	$("#errors-error").hide();
	reset();
	$.get(
        reportServerAddress + '/get_all_edits/?dictionary="' + encodeURIComponent(dictionary) +'"&pwn_id="' + $("#pwn-input").val() +'"&edit_status="' + statusFilter +'"&field="' + editFieldFilter +'"&type="' + editTypeFilter + '"',
        null,
        function(data) {
        	editations = data;
			if(editations.length > 0) {
				for (i = 0; i < editations.length; i++) {
					insertMajorEditation($("#editations"), editations[i]);
				}
				changeRightCard($("#editations"));
			} else {
				changeRightCard($("#editations-noresults"));
			}
        }
    ).fail(function() {
		$("#errors-offline").show();
  	});
	
}

function insertMajorEditation(node, json) {
	meta = json[0];
	html = editHTML;
	html = html.replace(/{id}/gi, meta["id"]);
	html = html.replace(/{name}/gi, meta["edit_name"].capitalize());
	html = html.replace(/{user}/gi, meta["edited_by"]["name"].capitalize());
	html = html.replace(/{date}/gi, new Date(meta["edited"]).toLocaleDateString());
	appended = node.append(html);

	initEditButtons(appended, json);
	
	for(j = 1; j < json.length; j++) {
		insertMinorEditation($("#edit-" + meta["id"] + "-minoredits"), json, j);
	}

	
	
	meta["loaded"] = false;
	$("#edit-" + meta["id"] + "-accordion").data("meta", meta);
	$("#edit-" + meta["id"] + "-accordion").data("edits", json);
	$("#edit-" + meta["id"] + "-accordion").click(function(e) {
		meta = $(this).data("meta");
		if(meta["loaded"] == false){
			meta["loaded"] = true;
			$(this).data("meta", meta);
			edits = $(this).data("edits");
			$.ajax({
       			method: "GET",
       			url: serverAddress + "/" + encodeURIComponent(meta["dictionary"]) + "?action=runQuery&query=" + encodeURIComponent(meta["pwn_id"]) + "&outtype=plain",
    		}).done(function( msg ) {
    			s = $(getXMLDom(msg));

    			for(j = 1; j < edits.length; j++) {
					edit = edits[j];
					if((edit.edit_type == 0 && edit.edit_status == 0) || (edit.edit_type == 2 && edit.edit_status == 1)) {
						oldValue = "";
					} else {
						oldValue = s.xpath(edit.edit_xpath);
						if(oldValue.length == 0) {
							$("#info-" + edit.id).attr("title", localize("old-value-not-found"));
							$("#info-" + edit.id).show();
						}
						try {
							oldValue = oldValue[0].textContent;	
						} catch(e) {
							
						}
						
					}
					$("#minoredit-" + edit["id"] + "-old").html(oldValue);
					$("#loader-" + edit["id"]).hide();
				}
    		});
		}	
	});
}

function insertMinorEditation(node, json, actionNum) {
	meta = json[actionNum];
	html = minorEditHTML;
	html = html.replace(/{id}/gi, meta["id"]);
	if(statusFilter==0) {
		html = html.replace(/{type}/gi, localize("edit-type-" + meta["edit_type"]).capitalize());
	} else {
		html = html.replace(/{type}/gi, localize("edit-type-past-" + meta["edit_type"]).capitalize());
	}
	html = html.replace(/{field}/gi, localize(meta["field_of_edit"]).capitalize());
	html = html.replace(/{new}/gi, meta["edit_value"]);
	appended = node.append(html);
	initMinoreditButtons(appended, json, actionNum);
}

function initEditButtons(node, json) {
	meta = json[0];
	edit = $("#edit-" + meta["id"]).data(json);
	a = node.find("#edit-" + meta["id"] + "-approve");
	registerApproveHandler(a);
	a = node.find("#edit-" + meta["id"] + "-cancel");
	registerCancelHandler(a);
	a = node.find("#edit-" + meta["id"] + "-undo");
	registerUndoHandler(a);
	a = node.find("#edit-" + meta["id"] + "-refresh");
	registerRefreshHandler(a);
	if(statusFilter == 1) { //Approved
		node.find("#edit-" + meta["id"] + "-approve").hide();
		node.find("#edit-" + meta["id"] + "-cancel").hide();
		node.find("#edit-" + meta["id"] + "-refresh").hide();
	} else if (statusFilter == 2) { //Rejected
		node.find("#edit-" + meta["id"] + "-approve").hide();
		node.find("#edit-" + meta["id"] + "-cancel").hide();
		node.find("#edit-" + meta["id"] + "-undo").hide();
	} else { //To approval
		node.find("#edit-" + meta["id"] + "-refresh").hide();
		node.find("#edit-" + meta["id"] + "-undo").hide();
	}
}

function initMinoreditButtons(node, json, id) {
	meta = json[0];
	minoredit = json[id];
	data = [];
	data.push(meta);
	data.push(minoredit);
	$("#minoredit-" + minoredit["id"]).data(data);
	a = node.find("#minoredit-" + minoredit["id"] + "-approve");
	registerApproveHandler(a);
	a = node.find("#minoredit-" + minoredit["id"] + "-cancel");
	registerCancelHandler(a);
	a = node.find("#minoredit-" + minoredit["id"] + "-undo");
	registerUndoHandler(a);
	a = node.find("#minoredit-" + minoredit["id"] + "-refresh");
	registerRefreshHandler(a);
	if(statusFilter == 1) { //Approved
		node.find("#minoredit-" + minoredit["id"] + "-approve").hide();
		node.find("#minoredit-" + minoredit["id"] + "-cancel").hide();
		node.find("#minoredit-" + minoredit["id"] + "-refresh").hide();
	} else if (statusFilter == 2) { //Rejected
		node.find("#minoredit-" + minoredit["id"] + "-approve").hide();
		node.find("#minoredit-" + minoredit["id"] + "-cancel").hide();
		node.find("#minoredit-" + minoredit["id"] + "-undo").hide();
	} else { //To approval
		node.find("#minoredit-" + minoredit["id"] + "-refresh").hide();
		node.find("#minoredit-" + minoredit["id"] + "-undo").hide();
	}
}

function reset() {
	$("#editations").html("");
}

function registerApproveHandler(node) {
	$(node).click(function() {
		if(lock!=true) {
			lock = true;
			dataParent = findMinorEditParent($(this));
			if(dataParent.length == 0) {
				dataParent = findEditParent($(this));
			}
			actions = $.map(dataParent.data(), function(value, index) {
    			return [value];
			});

			meta = actions[0];
			actions.shift(); //Remove meta
			actions.splice(actions.length - 1, 1); //Remove prototype function
			$.get(
				serverAddress + "/" + encodeURIComponent(meta["dictionary"]) + "?action=runQuery&query=" + encodeURIComponent(meta["pwn_id"]) + "&outtype=plain"
			).done(function (msg) {
				updateSynset(msg, actions, meta, editStates["Approved"]);
			}).fail(function (msg) {
				alert(localize("debdict-server-error"));
				lock = false;
			});
		} else {
			alert(localize("multiple-edit-action-error"));
		}

	});
}

function registerCancelHandler(node) {
	$(node).click(function() {
		if(lock!=true) {
			lock = true;
			dataParent = findMinorEditParent($(this));
			if(dataParent.length == 0) {
				dataParent = findEditParent($(this));
			}
			actions = $.map(dataParent.data(), function(value, index) {
    			return [value];
			});

			meta = actions[0];
			actions.shift(); //Remove meta
			actions.splice(actions.length - 1, 1); //Remove prototype function
			toRemove = [];
			for(j = 0; j < actions.length; j++) {
				toRemove.push({"id": actions[j].id});
			}
			reportData = {"edited_by": meta["edited_by"]};
			reportData["status_2"] = toRemove;
			reportData = JSON.stringify(reportData);
			$.post(
				reportServerAddress + "/change_status_edit/",
				reportData
			).done(function (msg) {
				alert(localize("editation-canceled-result-ok"));
				for(j=0; j < actions.length; j++) {
					$("#minoredit-" + actions[j].id).remove();
				} 
				if($("#edit-" + meta.id + "-minoredits").children().length == 0) {
					$("#edit-" + meta.id).remove();
				}
				lock = false;
			}).fail(function (msg) {
				console.log(msg);
				alert(localize("report-server-error"));
				lock = false;
			});
		} else {
			alert(localize("multiple-edit-error"));
		}

	});
}

function registerUndoHandler(node) {
	$(node).click(function() {
		if(lock!=true) {
			lock = true;
			dataParent = findMinorEditParent($(this));
			if(dataParent.length == 0) {
				dataParent = findEditParent($(this));
			}
			actions = $.map(dataParent.data(), function(value, index) {
				if(value.edit_type == 2) {
					value.edit_type = 0;
				} else if(value.edit_type == 0) {
					value.edit_type = 2;
				}
    			return [value];
			});

			meta = actions[0];
			actions.shift(); //Remove meta
			actions.splice(actions.length - 1, 1); //Remove prototype function
			$.get(
				serverAddress + "/" + encodeURIComponent(meta["dictionary"]) + "?action=runQuery&query=" + encodeURIComponent(meta["pwn_id"]) + "&outtype=plain"
			).done(function (msg) {
				updateSynset(msg, actions, meta, editStates["To review"]);
			}).fail(function (msg) {
				alert(localize("debdict-server-error"));
				lock = false;
			});
		} else {
			alert(localize("multiple-edit-error"));
		}

	});
	
}

function registerRefreshHandler(node) {
	$(node).click(function() {
		if(lock!=true) {
			lock = true;
			dataParent = findMinorEditParent($(this));
			if(dataParent.length == 0) {
				dataParent = findEditParent($(this));
			}
			actions = $.map(dataParent.data(), function(value, index) {
    			return [value];
			});

			meta = actions[0];
			actions.shift(); //Remove meta
			actions.splice(actions.length - 1, 1); //Remove prototype function
			toRefresh = [];
			for(j = 0; j < actions.length; j++) {
				toRefresh.push({"id": actions[j].id});
			}
			reportData = {"edited_by": meta["edited_by"]};
			reportData["status_0"] = toRefresh;
			reportData = JSON.stringify(reportData);
			$.post(
				reportServerAddress + "/change_status_edit/",
				reportData
				).done(function (msg) {
					alert(localize("editation-refresh-result-ok"));
					for(j=0; j < actions.length; j++) {
						$("#minoredit-" + actions[j].id).remove();
					} 
					if($("#edit-" + meta.id + "-minoredits").children().length == 0) {
						$("#edit-" + meta.id).remove();
					}
					lock = false;
			}).fail(function (msg) {
				console.log(msg);
				alert(localize("report-server-error"));
				lock = false;
			});
		} else {
			alert(localize("multiple-edit-error"));
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
var synsetPWN;
var dictionary = "wneng2";
var user;

var synsetXML; //Synset XML
var synset;
var reloadAlert = false;

var cardTitleHTML = '{content} <span class="badge badge-default">{pos}</span></h3>'
var usagesHTML = '<div id="{id}" class="row stacked-input"><div class="control-label col reveal"><a href="javascript:void(0)">{content}</a></div><div class="row col"><div class="col"><input id="{id}-input" class="form-control" type="text" placeholder="Enter usage" value="{content}"></div><div class="col-1"><a id="{id}-delete" class="delete btn btn-danger" href="javascript:void(0)"><img src="../../img/delete.png"></a></div></div></div>';
var usagesCount = 0;
var synonymsHTML = '<div id="{id}" class="row stacked-input"><div class="control-label col reveal"><a href="javascript:void(0)"><span>{literal}</span> <span>{sense}</span> <span>{lnote}</span></a></div><div class="row col"><div class="col"><input id="{id}-literal-input" type="text" class="form-control" placeholder="Enter literal" value="{literal}"></div><div class="col"><input id="{id}-sense-input" type="text" class="form-control" placeholder="Enter sense" value="{sense}"></div><div class="col"><input id="{id}-lnote-input" type="text" class="form-control" placeholder="Enter lnote" value="{lnote}"></div><div class="col-1"><a id="{id}-delete" class="delete btn btn-danger" href="javascript:void(0)"><img src="../../img/delete.png"></a></div></div></div>';
var synonymsCount = 0;
var relationsHTML = '<div id="{id}" class="row stacked-input"><div class="control-label col reveal"><a href="javascript:void(0)">{content}</a></div><div class="row col"><div class="col"><input id="{id}-pwn" type="text" class="form-control" placeholder="Enter suggested Princeton Wordnet ID" value="{pwn}"></div><div class="col"><select id="{id}-type" class="form-control" type="text">{type-options}</select></div><div class="col-1"><a id="{id}-delete" class="delete btn btn-danger" href="javascript:void(0)"><img src="../../img/delete.png"></a></div></div></div>';
var relationsCount = 0;

var dicts;

var relationsSelectOptions = {};

var activeRightCard = $("#loader");


$(document).ready(function () {
	init();
});

function init() {
	$.ajax({
       	method: "GET",
       	url: serverAddress + "/" + "doc?action=connect",
    }).done(function( msg ) {
    	console.log(msg);
    	initLocalesDropdown("report.html");
       	dicts = msg.dicts;
       	user = msg.user;
       	$(".username").html(user.name);
       	$("#email-input").val(user.email);

       	dictsRelationTypes = new Array();
       	for (var dict in dicts) {
    		(function(dict, dicts) {
    			if (dicts.hasOwnProperty(dict)) {
       				request = $.ajax({
       					method: "GET", url: serverAddress + "/" + encodeURIComponent(dicts[dictionary].code) + "?action=getTypes"
       				}).done(function( msg ) {
    					console.log(msg);
       					relationsSelectOptions[dict] = JSON.parse(msg);
        				relationsSelectOptions[dict].checkAndAdd("");
					});
       				dictsRelationTypes.push(request);
    			}
    		})(dict, dicts);
		}
       	
       	$.when.apply($, dictsRelationTypes).done(function() {
			console.log("Requests done");

			if(synsetPWN) {
				$("#pwn-input").val(synsetPWN);
			}
			var dictsOptions = "";
			for (var key in dicts) {
  				dictsOptions += "<option value='" + key + "'>[" + dicts[key].access + "] " + dicts[key].name + "</option>";
			}

			$("#dictionaries-select").append(dictsOptions);
			$("#dictionaries-select").change(function() {
				dictionary = $("#dictionaries-select").val();
				setSearchAutocomplete($("#pwn-input"), dicts[dictionary].code);
				if(dicts[dictionary].access == "w") { 
					$("#errors-changes").show(); 
				}
				else { 
					$("#errors-changes").hide();
				}
			});
			if(dictionary){
				$("#dictionaries-select").val(dictionary);
				$("#dictionaries-select").change();
			}

			$("#definition a").click(function() {
				reloadAlert = true;
				hideAndShow($("#definition a"), $("#definition input"));
			});
			$("#domain a").click(function() {
				reloadAlert = true;
				hideAndShow($("#domain a"), $("#domain input"));
			});
			$("#sumo a").click(function() {
				reloadAlert = true;
				hideAndShow($("#sumo a"), $("#sumo input"));
			});
			$("#sumo-type a").click(function() {
				reloadAlert = true;
				hideAndShow($("#sumo-type a"), $("#sumo-type input"));
			});
			$( "#usage-add a" ).click(function() {
    			reloadAlert = true;
				insertUsage($("#usages"), "", false);
			});
			$( "#synonym-add a" ).click(function() {
				reloadAlert = true;
				insertSynonym($("#synonyms"), "", "", "", false);
			});
			$( "#relation-add a" ).click(function() {
				reloadAlert = true;
				insertRelation($("#relations"), {"pwn_id": "", "label": "", "type": "", "content": ""}, false);
			});

			$("#btn-cancel").click(function() {
				changeRightCard($("#editform-start"));
				reloadAlert = false;
			});

			$("#btn-submit").click(function(e) {
				e.preventDefault();
				saveEdits();
				return true;
			});

			$("#btn-select").click(function(e) {
				e.preventDefault();
				onPWNchange();
			});
			
			changeRightCard($("#editform-start"));
			$("#selectform").show();
			$("#userform").show();

			if(synsetPWN && dictionary) {
				$("#btn-select").click();
			} else {
				$("#pwn-input").focus();
			}

		}).fail(function() {
			$("#loader").hide();
    		alert("Can't reach server!");
  		});
	})
}

function onPWNchange() {
	changeRightCard($("#loader"));
	$("#errors-not-found").hide();
	$("#errors-fill").hide();
	$("#errors-offline").hide();
	$("#errors-error").hide();
	$("#errors-no-edits").hide();
	synsetPWN = $("#pwn-input").val().split(":")[0];
	dictionary = $("#dictionaries-select").val();
	if(!synsetPWN || !dictionary || dictionary == "" || synsetPWN == "") {
		$("#errors-fill").show();
		changeRightCard($("#editform-start"));
	} else {
		$.ajax({
       		method: "GET",
       		url: serverAddress + "/" + encodeURIComponent(dicts[dictionary].code) + "?action=runQuery&query=" + encodeURIComponent(synsetPWN) + "&outtype=plain",
   		}).done(function( msg ) {
   			try {
   				if (typeof msg === 'string' || msg instanceof String) {
   					changeRightCard($("#editform"));
   					synsetXML = msg;
					parseXML();
   				} else {
   					changeRightCard($("#editform-noresults"));
   				}
			} catch (e) {
				changeRightCard($("#editform-noresults"));
			}
			return false;
		}).fail(function( msg ) {
			if (msg.status==0) {
				$("#errors-offline").show();
   			} else {
   				$("#errors-error").show();
			}
			changeRightCard($("#editform-noresults"));
		});					
	}
}

//Parses XML into HTML
function parseXML() {
	reset();
	synset = getSynsetFromXML(synsetXML);

	//Title
	var title = "";

	for (i = 0; i < synset.synonyms.length; i++) {
		try{ title += synset.synonyms[i]["literal"] + ", "; } catch(e) {}
	}
	title = title.substring(0, title.length - 2);

	title = cardTitleHTML.replace(/{content}/gi, title);
	title = title.replace(/{pos}/gi, "[" + synset.pos + "]");
	$("#editform-card-title").html(title.capitalize());
	//Basic info

	//Definition
	hideAndShow($("#definition input"), $("#definition a"));
	if (synset.definition) {
		$("#definition a").html(synset.definition);
		$("#definition input").val(synset.definition);
	} else {
		$("#definition a").html("Add");
		$("#definition a").addClass("btn btn-primary");
		$("#definition input").val("");
	}
	$("#definition input").attr("origvalue", $("#definition input").val());

	//Domain
	hideAndShow($("#domain input"), $("#domain a"));
	if(synset.domain) {
		$("#domain a").html(synset.domain);
		$("#domain input").val(synset.domain);
	} else {
		$("#domain a").html("Add");
		$("#domain a").addClass("btn btn-primary");
		$("#domain input").val("");
	}
	$("#domain input").attr("origvalue", $("#domain input").val());

	//Sumo + type
	hideAndShow($("#sumo input"), $("#sumo a"));
	if(synset.sumo) {
		$("#sumo a").html(synset.sumo);
		$("#sumo input").val(synset.sumo);
	} else {
		$("#sumo a").html("Add");
		$("#sumo a").addClass("btn btn-primary");
		$("#sumo input").val("");
	}
	$("#sumo input").attr("origvalue", $("#sumo input").val());


	hideAndShow($("#sumo-type input"), $("#sumo-type a"));
	if(synset.sumoType) {
		$("#sumo-type a").html(synset.sumoType);
		$("#sumo-type input").val(synset.sumoType);
	} else {
		$("#sumo-type a").html("Add");
		$("#sumo-type a").addClass("btn btn-primary");
		$("#sumo-type input").val("");
	}
	$("#sumo-type input").attr("origvalue", $("#sumo-type input").val());
	
	
	//Usages
	for (i = 0; i < synset.usages.length; i++) {
		insertUsage($("#usages"), synset.usages[i], true);
	}

	//Synonyms
	for (i = 0; i < synset.synonyms.length; i++) {
		syn = synset.synonyms[i];
		insertSynonym($("#synonyms"), syn["literal"], syn["sense"], syn["lnote"], true);
	}

	//Relations
	for (j = 0; j < synset.relations.length; j++) {
		rel = synset.relations[j];
		insertRelation($("#relations"), rel, true);
	}
}

function parseToXML() {
	return "";
}

function insertUsage(node, content, preview) {
	var id = "usage-" + usagesCount;
	usagesCount++;
	var html = usagesHTML;
	html = html.replace(/{id}/gi, id);
	html = html.replace(/{content}/gi, content);
	var inserted = node.append(html).find("#" + id);
	var reveal = inserted.find(".reveal");
	if(preview) {
		reveal.click(function() {
			reloadAlert = true;
			hideAndShow($(this), $(this).next());
		});
		reveal.next().hide();
	} else {
		reveal.hide();
	}

	inserted.find("input:text").change(inputChangeHandler);
	registerDeleteHandler(inserted.find(".delete"));
}

function insertSynonym(node, literal, sense, lnote, preview) {
	var id = "synonym-" + synonymsCount;
	synonymsCount++;
	var html = synonymsHTML;
	html = html.replace(/{id}/gi, id);
	html = html.replace(/{literal}/gi, literal);
	html = html.replace(/{sense}/gi, sense);
	html = html.replace(/{lnote}/gi, lnote);
	var inserted = node.append(html).find("#" + id);
	var reveal = inserted.find(".reveal");
	if(preview) {
		reveal.click(function() {
			reloadAlert = true;
			hideAndShow($(this), $(this).next());
		});
		reveal.next().hide();
	} else {
		reveal.hide();
	}

	inserted.find("input:text").change(inputChangeHandler);
	registerDeleteHandler(inserted.find(".delete"));
}

function insertRelation(node, relation, preview) {
	var id = "relation-" + relationsCount;
	relationsCount++;
	var html = relationsHTML;
	html = html.replace(/{id}/gi, id);
	if(relation["pwn_id"] != "" && relation["label"] != "") {
		html = html.replace(/{content}/gi, relation["pwn_id"] + ":" + relation["content"]); //Label
		html = html.replace(/{pwn}/gi, relation["pwn_id"] + ":" + relation["content"]); //Input content
	} else {
		html = html.replace(/{content}/gi, relation["pwn_id"] + relation["content"]); //Label
		html = html.replace(/{pwn}/gi, relation["pwn_id"] + relation["content"]); //Input content
	}
	
	html = html.replace(/{type-options}/gi, getRelationOptions(relation["type"]));
	var inserted = node.append(html).find("#" + id);
	var PWNinput = inserted.find("#" + id + "-pwn");
	PWNinput.data(relation)
	var reveal = inserted.find(".reveal");
	if(preview) {
		reveal.click(function() {
			reloadAlert = true;
			hideAndShow($(this), $(this).next());
		});
		reveal.next().hide();
	} else {
		reveal.hide();
	}
	
	inserted.find("input:text").change(inputChangeHandler);
	setSearchAutocomplete($("#" + id + "-pwn"), dicts[dictionary].code);
	registerDeleteHandler(inserted.find(".delete"));
}

function saveEdits() {
	var newSynset = {};
	newSynset.pwn = synset.pwn;
	newSynset.pos = synset.pos;
	newSynset.domain = $("#domain-input").val();
	newSynset.sumo = $("#sumo-input").val();
	newSynset.sumoType = $("#sumo-type-input").val();
	newSynset.definition = $("#definition-input").val();
	newSynset.usages = new Array();
	newSynset.synonyms = new Array();
	newSynset.relations = new Array();
	for(i = 0; i < usagesCount; i++) {
		if($("#usage-" + i).is(':visible')) {
			newSynset.usages.push($("#usage-" + i + "-input").val());
		} else {
			newSynset.usages.push("");
		}
	}
	for(i = 0; i < synonymsCount; i++) {
		if($("#synonym-" + i).is(':visible')) {
			syn = {
				"literal": $("#synonym-" + i + "-literal-input").val(),
				"sense": $("#synonym-" + i + "-sense-input").val(),
				"lnote": $("#synonym-" + i + "-lnote-input").val()
			};
			newSynset.synonyms.push(syn);
		} else {
			newSynset.usages.push("");
		}
	}
	for(i = 0; i < relationsCount; i++) {
		if($("#relation-" + i).is(':visible')) {
			inputData = $("#relation-" + i + "-pwn").data();
			inputData["type"] = $("#relation-" + i + "-type").val();
			if(inputData["type"] == undefined) {
				inputData["type"] = "";
			}
			
			newSynset.relations.push(inputData);
		} else {
			newSynset.usages.push("");
		}
	}

	diff = compareSynsets(synset, newSynset);

	if(diff.length > 0) {
		var access = dicts[dictionary].access;
		//if(access == "r") {
			var usermeta = {
        		"email": $("#email-input").val(),
        		"role": "ROLE_USER",
        		"name": user.name
    		}

			var meta = {
				"edit_name": $("#editform-card-title").html(),
				"dictionary": dicts[dictionary].code,
				"ili": "",
				"pwn_id": synsetPWN,
				"edited_by": usermeta,
				"actions": diff
			};

			post = JSON.stringify(meta);
			$.post(
    	    	reportServerAddress + "/create_edit/",
        		post
    		).done(function(msg) {
    			alert("Synset reported!");
    			changeRightCard($("#editform-start"));
    			reloadAlert = false;
    		}).fail(function(msg) {
    			alert(localize("report-server-error"));
    		});
		/*
		} else {
			xml = applyActions(synsetXML, diff);
			changeRightCard($("#editform-start"));
		}*/
	} else {
		$("#errors-no-edits").show();
	}
	
}

function changeRightCard(newCard) {
	hideAndShow(activeRightCard, newCard);
	activeRightCard = newCard;
}

function hideAndShow(hide, reveal) {
  	hide.hide();
  	reveal.show();
}

function reset() {
	$("#definition a").removeClass("btn btn-primary");
	$("#domain a").removeClass("btn btn-primary");
	$("#sumo a").removeClass("btn btn-primary");
	$("#sumo-type a").removeClass("btn btn-primary");
	$("#editform input:text").off("change");
	//$("#editform-card-title").html("");
	usagesCount = 0;
	$("#usages").children().each(function(i) {
		if(i > 0) {
			this.remove();
		}
	});
	synonymsCount = 0;
	$("#synonyms").children().each(function(i) {
		if(i > 0) {
			this.remove();
		}
	});
	relationsCount = 0;
	$("#relations").children().each(function(i) {
		if(i > 0) {
			this.remove();
		}
	});
}

function getRelationOptions(selected) {
	optionsHTML = "";
	for (i = 0; i < relationsSelectOptions[dictionary].length; i++) {
		opt = relationsSelectOptions[dictionary][i];
		if(opt == "") {
			if(selected != "") {
				optionsHTML += "<option value=''>" + localize("relation-selectbox-remove") + "</option>";
			} else {
				optionsHTML += "<option value='' disabled selected>" + localize("relation-selectbox-do-selection") + "</option>";
			}
		} else {
			if(opt == selected) {
				optionsHTML += "<option value='" + opt + "' selected>" + opt + "</option>";
			} else {
				optionsHTML += "<option value='" + opt + "'>" + opt + "</option>";
			}
			
		}
	}
	return optionsHTML;
}

function registerDeleteHandler(node) {
	node.click(function() {
		if(confirm(localize("delete-question"))) {
			var parentId = $(this).attr('id').replace("-delete", "");
			$("#" + parentId).hide();
		}		
	});
}

function inputChangeHandler() {
	if($(this).attr("origvalue") == this.value) {
		$(this).removeClass("input-edited");
	} else {
		$(this).addClass("input-edited");
	}
}

function closeWindow() {
	if(confirm(localize("cancel-question"))) {
		window.close();
	}
}

window.onbeforeunload = function () {
    if (reloadAlert) {
        return localize("cancel-question");
    } else {
        return null;
    }
}
var synsetPWN;
var dictionary = "wneng2";
var user;

var synsetXML; //Synset XML
var synset;

var cardTitleHTML = "{content} <span class='badge badge-default'>{pos}</span></h3>";
var usagesHTML = "<div id='{id}' class='row stacked-input'><div class='control-label col reveal'><a href='javascript:void(0)'>{content}</a></div><div class='row col'><div class='col'><input id='{id}-input' class='form-control' type='text' placeholder='Enter usage' value='{content}'></div><div class='col-1'><a id='{id}-delete' class='delete btn btn-danger' href='javascript:void(0)'><img src='../../img/delete.png'></a></div></div></div>";
var usagesCount = 0;
var synonymsHTML = "<div id='{id}' class='row stacked-input'><div class='control-label col reveal'><a href='javascript:void(0)'><span>{literal}</span> <span>{sense}</span> <span>{lnote}</span></a></div><div class='row col'><div class='col'><input id='{id}-literal-input' type='text' class='form-control' placeholder='Enter literal' value='{literal}'></div><div class='col'><input id='{id}-sense-input' type='text' class='form-control' placeholder='Enter sense' value='{sense}'></div><div class='col'><input id='{id}-lnote-input' type='text' class='form-control' placeholder='Enter lnote' value='{lnote}'></div><div class='col-1'><a id='{id}-delete' class='delete btn btn-danger' href='javascript:void(0)'><img src='../../img/delete.png'></a></div></div></div>";
var synonymsCount = 0;
var relationsHTML = "<div id='{id}' class='row stacked-input'><div class='control-label col reveal'><a href='javascript:void(0)'>{content}</a></div><div class='row col'><div class='col'><input id='{id}-pwn' type='text' class='form-control' placeholder='Enter suggested Princeton Wordnet ID' value='{pwn}'></div><div class='col'><select id='{id}-type' class='form-control' type='text'></select></div><div class='col-1'><a id='{id}-delete' class='delete btn btn-danger' href='javascript:void(0)'><img src='../../img/delete.png'></a></div></div></div>";
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
       	url: serverAddress + "/" + "doc?action=connect"
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
			if(dictionary) {
				$("#dictionaries-select").val(dictionary);
				$("#dictionaries-select").change();
			}

			$("#editform input:text").change(inputChangeHandler);

			$("#definition a").click(function() {
				hideAndShow($("#definition a"), $("#definition input"));
			});
			$("#domain a").click(function() {
				hideAndShow($("#domain a"), $("#domain input"));
			});
			$("#sumo a").click(function() {
				hideAndShow($("#sumo a"), $("#sumo input"));
			});
			$("#sumo-type a").click(function() {
				hideAndShow($("#sumo-type a"), $("#sumo-type input"));
			});
			$( "#usage-add a" ).click(function() {
				insertUsage($("#usages"), "", false);
			});
			$( "#synonym-add a" ).click(function() {
				insertSynonym($("#synonyms"), "", "", "", false);
			});
			$( "#relation-add a" ).click(function() {
				insertRelation($("#relations"), {"$": "", "@link": "", "@type": ""}, false);
			});

			$("#btn-cancel").click(function() {
				if (revertEdits()) {
					reset();
					changeRightCard($("#editform-start"));
				}
			});

			$("#btn-submit").click(function(e) {
				e.preventDefault();
				saveEdits();
				return true;
			});

			$("#btn-select").click(function(e) {
				e.preventDefault();
				if (revertEdits()) {
					onPWNchange();
				}
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
	synsetPWN = $("#pwn-input").data()["@link"];
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
   				if (typeof msg === "string" || msg instanceof String) {
   					synsetXML = msg;
					parseXML();
					changeRightCard($("#editform"));
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
	synset = xmlToJSON(synsetXML).SYNSET;

	//Title
	var title = "";

	for (i = 0; i < synset.SYNONYM.LITERAL.length; i++) {
		try{ title += synset.SYNONYM.LITERAL[i].$ + ", "; } catch(e) {}
	}
	title = title.substring(0, title.length - 2);

	title = cardTitleHTML.replace(/{content}/gi, title);
	title = title.replace(/{pos}/gi, "[" + synset.POS.$ + "]");
	$("#editform-card-title").html(title.capitalize());
	//Basic info

	//Definition
	hideAndShow($("#definition input"), $("#definition a"));
	if ("$" in synset.DEF && synset.DEF.$ != "") {
		$("#definition a").html(synset.DEF.$);
		$("#definition input").val(synset.DEF.$);
	} else {
		$("#definition a").html("Add");
		$("#definition a").addClass("btn btn-primary");
		$("#definition input").val("");
	}
	$("#definition input").attr("origvalue", $("#definition input").val());

	//Domain
	hideAndShow($("#domain input"), $("#domain a"));
	if("$" in synset.DOMAIN && synset.DOMAIN.$ != "") {
		$("#domain a").html(synset.DOMAIN.$);
		$("#domain input").val(synset.DOMAIN.$);
	} else {
		$("#domain a").html("Add");
		$("#domain a").addClass("btn btn-primary");
		$("#domain input").val("");
	}
	$("#domain input").attr("origvalue", $("#domain input").val());

	//Sumo + type
	hideAndShow($("#sumo input"), $("#sumo a"));
	if("$" in synset.SUMO && synset.SUMO.$ != "") {
		$("#sumo a").html(synset.SUMO.$);
		$("#sumo input").val(synset.SUMO.$);
	} else {
		$("#sumo a").html("Add");
		$("#sumo a").addClass("btn btn-primary");
		$("#sumo input").val("");
	}
	$("#sumo input").attr("origvalue", $("#sumo input").val());


	hideAndShow($("#sumo-type input"), $("#sumo-type a"));
	if("@type" in synset.SUMO && synset.SUMO["@type"] != "") {
		$("#sumo-type a").html(synset.SUMO["@type"]);
		$("#sumo-type input").val(synset.SUMO["@type"]);
	} else {
		$("#sumo-type a").html("Add");
		$("#sumo-type a").addClass("btn btn-primary");
		$("#sumo-type input").val("");
	}
	$("#sumo-type input").attr("origvalue", $("#sumo-type input").val());

	//Usages
	for (i = 0; i < synset.USAGE.length; i++) {
		insertUsage($("#usages"), synset.USAGE[i].$, true);
	}

	//Synonyms
	for (i = 0; i < synset.SYNONYM.LITERAL.length; i++) {
		syn = synset.SYNONYM.LITERAL[i];
		insertSynonym($("#synonyms"), syn.$, syn["@sense"], syn["@lnote"], true);
	}

	//Relations
	for (j = 0; j < synset.ILR.length; j++) {
		rel = synset.ILR[j];
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
			hideAndShow($(this), $(this).next());
		});
		reveal.next().hide();
	} else {
		reveal.hide();
	}

	inserted.find("input:text").each(function(i) {
		input = $(this);
		input.change(inputChangeHandler);
		input.attr("origvalue", input.val());
	});
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
			hideAndShow($(this), $(this).next());
		});
		reveal.next().hide();
	} else {
		reveal.hide();
	}

	inserted.find("input:text").each(function(i) {
		input = $(this);
		input.change(inputChangeHandler);
		input.attr("origvalue", input.val());
	});
	registerDeleteHandler(inserted.find(".delete"));
}

function insertRelation(node, relation, preview) {
	var id = "relation-" + relationsCount;
	relationsCount++;
	var html = relationsHTML;
	html = html.replace(/{id}/gi, id);
	content = relation["@link"];
	if(relation.$ != "") {
		content += ": ";
		content += "[" + relation["@link"].slice(-1) + "] " + relation.$;
	}

	html = html.replace(/{content}/gi, content); //Label
	html = html.replace(/{pwn}/gi, content); //Input content

	var inserted = node.append(html).find("#" + id);
	var PWNinput = inserted.find("#" + id + "-pwn");
	PWNinput.data(relation)
	var reveal = inserted.find(".reveal");
	if(preview) {
		reveal.click(function() {
			hideAndShow($(this), $(this).next());
		});
		reveal.next().hide();
	} else {
		reveal.hide();
	}

	inserted.find("input:text").each(function(i) {
		input = $(this);
		input.change(inputChangeHandler);
		input.attr("origvalue", input.val());
	});
	setSearchAutocomplete($("#" + id + "-pwn"), dicts[dictionary].code);
	setRelationOptions($("#" + id + "-type"), relationsSelectOptions[dictionary], relation["@type"]);
	registerDeleteHandler(inserted.find(".delete"));
}

function getNewSynset() {
	var obj = getBlankSynset();
	newSynset = obj.SYNSET;
	newSynset.ID = synset.ID;
	newSynset.POS = synset.POS;
	newSynset.DOMAIN = {"$": $("#domain-input").val()};
	newSynset.SUMO = {"$": $("#sumo-input").val(), "@type": $("#sumo-type-input").val()};
	newSynset.DEF = {"$": $("#definition-input").val()};
	for(i = 0; i < usagesCount; i++) {
		if($("#usage-" + i).is(":visible")) {
			newSynset.USAGE.push($("#usage-" + i + "-input").val());
		} else {
			newSynset.USAGE.push("");
		}
	}
	for(i = 0; i < synonymsCount; i++) {
		if($("#synonym-" + i).is(":visible")) {
			newSynset.SYNONYM.LITERAL.push({
				"$": $("#synonym-" + i + "-literal-input").val(),
				"@sense": $("#synonym-" + i + "-sense-input").val(),
				"@lnote": $("#synonym-" + i + "-lnote-input").val()
			});
		} else {
			newSynset.SYNONYM.LITERAL.push({
				"$": "",
				"@sense": "",
				"@lnote":""
			});
		}
	}
	for(i = 0; i < relationsCount; i++) {
		if($("#relation-" + i).is(':visible')) {
			inputData = $("#relation-" + i + "-pwn").data();
			inputData["@type"] = $("#relation-" + i + "-type").val();
			if(inputData["@type"] == undefined) {
				inputData["@type"] = "";
			}
			newSynset.ILR.push(inputData);
		} else {
			newSynset.ILR.push({"$":"", "@type": "", "@link": ""});
		}
	}
	return newSynset;
}

function saveEdits() {
	newSynset = getNewSynset();
	diff = compareSynsets(synset, newSynset);
	if(diff.length > 0) {
		deffer = showComparement($("#diff-overview"), diff);
		deffer.done(function (result) {
			if(result=="submit") {
				submit(diff);
			}
		});
	} else {
		$("#errors-no-edits").show();
	}

}

function submit(diff) {
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
   			alert(localize("report-server-ok"));
   			reset();
   			changeRightCard($("#editform-start"));
   		}).fail(function(msg) {
   			alert(localize("report-server-error"));
   		});
   	/*
	} else {
		xml = applyActions(synsetXML, diff);
		changeRightCard($("#editform-start"));
	}*/
}

function reset() {
	$("#definition a").removeClass("btn btn-primary");
	$("#domain a").removeClass("btn btn-primary");
	$("#sumo a").removeClass("btn btn-primary");
	$("#sumo-type a").removeClass("btn btn-primary");
	$(".input-edited").removeClass("input-edited");
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

function registerDeleteHandler(node) {
	node.click(function() {
		if(confirm(localize("delete-question"))) {
			var parentId = $(this).attr("id").replace("-delete", "");
			$("#" + parentId).hide();
		}
	});
}

function closeWindow() {
	if(confirm(localize("cancel-question"))) {
		window.close();
	}
}

window.onbeforeunload = function () {
    if ($(".input-edited").length > 0) {
        return localize("cancel-question");
    } else {
        return null;
    }
}

function revertEdits() {
	if ($(".input-edited").length > 0) {
        if(confirm(localize("cancel-question"))) {
        	return true;
        }
        return false;
    } else {
    	return true;
    }
}
function getXMLDom(xml) {
	parser = new DOMParser();
	return parser.parseFromString(xml,"text/xml");
}

function xmlToJSON(xml) {
	dom = getXMLDom(xml);
	var obj = getBlankSynset();
    var synset = obj["SYNSET"];

    e = $(dom).xpath("//ID");
    if(e.length > 0) {
    	synset["ID"] = {"$": $(e[0]).text()};
    }
    e = $(dom).xpath("//ILI");
    if(e.length > 0) {
    	synset["ILI"] = {"$": $(e[0]).text()};
    }
    e = $(dom).xpath("//DOMAIN");
    if(e.length > 0) {
    	synset["DOMAIN"] = {"$": $(e[0]).text()};
    }
    e = $(dom).xpath("//SUMO");
    if(e.length > 0) {
    	synset["SUMO"] = {"$": $(e[0]).text()};
    }
    e = $(dom).xpath("//SUMO/@type");
    if(e.length > 0) {
    	synset["SUMO"]["@type"] = e[0].textContent;
    } else {
    	synset["SUMO"]["@type"] = "";
    }
    e = $(dom).xpath("//POS");
    if(e.length > 0) {
    	synset["POS"] = {"$": $(e[0]).text()};
    }
    e = $(dom).xpath("//NL");
    if(e.length > 0) {
    	synset["NL"] = {"$": $(e[0]).text()};
    }
    e = $(dom).xpath("//LITERAL");
    if(e.length > 0) {
    	for(i = 0; i < e.length; i++) {
    		literal = $(e[i]);
    		sense = literal.attr("sense") ? literal.attr("sense") : "";
    		lnote = literal.attr("lnote") ? literal.attr("lnote") : "";
    		literal = literal.text();
    		synset["SYNONYM"]["LITERAL"].push({
                           '$': literal,
                           '@sense': sense,
                           '@lnote': lnote
                        });
    	}
    }
    e = $(dom).xpath("//DEF");
    if(e.length > 0) {
    	synset["DEF"] = {"$": $(e).text()};
    }
    e = $(dom).xpath("//USAGE");
    if(e.length > 0) {
    	for(i = 0; i < e.length; i++){
    		synset["USAGE"].push({
                 '$': $(e[i]).text(),
             });
    	}
    }

    e = $(dom).xpath("//ILR");
    if(e.length > 0) {
    	for(i = 0; i < e.length; i++){
    		synset["ILR"].push({
                 '$': e[i].textContent,
                 '@link': $(e[i]).attr("link"),
                 '@type': $(e[i]).attr("type")
             });
    	}
    }
    
    e = $(dom).xpath("//SNOTE");
    for(i = 0; i < e.length; i++){
    	var val = $(e[i]).text();
    	if(typeof val === 'undefined') continue;
    	synset["SNOTE"].push({
            '$': val
        });
  	}

  	e = $(dom).xpath("//VALENCY");
    for(i = 0; i < e.length; i++){
    	valency = $(e[i]);
    	appendedVal = {
      		'FRAME': []
    	};
    	frames = valency[0].childNodes;
    	for(j = 0; j < frames.length; j++) {
    		frame = frames[j];
    		if(typeof frame === 'undefined' || frame.nodeType === 3) continue;
			appendedVal["FRAME"].push({
            	'$': frame.textContent
        	});
    	}
    	synset["VALENCY"].push(appendedVal);
  	}
  synset["STAMP"] = $(dom).xpath("//STAMP").text() ? {"$" : $(dom).xpath("//STAMP").text()} : {};
  synset["BCS"] = $(dom).xpath("//BCS").text() ? {"$" : $(dom).xpath("//BCS").text()} : {};
  return obj;
}

function compareSynsets(oldSynset, newSynset) {
	diffs = [];
	if(oldSynset.POS.$ != newSynset.POS.$) {
		diff = {"edit_value": newSynset.POS.$, "edit_value_old": oldSynset.POS.$, "field_of_edit": "position", "edit_status": 0};
		diff["edit_type"] = resolveEditType(oldSynset.POS.$, newSynset.POS.$);
		if(diff["edit_type"] == 0) {
			diff["edit_xpath"] = "/SYNSET";
		} else {
			diff["edit_xpath"] = "/SYNSET/POS";
		}
		diffs.push(diff);
	}
	if(oldSynset.DEF.$ != newSynset.DEF.$) {
		diff = {"edit_value": newSynset.DEF.$, "edit_value_old": oldSynset.DEF.$, "field_of_edit": "definition", "edit_status": 0, "edit_xpath": "/SYNSET/DEF"};
		diff["edit_type"] = resolveEditType(oldSynset.DEF.$, newSynset.DEF.$);
		if(diff["edit_type"] == 0) {
			diff["edit_xpath"] = "/SYNSET";
		} else {
			diff["edit_xpath"] = "/SYNSET/DEF";
		}
		diffs.push(diff);
	}
	if(oldSynset.DOMAIN.$ != newSynset.DOMAIN.$) {
		diff = {"edit_value": newSynset.DOMAIN.$, "edit_value_old": oldSynset.DOMAIN.$, "field_of_edit": "domain", "edit_status": 0, "edit_xpath": "/SYNSET/DOMAIN"};
		diff["edit_type"] = resolveEditType(oldSynset.DOMAIN.$, newSynset.DOMAIN.$);
		if(diff["edit_type"] == 0) {
			diff["edit_xpath"] = "/SYNSET";
		} else {
			diff["edit_xpath"] = "/SYNSET/DOMAIN";
		}
		diffs.push(diff);
	}
	if(oldSynset.SUMO.$ != newSynset.SUMO.$) {
		diff = {"edit_value": newSynset.SUMO.$, "edit_value_old": oldSynset.SUMO.$, "field_of_edit": "sumo", "edit_status": 0, "edit_xpath": "/SYNSET/SUMO"};
		diff["edit_type"] = resolveEditType(oldSynset.SUMO.$, newSynset.SUMO.$);
		if(diff["edit_type"] == 0) {
			diff["edit_xpath"] = "/SYNSET";
		} else {
			diff["edit_xpath"] = "/SYNSET/SUMO";
		}
		diffs.push(diff);
	}
	if(oldSynset.SUMO["@type"] != newSynset.SUMO["@type"]) {
		diff = {"edit_value": newSynset.SUMO["@type"], "edit_value_old": oldSynset.SUMO["@type"], "field_of_edit": "type@sumo", "edit_status": 0, "edit_xpath": "/SYNSET/SUMO/@type"};
		diff["edit_type"] = resolveEditType(oldSynset.SUMO["@type"], newSynset.SUMO["@type"]);
		if(diff["edit_type"] == 0) {
			diff["edit_xpath"] = "/SYNSET";
		} else {
			diff["edit_xpath"] = "/SYNSET/SUMO/@type";
		}
		diffs.push(diff);
	}
	for(i = 0; i < Math.max(oldSynset.USAGE.length, newSynset.USAGE.length); i++) {
		oldUsage = oldSynset.USAGE[i];
		if(!oldUsage) {
			oldUsage = "";
		}
		newUsage = newSynset.USAGE[i];
		if(!newUsage) {
			newUsage = "";
		}
		if(oldUsage != newUsage) {
			diff = {"edit_value": "<USAGE>" + newUsage + "</USAGE>", "edit_value_old": "<USAGE>" + oldUsage + "</USAGE>", "field_of_edit": "usage", "edit_status": 0};
			diff["edit_type"] = resolveEditType(oldUsage, newUsage);
			if(diff["edit_type"] != 0) {
				diff["edit_xpath"] = "/SYNSET/USAGE[text()='" + oldUsage + "']";
			} else {
				diff["edit_xpath"] = "/SYNSET";
			}
			diffs.push(diff);
		}
	}
	for(i = 0; i < Math.max(oldSynset.SYNONYM.LITERAL.length, newSynset.SYNONYM.LITERAL.length); i++) {
		oldSyn = oldSynset.SYNONYM.LITERAL[i];
		if(!oldSyn) {
			oldSyn = {"$": "", "@sense": "", "@lnote": ""};
		}
		
		newSyn = newSynset.SYNONYM.LITERAL[i];
		if(!newSyn) {
			newSyn = {"$": "", "@sense": "", "@lnote": ""};
		}
		if(oldSyn.$ != newSyn.$ || oldSyn["@sense"] != newSyn["@sense"] || oldSyn["@lnote"] != newSyn["@lnote"]) {
			diff = {
				"edit_value": "<LITERAL sense='" + newSyn["@sense"] + "' lnote='" + newSyn["@lnote"] + "'>" + newSyn.$ + "</LITERAL>",
				"edit_value_old": "<LITERAL sense='" + oldSyn["@sense"] + "' lnote='" + oldSyn["@lnote"] + "'>" + oldSyn.$ + "</LITERAL>",
				"field_of_edit": "synonym",
				"edit_status": 0
			};
			if(oldSyn["@sense"] == "" && oldSyn["@lnote"] == "" && oldSyn.$ == "") {
				diff["edit_type"] = 0;
			} else if(newSyn["@sense"] == "" && newSyn["@lnote"] == "" && newSyn.$ == "") {
				diff["edit_type"] = 2;
			} else {
				diff["edit_type"] = 1;
			}
			
			if(diff["edit_type"] != 0) {
				diff["edit_xpath"] = "/SYNSET/SYNONYM/LITERAL[@sense='" + oldSyn["@sense"] + "' and text()='" + oldSyn.$ + "']";
			} else {
				diff["edit_xpath"] = "/SYNSET/SYNONYM";
			}
			diffs.push(diff);
		}
	}
	for(i = 0; i < Math.max(oldSynset.ILR.length, newSynset.ILR.length); i++) {
		oldRel = oldSynset.ILR[i];
		if(!oldRel) {
			oldRel = {"$": "", "@link": "", "@type": ""};
		}
		
		newRel = newSynset.ILR[i];
		if(!newRel) {
			newRel = {"$": "", "@link": "", "@type": ""};
		}
		if(oldRel["@link"] == "" && newRel["@link"] == "") {
			continue;
		}
		if(oldRel.$ != newRel.$ || oldRel["@type"] != newRel["@type"] || oldRel["@link"] != newRel["@link"]) {
			diff = {
				"edit_value": "<ILR type='" + newRel["@type"] + "' link='" + newRel["@link"] + "'>" + newRel.$ + "</ILR>",
				"edit_value_old": "<ILR type='" + oldRel["@type"] + "' link='" + oldRel["@link"] + "'>" + oldRel.$ + "</ILR>",
				"field_of_edit": "relation",
				"edit_status": 0
				};
			if(oldRel.$ == "" && oldRel["@type"] == "" && oldRel["@link"] == "") {
				diff["edit_type"] = 0;
			} else if(newRel["@type"] == "" && newRel.$ == "" && newRel["@link"] == "") {
				diff["edit_type"] = 2;
			} else {
				diff["edit_type"] = 1;
			}
			if(diff["edit_type"] != 0) {
				diff["edit_xpath"] = "/SYNSET/ILR[@type='" + oldRel["@type"] + "' and @link='" + oldRel["@link"] + "']";
			} else {
				diff["edit_xpath"] = "/SYNSET";
			}
			diffs.push(diff);
		}
	}
	return diffs;
}
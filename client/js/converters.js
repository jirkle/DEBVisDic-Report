function getXMLDom(xml) {
	parser = new DOMParser();
	return parser.parseFromString(xml,"text/xml");
}

function getSynsetFromXML(xml) {
	s = getXMLDom(xml);
	var synset = {};
	try {	
		synset.synonyms = s.evaluate('//LITERAL', s, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
	} catch(e) {}
	try {	
		synset.relations = s.evaluate('//ILR', s, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
	} catch(e) {}

	try { synset.pwn = s.getElementsByTagName("ID")[0].textContent; } catch(e) { synset.pwn = ""; }
	try { synset.pos = s.getElementsByTagName("POS")[0].textContent; } catch(e) { synset.pos = ""; }
	try { synset.domain = s.getElementsByTagName("DOMAIN")[0].textContent; } catch(e) { synset.domain = ""; }
	try { synset.sumo = s.getElementsByTagName("SUMO")[0].textContent; } catch(e) { synset.sumo = ""; }
	try { synset.sumoType = s.getElementsByTagName("SUMO")[0].attributes.getNamedItem("type").textContent; } catch(e) { synset.sumoType = ""; }
	try { synset.definition = s.getElementsByTagName("DEF")[0].textContent; } catch(e) { synset.definition = ""; }
	try { synset.usages = s.getElementsByTagName("USAGE"); } catch(e) { synset.usages = new Array(); }
	try { synset.synonyms = s.getElementsByTagName("LITERAL"); } catch(e) { synset.synonyms = new Array(); }
	try { synset.relations = s.getElementsByTagName("ILR"); } catch(e) { synset.relations = new Array(); }
	var usages = new Array();
	for (i = 0; i < synset.usages.length; i++) {
		try { usage = synset.usages[i].childNodes[0].textContent; } catch(e) { usage = "";}
		usages.push(usage);
	}
	synset.usages = usages;

	var synonyms = new Array();
	for (i = 0; i < synset.synonyms.length; i++) {
		syn = synset.synonyms[i];
		try{ literal = syn.textContent; } catch(e) { literal = ""; }
		try{ sense = syn.attributes.getNamedItem("sense").textContent;} catch(e) { sense = ""; }
		try{ lnote = syn.attributes.getNamedItem("lnote").textContent;} catch(e) { lnote = ""; }

		synonyms.push({"literal": literal, "sense": sense, "lnote": lnote});
	}
	synset.synonyms = synonyms;

	var relations = new Array();
	for (i = 0; i < synset.relations.length; i++) {
		rel = synset.relations[i];
		try{ content = rel.firstChild.textContent; } catch(e) { content = "Broken link!"; }
		try{ pwn = rel.attributes.getNamedItem("link").textContent; } catch(e) { pwn = ""; }
		try{ selectedType = rel.attributes.getNamedItem("type").textContent; } catch(e) { selectedType = ""; }
		relations.push({"label": pwn + ":" + content, "pwn_id": pwn, "type": selectedType, "content": content});
	}
	synset.relations = relations;

	return synset;
}

function compareSynsets(oldSynset, newSynset) {
	diffs = [];
	if(oldSynset.pos != newSynset.pos) {
		diff = {"edit_value": newSynset.pos, "field_of_edit": "position", "edit_status": 0};
		diff["edit_type"] = resolveEditType(oldSynset.pos, newSynset.pos);
		if(diff["edit_type"] == 0) {
			diff["edit_xpath"] = "/SYNSET";
		} else {
			diff["edit_xpath"] = "/SYNSET/POS";
		}
		diffs.push(diff);
	}
	if(oldSynset.definition != newSynset.definition) {
		diff = {"edit_value": newSynset.definition, "field_of_edit": "definition", "edit_status": 0, "edit_xpath": "/SYNSET/DEF"};
		diff["edit_type"] = resolveEditType(oldSynset.definition, newSynset.definition);
		if(diff["edit_type"] == 0) {
			diff["edit_xpath"] = "/SYNSET";
		} else {
			diff["edit_xpath"] = "/SYNSET/DEF";
		}
		diffs.push(diff);
	}
	if(oldSynset.domain != newSynset.domain) {
		diff = {"edit_value": newSynset.domain, "field_of_edit": "domain", "edit_status": 0, "edit_xpath": "/SYNSET/DOMAIN"};
		diff["edit_type"] = resolveEditType(oldSynset.domain, newSynset.domain);
		if(diff["edit_type"] == 0) {
			diff["edit_xpath"] = "/SYNSET";
		} else {
			diff["edit_xpath"] = "/SYNSET/DOMAIN";
		}
		diffs.push(diff);
	}
	if(oldSynset.sumo != newSynset.sumo) {
		diff = {"edit_value": newSynset.sumo, "field_of_edit": "sumo", "edit_status": 0, "edit_xpath": "/SYNSET/SUMO"};
		diff["edit_type"] = resolveEditType(oldSynset.sumo, newSynset.sumo);
		if(diff["edit_type"] == 0) {
			diff["edit_xpath"] = "/SYNSET";
		} else {
			diff["edit_xpath"] = "/SYNSET/SUMO";
		}
		diffs.push(diff);
	}
	if(oldSynset.sumoType != newSynset.sumoType) {
		diff = {"edit_value": newSynset.sumoType, "field_of_edit": "type@sumo", "edit_status": 0, "edit_xpath": "/SYNSET/SUMO/@type"};
		diff["edit_type"] = resolveEditType(oldSynset.sumoType, newSynset.sumoType);
		if(diff["edit_type"] == 0) {
			diff["edit_xpath"] = "/SYNSET";
		} else {
			diff["edit_xpath"] = "/SYNSET/SUMO/@type";
		}
		diffs.push(diff);
	}
	for(i = 0; i < Math.max(oldSynset.usages.length, newSynset.usages.length); i++) {
		oldUsage = oldSynset.usages[i];
		if(!oldUsage) {
			oldUsage = "";
		}
		newUsage = newSynset.usages[i];
		if(!newUsage) {
			newUsage = "";
		}
		if(oldUsage != newUsage) {
			diff = {"edit_value": "<USAGE>" + newUsage + "</USAGE>", "field_of_edit": "usage", "edit_status": 0};
			diff["edit_type"] = resolveEditType(oldUsage, newUsage);
			if(diff["edit_type"] != 0) {
				diff["edit_xpath"] = "/SYNSET/USAGE[text()='" + oldUsage + "']";
			} else {
				diff["edit_xpath"] = "/SYNSET";
			}
			diffs.push(diff);
		}
	}
	for(i = 0; i < Math.max(oldSynset.synonyms.length, newSynset.synonyms.length); i++) {
		oldSyn = oldSynset.synonyms[i];
		if(!oldSyn) {
			oldSyn = {"literal": "", "sense": "", "lnote": ""};
		}
		
		newSyn = newSynset.synonyms[i];
		if(!newSyn) {
			newSyn = {"literal": "", "sense": "", "lnote": ""};
		}
		if(oldSyn.literal != newSyn.literal || oldSyn.sense != newSyn.sense || oldSyn.lnote != newSyn.lnote) {
			diff = {"edit_value": "<LITERAL sense='" + newSyn.sense + "' lnote='" + newSyn.lnote + "'>" + newSyn.literal + "</LITERAL>", "field_of_edit": "synonym", "edit_status": 0};
			if(oldSyn.sense == "" && oldSyn.lnote == "" && oldSyn.literal == "") {
				diff["edit_type"] = 0;
			} else if(newSyn.sense == "" && newSyn.lnote == "" && newSyn.literal == "") {
				diff["edit_type"] = 2;
			} else {
				diff["edit_type"] = 1;
			}
			
			if(diff["edit_type"] != 0) {
				diff["edit_xpath"] = "/SYNSET/SYNONYM/LITERAL[@sense='" + oldSyn.sense + "' and text()='" + oldSyn.literal + "']";
			} else {
				diff["edit_xpath"] = "/SYNSET/SYNONYM";
			}
			diffs.push(diff);
		}
	}
	for(i = 0; i < Math.max(oldSynset.relations.length, newSynset.relations.length); i++) {
		oldRel = oldSynset.relations[i];
		if(!oldRel) {
			oldRel = {"type": "", "label": "", "pwn_id": ""};
		}
		
		newRel = newSynset.relations[i];
		if(!newRel) {
			newRel = {"type": "", "label": "", "pwn_id": ""};
		}
		if(oldRel.type != newRel.type|| oldRel.label != newRel.label || oldRel.pwn_id != newRel.pwn_id) {
			diff = {
				"edit_value": "<ILR type='" + newRel.type + "' link='" + newRel.pwn_id + "'>" + newRel.label + "</ILR>",
				"field_of_edit": "relation",
				"edit_status": 0
				};
			if(oldRel.type == "" && oldRel.label == "" && oldRel.pwn_id == "") {
				diff["edit_type"] = 0;
			} else if(newRel.type == "" && newRel.label == "" && newRel.pwn_id == "") {
				diff["edit_type"] = 2;
			} else {
				diff["edit_type"] = 1;
			}
			if(diff["edit_type"] != 0) {
				diff["edit_xpath"] = "/SYNSET/ILR[@type='" + oldRel.type + "' and @link='" + oldRel.pwn_id + "']";
			} else {
				diff["edit_xpath"] = "/SYNSET";
			}
			diffs.push(diff);
		}
	}
	return diffs;
}

function xmlToJSON(xml) {
	dom = getXMLDom(xml);
	var obj = {
		'SYNSET': {
			'ID': {},
			'ILI': {},
			'DOMAIN': {},
			'SUMO': {},
			'POS': {},
			'NL': {},
			'SYNONYM': {
				'LITERAL': [],
				'WORD': []
			},
			'DEF': {},
			'USAGE': [],
			'ILR': [],
			'SNOTE': [],
			'VALENCY': [],
			'STAMP': {},
			'BCS': {}
        }
    };
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
                 '$': $(e[i]).attr("link"),
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
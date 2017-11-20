row = "<div id='diff-overview-{id}' class='row'><div class='col-3 right-border'><div class='badge badge-primary'>{type}</div>{field}</div><div class='col-4 text-right'><img id='minoredit-info-{id}' class='info' src='img/info.png' style='display:none'><span id='minoredit-{id}-old' class='oldValue'>{old}</span></div><div class='col-1 text-center'> → </div><div class='col-4'><span id='minoredit-{id}-new' class='newValue'>{new}</span></div></div>"

function showComparement(node, oldXml, newXml) {
	oldSynset = xmlToJSON(oldXml).SYNSET;
	newSynset = xmlToJSON(newXml).SYNSET;
	diff = compareSynsets(oldSynset, newSynset);
	return showComparement(node, diff);
}

function showComparement(node, diff) {
	var defer = $.Deferred();
	node.css("display", "block");
	node.html("<div class='modal-content'><h3>" + localize("diff-overview-title") + ":</h3><div id='diff-overview-content'></div></div>");
	content = node.find("#diff-overview-content");
	$(diff).each(function(i) {
		id = "diff-overview-" + i;
		html = row;
		html = html.replace(/{id}/gi, i);
		html = html.replace(/{type}/gi, localize("edit-type-" + this["edit_type"]).capitalize());
		html = html.replace(/{field}/gi, localize(this["field_of_edit"]).capitalize());
		html = html.replace(/{old}/gi, this["edit_value_old"]);
		html = html.replace(/{new}/gi, this["edit_value"]);
		content.append(html)
	});
	buttons = node.find(".modal-content");
	buttons.append(
		"<div class='text-muted text-right'><a id='diff-overview-btn-cancel' class='btn btn-default' href='javascript:void(0)'>" +
		localize("btn-cancel").capitalize() +
		"</a><button id='diff-overview-btn-submit' type='submit' class='btn btn-primary'>" +
		localize("btn-save").capitalize() +
		"</button></div>");
	node.find("#diff-overview-btn-cancel").click(function() {
		defer.resolve("cancel");
		node.css("display", "none");
	});
	node.find("#diff-overview-btn-submit").click(function() {
		defer.resolve("submit");
		node.css("display", "none");
	});
    return defer.promise();
}
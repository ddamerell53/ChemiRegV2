var ChemiRegRoutes = $hxClasses["ChemiRegRoutes"] = function() {
	
};

ChemiRegRoutes.__name__ = ["ChemiRegRoutes"]

ChemiRegRoutes.fetch_compound = function(path, req, res, next, handle_function){
	var command = '_remote_provider_._data_request_objects_namedquery';

	var d = {};
	var json = {};

	if(Reflect.hasField(req.params, 'format') && req.params.format == 'svg'){
	    json.action = 'as_svg';
	    json.ctab_content = req.params.molblock;
	}

	d.queryId = 'saturn.db.provider.hooks.ExternalJsonHook:Fetch';
	
	d.parameters = haxe.Serializer.run([json]);

	handle_function(path,req, res, next, command, d);
};

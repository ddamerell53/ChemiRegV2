/**
 * File includes custom functions which transform simple RESTful arguments into the format 
 * expected by the underlying Socket.IO web-service layer.
 *
 * Note that routing configuration is defined in the ChemiReg service configuration file services/chemireg.json
 *
 */

var ChemiRegRoutes = $hxClasses["ChemiRegRoutes"] = function() {
	
};

ChemiRegRoutes.__name__ = ["ChemiRegRoutes"]

// fetch_compound returns to the caller a PNG or SVG representation of a MolBlock 
ChemiRegRoutes.fetch_compound = function(path, req, res, next, handle_function){
	var command = '_remote_provider_._data_request_objects_namedquery';

	var d = {};
	var json = {};

	if(Reflect.hasField(req.params, 'format') && req.params.format == 'svg'){
	    json.action = 'as_svg';
	    json.ctab_content = req.params.molblock;
	}else if(Reflect.hasField(req.params, 'format') && req.params.format == 'png'){
	    json.action = 'as_png';
	    json.ctab_content = req.params.molblock;
	}

	d.queryId = 'saturn.db.provider.hooks.ExternalJsonHook:Fetch';
	
	d.parameters = haxe.Serializer.run([json]);

	handle_function(path,req, res, next, command, d);
};

// save_changes inserts or updates compounds 
ChemiRegRoutes.save_compounds = function(path, req, res, next, handle_function){
	var command = '_remote_provider_._data_request_objects_namedquery';

	var d = {};
	var json = {};

	json.save_changes = JSON.parse(req.params.compounds);
	json._username =  null;
	json.project_name = req.params.project_name;

	d.queryId = 'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister';
	
	d.parameters = haxe.Serializer.run([json]);

	handle_function(path,req, res, next, command, d);
};

// delete_compounds deletes compounds from the database
// TODO: Support deleting multiple compounds at once (the underlying API doesn't support this yet)
ChemiRegRoutes.delete_compounds = function(path, req, res, next, handle_function){
	var command = '_remote_provider_._data_request_objects_namedquery';

	var d = {};
	var json = {};

	if(!Reflect.hasField(req.params,'id')){
		res.status(400);
		res.send('Object ID to delete is missing');
		next();
		return;
	}

	json.delete_compound = req.params.id
	json._username =  null;

	d.queryId = 'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister';
	
	d.parameters = haxe.Serializer.run([json]);

	handle_function(path,req, res, next, command, d);
};


ChemiRegRoutes.delete_compounds_by_field = function(path, req, res, next, handle_function){
	var command = '_remote_provider_._data_request_objects_namedquery';

	var d = {};
	var json = {};

    json._username =  null;
    json.project_name = req.params.project_name;
    json.field_name = req.params.field_name;
    json.field_value = req.params.field_value;

	d.queryId = 'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister';

	d.parameters = haxe.Serializer.run([json]);

	handle_function(path,req, res, next, command, d);
};


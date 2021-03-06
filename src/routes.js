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

ChemiRegRoutes.handle_invalid_request = function(msg, res, next){
    res.status(400);
    res.send(msg);
    next();
    return;
}

ChemiRegRoutes.error_on_field_missing = function(fields, req, res, next){
    for(var i=0;i<fields.length;i++){
        var field = fields[i];

        if(!Reflect.hasField(req.params, field)){
            ChemiRegRoutes.handle_invalid_request('Invalid request - ' + field + ' field missing', res, next);
            return true;
        }else{
            return false;
        }
    }
}

ChemiRegRoutes.error_on_field_empty = function(fields, req, res, next){
    for(var i=0;i<fields.length;i++){
        var field = fields[i];

        var value = Reflect.field(req.params, field);


        if(value == null || value == ''){
            ChemiRegRoutes.handle_invalid_request('Invalid request - ' + field + ' field is empty', res, next);
            return true;
        }else{
            return false;
        }
    }
}

// fetch_compound returns to the caller a PNG or SVG representation of a MolBlock 
ChemiRegRoutes.fetch_compound = function(path, req, res, next, handle_function){
	var command = '_remote_provider_._data_request_objects_namedquery';

	var d = {};
	var json = {};

	if(ChemiRegRoutes.error_on_field_missing(['molblock'], req, res, next)){
	    return;
	}

	if(ChemiRegRoutes.error_on_field_empty(['molblock'], req, res, next)){
	    return;
	}

	if(Reflect.hasField(req.params, 'format') && req.params.format == 'svg'){
	    json.action = 'as_svg';
	    json.ctab_content = req.params.molblock;
	}else if(Reflect.hasField(req.params, 'format') && req.params.format == 'png'){
	    json.action = 'as_png';
	    json.ctab_content = req.params.molblock;
	}else if(Reflect.hasField(req.params, 'format') && req.params.format == 'svg_link'){
	    json.action = 'as_svg_file';
	    json.ctab_content = req.params.molblock;
	}else if(Reflect.hasField(req.params, 'format') && req.params.format == 'png_link'){
	    json.action = 'as_png_file';
	    json.ctab_content = req.params.molblock;
	}else{
	    ChemiRegRoutes.handle_invalid_request('Invalid request', res, next);
    	    return;
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

	if(Reflect.hasField(req.params, 'compounds')){
	    if(ChemiRegRoutes.error_on_field_empty(['compounds'], req, res, next)){
            return;
        }

	    json.save_changes = JSON.parse(req.params.compounds);
	}else if(Reflect.hasField(req.params, 'upload_key')){
	    json.upload_key_sdf = req.params.upload_key;

	    if(ChemiRegRoutes.error_on_field_missing(['upload_defaults'], req, res, next)){
            return;
        }

        if(ChemiRegRoutes.error_on_field_missing(['upload_name'], req, res, next)){
            return;
        }

        if(ChemiRegRoutes.error_on_field_empty(['upload_defaults', 'upload_name'], req, res, next)){
            return;
        }

	    json.upload_defaults = JSON.parse(req.params.upload_defaults);
	    json.name = req.params.upload_name;
	}else{
	    ChemiRegRoutes.handle_invalid_request('Invalid request', res, next);

        return;
	}

	json._username =  null;

	if(ChemiRegRoutes.error_on_field_missing(['project_name'], req, res, next)){
        return;
    }

    if(ChemiRegRoutes.error_on_field_empty(['project_name'], req, res, next)){
        return;
    }

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

	if(ChemiRegRoutes.error_on_field_missing(['id'], req, res, next)){
        return;
    }

    if(ChemiRegRoutes.error_on_field_empty(['id'], req, res, next)){
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

    var required_fields = ['project_name', 'field_name', 'field_value'];

    if(ChemiRegRoutes.error_on_field_missing(required_fields, req, res, next)){
        return;
    }

    if(ChemiRegRoutes.error_on_field_empty(required_fields, req, res, next)){
        return;
    }

    json.project_name = req.params.project_name;
    json.field_name = req.params.field_name;
    json.field_value = req.params.field_value;
    json.delete_compound_by_field = true

	d.queryId = 'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister';

	d.parameters = haxe.Serializer.run([json]);

	handle_function(path,req, res, next, command, d);
};

ChemiRegRoutes.upload_file = function(path, req, res, next, handle_function){
	var command = '_remote_provider_._data_request_upload_file';

	//var d = {};
	var json = {};

    json._username =  null;

    var required_fields = ['contents'];

    if(ChemiRegRoutes.error_on_field_missing(required_fields, req, res, next)){
        return;
    }

    if(ChemiRegRoutes.error_on_field_empty(['contents'], req, res, next)){
        return;
    }

    json.file_identifier = req.params.upload_id;

    if(json.file_identifier == 'None'){
        json.file_identifier = null;
    }

    json.contents = req.params.contents;

	handle_function(path,req, res, next, command, json);
};

ChemiRegRoutes.find_entities = function(path, req, res, next, handle_function){
	var command = '_remote_provider_._data_request_objects_namedquery';

	var json = {};

	json._username =  null;
    json.action = 'search';

	if(Reflect.hasField(req.params, 'field_name')){
	    var fields = ['project_name', 'field_name', 'field_value'];

	    if(ChemiRegRoutes.error_on_field_missing(fields, req, res, next)){
            return;
        }

        if(ChemiRegRoutes.error_on_field_empty(fields, req, res, next)){
            return;
        }

        for(var i=0;i<fields.length;i++){
            var field = fields[i];

            Reflect.setField(json, field, Reflect.field(req.params, field));
        }

        json.task = 'fetch_by_field';
	}else if(Reflect.hasField(req.params, 'mol_block') || Reflect.hasField(req.params, 'smiles')){
		json.task = 'fetch';
		var required_fields = ['from_row', 'to_row', 'search_terms','project_name'];

		if(ChemiRegRoutes.error_on_field_missing(required_fields, req, res, next)){
			return;
		}

		if(ChemiRegRoutes.error_on_field_empty(required_fields, req, res, next)){
			return;
		}

		if(Reflect.hasField(req.params, 'smiles')){
			json.smiles = req.params.smiles;
			if(ChemiRegRoutes.error_on_field_empty(['smiles'], req, res, next)){
				return;
			}
		}else{
			json.ctab_content = req.params.mol_block;
			if(ChemiRegRoutes.error_on_field_empty(['mol_block'], req, res, next)){
				return;
			}
		}

		json.from_row = parseInt(req.params.from_row);
		json.to_row = parseInt(req.params.to_row);
		json.search_terms = req.params.search_terms;
		json.project = req.params.project_name;

		if(Reflect.hasField(req.params, 'sim_threshold')){
			json.sim_threshold = req.params.sim_threshold;
		}
	}else{
	    ChemiRegRoutes.handle_invalid_request('Invalid request', res, next);
            return;
	}

	var d = {};

 	d.queryId = 'saturn.db.provider.hooks.ExternalJsonHook:Fetch';

	d.parameters = haxe.Serializer.run([json]);

	console.log(json)

	handle_function(path,req, res, next, command, d);
}

ChemiRegRoutes.get_upload_file = function(path, req, res, next, handle_function){
	var command = '_remote_provider_._data_request_objects_namedquery';

	var json = {};

	json._username =  null;

	var required_fields = ['action','upload_id', 'project_name', 'limit']

	if(ChemiRegRoutes.error_on_field_missing(required_fields, req, res, next)){
        return;
    }

    if(ChemiRegRoutes.error_on_field_empty(required_fields, req, res, next)){
        return;
    }

    json.action = req.params.action;

	json.upload_key_sdf = req.params.upload_id;
	json.project_name = req.params.project_name;
	json.limit = parseInt(req.params.limit);

	var d = {};

    d.queryId = 'saturn.db.provider.hooks.ExternalJsonHook:Fetch';

	d.parameters = haxe.Serializer.run([json]);

	console.log(json)

	handle_function(path,req, res, next, command, d);
}


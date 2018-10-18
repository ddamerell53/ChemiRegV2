/* 
* ChemiReg - web-based compound registration platform
* Written in 2017 by David Damerell <david.damerell@sgc.ox.ac.uk>, Brian Marsden <brian.marsden@sgc.ox.ac.uk>
* 
* To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
* You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
*/

var structure_editor_type = 'Ketcher';
//var structure_editor_type = 'MolEdit';

var grid = null;
var compounds = [];
var current_fetch = null;

var query_params = {};
var query_page = 0;
var page_size = 10;
var query_row = page_size;
var query_size = 0;
var max_buttons =2;
var left_pages = [];
var right_pages = [];
var molViewer;
var msgIdToImage = new haxe.ds.StringMap();
var msgIdToFileName = new haxe.ds.StringMap();
var ctab_to_image = new haxe.ds.StringMap();
var unsaved_changes = new haxe.ds.StringMap();
var last_target = null;
var term_search_in_progress = false;
var last_search_term = null;
var ignore_reset = false;

var custom_fields = null;
var custom_fields_human_index = null;
var search_control = null;
var project_defs = null;

var entity_structure_to_update = null;
var entity_structure_to_update_btn = null;

var cached_entities = null;
var upload_defaults = null;
var insert_mode = false;
var upload_files = null;
var mapping_fields = new haxe.ds.StringMap();


var login_load = false;
var user_settings;

var cols_ordered = []; //leo
var row_index = -1;

function reset_paging_panel(){
	query_page = 0;
	query_size = 0;
	compounds = [];
	
	update_paging_panel();
}

function import_from_string(ctab){
	if(structure_editor_type == 'MolEdit'){
		molViewer.importFromString(ctab)
	}else{
		get_ketcher().setMolecule(ctab);
	}
}

function get_mol_file(){
	if(structure_editor_type == 'MolEdit'){
		return molViewer.getMolfile();
	}else{
		return get_ketcher().getMolfile();
	}
}

function get_ketcher(){
	var ketcherFrame = document.getElementById('ifketcher');
	var ketcher = null;

	if ('contentDocument' in ketcherFrame){
	    ketcher = ketcherFrame.contentWindow.ketcher;
	}else{
	    ketcher = document.frames['ifketcher'].window.ketcher;
	}
	
	return ketcher;
}

function create_structure_editor(){
	var width = 900;
	var height = 450;

	var screen_width = window.innerWidth;
	if(screen_width < 340){
		width = 220;
	}else if(screen_width < 1200){
		width = 250;
	}else{
		height = 500;
	}
	
	if(structure_editor_type == 'MolEdit'){
		molViewer = new MolEdit.ChemicalView("",'structure_editor', width, height );
	}else if(structure_editor_type == 'Ketcher'){
		// Your distribution becomes GPL at this point
		var container = document.getElementById('structure_editor');
		
		var iframe = document.createElement('iframe');
		
		iframe.setAttribute('id', 'ifketcher');
		iframe.setAttribute('src', 'ketcher/ketcher.html');
		iframe.setAttribute('width', '100%');
		iframe.setAttribute('height', '100%');
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		iframe.style.position = 'absolute';
		iframe.style.border = 'none';

		container.appendChild(iframe);
	}
}

function get_project(){
	var projectSelection = document.getElementById('project_selection')
	var project_name = project_selection.value;
	
	return project_name;
}

function register_sdf_ui(){
	if(Reflect.hasField(upload_defaults,'compound_id') && upload_defaults.compound_id.map_column != null){
		ask_question(
			'warning', 
			'Uploading manual IDs', 
			'You have mapped the ' + get_entity_name() + ' ID field. '+
			'Which will override the generation of automatic IDs.  Click yes to continue or No to cancel', 'Yes', 'No', 
			function(confirm){
				if(confirm){
					register_sdf();
				}
			}
		);
	}else{
		register_sdf();
	}	
}

function register_sdf(){
	var files = [];
	var inputFiles = document.getElementById('input').files;
	for(var i=0;i<inputFiles.length;i++){
		files.push(inputFiles[i]);
	}
	
	if(files.length == 0){
		show_message('No files selected','Please select files to upload');
		return;
	}

	var projectSelection = document.getElementById('project_selection')
	var project_name = project_selection.value;
	
	var next = null;
	next = function(){
		switch_screen('home');

		var selectedFile = files.pop();

		var register_function = function(upload_key){
			saturn.core.Util.getProvider().getByNamedQuery(
					'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister',
					[{
						'upload_key_sdf': upload_key, 'name':selectedFile.name, 
						'_username':null,
						'project_name': project_name,
						'upload_defaults': upload_defaults
					}],
					null,
					false,
					function(objs, err){
						if(err != null){
							if(objs != null){
								var obj = objs[0]
								if(Reflect.hasField(obj, 'missing_entity')){
									var missing_entity = obj.missing_entity; 
									
									var project_name = missing_entity.project_name;
									var entity_id = missing_entity.entity_id;
									
									ask_question('warning', 'Unknown Supplier', '"'+entity_id+'"<br/>Register?', 'Yes', 'No', function(confirmed){
										if(confirmed){
											saturn.core.Util.getProvider().getByNamedQuery(
													'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister',
													[{'save_changes': {'-1':{'id': -1, 'compound_id': entity_id}}, '_username': null, 'project_name': project_name}],
													null,
													false,
													function(objs, err){
														if(err != null){
															show_message('Failed to register supplier', err);
														}else{
															switch_screen('home');
															register_function(upload_key);
														}
													}
											)
											
										}
									});
									
									
									switch_screen('upload');
									return;
								}
							}
							switch_screen('upload');
							show_message('Registration Failed',err);
							
						}else{
							if(files.length != 0){
								next();
							}
							
							if(upload_defaults['_update']['default_value'] || !enable_structure_field()){
								var refreshed_objects = objs[0].refreshed_objects;
								
								var compounds = []
								
								var compound_table_body = document.getElementById('compounds_results');
								
								var ids = Reflect.fields(refreshed_objects);
								for(var i=0;i<ids.length;i++){
									var id = ids[i];
									compounds.push(Reflect.field(refreshed_objects, id).compound_id);
								}
								
								current_fetch = {'action':'fetch_exact', 'ids': compounds,'_username': null, 'project_name': get_project(),'project': get_project()};
								new_fetch(true);								
							}else{
								var upload_id = objs[0].upload_id;
								show_upload_set(upload_id, selectedFile.name);
							}
						}
					}
			);
		}

		if(selectedFile.size > 1024*1){
			var upload_key = null;
			var blocks_done = 0;
			var chunk_size = 1024*60000;
			var blocks = Math.ceil(selectedFile.size / chunk_size);
			var chunk_msg_ids = [];
			saturn.client.core.CommonCore.getFileInChunks(selectedFile, chunk_size, function(err, chunk, next){
				if(err != null){
					show_message('Error reading file', err);
				}else if(chunk != null){
					var msgId = saturn.core.Util.getProvider().uploadFile(chunk, upload_key, function(err, _upload_key){
						if(err != null){
							show_message('Error uploading file chunk', err);
						}else{
							upload_key = _upload_key;

							next();
						}
					});

					chunk_msg_ids.push(msgId);

					blocks_done += 1;

					chunk_msg_ids.push(msgId);

					msgIdToFileName.set(msgId, selectedFile.name.substr(0, 6) + '... (part ' + blocks_done  + ' of ' + blocks + ')');
				}else{
					if(blocks_done == blocks){
						var last_chunk_id = chunk_msg_ids[chunk_msg_ids.length-1];
						var msgIds = clientCore.msgIds;
						var first_chunk_id = chunk_msg_ids[0];
						for(var l=0;l<chunk_msg_ids.length -1;l++){
							var chunk_msg_id = chunk_msg_ids[l];
							for(var i=0;i<msgIds.length;i++){
								var msg_id = msgIds[i];
								if(msg_id == chunk_msg_id){
									clientCore.msgIds.splice(i,1);
									msgIdToFileName.remove(msg_id);
								}
							}
						}

						var job = clientCore.msgIdToJobInfo.get(last_chunk_id);
						Reflect.setField(job, 'START_TIME', Reflect.field(clientCore.msgIdToJobInfo.get(first_chunk_id),'START_TIME'));

						msgIdToFileName.set(last_chunk_id, selectedFile.name.substr(0, 6) + '....');
					}

					register_function(upload_key);
				}
			});
		}else{
			saturn.client.core.CommonCore.getFileAsText(selectedFile, function(content){
				var msgId = saturn.core.Util.getProvider().uploadFile(window.btoa(unescape(encodeURIComponent(content))), null, function(err, upload_key){
					if(err == null){
						register_function(upload_key)
					}else{
						show_message('Registration Failedk',err);
					}
				});
				msgIdToFileName.set(msgId, selectedFile.name);
			});
		}
	};
	
	next();
};

function register_supplier(supplier, cb){
	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister',
			[{'register_supplier':supplier}],
			null,
			false,
			function(objs, err){
				cb(err);
			}
	);
}

function show_upload_set(upload_id,selectedFile){
	current_fetch = {'action':'fetch_upload','upload_id': upload_id,'file_name':selectedFile, '_username': null,'project': get_project()};
	new_fetch(true);
}

function new_fetch(auto_show){
	// Starts a timer which will switch to the home screen to show progress if more than 2 seconds have passed
	// We are trying to avoid fast queries hiding and then displaying the results table
	set_action_done(false);
	
	// Clear changes
	unsaved_changes = new haxe.ds.StringMap();
	
	current_fetch.task = 'count';
	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
			[current_fetch],
			null,
			false,
			function(objs, err){
				
				
				set_action_done(true);
				
				if(err != null){
					show_message('Search Failed',err);
				}else{
					window.objs = objs;

					query_size = objs[0].count;

					current_fetch.from_row = 0;
					current_fetch.to_row = page_size-1;

					fetch(auto_show);
				}
			}
	);
}

function set_action_done(done){
	action_done = done;
	
	if(!action_done){		
		setTimeout(function(){
			if(!action_done){				
				switch_screen('home');
			}
		}, 20)
	}
}



function fetch(auto_show){
	insert_mode = false;
	
	current_fetch.task = 'fetch';

	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
			[current_fetch],
			null,
			false,
			function(objs, err){
				set_action_done(true);
				
				if(err != null){
					show_message('Fetch Failed',err);
				}else{
					update_compound_table(objs[0].upload_set);

					query_row = current_fetch.to_row +1;

					query_page = Math.floor((current_fetch.to_row + 1) / page_size) -1;

					update_paging_panel();

					if(auto_show){
						switch_screen('results');
					}
				}
			}
	);
}

function download_sdf(){
	export_results('sdf');
}

function download_excel(){
	export_results('excel');
}

function export_results(export_format){
	if(query_size > 1000){
		show_message('Export limit!','Exporting is limited to 1,000 structures');
		return;
	}
	
	var sdf_fetch = {
			'action':current_fetch.action,
			'out_file':null, 
			'task': 'export_' + export_format, 
			'from_row': 0, 
			'to_row': 10000000000, 
			'_username': null,
			'project': get_project(),
			'tz': moment.tz.guess()
	};
	
	if(Reflect.hasField(current_fetch, 'ids')){
		sdf_fetch.ids = current_fetch.ids;
	}

	if(Reflect.hasField(current_fetch, 'upload_id')){
		sdf_fetch['upload_id'] = current_fetch['upload_id'];
		sdf_fetch['file_name'] = current_fetch['file_name'];
		sdf_fetch['action'] = 'fetch_upload';
	}else if(Reflect.hasField(current_fetch, 'ctab_content')){
		sdf_fetch['ctab_content'] = '';
		sdf_fetch['search_terms'] = null;
		
		if(Reflect.hasField(current_fetch, 'ctab_content')){
			sdf_fetch['ctab_content'] = current_fetch['ctab_content'];
		}
		
		if(Reflect.hasField(current_fetch, 'search_terms')){
			sdf_fetch['search_terms'] = current_fetch['search_terms'];
		}
	}

	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
			[sdf_fetch],
			null,
			false,
			function(objs, err){
				if(err != null){
					show_message('Fetch Failed',err);
				}else{
					objs[0].out_file = objs[0].out_file.replace('public','');

					window.open(objs[0].out_file);
				}
			}
	);
}

function store_excel(entity_id, entity_pkey){
	store_result(entity_id, entity_pkey, 'excel')
}

function store_sdf(entity_id, entity_pkey){
	store_result(entity_id, entity_pkey, 'sdf')
}

function store_result(entity_id, entity_pkey, export_format){
	
}

function update_upload_field_table(){
	var table_body = document.getElementById('advanced_register_options_table_body');
	
	while(table_body.hasChildNodes()){
		table_body.removeChild(table_body.lastChild);
	}
	
	var project_fields = custom_fields[get_project()];
	
	var clone_fields = Object();
	var field_names = Reflect.fields(project_fields);
	
	
	
	for(var i=0;i<field_names.length;i++){
		var field_name = field_names[i];
		Reflect.setField(clone_fields, field_name, Reflect.field(project_fields, field_name));
	}
	
	project_fields = clone_fields;
	
	project_fields.compound_id = {'human_name': get_entity_name() + ' ID ', 'visible': true, 'field_type': 'varchar','required': false};
	project_fields.batchable = {'human_name': 'Batchable', 'visible': true, 'field_type': 'bool', 'required': false};
	
	project_fields._update = {'human_name': 'Update existing', 'visible': true, 'field_type': 'bool', 'required': true};
	
	field_names.unshift('compound_id');
	field_names.unshift('batchable');
	field_names.unshift('_update');
	
	if(enable_structure_field()){
		project_fields._mol = {'human_name':'Molecule', 'visible': true, 'field_type': 'varchar'};
		
		field_names.unshift('_mol');
	}
	
	field_names.sort(function(a,b){
		if(a == '_mol'){
			return -1;
		}else{
			if(Reflect.field(project_fields, a).required == true && Reflect.field(project_fields, b).required == false){
				return -1
			}else if(Reflect.field(project_fields, a).required == false && Reflect.field(project_fields, b).required == true){
				return 1;
			}else{
				if(a<b){
					return -1;
				}else if(a>b){
					return 1;
				}else{
					return 0;
				}
			}
		}
	});
	
	upload_defaults = Object();
	
	var selectize_items = [];
	mapping_fields = new haxe.ds.StringMap();
	
	for(var i=0;i<field_names.length;i++){
		(function(){
			var field_name = field_names[i];
			
			Reflect.setField(upload_defaults, field_name, {'default_value': null, 'map_column': null});
			
			var field_item = Reflect.field(project_fields, field_name);
			
			var field_type = field_item.field_type;
			
			if(field_item.visible &&  !field_item.calculated){
				var tr_element = document.createElement('tr');
				
				if(field_name == '_mol'){
					tr_element.style.display = 'None';
					tr_element.setAttribute('id','_mol_upload_row');
				}
	
				if(field_item.required == true){
					tr_element.classList.add('required_field');
				}
				
				var td_field_name_cell = document.createElement('td');
				td_field_name_cell.setAttribute('column_name', 'Field Name');
				td_field_name_cell.classList.add('upload_td_wide');
				td_field_name_cell.style.paddingLeft = '4px';
				
				td_field_name_cell.appendChild(document.createTextNode(field_item.human_name));
				tr_element.appendChild(td_field_name_cell);
				
				var td_field_name_cell = document.createElement('td');
				td_field_name_cell.setAttribute('column_name', 'Mapping Field');
				td_field_name_cell.classList.add('upload_td_wide');
				
				var mapping_select_id = 'mapping_field_' + field_name;
				var mapping_select = document.createElement('select');
				
				if(field_name == '_update'){
					mapping_select.setAttribute('disabled', true);
				}
				
				mapping_select.classList.add('u-full-width');
				var mapping_select_option = document.createElement('option');
				
				mapping_select_option.appendChild(document.createTextNode('Set'));
				
				mapping_select.appendChild(mapping_select_option);
				
				
				mapping_select.setAttribute('id', mapping_select_id);
				td_field_name_cell.appendChild(mapping_select);
				
				tr_element.appendChild(td_field_name_cell);
				
				var td_field_value_cell = document.createElement('td');
				td_field_value_cell.appendChild(document.createTextNode(''));
				td_field_value_cell.style.textAlign='left';
				td_field_value_cell.setAttribute('column_name', 'Default Value');
				td_field_value_cell.classList.add('upload_td_wide');
				
				if(Reflect.hasField(field_item, 'foreign_key_project_name') && field_item.foreign_key_project_name != null){
					var select = document.createElement('select');
					
					var option = document.createElement('option');
					
					option.appendChild(document.createTextNode('Select'));
					
					select.appendChild(option);
					
					var id = 'field_' + field_name;
					
					select.setAttribute('id', id);
					select.classList.add('u-full-width');
					
					selectize_items.push({'id': id, 'foreign_key_project_name': field_item.foreign_key_project_name, 
						field_name: field_item.field_name,
					});
					
					td_field_value_cell.appendChild(select);
				}else if(field_type == 'bool'){
					var checkbox = document.createElement('input');
					
					checkbox.setAttribute('type', 'checkbox');
					
					if(field_name != '_update'){
						checkbox.setAttribute('checked', '');
						Reflect.setField(Reflect.field(upload_defaults, field_name),'default_value', true);
					}else{
						Reflect.setField(Reflect.field(upload_defaults, field_name),'default_value', false);
					}
					
					checkbox.addEventListener('click',function(event){
						Reflect.setField(Reflect.field(upload_defaults, field_name),'default_value' ,event.target.checked);
					});
					td_field_value_cell.appendChild(checkbox);
				}else{
					td_field_value_cell.setAttribute('contenteditable', true);
					
					td_field_value_cell.addEventListener('input', function(event){
						Reflect.setField(Reflect.field(upload_defaults, field_name),'default_value' ,event.target.innerText);
					});
				}
				
				tr_element.appendChild(td_field_value_cell);
				
				table_body.appendChild(tr_element);
				

				selectize_cmp = $('#'+mapping_select_id).selectize({
					valueField: 'compound_id',
				    labelField: 'compound_id',
				    searchField: 'compound_id',
				    createOnBlur: true,
					create: false,
					maxItems: 4000,
					preload: false,
					closeAfterSelect: true,
					mode: 'single',
					onChange(value){
						if(value == null || value == 'Set'){
							Reflect.setField(Reflect.field(upload_defaults, field_name),'map_column' ,null);
							return;
						}
						//value and foreign_key_project_name are important here
						Reflect.setField(Reflect.field(upload_defaults, field_name),'map_column' ,value[0]);
					}
				})[0].selectize;
				
				selectize_cmp.setValue('Set', false);
				
				mapping_fields.set(field_item.human_name,[selectize_cmp,field_name]);
			}
		})();
	}

	for(var i=0;i<selectize_items.length;i++){
		(function(){
			var id = selectize_items[i].id;
			var foreign_key_project_name = selectize_items[i].foreign_key_project_name;
			var value  = selectize_items[i].value;
			var field_name = selectize_items[i].field_name;
			var target = $('#' + id);
			var selectize_cmp = null;
			
			selectize_cmp = target.selectize({
				valueField: 'entity_id',
			    labelField: 'label',
			    searchField: 'entity_id',
			    createOnBlur: true,
				create: false,
				maxItems: 4000,
				preload: true,
				closeAfterSelect: true,
				mode: 'single',
				onChange(value){
					if(value == null || value == 'Select'){
						Reflect.setField(Reflect.field(upload_defaults, field_name),'map_column' ,null);
						return;
					}
					//value and foreign_key_project_name are important here
					Reflect.setField(Reflect.field(upload_defaults, field_name),'default_value' ,value[0]);
				},
				load: function(search_term, callback){
					var query_name = null;
					var request = null;
					
					if(search_term == '' || search_term == null){
						query_name = 'saturn.db.provider.hooks.ExternalJsonHook:Fetch';
						request = [{'action':'search_all','task':'fetch','_username': null, 'project': foreign_key_project_name,'from_row':0, 'to_row': 99999999}];
					}else{
						query_name = 'saturn.db.provider.hooks.ExternalJsonHook:FastFetch';
						request = [{'find_terms':search_term,'_username': null, 'project': foreign_key_project_name}];
					}
					
					
					saturn.core.Util.getProvider().getByNamedQuery(
							query_name,
							request,
							null,
							false,
							function(objs, err){
								if(err != null){
									show_message('Error fetching terms',err);
									callback();
								}else{
									var entities = null;
									var merged_entities = [];
									
									if(search_term == '' || search_term == null){
										entities = objs[0].upload_set;
										
										if(entities != null){
											for(var i=0;i<entities.length;i++){
												var label = entities[i].compound_id;
												
												if(Reflect.hasField(entities[i],'description')){
													label += ' - ' + entities[i].description;
												}
												
												merged_entities.push({'entity_id': entities[i].compound_id, 'label': label})
												
											}
										}
									}else{
										entities = objs[0].entities;
										
										var entity_map = new haxe.ds.StringMap();
										var entity_found_map = new haxe.ds.StringMap();
										
										if(entities != null){
											for(var i=0;i<entities.length;i++){
												var entity = entities[i];
												var entity_id = entity.entity_id;
												var custom_field_value = entity.custom_field_value;
												var custom_field_name = entity.custom_field_name;
												var search_label = entity.search_label;
												
												if(custom_field_name == 'compound_id'){
													entity_found_map.set(entity_id, true);
													if(!entity_map.exists(entity_id)){
														entity_map.set(entity_id, []);
													}
													
													entity_map.get(entity_id).unshift(entity.label);
												}else{
													if(!entity_map.exists(entity_id)){
														entity_map.set(entity_id, []);
													}
													
													entity_map.get(entity_id).push('(' + custom_field_name + '=>' + custom_field_value + ')');
												}
											}
											
											
											var it = entity_map.keys();
											while(it.hasNext()){
												var entity_id = it.next();
												
												if(!entity_found_map.exists(entity_id)){
													entity_map.get(entity_id).unshift(entity_id);
												}
												
												merged_entities.push({'entity_id': entity_id, 'label': entity_map.get(entity_id).join(' ')})
											}
											
											
										}
									}
									
									merged_entities.sort(function(a, b){
										if(a.entity_id < b.entity_id){
											return -1;
										}else if(a.entity_id > b.entity_id){
											return 1;
										}else{
											return 0;
										}
									});
									
									
									callback(merged_entities);
								}
							}
					);
				}
			})[0].selectize;
			
			
			selectize_cmp.setValue('Select', false);
		})();
	}
}

function on_project_change(cb){
	row_index = 0;
	
	if(get_project() == 'Logout'){
		logout();
		return;
	}
	
	clear_results_table();
	reset_paging_panel();
	add_results_table_headings();
	
	//clear recent term searchers
	search_control[0].selectize.clear();
	search_control[0].selectize.clearOptions();

	var results_button = document.getElementById('results_button')
	results_button.innerText = get_entity_name() + 's';
	
	document.getElementById('search_selection-selectized').setAttribute('placeholder', get_entity_name());
	
	if(enable_structure_field()){
		document.getElementById('structure_editor').style.display = 'flex';
		
	}else{
		document.getElementById('structure_editor').style.display = 'none';
	}
	
	// Prefetch items to populate drop-downs, this mechanism won't scale for very large collections
	// Why - using the load function with pre-load set to true on selectize drop-down elements will 
	// cause multiple simultaneous requests for the same collections even with cached set to true for
	// getByNamedQuery.  This is because all requests will be fired before any responses have been cached
	// This does mean that new items won't appear unless a user refreshes the page or toggles between projects
	
	update_key_cache(function(){
		if(cb == null){
			fetch_all(true);
		}else{
			cb();
		}
	});
}	
	
function update_key_cache(cb){	
	update_upload_field_table();
	cb();
	return;
	// Reset pre-fetch cache
	cached_entities = Object();
	
	var project_fields = custom_fields[get_project()];
	var fields = Reflect.fields(project_fields);
	
	// List of entity types / projects to fetch
	var projects_to_fetch = [];
	
	for(var l=0;l<fields.length;l++){
		var field = fields[l];
		var field_item = Reflect.field(project_fields, field);

		if(Reflect.hasField(field_item, 'foreign_key_project_name') && field_item.foreign_key_project_name != null){
			projects_to_fetch.push(field_item.foreign_key_project_name);
		}
	}
			
	// Async iterator to make it easier to code
	var next = null;
	next = function(){
		if(projects_to_fetch.length == 0){
			//tmp to replace with more complete solution
			var prefixSelection = document.getElementById('prefix_selection');

			var items = Reflect.field(cached_entities, get_project() + '/Compound Classifications');
			
			if(items != null && items.length > 0){
				for(var i =0;i<items.length;i++){
					var item = items[i];
					var elem = document.createElement('option');
					elem.value = item.compound_id
					elem.text = item.description + ' (' + item.compound_id + ')';
					prefixSelection.add(elem);
				}
			}
			
			update_upload_field_table();
			
			cb();
		}else{
			var foreign_key_project_name = projects_to_fetch.pop();
			
			saturn.core.Util.getProvider().getByNamedQuery(
				'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
				[{  'action': 'search_all', 'task': 'fetch', 
					'_username': null, 'project': foreign_key_project_name, 
					'search_terms': [''],
					'from_row': 0,
					'to_row': 1000,
					'ctab_content': ''
				}],
				null,
				false,
				function(objs, err){
					if(err != null){
						show_message('Error fetching terms',err);
						callback();
					}else{
						var entities = objs[0].upload_set;
						
						Reflect.setField(cached_entities, foreign_key_project_name, entities);
						
						next();
					}
				}
			);		
		}
	}
	
	next();
}

function update_compound_table(compound_array){
	compounds = compound_array;
	var compound_table_body = document.getElementById('compounds_results');
	while(compound_table_body.hasChildNodes()){
		compound_table_body.removeChild(compound_table_body.lastChild);
	}

	var html = '';

	for(var i=0;i<compounds.length;i++){
		var compound = compounds[i];
		
		add_row(compound_table_body,compound);
	}
	
}

function find_next_new_row_id(){
	var min_compound_id = 0;
	for(var i=0;i<compounds.length;i++){
		if(compounds[i].id < min_compound_id){
			min_compound_id = compounds[i].id;
		}
	}
	
	return min_compound_id -1;
}

function add_new_row(){
	if(!insert_mode){
		clear_results_table();
		reset_paging_panel();
		add_results_table_headings();
		
		insert_mode = true;
		current_fetch = null;
		query_size = 0;
		
		row_index = 0;
	}

	query_size += 1;
	
	update_paging_panel();
	
	var entity = Object();
	
	entity.id = find_next_new_row_id();
	
	entity.compound_id = 'Enter ID';
	
	entity.username = clientCore.getUser().username.toLowerCase();
	
	if(enable_structure_field()){
		entity.mol_image = null;
		entity.compound_sdf = null;
	}
	
	if(enable_attachment_field()){
		entity.attachments = [];
	}
	
	//Custom fields
	var project_fields = custom_fields[get_project()];
	var fields = Reflect.fields(project_fields);
	
	for(var l=0;l<fields.length;l++){
		(function() {
			var field = fields[l];
			var field_item = Reflect.field(project_fields, field);
			
			Reflect.setField(entity, field_item.field_name, null);
		})();
	}
	
	entity.username = clientCore.getUser().username.toLowerCase();
	entity.batchable = 'true';
	
	var compound_table_body = document.getElementById('compounds_results');
	
	compounds.push(entity);
	
	add_row(compound_table_body, entity);
}

function add_row(compound_table_body, compound, replace_row){
	row_index++;
	var g_row_index = row_index;
	
	var compound_row = document.createElement('tr');
	compound_row.setAttribute('id', 'compound_row_' + compound.id);
	compound_row.style.verticalAlign = 'top';
	compound_row.style.marginTop = '4px';

	var compound_id_cell = document.createElement('td');
	compound_id_cell.classList.add('search_results_td_narrow');
	compound_id_cell.classList.add('compound_table_field');
	compound_id_cell.setAttribute('column_name',  get_entity_name() + ' ID');

	var compound_id_span = document.createElement('div');
	
	compound_id_span.appendChild(document.createTextNode(compound.compound_id));
	
	compound_id_cell.appendChild(compound_id_span);
	
	compound_id_span.addEventListener('click', function(event){
		make_editable(event.target);
	});
	
	var field_item = null;
	compound_id_span.addEventListener('paste', function(event){ //leo
		event.preventDefault();
		paste_data(compound, field_item, g_row_index, event);
	});
    
	compound_id_span.addEventListener('input', function(event){
		on_field_change_ui(event.target, 'compound_id',  Reflect.field(compound, 'compound_id'), compound.id);
	});

	compound_row.appendChild(compound_id_cell);
	
	selectize_items = [];
	
	if(enable_structure_field()){
		(function(){
			var structure_html = compound.mol_image;
			
			if(structure_html != null){
				structure_html = structure_html.replace(/svg:/g,'');
				structure_html = structure_html.replace("width=\"200pt\"","width='100%'");
				structure_html = structure_html.replace("height=\"200pt\"",'viewBox="0 0 200 200"');
			}
			var structure_cell = document.createElement('td');
			structure_cell.setAttribute('column_name','Structure');
			structure_cell.classList.add('compound_table_field');
			structure_cell.classList.add('search_results_td_narrow');
	
			i += 1;
			
			var structure_btn = document.createElement('button');
			structure_btn.classList.add("button");
			structure_btn.classList.add("structure_btn");
			structure_btn.style.height = 'initial';
			structure_btn.style.width='100%';
			structure_btn.style.marginLeft = 'auto';
			structure_btn.style.marginRight = 'auto';
			structure_btn.style.padding = 'initial';
			structure_btn.style.cursor = 'pointer';
			structure_btn.style.background = 'transparent';
			structure_btn.addEventListener('click', function(event){
				var ctab = compound.compound_sdf;
				
				if(get_project().indexOf('/Search History') > -1){					
					var new_project = compound.project_name;
					
					document.getElementById('project_selection').value = new_project;
					
					on_project_change(function(){
						load_structure_in_editor(ctab);
					})
				}else{
					load_structure_in_editor(ctab);
				}
			});
			
			if(ctab_has_structure(compound.compound_sdf)){
				structure_btn.style.display = 'inline-block';
			}else{
				structure_btn.style.display = 'none';
			}
	
			var tmp = document.createElement('template');
			tmp.innerHTML = structure_html;
	
			structure_btn.innerHTML = structure_html;
	
			structure_cell.appendChild(structure_btn);
			
			if(get_project().indexOf('/Search History') > -1){
				
			}else{
				var edit_btn = document.createElement('button');
				edit_btn.appendChild(document.createTextNode('Edit Structure'));
			
				edit_btn.addEventListener('click', function(){
					if(compound.compound_sdf != null){
						import_from_string(compound.compound_sdf);
					}
					
					update_structure_ui(compound.id, structure_btn);
				});
				
				edit_btn.style.display="block";
				edit_btn.style.marginLeft = "auto";
				edit_btn.style.marginRight = "auto";
				
				structure_cell.appendChild(edit_btn);
			}
			
			compound_row.appendChild(structure_cell);
		})();
	}
	
	if(enable_attachment_field()){
		var attachment_row = document.createElement('td');
		attachment_row.setAttribute('column_name','Attachments');
		attachment_row.classList.add('search_td_wide');
		attachment_row.classList.add('compound_table_field');
		attachment_row.style.minWidth = '200px';

		i += 1;
		
		var attachments = compound.attachments;
		if(attachments != null){
			for(var j=0;j<attachments.length;j++){
				(function() {
					var attachment = attachments[j];

					var file_link = document.createElement('a');
					file_link.style.display = 'inline-block';
					file_link.setAttribute('href',window.location.protocol + '//' + window.location.hostname + ':' + window.location.port+ '/static/out/permanent/' + attachment.uuid);
					file_link.setAttribute('download', attachment.file_name);
					file_link.appendChild(document.createTextNode(attachment.file_name));
					file_link.style.float = 'right';
					file_link.style.maxWidth = '70%';
					file_link.style.wordBreak = 'break-word';


					var delete_btn = document.createElement('button');
					delete_btn.style.marginLeft = '10px';
					delete_btn.style.padding = '0 10px';
					delete_btn.style.fontSize = 'xx-large';
					delete_btn.style.float = 'right';
					delete_btn.classList.add('button');
					delete_btn.innerHTML = '&#128465;';
					delete_btn.addEventListener('click', function(event){
						delete_file_ui(attachment.uuid, compound.compound_id);
					});


					attachment_row.appendChild(delete_btn);
					attachment_row.appendChild(file_link);
					var clear_div = document.createElement('div')
					clear_div.style.clear = 'both';
					attachment_row.appendChild(clear_div);
				})();
			}
		}
		
		compound_row.appendChild(attachment_row);
	}
	
	//Custom fields
	var project_fields = custom_fields[get_project()];
	var fields = Reflect.fields(project_fields);
	
	var cols = [];
	var field_map = new haxe.ds.StringMap()
	for(var k=0;k<fields.length;k++){
		var field_name = fields[k];
		var human_name = project_fields[field_name].human_name;
		
		field_map.set(human_name, field_name);
		
		cols.push(human_name);
	}
	
	cols.sort()
	
	for(var l=0;l<cols.length;l++){
		(function() {
			var field = cols[l];
			
			var k = j;
			
			var field_item = Reflect.field(project_fields, field_map.get(field));
			
			if(!field_item.visible){
				return;
			}
			
			var field_cell = document.createElement('td');
			field_cell.setAttribute('column_name',field_item.human_name);

			
			field_cell.addEventListener('paste', function(event){
				event.preventDefault();
				paste_data(compound, field_item, g_row_index, event);
			});
			
			var field_value = Reflect.field(compound, field_item.field_name);
			if(field_value == null){
				field_value = '';
			}
			
			field_cell.classList.add('search_results_td_narrow');
			field_cell.classList.add('compound_table_field');
			
			if(field_item.required == true){
				field_cell.classList.add('required_field');
			}
			
			if(Reflect.hasField(field_item, 'foreign_key_project_name') && field_item.foreign_key_project_name != null){
				var select = document.createElement('select');
				
				var id = 'field_' + compound.id + '_' + field_item.field_name;
				
				select.setAttribute('id', id);
				select.classList.add('u-full-width');
				
				var option = document.createElement('option');
				
				var original_value = Reflect.field(compound, field_item.field_name);
				if(original_value == null){
					original_value = 'Select';
				}				
				
				option.appendChild(document.createTextNode(original_value));
				
				select.appendChild(option);
				
				field_cell.appendChild(select);
				
				field_cell.style.minWidth="150px"
				
				compound_row.appendChild(field_cell);
				
				if(field_item.calculated == true){
					field_cell.classList.add('calculated_field');
				}else{
					selectize_items.push({'id': id, 'foreign_key_project_name': field_item.foreign_key_project_name, 
						entity_id: compound.id, field_name: field_item.field_name,
						original_value: original_value
					});
				}
			}else{
				if(field_item.type_name == 'float' && field_value != null && field_value != ''){
					field_value = parseFloat(field_value).toPrecision(4);
				}
				
				field_cell.appendChild(document.createTextNode(field_value));

				compound_row.appendChild(field_cell);
				
				if(field_item.calculated == true){
					field_cell.classList.add('calculated_field');
				}else{
					field_cell.addEventListener('click', function(event){
						make_editable(event.target);
					});

					field_cell.addEventListener('input', function(event){
						on_field_change_ui(event.target, field_item.field_name,  Reflect.field(compound, field_item.field_name), compound.id);
					});
				}
			}
			
			
			
		})();
	}
	
	if(enable_structure_field()){
		var batchable_cell = document.createElement('td');
		batchable_cell.classList.add('search_results_td_narrow');
		batchable_cell.classList.add('compound_table_field');
		batchable_cell.setAttribute('column_name',  'Batchable');
	
		var batchable_checkbox = document.createElement('input');
		batchable_checkbox.setAttribute('type', 'checkbox');
		
		if(Reflect.field(compound, 'batchable') == 'true'){
			batchable_checkbox.checked = true;
		}else{
			batchable_checkbox.checked = false;
		}
		
		batchable_cell.appendChild(batchable_checkbox);
		
		batchable_checkbox.addEventListener('click', function(event){
			on_field_change_ui(event.target, 'batchable',  Reflect.field(compound, 'batchable'), compound.id);
		});
	
		compound_row.appendChild(batchable_cell);
	}
	
	var username_cell = document.createElement('td');
	username_cell.setAttribute('column_name','User');
	username_cell.classList.add('calculated_field');
	
	username_cell.appendChild(document.createTextNode(compound.username));

	username_cell.classList.add('search_results_td_narrow');
	username_cell.classList.add('compound_table_field');
	compound_row.appendChild(username_cell);
	
	var date_timestamp_cell = document.createElement('td');
	date_timestamp_cell.setAttribute('column_name','Date Record Created');
	date_timestamp_cell.classList.add('calculated_field');
	
	var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
	date_string = '';
	
	if(compound.date_record_created != null){
		d.setUTCSeconds(compound.date_record_created);
		
		date_string = d.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute: '2-digit', second:'2-digit' });
	}
	
	date_timestamp_cell.appendChild(document.createTextNode(date_string));	

	date_timestamp_cell.classList.add('search_results_td_narrow');
	date_timestamp_cell.classList.add('compound_table_field');
	compound_row.appendChild(date_timestamp_cell);
	
	if(compound.id > 0 && enable_attachment_field()){
		var attach_btn = document.createElement('button');
		attach_btn.classList.add('button');
		attach_btn.style.display='block';
		attach_btn.style.width='100%';
		attach_btn.style.marginTop = '10px';
		attach_btn.appendChild(document.createTextNode('Attach File'));

		attach_btn.addEventListener('click', function(event){
			document.getElementById('attach_files_'+compound.id).click();
		});

		compound_id_cell.appendChild(attach_btn);

		var input_btn = document.createElement('input');
		input_btn.style.display = 'none';
		input_btn.setAttribute('id', 'attach_files_'+compound.id);
		input_btn.setAttribute('type', 'file');
		input_btn.setAttribute('multiple', '');
		input_btn.addEventListener('change', function(event){
			attach_files(compound.id, this.files);
		});

		compound_id_cell.appendChild(input_btn);
	}
	
	var custom_button_configurations = get_project_configuration_parameter('custom_row_buttons')
	
	if(custom_button_configurations != null){
		for(var i=0;i<custom_button_configurations.length;i++){
			(function(){
				var custom_button_configuration = custom_button_configurations[i];
				
				var btn = document.createElement('button');
				btn.classList.add('button');
				btn.style.display = 'block';
				btn.style.width = '100%';
				btn.style.marginTop = '10px';
				btn.appendChild(document.createTextNode(custom_button_configuration.label));
				btn.addEventListener('click', function(event){
					window[Reflect.field(custom_button_configuration,'function')](compound.compound_id, compound.id)
				});
				
				compound_id_cell.appendChild(btn);
			})();
		}
	}

	var delete_btn = document.createElement('button');
	delete_btn.classList.add('button');
	delete_btn.style.display = 'block';
	delete_btn.style.width = '100%';
	delete_btn.style.marginTop = '10px';
	delete_btn.appendChild(document.createTextNode('Delete'));
	delete_btn.addEventListener('click', function(event){
		delete_compound_ui(compound.compound_id, compound.id);
	});
	
	compound_id_cell.appendChild(delete_btn);
	
	if(replace_row == null){
		compound_table_body.appendChild(compound_row);
	}else{
		compound_table_body.replaceChild(compound_row, replace_row);
	}
	
	for(var i=0;i<selectize_items.length;i++){
		(function(){
			var id = selectize_items[i].id;
			var foreign_key_project_name = selectize_items[i].foreign_key_project_name;
			var entity_id = selectize_items[i].entity_id;
			var field_name = selectize_items[i].field_name;
			var original_value = selectize_items[i].original_value;
			var target = $('#' + id);
			var selectize_cmp = null;
			var first = true;
			selectize_cmp = target.selectize({
				valueField: 'entity_id',
			    labelField: 'entity_id',
			    searchField: 'entity_id',
			    createOnBlur: true,
				create: false,
				maxItems: 4000,
				preload: 'focus',
				closeAfterSelect: true,
				//options: Reflect.field(cached_entities, foreign_key_project_name),
				mode: 'single',
				allowEmptyOption:true,
				onChange(value){
					for(var j=0;j<compounds.length;j++){
						if(compounds[j].id == entity_id){
							if(value != null){
								value = value[0]
							}
							
							on_field_change(field_name, original_value, entity_id, value, target[0].parentElement)
							break;
						}
					}
				},
				load: function(search_term, callback){
					saturn.core.Util.getProvider().getByNamedQuery(
							'saturn.db.provider.hooks.ExternalJsonHook:FastFetch',
							[{'find_terms': search_term, '_username': null, 'project': foreign_key_project_name}],
							null,
							false,
							function(objs, err){
								if(err != null){
									show_message('Error fetching terms',err);
									callback();
								}else{
									var entities = objs[0].entities;
									callback(entities);
								}
							}
					);
				}
			})[0].selectize;
			
			if(original_value == null){
				original_value = '';
			}
			
			selectize_cmp.setValue(original_value, true);
		})();
	}
}

function paste_data(compound, field_item, g_row_index, event){
	var pasted_data = event.clipboardData.getData('text');
	var rows = pasted_data.split('\n');
    rows.pop();
    
    if (field_item == null) {
    	field_name = 'compound_id';
    } else {
    	var field_name = field_item.field_name;
    }
    
    var total_rows = compounds.length;
    var diff = total_rows - g_row_index + 1;
    var to_add = rows.length - diff;
   
    if(insert_mode){
	    if(to_add > 0){
	    	for (i=0; i<to_add; i++) {
	        	add_new_row();
	        }
	    }
    }
    
    // Create a copy of cols_ordered which includes the first special column for ID
    var table_column_defs = [];
    for(var i=0;i<cols_ordered.length;i++){
    	table_column_defs.push(cols_ordered[i]);
    }
    
    // Column of table pasted into - an integer
    var starting_col = null;
    
    if(field_item != null){
    	// We get here for all custom fields (i.e. not the first field which includes the entity ID)
    	
    	// Iterate custom field columns to work out which one was pasted into
    	for(var k=0;k<cols_ordered.length;k++){
    		// K'th column definition
            var col_definition = cols_ordered[k];
            
            if(col_definition == field_item.human_name){
            	// We get here if, this was the column pasted into 
            	starting_col = k;
            }
        }
    }else{
    	// We get here when the column pasted into was for the first special ID field
    	starting_col = 0;
    }
    
    // Iterate rows of pasted content
    for(row in rows) {
    	// Split row into cells
    	var row_cells = rows[row].split("\t");
    	console.log('row cells', row_cells);
    	
    	// Get compound at this row in the table
    	var compound_for_row = compounds[g_row_index-1];	
    	
    	if (compound_for_row === undefined)  {
    		// When the pasted rows are more than the available ones
    		show_message('Error pasting data', 'You have pasted too many rows.');
    		break;
    	}
    	
    	// Get the TR element for this row
    	var target_elem = document.getElementById('compound_row_' + compound_for_row.id);
    	
    	// Get a list of all TD elements for this row, so we can find the matching 
        var children = target_elem.getElementsByTagName('td');
    	
    	// Increment row counter for the next loop
    	g_row_index += 1;
    	
    	// Store the column position for which the next value should be pasted
    	var row_cell_col = starting_col;
    	
    	// Iterate cells for this row
    	for(var u=0;u<row_cells.length;u++){
    		// Value associated with this cell 
    		var row_cell_value = row_cells[u];
    		
    		// Get the definition for the column we are going to paste a value for
    		var col_field_human_name = table_column_defs[row_cell_col];
    		var col_field_item = null;
    		if(custom_fields_human_index.exists(col_field_human_name)){
    			col_field_item = custom_fields_human_index.get(col_field_human_name);
    		}
    		
    		// Get the TD corresponding to this cell
    		var child = children[row_cell_col];
    		
    		// We need to treat the first column and all the custom fields differently
    		var appendToElem = null;
    		var custom_field_name = null;
    		if(col_field_item == null){
    			// We get here if the column is the first special ID one
    			appendToElem = child.getElementsByTagName('div')[0];
    			custom_field_name = 'compound_id';
    		}else{
    			// We get here for the custom fields
    			appendToElem = child;
    			custom_field_name = col_field_item.field_name;
    		}
    		
    		if (col_field_item != null && Reflect.hasField(col_field_item, 'foreign_key_project_name') && col_field_item.foreign_key_project_name != null){
    			var child_id = child.firstChild.id;
    			
    			//$('#' + child_id).siblings('.selectize-control').find('.item').attr('data-value', row_cell_value);
    			//$('#' + child_id).siblings('.selectize-control').find('.item').text(row_cell_value);
    			//$('#' + child_id).siblings('.selectize-control').find('.selectize-dropdown-content').append('<div class="option selected" data-selectable data-value=' + row_cell_value + '><span class="highlight">'+ row_cell_value +'</span></div>');
    			//$('#' + child_id).siblings('.selectize-control').find('.selectize-dropdown-content').addClass('222222');
    			
    			var search_term = row_cell_value;
    			
    			var $select = $('#' + child_id).selectize({
    				create: true,
    			}); /**
    				load: function(search_term, callback){
    					saturn.core.Util.getProvider().getByNamedQuery(
    							'saturn.db.provider.hooks.ExternalJsonHook:FastFetch',
    							[{'find_terms': search_term, '_username': null, 'project': foreign_key_project_name}],
    							null,
    							false,
    							function(objs, err){
    								if(err != null){
    									show_message('Error fetching terms',err);
    									callback();
    								}else{
    									var entities = objs[0].entities;
    									callback(entities);
    								}
    							}
    					);
    				}
    				
    			}); */
    			
    			
    			var selectize = $select[0].selectize;

    			var list = [
    			    {
    			        text: 'GB',
    			        value: 1
    			    },
    			    {
    			        text: 'ZZ',
    			        value: 2
    			    }
    			];
    			    			
    			
                selectize.clear();
                selectize.clearOptions();
                selectize.renderCache['option'] = {};
                selectize.renderCache['item'] = {};
                
                selectize.addOption(list);
                selectize.setValue(list[0].value);
                
                
    			//selectize.clear();

    			/**
    			selectize.load(function(callback) {
    			    callback(list);
    			}); */
    		

    			
    			
    			selectize.addOption({value:'GB', text:'GB'});

    			//selectize.addItem('GB');
    		    			
    			//selectize.setValue('GB', false);
    			
    			
    			selectize.on('change', function() {
    			      var test = selectize.getValue();
    			      alert(test);
    			});
    			
    			
    			
    		} else if (enable_structure_field() && col_field_human_name == 'Structure'){
    			(function(){
    				var g_custom_field_name = custom_field_name;
    				var g_compound_for_row = compound_for_row;
    				var g_child = child;
	    			convert_smiles_to_ctab(row_cell_value, function(ctab_content, error){	    				
	    				update_structure(ctab_content, g_compound_for_row.id, g_child.getElementsByTagName('button')[0]);
	    				
	    				// Saves the change in the unsaved_changes object and highlight the cells with unsaved changes to the user
	            		// on_field_change(g_custom_field_name, Reflect.field(g_compound_for_row,g_custom_field_name), g_compound_for_row.id, ctab_content, g_child);
	    			})
    			})();
    		} else if (col_field_human_name == 'Attachments') {
    			// Ignore
    		} else {
    			// Remove all text nodes from the parent
        		while(appendToElem.firstChild){
        			appendToElem.removeChild(appendToElem.firstChild);
        		}
    			
    			// Append a new text node with the new value to be pasted
        		appendToElem.appendChild(document.createTextNode(row_cell_value));
        		
        		// Saves the change in the unsaved_changes object and highlight the cells with unsaved changes to the user
        		on_field_change(custom_field_name, Reflect.field(compound_for_row,custom_field_name), compound_for_row.id, row_cell_value, child);
    		}
    		
            // Increment the column number we are going to paste into on the next loop
    		row_cell_col += 1;
    	}
    }
}

function delete_upload_set_ui(entity_id, entity_pkey){
	ask_question('warning', 'Delete upload set', 'Are you sure?', 'Yes', 'No', function(confirm){
		if(confirm){
			delete_upload_set(entity_id,entity_pkey);
		}
	});
}

function delete_upload_set(entity_id, entity_pkey){
	var request = {
			'delete_upload_set': null,
			'_username': null,
			'project_name': null,
			'upload_id': null
	};
	
	
	for(var j=0;j<compounds.length;j++){
		var entity = compounds[j];
		if(entity.compound_id == entity_id){
			request.project_name = entity.upload_project;
			request.upload_id = entity.upload_upload_uuid;
		}
	}
	
	saturn.core.Util.getProvider().getByNamedQuery(
		'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister',
		[request],
		null,
		false,
		function(objs, err){
			if(err != null){
				show_message('Error deleteing compound',err);
			}else{
				show_message('Upload set removed');
			}
		}
	);
}

function fetch_upload_set(entity_id, entity_pkey){	
	var upload_id = null;
	var project_name = null;
	
	for(var j=0;j<compounds.length;j++){
		var entity = compounds[j];
		if(entity.compound_id == entity_id){
			project_name = entity.upload_project;
			upload_id = entity.upload_upload_uuid;
			
			break;
		}
	}
	
	set_project(project_name);
	
	on_project_change(function(){
		show_upload_set(upload_id, upload_id);
	});
}


function on_field_change_ui(target, field_name, original_value, compound_id){
	var new_value = null;
	
	if(target.nodeName == 'INPUT' && target.getAttribute('type') == 'checkbox'){
		if(target.checked){
			new_value = true;
		}else{
			new_value = false;
		}
		
		target = target.parentNode;
	}else{
		new_value = target.innerText;
	}
	
	on_field_change(field_name, original_value, compound_id, new_value, target);
}

function on_field_change(field_name, original_value, compound_id, new_value, target){
	if(original_value != new_value){
		if(!unsaved_changes.exists(compound_id)){
			unsaved_changes.set(compound_id, new haxe.ds.StringMap());
		}

		target.classList.add('cell_modified');

		if(field_name == 'compound_id'){
			for(var i=0;i<user_settings.length;i++){
				var user_setting = user_settings[i];
				
				if(user_setting.compound_id == 'Hide_Salt_Suffixes_' + get_project()){
					if(user_setting.option == 'Yes'){
				
						if(new_value.length != 11){
							var salted_id = null;
							for(var j=0;j<compounds.length;j++){
								var compound = compounds[j];
								if(compound.id == compound_id && Reflect.hasField(compound, '_compound_id')){
									salted_id = compound._compound_id;
									break;
								}
							}
							
							if(salted_id != null && salted_id.length == 11){
								new_value = new_value + salted_id.substr(9,11);
							}
						}
					}
					break;
				}
			}
		}
		
		unsaved_changes.get(compound_id).set(field_name, new_value);
	}else{
		if(unsaved_changes.exists(compound_id)){
			if(unsaved_changes.get(compound_id).exists(field_name)){
				unsaved_changes.get(compound_id).remove(field_name);

				target.classList.remove('cell_modified');
			}

			if(!unsaved_changes.get(compound_id).keys().hasNext()){
				unsaved_changes.remove(compound_id)
			}
		}
	}

	var save_btn = document.getElementById('save_btn');
	if(unsaved_changes.keys().hasNext()){
		save_btn.disabled = false;
		save_btn.classList.add('changes');
	}else{
		save_btn.disabled = true;
		save_btn.classList.remove('changes');
	}
}

function make_editable(target){
	if(last_target != null && last_target != target){
		last_target.contentEditable = false;
	}

	last_target = target;

	target.contentEditable = true;
}

function handle_files(files){
	var a = document.getElementById('file_select');

	if(files.length > 1){
		a.innerHTML = 'Selected ' + files.length + ' Files';
	}else{
		a.innerHTML = files[0].name;
	}
	
	
	upload_files = files;
	
	file_name = upload_files[0].name;
	
	if(file_name.endsWith('.sdf')){
		document.getElementById('_mol_upload_row').style.display = 'None';

		var file_parser = new LineNavigator(upload_files[0])
	
		file_parser.find(/M  END/, 0, function(err, start_index, match) {
			file_parser.find(/^\$/, start_index, function(err, index, match) {
				window.err = err;
			    window.index = index;
			    window.match = match;
			    
			    file_parser.readLines(start_index+1, index, function (err, index, lines, isEof, progress) {
			    	_update_upload_field_mapping(lines);
			    });
			});
		});
	}else if(file_name.endsWith('.xlsx') || file_name.endsWith('.csv') || file_name.endsWith('.txt')){
		if(enable_structure_field()){
			document.getElementById('_mol_upload_row').style.display = 'table-row';
		}
		
		var reader = new FileReader();
		reader.onload = function(e) {
			var data = e.target.result;
			
			var workbook = XLSX.read(data, {type:'binary'});
			
			var first_sheet_name = workbook.SheetNames[0];
			var address_of_cell = 'A1';

			var worksheet = workbook.Sheets[first_sheet_name];

			var cell_address = {c:0, r:0};
			
			/* Find desired cell */
			
			var headers = [];
			
			var range = XLSX.utils.decode_range(worksheet['!ref']);
			
			for(var i=0;i<range['e']['c']+1;i++){
				var address = {'c':i,r:0};
				var desired_cell = worksheet[XLSX.utils.encode_cell(address)];
				var desired_value = (desired_cell ? desired_cell.v : undefined);
				headers.push('> <'+desired_value+'>');
			}			
			
			_update_upload_field_mapping(headers);
		};
		reader.readAsBinaryString(upload_files[0]); 
	}else{
		show_message('Invalid file format','Supported file formats are .xlsx, .txt, .csv, .sdf');
		
		var upload_section = document.getElementById('file_select');
		document.getElementById('sdf_upload').style.display = 'block';
		
		if(enable_structure_field()){
			upload_section.innerText = 'Select (SDF, Excel, CSV, Txt)'
		}else{
			upload_section.innerText = 'Select (Excel, CSV, Txt)'
		}
		
		document.getElementById('input').value = null;
		
		upload_files = [];
	}
}

function _update_upload_field_mapping(lines){
	var regex = /^>\s+<([^>]+)>/;
	var fields = [{'compound_id': 'Set'}];
	for(var i=0;i<lines.length;i++){
		var match = regex.exec(lines[i]);
		if(match != null){
			field = match[1];
			fields.push({'compound_id': field})
		}
	}
	
	var field_to_closest_distance = new haxe.ds.StringMap();
	var field_to_closest_field = new haxe.ds.StringMap();
	
	var user_field_to_closest_distance = new haxe.ds.StringMap();
	
	var d_threshold = 0.8;
	
	var mapping_field_names = mapping_fields.keys();
	
	while(mapping_field_names.hasNext()){
		var field_name = mapping_field_names.next();
		field_to_closest_distance.set(field_name, 0);
		
		for(var j=0;j<fields.length;j++){
			var field = fields[j].compound_id;
			
			var d_max = 0;
			
			if(field_name == 'Molecule' && (field.toLowerCase().indexOf('smiles') >-1 || field.toLowerCase().indexOf('inchi') > -1)){
				d_max = 1;		
			}else{
				var wField = field.replace(/ /g,'');
				
				var d1 = distance(field_name, field);
				var d2 = distance(field_name, wField);
				var d3 = distance(field_name, field.split(/\s+/).reverse().join(' '));
				var d4 = distance(field, field_name.split(/\s+/).reverse().join(' '));
				
				d_max =  Math.max(d1,d2,d3,d4);
			}
			
			
			if(d_max > d_threshold && d_max > field_to_closest_distance.get(field_name) ){
				if(user_field_to_closest_distance.exists(field) && user_field_to_closest_distance.get(field)> d_max){
					continue
				}else{				
					field_to_closest_distance.set(field_name, d_max);
					field_to_closest_field.set(field_name, field);
					user_field_to_closest_distance.set(field, d_max);
				}
			}
		}
	}
	
	
	mapping_field_names = mapping_fields.keys();
	
	while(mapping_field_names.hasNext()){
		var field_name = mapping_field_names.next();
		var selectize = mapping_fields.get(field_name)[0];
		var real_field_name = mapping_fields.get(field_name)[1];

		selectize.clearOptions();
		selectize.load(function(cb){
			cb(fields);
		});
		var set = false;
		
		if(field_to_closest_field.exists(field_name)){
			var field = field_to_closest_field.get(field_name);
			selectize.addItem({'compound_id':field}, true);
			selectize.setValue(field, true);
			//close, otherwise the button has massive padding, something must be broken in selectize or the docs
			selectize.close();
			
			Reflect.setField(Reflect.field(upload_defaults, real_field_name),'map_column',field);
			set = true;
		}
		
		if(set == false){
			selectize.setValue('Set', true);
			selectize.close();
		}
	}
}

function attach_files(id, inputFiles){
	var files = [];
	
	for(var i=0;i<inputFiles.length;i++){
		files.push(inputFiles[i]);
	}

	var next = null;
	next = function(){
		var selectedFile = files.pop();

		var attach_function = function(upload_key){
			saturn.core.Util.getProvider().getByNamedQuery(
					'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister',
					[{'upload_key_attach': upload_key, 'file_name':selectedFile.name, '_username':null,  'id': id}],
					null,
					false,
					function(objs, err){
						if(err != null){
							show_message('Attach Failed',err);
						}else{
							var uuid = objs[0]['uuid'];

							for(var j=0;j<compounds.length;j++){
								var compound = compounds[j];
								if(compound.id == id){
									compound.attachments.push({'uuid': uuid, 'file_name': selectedFile.name});
								}
							}

							update_compound_table(compounds);

							if(files.length != 0){
								next();
							}else{
								switch_screen('results');
							}
						}
					}
			);
		}

		if(selectedFile.size > 1024*1){
			switch_screen('home');

			var upload_key = null;
			var blocks_done = 0;
			var chunk_size = 1024*60000;
			var blocks = Math.ceil(selectedFile.size / chunk_size);
			var chunk_msg_ids = [];
			saturn.client.core.CommonCore.getFileInChunks(selectedFile, chunk_size, function(err, chunk, next){
				if(err != null){
					show_message('Error reading file', err);
				}else if(chunk != null){
					var msgId = saturn.core.Util.getProvider().uploadFile(chunk, upload_key, function(err, _upload_key){
						if(err != null){
							show_message('Error uploading file chunk', err);
						}else{
							upload_key = _upload_key;

							next();
						}
					});

					blocks_done += 1;

					chunk_msg_ids.push(msgId);

					msgIdToFileName.set(msgId, selectedFile.name.substr(0, 6) + '... (part ' + blocks_done  + ' of ' + blocks + ')');
				}else{
					if(blocks_done == blocks){
						var last_chunk_id = chunk_msg_ids[chunk_msg_ids.length-1];
						var msgIds = clientCore.msgIds;
						var first_chunk_id = chunk_msg_ids[0];
						for(var l=0;l<chunk_msg_ids.length -1;l++){
							var chunk_msg_id = chunk_msg_ids[l];
							for(var i=0;i<msgIds.length;i++){
								var msg_id = msgIds[i];
								if(msg_id == chunk_msg_id){
									clientCore.msgIds.splice(i,1);
									msgIdToFileName.remove(msg_id);
								}
							}
						}

						var job = clientCore.msgIdToJobInfo.get(last_chunk_id);
						Reflect.setField(job, 'START_TIME', Reflect.field(clientCore.msgIdToJobInfo.get(first_chunk_id),'START_TIME'));

						msgIdToFileName.set(last_chunk_id, selectedFile.name.substr(0, 6) + '....');
					}

					attach_function(upload_key);
				}
			});
		}else{
			saturn.client.core.CommonCore.getFileAsText(selectedFile, function(content){
				var msgId = saturn.core.Util.getProvider().uploadFile(window.btoa(content), null, function(err, upload_key){
					if(err == null){
						attach_function(upload_key)
					}else{
						show_message('Registration Failedk',err);
					}
				});
				msgIdToFileName.set(msgId, selectedFile.name);
			});
		}
	};

	next();
}

function rerun(msgId){
	var job = clientCore.msgIdToJobInfo.get(msgId);
	var json = Reflect.field(job, 'JSON');

	
	current_fetch = haxe.Unserializer.run(Reflect.field(json,'parameters'))[0];
	
	var fetch = function(){
		current_fetch = haxe.Unserializer.run(Reflect.field(json,'parameters'))[0];
		
		new_fetch(true);
	};
	
	if(current_fetch.project != get_project()){
		set_project(current_fetch.project);
		
		on_project_change(fetch)
	}else{
		fetch();
	}
	
	//current_fetch['project'] = get_project();
	
	
}

function set_project(project){
	document.getElementById('project_selection').value = project;
}

function progress_listener(){	
	var table = document.createElement('table');
	table.style.tableLayout = 'fixed';
	table.style.width = '100%';
	table.style.margin = 'auto';
	table.style.clear='both';
	table.classList.add('search_results');
	table.setAttribute('id', 'search_results_table');
	
	var tbody = document.createElement('tbody');
	
	var template = document.createElement('template');
	template.innerHTML = '<thead><tr><th style="width:20%;">Status</th><th style="width:40%;text-align:center">Search</th><th style="width:20%;text-align:right">Elapsed Time</th></tr></thead>';

	table.appendChild( template.content.firstChild);
	table.appendChild(tbody);

	var runTimer = false;

	var uniqueStructures = new haxe.ds.StringMap();
	var fetched = new haxe.ds.StringMap();

	var msgIds = clientCore.msgIds;
	for(var i=0;i<msgIds.length;i++){
		var msgId = msgIds[i];
		var job = clientCore.msgIdToJobInfo.get(msgId);
		var json = Reflect.field(job, 'JSON');

		var msg = Reflect.field(job, 'MSG');
		var centerComponent = '';
		
		var add_row = false;
		
		var action_td = document.createElement('td');
		action_td.style.textAlign = 'left';
		action_td.setAttribute('column_name','Status');
		action_td.classList.add('compound_table_field');
		action_td.classList.add('search_results_td_narrow');
		action_td.classList.add('progress_td');
		
		var details_td = document.createElement('td');
		details_td.style.textAlign = 'center';
		details_td.setAttribute('column_name','Search');
		details_td.classList.add('compound_table_field');
		details_td.classList.add('search_results_td_narrow');
		details_td.classList.add('progress_td');
		details_td.style.backgroundColor = 'rgb(51, 195, 240)';
		
		var time_td = document.createElement('td');
		time_td.style.textAlign = 'right';
		time_td.style.fontFamily = 'monospace';
		time_td.setAttribute('column_name','Elapsed Time');
		time_td.classList.add('compound_table_field');
		time_td.classList.add('search_results_td_narrow');
		time_td.classList.add('progress_td');

		if(msg == '_remote_provider_._data_request_objects_namedquery'){
			var button_code = '';

			if(Reflect.field(json,'queryId') == 'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister'){
				var obj = haxe.Unserializer.run(Reflect.field(json,'parameters'))[0];

				if(Reflect.hasField(obj, 'upload_key_sdf')){
					var endTime = Reflect.field(job, 'END_TIME');
					var action_description = null;
					
					if(endTime == null){
						action_description = 'Registering';
					}else{
						action_description = 'Registered';
					}
					
					action_td.appendChild(document.createTextNode(action_description));
					
					var font_elem = document.createElement('font');
					font_elem.style.fontSize = '13.3px';
					font_elem.appendChild(document.createTextNode(Reflect.field(obj, 'name')))
					
					details_td.appendChild(font_elem);
					
					add_row = true;
				}
			}else if(Reflect.field(json,'queryId') == 'saturn.db.provider.hooks.ExternalJsonHook:Fetch'){
				var obj = haxe.Unserializer.run(Reflect.field(json,'parameters'))[0];
				var action = Reflect.field(obj,'action');

				if(action == 'search' || action == 'search_all' || action == 'fetch_upload' || action == 'fetch_exact'){
					var task = Reflect.field(obj,'task');

					var endTime = Reflect.field(job, 'END_TIME');

					if(endTime != null && Reflect.field(obj, 'from_row') != 0){
						continue;
					}
					
					var action_description = null;

					if(endTime == null){
						if(task == 'fetch'){
							action_description = 'Retrieving ';
						}else if(task == 'count'){
							action_description = 'Searching ';
						}else if(task == 'export_sdf' || task == 'export_excel'){
							action_description = 'Exporting ';
						}
					}else{
						if(task == 'fetch'){
							action_description = 'Previous Search ';
						}else if(task == 'count'){
							action_description = 'Previous Search ';
						}
					}
					
					action_td.appendChild(document.createTextNode(action_description));
					
					add_row = true;

					if(task == 'fetch' || task == 'count' || task == 'export_sdf' || task == 'export_excel'){
						var ctab = Reflect.field(obj, 'ctab_content');
						
						var search_terms = null;
						
						if(Reflect.hasField(obj,'search_terms')){
							search_terms = Reflect.field(obj, 'search_terms');
						}else if(Reflect.hasField(obj,'ids')){
							search_terms = Reflect.field(obj, 'ids');
						}
						
						
						
						if(action == 'fetch_upload'){
							search_terms = ['Upload: ' + obj.upload_id];
						}

						var mol_image = '';
						var button_style = '';

						
						if(Reflect.hasField(obj, 'file_name')){
							mol_image = obj.file_name;
							button_style = "padding:5px;margin:auto;";

							if(fetched.exists(obj.file_name)){
								continue;
							}else{
								fetched.set(obj.file_name, '');
							}
							
							var button_elem = document.createElement('button');
							button_elem.style.height = 'initial';
							button_elem.style.color = 'white';
							button_elem.style.border = 'none';
							(function(){
								var but = button_elem;
								var id = msgId;
								but.addEventListener('click', function(){
									rerun(id);
								});
							})();
							button_elem.appendChild(document.createTextNode(mol_image));

							details_td.appendChild(button_elem);
						}else{
							var button_elem = document.createElement('button');
							button_elem.style.height = 'initial';
							button_elem.style.color = 'white';
							button_elem.style.border = 'none';
							button_elem.classList.add('jump');
							
							(function(){
								var but = button_elem;
								var id = msgId;
								but.addEventListener('click', function(){
									rerun(id);
								});
							})();
							
							var search_key = '';
							
							var button_content_elem = null;
							
							if(Reflect.hasField(obj, 'project')){
								search_key += Reflect.field(obj, 'project');
								
								var elem = document.createElement('div');
								elem.appendChild(document.createTextNode('Project: ' + Reflect.field(obj, 'project')));
								
								button_elem.appendChild(elem);
								
							}
							
						
							if(ctab != null && ctab != ''){
								var line_count = ctab.split('\n').length;
								if(line_count > 6){
									if(!Reflect.hasField(obj,'ctab_key')){
										obj.ctab_key=CryptoJS.MD5(ctab).toString(CryptoJS.enc.Base64);
									}
									
									search_key += '<ctab>' + obj.ctab_key + '</ctab>';
									
									var div_container = document.createElement('div');
									
									var structure_html =  ctab_to_image[obj.ctab_key];
									structure_html = structure_html.replace(/svg:/g,'');
									structure_html = structure_html.replace("width=\"200pt\"","width='100%'");
									structure_html = structure_html.replace("height=\"200pt\"",'viewBox="0 0 200 200"');
									
									div_container.innerHTML = structure_html;
									
									button_elem.appendChild(div_container);
								}
							}
							
							
							
							var search_label = '';
							
							if(search_terms != null && search_terms != ''){
								search_key += '<terms>' + search_terms.join(',') + '</terms>';
								
								search_label = search_terms.join(',');
							}
							
							button_content_elem = document.createTextNode(search_label );
							
							if(uniqueStructures.exists(search_key)){
								continue;
							}else{
								uniqueStructures.set(search_key, '');
							}
							
							if(button_content_elem != null){
								button_elem.appendChild(button_content_elem);
							}
							
							button_elem.style.whiteSpace = 'initial';
							button_elem.style.wordWrap = 'break-word';
							button_elem.style.width = '100%';
							button_elem.style.maxWidth='300px';
							button_elem.style.fontFamily = '"HelveticaNeue", "Helvetica Neue", Helvetica, Arial, sans-serif';
							
							details_td.appendChild(button_elem);
						}
					}
				}
			}
		}else if(msg == '_remote_provider_._data_request_upload_file'){
			var action_description = null;
			
			if(endTime == null){
				action_description = 'Uploading';
			}else{
				action_description = 'Uploaded';
			}

			action_td.appendChild(document.createTextNode(action_description));
			
			details_td.appendChild(document.createTextNode(msgIdToFileName.get(msgId)));
			
			add_row = true;
		}
		
		if(add_row){		
			var endTime = Reflect.field(job, 'END_TIME');

			if(endTime == null){
				endTime = Date.now();
				runTimer = true;
			}
			
			var job = clientCore.msgIdToJobInfo.get(msgId);
			
			var startTime = Reflect.field( job,'START_TIME');

			var diff = endTime - startTime;

			var date = new Date(null);
			date.setMilliseconds(diff);
			
			time_td.appendChild(document.createTextNode(date.toISOString().substr(11,8))) ;
			
			var row_tr = document.createElement('tr');
			row_tr.style.marginTop = '4px';
			row_tr.appendChild(action_td);
			row_tr.appendChild(details_td);
			row_tr.appendChild(time_td);
			
			tbody.appendChild(row_tr);
		}
	}

	var progressElem = document.getElementById('progress');
	
	while (progressElem.hasChildNodes()) {
		progressElem.removeChild(progressElem.lastChild);
	}
	
	progressElem.appendChild(table);
	

	if(runTimer){
		setTimeout(progress_listener, 200);
	}
}

function login(){
	var username = document.getElementById('username').value;
	var password = document.getElementById('password').value;

	_login(username, password);
}

function _login(username, password){
	switch_screen('login_progress');

        clientCore.login(username, password, function(err){
		if(err != null){
                        switch_screen('login');

			show_message('Login Failed', 'Please try again with valid credentials ' + err);
		}
	});
}

function request_password_reset(){
	var username = document.getElementById('username').value;

	var request = {
			'mode': 'request_password_reset',
			'username': username
	};

	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Register',
			[request],
			null,
			false,
			function(objs, err){
				if(err != null){
					show_message('Password reset error',err);
				}else{
					show_message('Reset instructions emailed', err);
				}
			}
	);
}

function logout(){
	clientCore.logout();

	refresh_session();
}

var first_load = true;

function refresh_session(){	
	reset_paging_panel();
	clear_results_table();

	var projectSelection = document.getElementById('project_selection');
	while(projectSelection.options.length > 0){
		projectSelection.remove(0);
	}

	projectSelection.selectedIndex = 0;

	if(clientCore.isLoggedIn()){
		setTimeout(function(){
			if(!clientCore.isLoggedIn()){
				return;
			}
			
			fetch_user_settings(function(){
				var request = {
						'mode': 'project_list',
						'_username': null
				};
				
				active_list = ['home_button','help_button','upload_button','search_button','results_button','registration_button', 'search_button', 'project_selection', 'main_buttons'];
				inactive_list = ['registration_button', 'loading'];
	
				for(var i=0;i<active_list.length;i++){
					if(active_list[i] == 'main_buttons'){
						document.getElementById(active_list[i]).style.display='flex';
					}else{
						document.getElementById(active_list[i]).style.display='initial';
					}
				}
	
				for(var i=0;i<inactive_list.length;i++){
					document.getElementById(inactive_list[i]).style.display='none';
				}
				
				switch_screen('home');
	
				saturn.core.Util.getProvider().getByNamedQuery(
						'saturn.db.provider.hooks.ExternalJsonHook:Register',
						[request],
						null,
						false,
						function(objs, err){
							if(err != null){
								show_message('Error requesting project list',err);
							}else{
								var projects = Reflect.fields(objs[0].projects);
								
								projects.sort(function(a,b){									
									if(a<b){
										return -1;
									}else if(a>b){
										return 1;
									}else{
										return 0;
									}
								});
								
								var real_projects = [];
								var upload_projects = [];
								var search_projects = [];
								var settings_projects = [];
								var custom_buttons_projects = [];
								
								for(var i=0;i<projects.length;i++){
									var project = projects[i];
									if(project.indexOf('/Custom Row Buttons') >-1){
										custom_buttons_projects.push(project);
									}else if(project.indexOf('/Uploads') >-1){
										upload_projects.push(project);
									}else if(project.indexOf('/Search History')>-1){
										search_projects.push(project);
									}else if(project.indexOf('/Settings')>-1){
										settings_projects.push(project);
									}else{
										real_projects.push(project);
									}
								}
								
								real_projects.push(null);
								real_projects= real_projects.concat(upload_projects);
								real_projects.push(null);
								real_projects = real_projects.concat(search_projects);
								real_projects.push(null);
								if(custom_buttons_projects.length > 0){
									real_projects= real_projects.concat(custom_buttons_projects);
									real_projects.push(null);
								}
								real_projects = real_projects.concat(settings_projects);
								real_projects.push(null);
								real_projects.push('Logout');
								
								projects = real_projects;
								
								custom_fields = objs[0].custom_fields;
								
								project_defs = objs[0].project_defs;
								
								var ordered_projects = [];
								for(var i =0;i<projects.length;i++){
									var project = projects[i];
									// True if project is the default
									if(Reflect.field(objs[0].projects, project)){
										ordered_projects.unshift(project);
									}else{
										ordered_projects.push(project);
									}
								}
								
								for(var i =0;i<ordered_projects.length;i++){
									var project = ordered_projects[i];
									var elem = document.createElement('option');
									
									if(project == null){
										elem.setAttribute('disabled','');
										elem.style.fontSize = '1px';
										elem.style.backgroundColor = 'rgb(51, 195, 240)';
									}
									
									elem.value = project;
									elem.text = project;
									projectSelection.add(elem);
								}
								
								var upload_section = document.getElementById('file_select');
								document.getElementById('sdf_upload').style.display = 'block';
								
								if(enable_structure_field()){
									upload_section.innerText = 'Select (SDF, Excel, CSV, Txt)'
								}else{
									upload_section.innerText = 'Select (Excel, CSV, Txt)'
								}
								
								on_project_change();
							}
						}
				);
			});
		}, 2000);

	}else{
		inactive_list = ['home_button','help_button','upload_button','search_button','results_button','search_button','loading','project_selection', 'main_buttons'];
		active_list = ['registration_button', ];

		for(var i=0;i<active_list.length;i++){
			document.getElementById(active_list[i]).style.display='initial';
		}

		for(var i=0;i<inactive_list.length;i++){
			document.getElementById(inactive_list[i]).style.display='none';
		}
		
		switch_screen('login');
	}

	var query_params = get_query_params(location.search);
	if(Reflect.hasField(query_params, 'reset_code') && !ignore_reset){
		if(clientCore.isLoggedIn()){
			logout();
		}else{
			show_password_reset();
		}
	}
}

function fetch_all(forget_search){
	if(get_project().indexOf('Search History') > -1){
		fetch_all_user(forget_search);
	}else{
		current_fetch = {'project':get_project(), '_username': null, 'action':'search_all', 'forget_search': forget_search};
		
		new_fetch(true);
	}
}

function fetch_user_settings(cb){
	var fetch_config = {'from_row':0, 'to_row':9999999999, 'task': 'fetch', 'project':clientCore.getUser().username.toLowerCase() + '/Settings', '_username': null, 'action':'search_all', 'forget_search': true};

	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
			[fetch_config],
			null,
			false,
			function(objs, err){				
				if(err != null){
					show_message('Unable to fetch user settings',err);
				}else{
					user_settings = objs[0].upload_set;
					
					cb();
				}
			}
	);
	
}

function fetch_all_user(forget_search){
	current_fetch = {'project':get_project(), '_username': null, 'action':'search_user_all', 'forget_search': forget_search};
	
	new_fetch(false);
}


function repeat_search(entity_id, entity_pkey){
	var matching_entity = null;
	for(var j=0;j<compounds.length;j++){
		var entity = compounds[j];
		if(entity.compound_id == entity_id){
			matching_entity = entity;
			break;
		}
	}
	
	search_obj = JSON.parse(matching_entity.json);
	
	new_project = search_obj.project;
	
	document.getElementById('project_selection').value = new_project;
	
	on_project_change(function(){
		saturn.core.Util.getProvider().getByNamedQuery(
				'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
				[{'action': 'as_svg', 'ctab_content': search_obj.ctab_content}],
				null,
				false,
				function(objs, err){
					if(err != null){
						show_message('Error fetching compounds',err);
					}else{
						var ctab_key = CryptoJS.MD5(search_obj.ctab_content).toString(CryptoJS.enc.Base64);

						var mol_image = objs[0].svg_content;

						mol_image = mol_image.replace(/svg:/g,'');
						mol_image = mol_image.replace("width='300px'","width='100px'");
						mol_image = mol_image.replace("height='300px'",'height="100px" viewBox="0 0 300 300"');

						ctab_to_image[ctab_key] = mol_image;

						current_fetch = search_obj
						
						new_fetch(true);
					}
				}
		);
	});
}



function store_excel(entity_id, entity_pkey){
	store_result(entity_id, entity_pkey, 'excel')
}

function store_sdf(entity_id, entity_pkey){
	store_result(entity_id, entity_pkey, 'sdf')
}

function store_result(entity_id, entity_pkey, export_format){
	var matching_entity = null;
	for(var j=0;j<compounds.length;j++){
		var entity = compounds[j];
		if(entity.compound_id == entity_id){
			matching_entity = entity;
			break;
		}
	}
	
	search_obj = JSON.parse(matching_entity.json);
	
	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
			[{'action': 'as_svg', 'ctab_content': search_obj.ctab_content}],
			null,
			false,
			function(objs, err){
				if(err != null){
					show_message('Error fetching compounds',err);
				}else{
					var ctab_key = CryptoJS.MD5(search_obj.ctab_content).toString(CryptoJS.enc.Base64);

					var mol_image = objs[0].svg_content;

					mol_image = mol_image.replace(/svg:/g,'');
					mol_image = mol_image.replace("width='300px'","width='100px'");
					mol_image = mol_image.replace("height='300px'",'height="100px" viewBox="0 0 300 300"');

					ctab_to_image[ctab_key] = mol_image;

					
					search_obj['out_file'] = null;
					search_obj['store_id'] = matching_entity.id
					search_obj['task'] = 'export_' + export_format;
					search_obj['from_row'] =  0;
					search_obj['to_row'] =  99999999;
					search_obj['tz'] =moment.tz.guess();
					
					saturn.core.Util.getProvider().getByNamedQuery(
							'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
							[search_obj],
							null,
							false,
							function(objs, err){
								if(err != null){
									show_message('Error fetching compounds',err);
								}else{
									var uuid = objs[0]['uuid'];
									var file_name = objs[0]['file_name'];

									for(var j=0;j<compounds.length;j++){
										var compound = compounds[j];
										if(compound.id == entity_pkey){
											compound.attachments.push({'uuid': uuid, 'file_name': file_name});
										}
									}

									update_compound_table(compounds);
								}
							}
					);
				}
			}
	);
}

function clear_results_table(){
	var header_elem = $('#compound_table_results thead')[0];
	while(header_elem.hasChildNodes()){
		header_elem.removeChild(header_elem.firstChild);
	}
	
	var body_elem = $('#compound_table_results tbody')[0];
	while(body_elem.hasChildNodes()){
		body_elem.removeChild(body_elem.firstChild);
	}
}

function add_results_table_headings(){
	var cols = [];
    
    custom_fields_human_index = new haxe.ds.StringMap();
	
	var project_fields = custom_fields[get_project()];
	var fields = Reflect.fields(project_fields);
	
	for(var i=0;i<fields.length;i++){
		var field = fields[i];
		var field_item = Reflect.field(project_fields, field);
		
		if(!field_item.visible){
			continue;
		}
		
		cols.push(field_item.human_name);
        
        custom_fields_human_index.set(field_item.human_name, field_item);
	}
	
	cols.sort();
    
    cols_ordered = cols;
	
	if(enable_attachment_field()){
		cols.unshift('Attachments');
	}
	
	if(enable_structure_field()){
		cols.unshift('Structure');
	}
	
	cols.unshift(get_entity_name() + ' ID');
	
	
	if(enable_structure_field()){
		cols.push('Batchable');
	}
	cols.push('User');
	cols.push('Date Created');
	
	var header_elem = $('#compound_table_results thead')[0];
	var tr_elem = document.createElement('tr');
	
	for(var i=0;i<cols.length;i++){
		var th_elem = document.createElement('th');
		
		th_elem.appendChild(document.createTextNode(cols[i]));
		
		tr_elem.appendChild(th_elem);
		
		th_elem.style.textAlign="Center";
	}
	
	header_elem.appendChild(tr_elem);
}

function delete_compound_ui(compound_id,id){
	ask_question('warning', 'Delete ' + get_entity_name(), 'Are you sure?', 'Yes', 'No', function(confirm){
		if(confirm){
			delete_compound(compound_id,id);
		}
	});
}

function delete_compound(compound_id, id){
	var request = {
			'delete_compound': id,
			'_username': null
	};
	
	var after_delete = function(){
		// Clear any stored changes
		if(unsaved_changes.exists(id)){
			unsaved_changes.remove(id);
		}
		
		query_size = query_size - 1;
		
		fetch(true);
	}

	if(id < 0){
		after_delete();
	}else{
		saturn.core.Util.getProvider().getByNamedQuery(
				'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister',
				[request],
				null,
				false,
				function(objs, err){
					if(err != null){
						show_message('Error deleteing compound',err);
					}else{
						after_delete();
					}
				}
		);
	}
	
	
}

function delete_file_ui(file_uuid, compound_id){
	ask_question('warning', 'Delete attachment', 'Are you sure?', 'Yes', 'No', function(confirm){
		if(confirm){
			delete_file(file_uuid, compound_id);
		}
	});
}

function delete_file(file_uuid, compound_id){
	var request = {
			'delete_file': file_uuid,
			'_username': null
	};

	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister',
			[request],
			null,
			false,
			function(objs, err){
				if(err != null){
					show_message('Error deleteing file',err);
				}else{
					for(var j=0;j<compounds.length;j++){
						var compound = compounds[j];
						if(compound.compound_id == compound_id){
							for(var k=0;k<compound.attachments.length;k++){
								var attachment = compound.attachments[k];
								if(file_uuid == attachment.uuid){
									compound.attachments.splice(k,1);
									break;
								}
							}
							break;
						}
					}

					update_compound_table(compounds);
				}
			}
	);
}

var clientCore;

function start(){
	switch_screen('progress');
	
	document.getElementById('project_selection').addEventListener('change', function(){		
		var upload_section = document.getElementById('upload_section_heading');
		document.getElementById('sdf_upload').style.display = 'block';
		
		if(enable_structure_field()){
			upload_section.innerText = 'Upload (SDF, Excel, CSV, Txt)'
		}else{
			upload_section.innerText = 'Upload (Excel, CSV, Txt)'
		}
		
		on_project_change();
	});
	
	saturn.client.core.ClientCore.main();

	clientCore = saturn.client.core.ClientCore.getClientCore();
	clientCore.setShowMessage(function(title, msg){
		show_message(title,msg);
	});

	clientCore.addUpdateListener(progress_listener);
	clientCore.addRefreshListener(refresh_session);
	clientCore.addLoginListener(refresh_session);

	clientCore.installNodeSocket();
	clientCore.installProviders();
	clientCore.refreshSession(function(){

	});
	
	saturn.core.Util.getProvider().enableCache(false);

	create_structure_editor();
	update_paging_panel();
	
	search_control = $('#search_selection').selectize({
		valueField: 'entity_id',
	    labelField: 'label',
	    searchField: 'label',
	    createOnBlur: true,
		create: true,
		maxItems: 4000,
		delimiter:'	',
		splitOn:/[\t ]+/,
		persist: false,
		load: function(search_term, callback){			
			saturn.core.Util.getProvider().getByNamedQuery(
					'saturn.db.provider.hooks.ExternalJsonHook:FastFetch',
					[{'find_terms': search_term, '_username': null, 'project': get_project()}],
					null,
					false,
					function(objs, err){
						if(err != null){
							show_message('Error fetching terms',err);
							callback();
						}else{
							var entities = objs[0].entities;
							var remove_suffixes = false;
							
							for(var i=0;i<user_settings.length;i++){
								var user_setting = user_settings[i];
								
								if(user_setting.compound_id == 'Hide_Salt_Suffixes_' + get_project()){
									if(user_setting.option == 'Yes'){
								
										remove_suffixes = true;
									}
									break;
								}
							}
							
							if(entities != null && remove_suffixes){
								for(var i=0;i<entities.length;i++){
									var entity = entities[i];
									
									if(entity.entity_id.length == 11){
										var original_id = entity.entity_id;
										entity.entity_id = entity.entity_id.substr(0,9);
										entity.label = entity.label.replace(original_id, entity.entity_id);
									}
								}
							}
							callback(entities);
						}
					}
			);
		}
	});
	
	var scroll_position = 0;
	
	document.getElementById("compound_table_container").addEventListener("scroll", function(){
		   scroll_position = this.scrollTop;
		
		   var translate = "translate(0,"+scroll_position+"px)";
		   this.querySelector("thead").style.transform = translate;
	});
	
	
}

function create_grid(){
	var ImageFormatter = _.extend({}, Backgrid.CellFormatter.prototype, {
		fromRaw: function (rawValue, model) {
			return rawValue
		}
	});

	var ImageCell = Backgrid.Cell.extend({
		// every cell class has a default formatter, which you can override
		formatter: ImageFormatter,
		render : function(){
			this.$el.empty();
			var model = this.model;
			var columnName = this.column.get("name");
			this.$el.html(this.formatter.fromRaw(model.get(columnName), model));
			this.delegateEvents();
			return this;
		}
	});

	var ActionCell = Backgrid.Cell.extend({
		render : function(){
			this.$el.empty();
			var model = this.model;
			this.$el.html(
					'<a class="button style2 " onclick="document.getElementById(\'attach_files\').click()" id="file_select">Attach File</a>' +
					'<input style="display:none" type="file" id="attach_files" onchange="attach_files(\'' + model.get('id') + '\')" multiple>'
			);
			this.delegateEvents();
			return this;
		}
	});

	var AttachCell = Backgrid.Cell.extend({
		render : function(){
			this.$el.empty();
			var model = this.model;

			var html = '<ul>'
				var attachments = model.get('attachments');
			if(attachments != null){
				for(var i=0;i<attachments.length;i++){
					var attachment = attachments[i];
					html += '<li><a href="' + window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/static/out/permanent/' + attachment.uuid  + '">' + attachment.file_name + '</li>'
				}
			}

			html += '</ul>';

			this.$el.html(
					html
			);
			this.delegateEvents();
			return this;
		}
	});


	var columns = [{
		name: "compound_id", // The key of the model attribute
		label: "Compound ID", // The name to display in the header
		editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
		cell:'string'
	},
	{
		name: "mol_image",
		label: "Structure",
		cell: ImageCell,
		editable: false
	},
	{
		name: "attachments",
		label: "Files",
		cell: AttachCell,
		editable: false
	},
	{
		name: "supplier", // The key of the model attribute
		label: "Supplier", // The name to display in the header
		editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
		cell:'string'
	},
	{
		name: "supplier_id", // The key of the model attribute
		label: "Supplier ID", // The name to display in the header
		editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
		cell:'string'
	},
	{
		name: "username", // The key of the model attribute
		label: "Username", // The name to display in the header
		editable: false, // By default every cell in a column is editable, but *ID* shouldn't be
		cell:'string'
	},
	{
		name: "actions",
		label: "Actions",
		cell: ActionCell,
		editable: false
	}
	];

	CompoundObject = Backbone.Model.extend({
		id: null,
		compound_id: null,
		mol_image: null,
		supplier: null,
		supplier_id:null,
		username: null
	});

	Compounds = Backbone.Collection.extend({
		model: CompoundObject,
		initialize: function (models,options) { }
	});

	compounds = new Compounds([]);

	// Initialize a new Grid instance
	grid = new Backgrid.Grid({
		columns: columns,
		collection: compounds
	});

	// Render the grid and attach the root to your HTML document
	$("#compound_table").append(grid.render().el);
}

// Paging functions

function navigate_to_page(from_row, to_row){
	current_fetch.from_row = from_row;
	current_fetch.to_row = to_row;

	fetch(true);
}

window.navigate_to_page = navigate_to_page;

function update_pages(){
	left_pages = [];
	var left_page = query_page;

	for(var i=query_row;i>0;i=i-page_size){
		left_pages.push({'page':left_page, 'from_row': i-page_size,'to_row':i-1});
		left_page--;

		if(left_pages.length == max_buttons+1){
			break;
		}
	}

	left_pages = left_pages.reverse();

	right_pages = [];
	var right_page = query_page + 1;
	for(var i=query_row;i<query_size;i=i+page_size){
		right_pages.push({'page':right_page, 'from_row': i,'to_row':i+page_size-1});
		right_page++;

		if(right_pages.length == max_buttons){
			break;
		}
	}
}

function update_paging_panel(){
	update_pages();

	var pages = left_pages.concat(right_pages);

	var html = '';
	
	var disabled_style = 'pointer-events: none;cursor: default;border:none;color:white;margin-bottom:0px;padding-left:30px';
	var default_style = 'border:none;color:white;margin-bottom:0px;padding-left:30px'

	// Disable paging buttons when in insert mode
	if(!insert_mode){
		html += '<div style="display:flex;flex-direction:row;margin-bottom:0px">';
		var from_row = 0;
		var to_row = page_size -1 ;
	
		var back_from_row = 0;
		var back_to_row = 0;
	
		var back_style = default_style;
		var back_button_style = default_style;
	
		back_from_row = query_row - page_size -page_size;
		back_to_row = back_from_row + page_size-1;
	
		if(query_page == 0){
			back_button_style = disabled_style;
			back_style = disabled_style;
		}
	

		html += "<button style='" + back_style + ";padding-left:0px;padding-right:0px;margin-left:10px;'href='#progress' onclick='navigate_to_page(" + from_row + "," + to_row + ")'>First</button> "
	
		html += "<button style='" + back_button_style + "'href='#progress' onclick='navigate_to_page(" + back_from_row + "," + back_to_row + ")'><</button> "
		html += '<div style="display:inline-box;flex-grow:1;margin-bottom:0px"></div>';
		
		for(var i=0;i<pages.length;i++){
			var page = pages[i];
	
			var style = default_style;
	
			if(page.page == query_page){
				style=disabled_style + ';text-decoration: underline';
			}
	
			html +="<button style='" + style + "'href='#progress' onclick='navigate_to_page(" + page.from_row + "," + page.to_row + ")'>"+(page.page + 1)+"</button> "
		}

		var from_row = query_size - page_size + 1;
		var to_row = query_size;
	
		var forward_from_row = 0;
		var forward_to_row = 0;
	
		var forward_button_style = disabled_style;
	
		var last_style = disabled_style;
	
		if(query_size  > query_row){
			forward_button_style = default_style;
	
			forward_from_row = query_row ;
			forward_to_row = forward_from_row + page_size -1;
	
			last_style = default_style;
		}

		html += '<div style="display:inline-box;flex-grow:1"></div>';
		html += "<button style='" + forward_button_style + ";padding-left:30px'href='#' onclick='navigate_to_page(" + forward_from_row + "," + forward_to_row + ")'>></button> "
	
		html += "<button style='" + last_style + ";margin-right:10px;padding-left:5px;padding-right:0px'href='#' onclick='navigate_to_page(" + from_row + "," + to_row + ")'>Last</button> "
		html += "</div>"
	}

	var export_style = default_style.replace('#35b88f','red');
	if(query_size == 0){
		export_style = disabled_style;
	}

	export_style += 'float:right';
	
	var entity_name = get_entity_name();
	
	
	extra_buttons = '<div style="display:flex;flex-direction:row;background-color:white"><div style="display:inline-box;background-color:#33C3F0;">';
	
	var add_enable = '';
	
	if(!enable_addition()){
		add_enable = 'disabled = "true"';
	}
	
	extra_buttons += "<button  "+add_enable+" style='padding-left:10px;padding-right:5px; border:none;color:white;margin-bottom:0px'href='#' onclick='add_new_row()'>Add</button>"
	extra_buttons += '<button onclick="save_changes()" id="save_btn" disabled="true"  onclick="save_changes()" style="padding-left:5px;padding-right:5px;border:none;color:white;margin-bottom:0px">Save</button>';
	extra_buttons += '</div><div style="display:inline-box;flex-grow:1;text-align:center;font-size:large">Records: ' + query_size + '</div><div style="display:inline-box;background-color:#33C3F0;">'
		
		
	if(enable_structure_field()){
		extra_buttons += '<button style="border:none;color:white;margin-bottom:0px;padding-left:5px;padding-right:5px"  onclick="download_sdf()">SDF</button>';
	}
	
	extra_buttons += '<button style="border:none;color:white;margin-bottom:0px;padding-left:5px;padding-right:10px"  onclick="download_excel()">Excel</button>';
	extra_buttons += '</div></div>';
	
	$('#compound_table_paging').html(extra_buttons + html);
}

function get_entity_name(){
	var	project_name = get_project();
	
	var entity_name = 'Compound';
	
	if(project_defs != null && Reflect.hasField(project_defs, project_name)){
		var project_def = Reflect.field(project_defs, project_name);
		entity_name = project_def.entity_name;
	}
	
	if(entity_name == null || entity_name == ''){
		entity_name = 'Compound';
	}
	
	return entity_name;
}

function get_project_configuration(){
	var	project_name = get_project();
	
	var entity_name = 'Compound';
	
	if(project_defs != null && Reflect.hasField(project_defs, project_name)){
		return Reflect.field(project_defs, project_name);
	}else{
		return null;
	}
}

function get_project_configuration_parameter(parameter_name){
	var project_configuration = get_project_configuration();
	
	if(project_configuration != null && Reflect.hasField(project_configuration, parameter_name)){
		return Reflect.field(project_configuration, parameter_name);
	}else{
		return null;
	}
}

function enable_structure_field(){
	var enable_structure_field = get_project_configuration_parameter('enable_structure_field');
	
	if(enable_structure_field == null){
		enable_structure_field = false;
	}
	
	return enable_structure_field;
}

function enable_attachment_field(){
	var enable_attachment_field = get_project_configuration_parameter('enable_attachment_field');
	
	if(enable_attachment_field == null){
		enable_attachment_field = false;
	}
	
	return enable_attachment_field;
}

function enable_addition(){
	var enable_addition = get_project_configuration_parameter('enable_addition');
	
	if(enable_addition == null){
		enable_addition = false;
	}
	
	return enable_addition;
}

function load_structure_in_editor(ctab_content){
	import_from_string(ctab_content);
	
	switch_screen('search')
}

function perform_search(ctab_content){
	current_fetch = {'action':'search','search_terms':[], '_username': null, 'ctab_content': ctab_content, 'project':document.getElementById('project_selection').value};

	import_from_string(ctab_content);

	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
			[{'action': 'as_svg', 'ctab_content': ctab_content}],
			null,
			false,
			function(objs, err){
				if(err != null){
					show_message('Error fetching compounds',err);
				}else{
					var ctab_key = CryptoJS.MD5(ctab_content).toString(CryptoJS.enc.Base64);

					var mol_image = objs[0].svg_content;

					mol_image = mol_image.replace(/svg:/g,'');
					mol_image = mol_image.replace("width='300px'","width='100px'");
					mol_image = mol_image.replace("height='300px'",'height="100px" viewBox="0 0 300 300"');

					ctab_to_image[ctab_key] = mol_image;

					new_fetch(true);
				}
			}
	);
}

function search_term_changed(){
	if(term_search_in_progress){
		setTimeout(function(){
			search_term_changed();
		}, 500);
		return;
	}

	var search_field = document.getElementById('search_selection');
	var search_options = document.getElementById('search_matches');
	var search_term = search_field.value;

	if(search_term == last_search_term){
		return;
	}

	term_search_in_progress = true;

	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:FastFetch',
			[{'find_terms': search_term, '_username': null}],
			null,
			false,
			function(objs, err){
				if(err != null){
					show_message('Error fetching terms',err);
				}else{
					var childrenToRemove = [];
					for(var i=0;i<search_options.childNodes.length;i++){
						childrenToRemove.push(search_options.childNodes[i]);
					}

					for(var i=0;i<childrenToRemove.length;i++){
						search_options.removeChild(childrenToRemove[i]);
					}

					var entities = objs[0].entities;
					
					for(var i=0;i<entities.length;i++){
						var entity = entities[i];
						var term = entity.entity_id;
						
						var option = document.createElement('option');
						option.setAttribute('value', term);
						option.appendChild(document.createTextNode(term));

						option.addEventListener('blur', function(e){
							if(search_options.length == 1){
								search_options.selectedIndex = 0;
								
								if ("createEvent" in document) {
								    var evt = document.createEvent("HTMLEvents");
								    evt.initEvent("change", false, true);
								    search_options.dispatchEvent(evt);
								}else{
									search_options.fireEvent("onchange");
								}
							}
						});
						
						search_options.appendChild(option);
					}

					term_search_in_progress = false;
					last_search_term = search_term;
				}
			}
	);
}

function ctab_has_structure(ctab_content){
	var ctab_real = false;
	if(ctab_content != null && ctab_content != ''){
		var line_count = ctab_content.split('\n').length;
		if(line_count == 6){
			ctab_real = false
		}else{
			ctab_real = true;
		}
	
	}
	
	return ctab_real;
}

function search(){
	var ctab_content = get_mol_file();
	
	var terms = search_control[0].selectize.items;
	
	var wildcard_input = document.getElementById('wildcard_search');
	
	if(wildcard_input.checked){
		current_fetch = {'action':'search','search_terms':terms, '_username': null, 'ctab_content': ctab_content, 'project':document.getElementById('project_selection').value};
	}else{
		current_fetch = {'action':'fetch_exact','ids':terms, '_username': null, 'ctab_content': ctab_content, 'project':document.getElementById('project_selection').value};
	}
	
	var ctab_real = ctab_has_structure(ctab_content);
	
	if(ctab_real){		
		saturn.core.Util.getProvider().getByNamedQuery(
				'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
				[{'action': 'as_svg', 'ctab_content': ctab_content}],
				null,
				false,
				function(objs, err){
					if(err != null){
						show_message('Error fetching compounds',err);
					}else{
						var ctab_key = CryptoJS.MD5(ctab_content).toString(CryptoJS.enc.Base64);

						var mol_image = objs[0].svg_content;

						mol_image = mol_image.replace(/svg:/g,'');
						mol_image = mol_image.replace("width='300px'","width='100px'");
						mol_image = mol_image.replace("height='300px'",'height="100px" viewBox="0 0 300 300"');

						ctab_to_image[ctab_key] = mol_image;

						new_fetch(true);
					}
				}
		);
	}else if(terms.length > 0){
		new_fetch(true);
	}else{
		fetch_all(false);
	}
}

function save_changes_ui(){
	ask_question('warning', 'Save?', 'Are you sure', 'Yes', 'No', function(confirmed){
		if(confirmed){
			save_changes();
		}
	});
}

function save_changes(){
	var compound_updates = {};
	var it = unsaved_changes.keys();
	while(it.hasNext()){
		compound_id = it.next();

		var changes = {};

		var it2 = unsaved_changes.get(compound_id).keys();
		while(it2.hasNext()){
			var field_name = it2.next();
			var field_value = unsaved_changes.get(compound_id).get(field_name);
			
			if(field_value === ''){
				field_value = null;
			}

			Reflect.setField(changes, field_name, field_value);
		}

		//changed from compound_id to id
		Reflect.setField(compound_updates, compound_id, changes);
	}

	var save_func = null;
	save_func =function(){
		saturn.core.Util.getProvider().getByNamedQuery(
				'saturn.db.provider.hooks.ExternalJsonHook:SDFRegister',
				[{'save_changes': compound_updates, '_username': null, 'project_name': get_project()}],
				null,
				false,
				function(objs, err){
					if(err != null){
						var idx = err.indexOf('Supplier not found: ');
						if(idx != -1){
							var supplierName = err.substring('Supplier not found: '.length, err.length);
							ask_question('warning', 'Registration Error', '"'+supplierName+'"<br/>Not a supplier<br/>Register?', 'Yes', 'No', function(confirmed){
								if(confirmed){
									register_supplier(supplierName, function(err){
										if(err != null){
											show_message('Supplier registration failed', err);
										}else{
											save_func();
										}
									});
								}else{

								}
							})
						}else{
							show_message('Registration Failedt',err);
						}
					}else{
						var elems = document.getElementsByClassName('compound_table_field');
						for(var i=0;i<elems.length;i++){
							elems[i].classList.remove('cell_modified');
						}

						unsaved_changes = new haxe.ds.StringMap();
						
						var compound_table_body = document.getElementById('compounds_results');
						
						var refreshed_objects = objs[0].refreshed_objects;
						for(var i=0;i<compounds.length;i++){
							if(Reflect.hasField(refreshed_objects, compounds[i].id)){
								var previous_id = compounds[i].id;
								compounds[i] = Reflect.field(refreshed_objects, compounds[i].id);
								
								var existing_elem = document.getElementById('compound_row_' + previous_id);
								
								add_row(compound_table_body,compounds[i], existing_elem);
							}
						}
						
						update_paging_panel();
					}
				}
		);
	};

	save_func();
}



function search_structure(){
	var ctab_content = get_mol_file();
	current_fetch = {'ctab_content':ctab_content, '_username': null};

	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
			[{'action': 'as_svg', 'ctab_content': ctab_content}],
			null,
			false,
			function(objs, err){
				if(err != null){
					show_message('Error fetching compounds',err);
				}else{
					var ctab_key = CryptoJS.MD5(ctab_content).toString(CryptoJS.enc.Base64);

					var mol_image = objs[0].svg_content;

					mol_image = mol_image.replace(/svg:/g,'');
					mol_image = mol_image.replace("width='300px'","width='100px'");
					mol_image = mol_image.replace("height='300px'",'height="100px" viewBox="0 0 300 300"');

					ctab_to_image[ctab_key] = mol_image;

					new_fetch(true);
				}
			}
	);
}

function toggle_advanced_register(){
	if(document.getElementById('advanced_register_options_btn').innerHTML == 'Advanced Options'){
		document.getElementById('advanced_register_options').style.display = 'block';
		document.getElementById('advanced_register_options_btn').innerText = 'Hide Options';
	}else{
		document.getElementById('advanced_register_options').style.display = 'none';
		document.getElementById('advanced_register_options_btn').innerHTML = 'Advanced Options';
	}
}

function check_reg_form(){
	var password = document.getElementById('reg_password').value;
	var password_confirm = document.getElementById('reg_password_confirm').value;
	var first_name = document.getElementById('reg_first_name').value;
	var last_name = document.getElementById('reg_last_name').value;
	var email = document.getElementById('reg_email').value;
	var username = document.getElementById('reg_username').value;

	if(password == password_confirm &&
			first_name != null && first_name != '' &&
			last_name != null && last_name != '' &&
			email != null && email != '' &&
			username != null && username != ''
	){
		document.getElementById('reg_submit').removeAttribute('disabled');
	}else{
		document.getElementById('reg_submit').disabled = true;
	}
}

function ask_question(type, title, message, confirmText, cancelText, cb){
	swal({
		title: title,
		text: message,
		html: message,
		type: type,
		showCancelButton: true,
		confirmButtonText: confirmText,
		cancelButtonText: cancelText,
		confirmButtonClass: 'confirm_button',
		cancelButtonClass: 'cancel_button',
		confirmButtonColor: '#33C3F0'
	}).then(function(){
		cb(true)
	}, function(dismiss){
		cb(false);
	});
}

function show_message(title,message){
	swal({
		title: title,
		text:message,
		type: "info",
		customClass: 'comp_reg',
		okButtonClass: 'confirm_button',
		confirmButtonClass: 'confirm_button',
		cancelButtonClass: 'cancel_button',
	});
}

function register(){
	var password = document.getElementById('reg_password').value;
	var first_name = document.getElementById('reg_first_name').value;
	var last_name = document.getElementById('reg_last_name').value;
	var email = document.getElementById('reg_email').value;
	var username = document.getElementById('reg_username').value;

	var request = {
			'first_name': first_name,
			'last_name': last_name,
			'email': email,
			'username': username,
			'password': password,
			'mode': 'register'
	}

	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Register',
			[request],
			null,
			false,
			function(objs, err){
				if(err != null){
					show_message('Registration Failed',err);
				}else{
					var response = objs[0];
					var outcome = response.outcome
					if(outcome == 'success'){
						_login(username, password);
					}else{
						if(Reflect.hasField(response,'message')){
							show_message('Registration Error',response.message);
						}else{
							show_message('Registration failed','');
						}
					}
				}
			}
	);
}

function switch_screen(screen_id){
	if(screen_id == 'search' && enable_structure_field()){
		document.body.onresize=function(){import_from_string(get_mol_file());}
	}else{
		document.body.onresize=null;
	}
	
	var screens = ['login_progress','home','registration','upload', 'results', 'login', 'search', 'password_reset_link', 'help'];
	for(var i=0;i<screens.length;i++){
		var screen = screens[i];
		if(screen == screen_id){
			if(screen == 'results' || screen == "login" || screen == "search" || screen == 'home' || screen == 'help'){
				if(screen == 'search'){
					document.getElementById(screen).style.top='0';
					document.getElementById(screen).style.position='initial';
					
				}
				document.getElementById(screen).style.display='flex';
			}else{
				document.getElementById(screen).style.display='block';
				
			}
			
			var screen_btn = document.getElementById(screen + '_button');
			if(screen_btn != null){
				screen_btn.classList.add('screen_selected');
			}

		}else{
			if(screen == 'search'){
				document.getElementById(screen).style.top='-2000px';
				document.getElementById(screen).style.position='fixed';
			}else{
				document.getElementById(screen).style.display='none';
				
			}
			
			var screen_btn = document.getElementById(screen + '_button');
			if(screen_btn != null){
				screen_btn.classList.remove('screen_selected');
			}
		}
	}
	
	document.getElementById('save_structure').style.display='none';
	
	document.getElementById('search_input_container').style.display='block';
	document.getElementById('search_wildcard_label').style.display='block';
	document.getElementById('wildcard_search').style.display='initial';
	document.getElementById('wildcard_search_span').style.display='initial';
	document.getElementById('search_button_container').style.display='block';
	document.getElementById('search_button_search').style.display='initial';
	
	
	if(screen == 'login'){
		document.getElementById('title').style.display = 'block';
	}else{
		document.getElementById('title').style.display = 'none';
	}
}

function update_structure_ui(entity_id, structure_btn){
	switch_screen('search');

	document.getElementById('search_input_container').style.display='none';
	document.getElementById('search_button_container').style.display='none';
	document.getElementById('save_structure').style.display='block';
	
	entity_structure_to_update = entity_id;
	entity_structure_to_update_btn = structure_btn;
}

function convert_smiles_to_ctab(smiles, cb){
	saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
			[{'action': 'convert_smiles_to_ctab', 'smiles': smiles}],
			null,
			false,
			function(objs, err){
				var ctab_content = null;
				
				if(err == null && objs != null && objs.length > 0){
					ctab_content = objs[0].ctab_content;
				}
				
				cb(ctab_content, err);
			}
	);
}

function update_structure(ctab_content, compound_id, compound_button){
	if(ctab_content == null){
		ctab_content = get_mol_file();
	}
	
	if(ctab_has_structure(ctab_content)){
		current_fetch = {'ctab_content':ctab_content, '_username': null};

		saturn.core.Util.getProvider().getByNamedQuery(
			'saturn.db.provider.hooks.ExternalJsonHook:Fetch',
			[{'action': 'as_svg', 'ctab_content': ctab_content}],
			null,
			false,
			function(objs, err){
				if(err != null){
					show_message('Error fetching compounds',err);
				}else{
					if(compound_button != null){
						entity_structure_to_update_btn = compound_button;
						entity_structure_to_update = compound_id;
					}
					
					var ctab_key = CryptoJS.MD5(ctab_content).toString(CryptoJS.enc.Base64);

					var mol_image = objs[0].svg_content;
					
					mol_image = mol_image.replace(/svg:/g,'');
					mol_image = mol_image.replace("width=\"200pt\"","width='100%'");
					mol_image = mol_image.replace("height=\"200pt\"",'viewBox="0 0 200 200"');
					
					for(var i=0;i<compounds.length;i++){
						if(compounds[i].id == entity_structure_to_update){
							compounds[i].mol_image = mol_image;
							
							on_field_change('compound_sdf', compounds[i].compound_sdf, entity_structure_to_update, ctab_content, entity_structure_to_update_btn);
							
							compounds[i].compound_sdf = ctab_content;
							
							break;
						}
					}
					
					entity_structure_to_update_btn.innerHTML = mol_image;
					entity_structure_to_update_btn.style.display = 'inline-block';
					
					switch_screen('results');
				}
			}
		);
	}else{
		for(var i=0;i<compounds.length;i++){
			if(compounds[i].id == entity_structure_to_update){
				compounds[i].mol_image = null;
				compounds[i].compound_sdf = null;
				
				on_field_change('compound_sdf', compounds[i].compound_sdf, entity_structure_to_update, '', entity_structure_to_update_btn);
			}
		}
		entity_structure_to_update_btn.innerHTML = '';
		
		switch_screen('results');
		
		entity_structure_to_update_btn.style.display = 'inline-block';
	}
}

//https://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-get-parameters
function get_query_params(qs) {
	qs = qs.split('+').join(' ');

	var params = {},
	tokens,
	re = /[?&]?([^=]+)=([^&]*)/g;

	while (tokens = re.exec(qs)) {
		params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
	}

	return params;
}

function show_password_reset(){
	switch_screen('password_reset_link');
}

function reset_password_link(){
	var password1 = document.getElementById('password_token_reset1').value;
	var password2 = document.getElementById('password_token_reset2').value;

	if(password1 != password2){
		show_message('Passwords don\'t match');
	}else{
		var query_params = get_query_params(location.search);
		var reset_token = query_params.reset_code;
		var username = query_params.username;

		var request = {
				'mode': 'reset_password_token',
				'username': username,
				'password': password1,
				'reset_token': reset_token
		};

		saturn.core.Util.getProvider().getByNamedQuery(
				'saturn.db.provider.hooks.ExternalJsonHook:Register',
				[request],
				null,
				false,
				function(objs, err){
					if(err != null){
						show_message('Password reset error',err);
					}else{
						ignore_reset = true;
						_login(username, password1);
					}
				}
		);
	}
}

function on_password_key_down(e){
	if(e.keyCode == 13){
		login();
	}
}

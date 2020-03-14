var CURR_USER = "";
var CURR_USER_PHOTO = "";
var CURR_USER_EMAIL = "";
var TASK_ID_FOR_CONFIRM = null;

window.onload = function() {
	/* Grab references for the Modal functionality*/
	const button = document.getElementById('create_task');
	button.addEventListener('click', function(e) {
		add_task();
	});

	/* MODAL for creating a new task */
	var create_modal = document.getElementById("create_modal");
	var create_x_out = document.getElementById('create_modal_close');
	create_x_out.onclick = function() {
		create_modal.style.display = "none";
	}
	var create_task_button = document.getElementById('create_task_btn');
	create_task_button.onclick = function() {
		create_modal.style.display = "none";
	}

	/* MODAL for confirming that you want to take on a task*/
	var confirm_modal = document.getElementById("confirm_modal");
	var confirm_x_out = document.getElementById('confirm_modal_close');
	confirm_x_out.onclick = function() {
		confirm_modal.style.display = "none";
	}
	var submit_task_button = document.getElementById('confirm_task_btn');
	submit_task_button.onclick = function() {
		confirm_modal.style.display = "none";
		confirmTaskFinal();
	}


	/* MODAL close a modal if user clicks outside of it*/
	window.onclick = function(event) {
		if (event.target == create_modal || event.target == confirm_modal) {
			confirm_modal.style.display = "none";
			create_modal.style.display = "none";
		}
	}

	/* UX for changing a date from a visible date to a dropdown calendar */
	$(document.body).on('focus', '.duedate-field', function() {
		$(this).attr("type", "date");
	});
	$(document.body).on('blur', '.duedate-field', function() {
		$(this).attr("type", "text");
	});

	/* UX show the create a task confimration when click 'Create Task' on navbar */
	$(document.body).on('click', '.create_task', function() {
		$('.create_modal').show();
	});
	$(document.body).on('click', '.exit-create', function() {
		$(this).parent().parent().parent().remove();
	});

	/* UX show the confirm you want to take this task when click 'Help me!' on task */
	$(document.body).on('click', '.sign_up_task', function() {
		confirmTaskPopup($(this));
	});

	/* Event listener to catch 'Edit Task' action */
	$(document.body).on('click', '#edit_task', function() {
		update_task($(this), $(this).parent().parent().find("#task_id").val());
	});


	/******************************AJAX CALLS******************************/
	$.get( "/userinfo", function( data ) {
		CURR_USER = data[0]['fullname'];
		CURR_USER_PHOTO = data[0]['photo']['data'];
		CURR_USER_EMAIL = data[0]['email'];
	});

	$.get("/tasks", function( data ) {
		for(const task in data){
			create_card(data[task]);
		}
	});
}

/* UX when a new task is created, physically create a new element to show user on screen */
function add_task(){
	/* HTML written entirely in plain html, can adjust but contains globals for photo and username */
	var begin_of_list = document.getElementById('list_begin_point');
	begin_of_list.insertAdjacentHTML('afterbegin', '<div class="container task_container"><div class="row"><div class="company-header-avatar" style="background-image: url('+photoLink(CURR_USER_PHOTO)+')"></div><div class="card-col"><div class="label label-default label-outlined label-name">'+CURR_USER+'</div></div><div class="card-col"><input type="text" class="form-control hours-field" placeholder="Hours Expected"></div><div class="card-col"><input type="text" class="form-control duedate-field" placeholder="Due Date"></div><div class="card-col"><input type="text" class="form-control description-field" placeholder="Task Description"></div><div class="card-col"></button><input type="button" class="form-control create_task" value="Submit."></div><button type="button" class="close" aria-label="Close"><span class="exit-create" aria-hidden="true">&times;</span></div></div>');
}

/* MODAL action for handling the elements changing when a new task is added to the board */
function createTaskPopup(task_data){
	/* Change the css */
	$(this).parent().parent().parent().addClass("curr-user card")
	/* Create a new button and add it to the card */
	var helpme_input = document.createElement('input');
	helpme_input.className = 'form-control sign_up_task';
	helpme_input.type = 'button';
	helpme_input.value = 'Help Me!';
	$(this).parent().append(helpme_input);
	
	/* Get rid of the 'cancel' aria-label */
	$(this).parent().parent().find(".close").remove();

	/* get rid of the old 'confirm' button */
	$(this).hide();

	/* AJAX */
	/* prep for the ajax by sending all database into one object */
	var task_info_for_db = {};
	task_info_for_db["task_duration"] = $(this).parent().parent().find(".hours-field").val()
	task_info_for_db["task_duedate"] = $(this).parent().parent().find(".duedate-field").val()
	task_info_for_db["task_description"] = $(this).parent().parent().find(".description-field").val()
	task_info_for_db["user_fullname"] = CURR_USER;
	task_info_for_db["is_active"] = 1;
	/* POST */
	insert_task_db(task_info_for_db);
}

/* AJAX Post to update task info in db */
function update_task(update_element, task_id){

	/* create an object holding only the values that changed */
	var hours_changed = update_element.parent().parent().find(".hours-field").val();
	var duedate_changed = update_element.parent().parent().find(".duedate-field").val();
	var description_changed = update_element.parent().parent().find(".description-field").val();
	
	/* the data object should contain the existing info as a shortcut so unchanged data is not affected */
	var update_task_data = {};
	if(hours_changed != "")
		update_task_data.hours = formatHours(hours_changed);
	else
		update_task_data.hours = formatHours(update_element.parent().parent().find(".hours-field").attr('placeholder'));
	if(duedate_changed != "")
		update_task_data.duedate = formatDate(duedate_changed);
	else
		update_task_data.duedate = formatDate(update_element.parent().parent().find(".duedate-field").attr('placeholder'));
	if(description_changed != "")
		update_task_data.description = description_changed
	else
		update_task_data.description = update_element.parent().parent().find(".description-field").attr('placeholder');
	
	update_task_data.id = task_id;
	console.log(JSON.stringify(update_task_data));
	$.post("/update_task", update_task_data, function(data){
		console.log(data);
	})

}

/* SUBFUNCTION helper to change date from verbal Month Day, Year to YYYY-MM-DD */
function formatDate(date) {
    var d = new Date(date),
        month = '' + (parseInt(d.getMonth()) + 1),
        day = '' + (parseInt(d.getDate()) + 1),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

/* SUBFUNCTION helper to change hours from X days to X */
function formatHours(hours){
	return parseInt(hours);
}

/* AJAX POST to insert task into db */
function insert_task_db(task_info){
	console.log(task_info);
	$.post("/tasks", task_info, function ( data ){
		console.log(data);
	})
}

/* MODAL shows the modal for when user wants to sign up for a task */
function confirmTaskPopup(task_data){
	$('.confirm_modal').show();
	TASK_ID_FOR_CONFIRM = task_data;
}

/* SUBFUNCTION called when user confirms they want to sign up for a task */
function confirmTaskFinal(){
	/* CSS change to a grey-ed out task*/
	TASK_ID_FOR_CONFIRM.parent().parent().parent().appendTo( $('#completed_tasks') );
	TASK_ID_FOR_CONFIRM.parent().parent().parent().removeClass("active")
	TASK_ID_FOR_CONFIRM.parent().parent().parent().addClass("complete")
	TASK_ID_FOR_CONFIRM.hide();

	makeInactive(TASK_ID_FOR_CONFIRM.parent().parent().find('#task_id').val());

	/* EMAIL */
	sendEmails();
}

/* SUBFUNCTION called to update DB to reflect that a task has been assigned*/
function makeInactive(task_id){
	var data_for_inactive = {'task_id':task_id};
	console.log(data_for_inactive);

	$.post("/make_inactive", data_for_inactive, function(data){
		console.log(data);
	})
}

/* EMAIL when a task is confirmed by user, request NODE to send email to both taskMASTER and taskTAKER*/
function sendEmails(){
	/*
		TODO: change the names to be consistent and more readable.
	*/ 

	/* AJAX */
	/* Prepare info for the content of the emails and use names as identifiers to get recipient emails */
	var task_hirer_name = TASK_ID_FOR_CONFIRM.parent().parent().find('.label-name').text();
	var task_description_text =  TASK_ID_FOR_CONFIRM.parent().parent().find('.label-description').text();
	let data_for_email = {taskmaster_name : task_hirer_name, tasktaker_email : CURR_USER_EMAIL, task_taker_name : CURR_USER, task_description: task_description_text}
	// console.log(data_for_email);

	/** POST **/
	$.post("/email", data_for_email, function(data){
		console.log(data);
	})
}

/* MIDDLEWARE handles creating a link for rendering photos */
/*
	buffer: INPUT - image buffer returned from db, assume jpeg
	return: imageUrl - a link that can be inserted into an img element or a div element
*/
function photoLink(buffer){
	var arrayBufferView = new Uint8Array( buffer );
    var blob = new Blob( [arrayBufferView], { type: "image/jpeg" } );
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL( blob );
    return imageUrl;
}


/* MIDDLEWARE handles creating each card from info returned by the db */
function create_card(task){
	console.log(task);
	var is_belong_curr_user = false;
	//divide between editable by user and not
	if(task['fullname'] == CURR_USER){
		is_belong_curr_user = true;
	}
	var is_active = task['is_active'];

	var container = document.createElement('div');
	if(Boolean(is_active==1)){
		if(is_belong_curr_user)
			container.className = 'container card curr-user';
		else
			container.className = 'container card active';
	}else{
		container.className = 'container card complete';
	}

	var row = document.createElement('div');
	row.className = 'row';
	container.appendChild(row);

	var avatar = document.createElement('div');
	avatar.className = 'company-header-avatar';

	var arrayBufferView = new Uint8Array( task['photo']['data'] );
    var blob = new Blob( [arrayBufferView], { type: "image/jpeg" } );
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL( blob );
    avatar.style = "background-image: url("+imageUrl+")";

	row.appendChild(avatar);

	var name_col = document.createElement('div');
	name_col.className = 'card-col';
	row.appendChild(name_col);
	var name_div = document.createElement('div');
	name_div.className = 'label label-default label-outlined label-name';
	var name_content = document.createTextNode(task['fullname']);
	name_content.className="label-text";
	name_div.appendChild(name_content);
	name_col.appendChild(name_div);


	// parse MySQL datetime to js datetime
	var t = task['task_duedate'].substr(0,10).split(/-/);
	// Apply each element to the Date function
	var due_date = new Date(t[0], parseInt(t[1])-1, t[2]);
	const options = {year: 'numeric', month: 'long', day: 'numeric' };
	due_date = due_date.toLocaleDateString(undefined, options);

	// add task_id to the row and make it invisible for every task
	var task_id = document.createElement('input');
	task_id.id = "task_id";
	task_id.type = "hidden";
	task_id.value = task['idtasks'];

	row.appendChild(task_id);

	/* UX split the function depending on which type of card it is */
	/* OPTION1 not belonging to user, the card will have divs containing info from existing tasks created by other users */
	if(!is_belong_curr_user || is_active == 0){
		var hours_col = document.createElement('div');
		hours_col.className = 'card-col hours';
		row.appendChild(hours_col);
		var hours_div = document.createElement('div');
		hours_div.className = 'label label-default label-outlined label-hours';
		var hours_content = document.createTextNode(task['task_duration'] + ' days');
		hours_div.appendChild(hours_content);
		hours_col.appendChild(hours_div);


		var duedate_col = document.createElement('div');
		duedate_col.className = 'card-col duedate';
		row.appendChild(duedate_col);
		var duedate_div = document.createElement('div');
		duedate_div.className = 'label label-default label-outlined label-duedate';
		var duedate_content = document.createTextNode(due_date);
		duedate_div.appendChild(duedate_content);
		duedate_col.appendChild(duedate_div);


		var description_col = document.createElement('div');
		description_col.className = 'card-col';
		row.appendChild(description_col);
		var description_div = document.createElement('div');
		description_div.className = 'label label-default label-outlined label-description';
		var description_content = document.createTextNode(task['task_description']);
		description_content.className="label-text";
		description_div.appendChild(description_content)
		description_col.appendChild(description_div);


		var helpme_col = document.createElement('div');
		helpme_col.className = 'card-col';
		row.appendChild(helpme_col);
		if(Boolean(is_active==1)){
			var helpme_input = document.createElement('input');
			helpme_input.className = 'form-control sign_up_task';
			helpme_input.type = 'button';
			helpme_input.value = 'Help Me!';
			helpme_col.appendChild(helpme_input);
		}
	}
	/* OPTION2 belongs to user so user can edit the fields of input elements */
	else{
		var hours_col = document.createElement('div');
		hours_col.className = 'card-col';
		row.appendChild(hours_col);
		var hours_input = document.createElement('input');
		hours_input.className = 'form-control hours-field';
		hours_input.type = 'text';
		hours_input.placeholder = task['task_duration'] + ' days';
		hours_col.appendChild(hours_input);

		var duedate_col = document.createElement('div');
		duedate_col.className = 'card-col';
		row.appendChild(duedate_col);
		var duedate_input = document.createElement('input');
		duedate_input.className = 'form-control duedate-field';
		duedate_input.type = 'text';
		duedate_input.placeholder = due_date;
		duedate_col.appendChild(duedate_input);

		var description_col = document.createElement('div');
		description_col.className = 'card-col';
		row.appendChild(description_col);
		var description_input = document.createElement('input');
		description_input.className = 'form-control description-field';
		description_input.type = 'text';
		description_input.placeholder = task['task_description'];
		description_col.appendChild(description_input);

		var helpme_col = document.createElement('div');
		helpme_col.className = 'card-col';
		row.appendChild(helpme_col);
		if(Boolean(is_active==1)){
			var helpme_input = document.createElement('input');
			helpme_input.className = 'form-control edit_task';
			helpme_input.id = 'edit_task';
			helpme_input.type = 'button';
			helpme_input.value = 'Edit Task';
			helpme_col.appendChild(helpme_input);
		}
	}

	////
	document.getElementById('list_begin_point').appendChild(container);
}

// index.js

/**
 * Required External Modules
 */
const express = require("express");
const path = require("path");
const util = require('util');
const nodemailer = require('nodemailer');


/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || "8000";

/**
 *  App Configuration
 */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(express.json());


/**
 * Routes Definitions
 */
app.get("/", (req, res) => {
  res.render("layout", { title: "Home" });
});

/**
* Database connection options
*/
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'pass',
  database: 'Deloitte_User'
});

/**
* Email handler options
*/
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yale.user117@gmail.com',
    pass: 'Yaleissocool12'
  }
});
var mailOptions = {
  from: 'yale.user117@gmail.com',
  to: 'recipientEmail',
  subject: 'Taskmaster has matched you and/or your task.',
  text: 'Taskmaster message \n'
};
app.post("/email", (req, res) => {
	connection.query('select email from user where user.fullname = "'+req.body.taskmaster_name+'"', (err, rows) => {
		if(err) throw err;

		var task_master_email = rows[0].email;
		var task_taker_email = req.body.tasktaker_email;
		console.log(task_master_email + ', ' + task_taker_email + ", " + req.body.task_taker_name);

		//send email
		mailOptions.to = [task_master_email, task_taker_email];
		mailOptions.text = mailOptions.text.concat(req.body.taskmaster_name, ", your task has been accepted by ", req.body.task_taker_name,"\nFor the task:\n",req.body.task_description,"\nHappy tasking :)");
		console.log(mailOptions);
		var email_status = 0;
		transporter.sendMail(mailOptions, function(error, info){
		  if (error) {
		    console.log(error);
		  } else {
		    console.log('Email sent: ' + info.response);
		    email_status = 1;
		  }
		});

		res.send({"email_status": email_status});
	})
});


/**
	MySQL setup/options
*/
connection.connect((err) => {
	if(err) throw err;
	console.log('connected');
});
app.get("/userinfo", (req, res) => {
	connection.query('SELECT * from User', (err, rows) => {
		if(err) throw err;

		console.log(rows);
		res.send(rows);
	})
});
app.get("/tasks", (req, res) => {
	connection.query('SELECT * from tasks left join user on tasks.task_user_id = User.id_user order by tasks.is_active desc, tasks.task_duedate asc', (err, rows) => {
		if(err) throw err;

		console.log(rows);
		res.send(rows);
	})
});
app.post("/tasks", (req, res) => {
	console.log(req.body.task_duration);
	console.log(req.body.task_duedate);
	console.log(req.body.task_description);
	console.log(req.body.is_active);
	console.log(req.body.user_fullname);

	var insert_query = 'insert into tasks(task_duration, task_duedate, task_description, is_active, task_user_id) select cast("'+req.body.task_duration+'" as UNSIGNED), cast("'+req.body.task_duedate+'" as date), "'+req.body.task_description+'",  1, id_user from user where fullname = "'+req.body.user_fullname+'"';

	console.log(insert_query);
	connection.query(insert_query, (err, results, fields) => {
		if(err) throw err;
		console.log(results);
		res.send(results);
	});
});
app.post("/make_inactive", (req, res) => {
	console.log(req.body);

	var inactive_query = 'update tasks set is_active = 0 where idtasks = '+req.body.task_id+';'

	//Update value of is_active of the idtask 
	connection.query(inactive_query, (err, results, fields) => {
		if(err) throw err;
		console.log(results);
		res.send(results);
	});
});
app.post("/update_task", (req, res) => {
	console.log(req.body);

	var update_task_query = 'update tasks set task_duration = '+req.body.hours+', task_duedate = "'+req.body.duedate+'", task_description ="'+req.body.description+'" where idtasks = '+req.body.id+';'

	//Update the info for the specified task
	connection.query(update_task_query, (err, results, fields) => {
		if(err) throw err;
		console.log(results);
		res.send(results);
	});
});

/**
 * Server Activation
 */
 app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
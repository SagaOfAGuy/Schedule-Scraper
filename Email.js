require('dotenv').config({path: '.env'});
const mailer = require("nodemailer");
const fs = require("fs");
const ScheduleFinder = require('./Schedule');
const emailHTML = fs.readFileSync("./html/Alert.html");
const errorHTML = fs.readFileSync("./html/Error.html");
const cron = require('node-cron');
const winston = require('winston');
const { send } = require('process');
// Build logger
const logger = winston.createLogger({
	format: winston.format.combine(
    		winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    		winston.format.prettyPrint()
  	),
    transports: [
        new winston.transports.File({ filename: './logs/email.log' })
	]
});
// Send Email Notification
async function Send() {
	const recipients = process.env.RECIPIENTS;
	const recipList = recipients.split(',');	
	let sender =  mailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: process.env.EMAIL,
			pass: process.env.EMAIL_PASS,
		},
		tls: {
			minVersion: 'TLSv1'
		}
	});
	try {
		for(var recip in recipList) {
			let message =  await sender.sendMail({
				from: `"Schedule Bot" ${process.env.EMAIL}`,
				to: [recipList[recip]],
				subject: 'Work Schedule',
				html: emailHTML,
				attachments: 
				[{
					filename:"Calendar1.png",
					cid: "unique@calendar",
					path: "./Calendar1.png"
				},
				{
					filename: "Schedule.ics",
					path: "./Schedule.ics"
				}]
				});
			}
		logger.info("Email Successfully Sent");
		return Promise.resolve(1);
	} catch(error) {
		// Send error email if Files are missing or error occurs
		for(var recip in recipList) {
			let errormessage = await sender.sendMail({
				from: `"Schedule Bot" ${process.env.EMAIL}`,
				to: [recipList[recip]],
				subject: 'Schedule Error',
				html: errorHTML,
			});
		}
		logger.info("Something has gone wrong",error.message);
		return Promise.resolve(0);
	}
}
// Delete old files
async function Cleanup() { 
	var files = ["./Calendar1.png","./Data.html","./Schedule.ics"];
	files.forEach(file => {
		fs.unlink(file, (err) => {
			if (err) {
				throw err;
				logger.error("File does not exist", err.message);
				return Promise.resolve(0);
			}
			logger.info("File is deleted.");
			return Promise.resolve(1);
		});
	})
}
// Schedule tasks 
function run(min,hr,day) {
	cron.schedule(`${min} ${hr} * * ${day}`, async() => {
		await ScheduleFinder.ScrapeCheck(process.env.K_USERNAME, process.env.K_PASSWORD);
		await Send();
		await Cleanup();
	});
}
// Run every week given crontab string. In this case, this script runs every week on Saturday @ 3:00PM
run(0,15,6);

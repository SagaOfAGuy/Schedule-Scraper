// Load environment variables
require('dotenv').config({path: '.env'});
// Import required libraries
const puppeteer = require('puppeteer');
const fs = require('fs'); 
const winston = require('winston');
//Import Module that creates ICS file
const icswriter = require('./CreateICS');
// Create logger
const logger = winston.createLogger({
	format: winston.format.combine(
    		winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    		winston.format.prettyPrint()
  	),
    transports: [
        new winston.transports.File({ filename: './logs/schedule.log' })
	]
});
// Scrape schedule data
async function Scrape(username,password) {
		// Setup browser config
		const browser = await puppeteer.launch({
			headless: true,
			args: ['--incognito','--start-fullscreen','--no-sandbox','--disable-setuid-sandbox']
		});
		const page = await browser.newPage();
		await page.setViewport({width:1920, height:1080,deviceScaleFactor:1.75})
		// Go to scheduling site and login with credentials
		await page.goto(process.env.CALENDAR_LINK);
		const user = await page.$("#KSWUSER");
		const pass = await page.$("#PWD");
		await user.type(username);
		await pass.type(password);
		await page.click('[value="I AGREE"]');
		// Catch if user is already logged in
		try { 
			await page.waitForNavigation({waitUntil: 'domcontentloaded'});
			const loggedInBtn = await page.$("#btnContinue");
			await loggedInBtn.click();
			logger.info("Already logged in");
			await page.waitForNavigation({waitUntil: 'domcontentloaded'});
		}
		catch(err) {
			logger.error("Fresh Login", err.message);
		}
		finally {
				try {
				// Download HTML 
				const calendar = await page.$("#calendar");
				const html = await calendar.evaluate(() => document.querySelector('#calendar').outerHTML);
				fs.writeFileSync("Data.html",html);
				logger.info("Data downloaded"); 
				// Go to main site
				await page.goto(process.env.MAIN_LINK, {waitUntil:'domcontentloaded'});
				// Check if second tab is present on site
				await page.waitForSelector("#ui-id-2", {
					visible:true,
				});
				// Delete blocking element
				await page.evaluate(() => {
					document.querySelector("body > div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-front.no-close.ui-draggable.ui-resizable").remove();
					document.querySelector("#ui-id-2").click();
				}); 
				// wait until calendar is detected on DOM
				await page.waitForSelector("#cal", {
					visible:true,
				});
				// Take screenshot of schedule
				const calendarImg = await page.$("#cal > tbody");
				await calendarImg.screenshot({path: 'Calendar1.png'});
				logger.info("Screenshot Taken");
				await browser.close();
				logger.info("Browser closed.");
				return Promise.resolve('success');
			}
			catch(err) {
				logger.info("Could not retrieve Schedule screenshot");
				return Promise.resolve('error');
			}	
		}
}
// Checks if data is downloaded and starts to write ICS file afterwards
async function ScrapeCheck(username,password) {
	var scrapeCheck = await Scrape(username,password);
	while(scrapeCheck != 'success') {
		console.log("Failure. Trying again...");
		scrapeCheck = await Scrape(username, password);
	}
	await icswriter.write("Data.html","Schedule.ics");
}
// Export ScrapeCheck method
module.exports = {
	ScrapeCheck,
}

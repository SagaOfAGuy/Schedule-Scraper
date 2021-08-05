const { convert } = require('html-to-text');
const fs = require('fs');
// Build logger
const winston = require('winston');
const logger = winston.createLogger({
	format: winston.format.combine(
    		winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    		winston.format.prettyPrint()
  	),
    transports: [
        new winston.transports.File({ filename: './logs/ics.log' })
	]
});
// Write shifts to ICS file
async function write(htmlText,filename) {
	try {
		var htmlFile = fs.readFileSync(htmlText);
		var plainText = convert(htmlFile);
		var datesText = plainText.split('*');
		const shifts = [];
		const date = new Date();
		const year = date.getFullYear();
		datesText.forEach(e => {
			if(e.length >= 41) {
				shifts.push(e); 
			}
		});
		const calendarStart = startCal();
		const calendarEnd = endCal();
		fs.writeFileSync(filename,calendarStart, {flag: 'w'});
		shifts.forEach(shift => {
			const month = shift.substring(1,3);
			const day = shift.substring(4,6);
			const times = shift.match(/([0-9]|[0-9][0-9])[:][0-9][0-9]\w/g);
			const startShift = adjustTime(times[0].padStart(5,'0'));
			const endShift = adjustTime(times[1].padStart(5,'0'));
			const middle = middleCal("Kroger",year,month,day,startShift,endShift);
			fs.writeFileSync(filename,"\n"+middle,{flag:'a'});
		}); 
		fs.writeFileSync(filename,"\n"+calendarEnd,{flag:'a'});
		logger.info("ICS file created")
		return Promise.resolve(1);
	} 
	catch(error) 
	{
		loggers.log(error.message);
		return Promise.resolve(0);
	}
}
// Adjust time if shift has minutes and depending on AM/PM 
function adjustTime(time) {
	var number = parseInt(time.substring(0,2));
	var minuteRegex = /[:][0-9][0-9]/g
	var minutes = time.match(minuteRegex).toString().substring(1);
	if(time.includes("p")) {
		if(number == 12) {
			var num = "12";
			return num + minutes;
		} 
		else {
			number += 12; 
		}
	}
	else { 
		if(number == 12) {
			var num = "00";
			return num + minutes; 
		}
		number = number.toString().padStart(2,'0');
	}
	var time = number + minutes;
	return time.toString();
}
// Beginning Header of ICS file
function startCal() {
		var start = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Work Schedule
X-WR-TIMEZONE:America/New_York
BEGIN:VTIMEZONE
TZID:America/New_York
X-LIC-LOCATION:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE`;
	return start;
	}
// Middle content of ICS file
function middleCal(summary,year,month,day,start,end) {
		var middle = `BEGIN:VEVENT
DTSTART;TZID=America/New_York:${year}${month}${day}T${start}00
DTEND;TZID=America/New_York:${year}${month}${day}T${end}00
RRULE:FREQ=DAILY;COUNT=1
DSTAMP:20201108T014109Z
CREATED:20201108T014107Z
LAST-MODIFIED:20201108T014108Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:${summary}
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:This is an event reminder
TRIGGER:-P0DT1H0M0S
DESCRIPTION:Work Schedule
END:VALARM
END:VEVENT`;
return middle; 
}
// End content of ICS file
function endCal() {
	return "END:VCALENDAR";
}
// export write method
module.exports = {
	write,
}



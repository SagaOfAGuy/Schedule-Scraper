# SecureWEB Schedule Scaping Utility

NodeJS application that screenshots  a weekly work schedule, creates an ICS with scheduled shifts, and sends them to a valid email address. 

## Prerequisites
* Have a valid SecureWEB account with working credentials
* Have a Gmail account, and ensure than an ***app password*** is enabled on the account. This app password will be used within the `.env` file we will create, and will serve as the value for the **EMAIL_PASS** variable. 

## Enabling App Passwords on Gmail Account
* To enable an app password on a gmail account, consult these instructions [here](https://support.google.com/mail/answer/185833?hl=en-GB)


## Installation

Use the NodeJS package manager [npm](https://www.npmjs.com/) to install dependencies.

```bash
# Navigate to project root
[user@user1 ~]$ cd Schedule-Scraper/

# Install dependencies via NPM
[user@user1 Schedule-Scraper]$ npm install
```

## Configure Environment Variables
Follow steps below to set environment variables needed for application:
```bash
# Create .env file
[user@user1 Schedule-Scraper]$ touch .env

# With text editor, edit .env file and fill in values for environment variables
[user@user1 Schedule-Scraper]$ vi .env

K_USERNAME=yourusername
K_PASSWORD=yourpassword
CALENDAR_LINK=https://feed-cdc.kroger.com/EmpowerESS/,DanaInfo=myeschedule.kroger.com+Schedule.aspx
EMAIL=yourdummygmailaccount
EMAIL_PASS=yourapppassword
MAIN_LINK=https://feed.kroger.com
RECIPIENTS="youremail1@gmail.com,youremail2@icloud.com"

~                                                                                                                           
~                                                                                                                           
~                                                                                                                                                                                                                                  
".env" [readonly] 9L, 332B     
```
After filling in the environmental variables, save the .env file

## Modify Execution Schedule
if you want to modify the scheduling time for this application, open the Email.js script: 
```bash
[user@user1 Schedule-Scraper]$ vi Email.js
# Example output of Email.js
~                                                                                                                                                                                                       
~                                                                            
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

```

In the output above, change the parameters for the `run()` function. The default is currently set to run at 3:00PM every Saturday.

For example, if you want to make the script wait to run every Monday at 5:00AM, you would replace `run(0,15,6)` with `run(0,5,1)`. 

If you're unfamiliar with the crontab format, take a look [here](https://github.com/node-cron/node-cron) to gain familiarity.


## Standalone Usage
If you want to run as a standalone script:

```bash
[user@user1 Schedule-Scraper]$ node Email.js
```

## Usage as a Service
First, edit the `Scheduler.service` file, and change the `ExecStart` and `WorkingDirectory` fields to match the directory path you've downloaded this project within. The `pwd` command can show your current directory path as well.

For example, if your current working directory is `/opt/node-apps/Scheduler-Scraper`, you would set this value to ***WorkingDirectory***, append Email.js to this filepath, and assign this value to the ***ExecStart*** field as seen in the sample output below:
```bash


[Unit]
# Edit the Scheduler.service file using vim
[user@user1 Schedule-Scraper]$ vi Scheduler.service

# Sample output of Scheduler.service file:
Description=Schedule retriever and notification app
after=network-online.target

[Service]
Restart=on-failure
WorkingDirectory=/opt/node-apps/Schedule-Scraper

ExecStart=/usr/local/bin/node /opt/node-apps/Schedule-Scraper/Email.js

[Install]
WantedBy=multi-user.target

```
Close and save this file.


Next it's time to execute the `LoadService.sh` file that loads Scheduler.service file to Systemd. Follow the instructions below: 
```bash

# Make sure LoadService.sh has executable permissions
[user@user1 Schedule-Scraper]$ chmod u+x LoadService.sh

# Execute script
[user@user1 Schedule-Scraper]$ sh ./LoadService.sh 

# Confirm NodeJS service is working in background
[user@user1 Schedule-Scraper]$ sudo systemctl status Scheduler

# Example output 
● Scheduler.service - Schedule retriever and notification app
     Loaded: loaded (/usr/lib/systemd/system/Scheduler.service; enabled; vendor preset: disabled)
     Active: active (running) since Sat 2021-07-31 22:53:22 EDT; 4 days ago
   Main PID: 242171 (node)
      Tasks: 11 (limit: 8773)
     Memory: 24.9M
        CPU: 1min 42.205s
     CGroup: /system.slice/Scheduler.service
             └─242171 /usr/local/bin/node /opt/node-apps/Schedule-Scraper/Email.js
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)

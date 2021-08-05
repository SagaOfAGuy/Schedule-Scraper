#!/bin/bash
sudo cp Scheduler.service /lib/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable Scheduler
sudo systemctl restart Scheduler
echo Schedule Service Loaded...

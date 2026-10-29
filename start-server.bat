@echo off
title COE-Pay Local Server
echo Starting COE-Pay local server...
powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause

@echo off

set "project_root=%~dp0.."
pushd %project_root%

set PYTHONPATH=%project_root%
call "%project_root%\.venv\Scripts\python.exe" "%project_root%\scheduled\scraper_scheduler.py"
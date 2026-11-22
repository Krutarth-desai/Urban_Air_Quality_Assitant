@echo off
python "%~dp0run.py" %*
if %ERRORLEVEL% NEQ 0 (
    pause
)

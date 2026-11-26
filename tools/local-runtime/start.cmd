@echo off
rem Start the local Jupyter kernel for the Laup notebook. Keep this window open.
rem NOTE: this file must stay ASCII-only with CRLF line endings and goto labels only.
rem Mixing "chcp 65001" with Chinese text made cmd.exe split lines and run them as
rem commands (the classic "double-click does nothing" failure), so all Chinese
rem output lives in start.py instead.
set "HERE=%~dp0"
cd /d "%HERE%"

set "PY="
where python >nul 2>nul
if not errorlevel 1 set "PY=python"
if defined PY goto have_python
where py >nul 2>nul
if not errorlevel 1 set "PY=py -3"
if defined PY goto have_python
goto no_python

:have_python
%PY% "%HERE%start.py" %*
goto end

:no_python
echo.
echo Python not found. Install Python 3 (tick "Add to PATH"), then double-click again.
echo Once only: python -m pip install jupyterlab ipykernel

:end
echo.
echo The local kernel has stopped. Press any key to close this window.
pause >nul

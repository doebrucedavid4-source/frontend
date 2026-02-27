$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$root\backend`"; .\.venv\Scripts\python manage.py runserver 8000"
)

Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$root`"; npm run dev"
)

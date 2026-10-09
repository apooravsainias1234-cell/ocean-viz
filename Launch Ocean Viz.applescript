-- Launch Ocean Viz.applescript
-- Save as an Application (see steps below) and keep the .app INSIDE the SIH1 folder,
-- next to run.sh. It finds run.sh relative to itself, so the folder can live anywhere.

on run
	set appPath to POSIX path of (path to me)
	set projectDir to do shell script "dirname " & quoted form of appPath
	set runScript to projectDir & "/run.sh"

	-- Make sure run.sh exists and is executable
	try
		do shell script "test -f " & quoted form of runScript
	on error
		display alert "run.sh not found" message "Keep this app in the same folder as run.sh:" & return & projectDir as critical
		return
	end try
	do shell script "chmod +x " & quoted form of runScript

	set cmd to "cd " & quoted form of projectDir & " && ./run.sh"

	tell application "Terminal"
		activate
		do script cmd
	end tell
end run

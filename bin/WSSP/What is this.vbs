Dim msg

msg = ""
msg = msg & "THREAT DETECTOR - HELP" & vbCrLf & vbCrLf

msg = msg & "OVERVIEW" & vbCrLf
msg = msg & "Threat Detector is a real-time camera security application designed to identify potentially dangerous situations using artificial intelligence." & vbCrLf
msg = msg & "It analyzes live video and audio to detect suspicious behavior and objects." & vbCrLf & vbCrLf

msg = msg & "DETECTED THREATS" & vbCrLf
msg = msg & "- Human presence" & vbCrLf
msg = msg & "- Faces" & vbCrLf
msg = msg & "- Knives" & vbCrLf
msg = msg & "- Guns" & vbCrLf
msg = msg & "- Rapid or abnormal movement" & vbCrLf & vbCrLf

msg = msg & "VISUAL INDICATORS" & vbCrLf
msg = msg & "- White box: Normal detected person" & vbCrLf
msg = msg & "- Red box: Potential threat detected" & vbCrLf
msg = msg & "- Background blur: Focus is placed on the detected threat" & vbCrLf & vbCrLf

msg = msg & "AUTOMATIC RECORDING" & vbCrLf
msg = msg & "- Full session video is recorded from start to exit" & vbCrLf
msg = msg & "- Suspicious activity is automatically recorded separately" & vbCrLf
msg = msg & "- Faces of suspicious individuals are automatically captured" & vbCrLf
msg = msg & "- Audio is continuously recorded during the session" & vbCrLf & vbCrLf

msg = msg & "MANUAL CONTROLS" & vbCrLf
msg = msg & "- Press 'P' to take a manual snapshot" & vbCrLf
msg = msg & "- Press 'ESC' to safely exit the application" & vbCrLf & vbCrLf

msg = msg & "SAVED FILE LOCATIONS" & vbCrLf
msg = msg & "- videos\session\        : Full session recordings" & vbCrLf
msg = msg & "- videos\suspicious\     : Automatically recorded threat clips" & vbCrLf
msg = msg & "- pics\session\          : Manual snapshots" & vbCrLf
msg = msg & "- pics\suspicious\       : Auto-captured suspicious faces" & vbCrLf
msg = msg & "- audio\                : Session audio recordings" & vbCrLf & vbCrLf

msg = msg & "SYSTEM REQUIREMENTS" & vbCrLf
msg = msg & "- Windows 10 or newer" & vbCrLf
msg = msg & "- Webcam and microphone" & vbCrLf
msg = msg & "- Python 3.9+ (for source execution)" & vbCrLf
msg = msg & "- Required Python libraries installed" & vbCrLf & vbCrLf

msg = msg & "IMPORTANT NOTES" & vbCrLf
msg = msg & "- This system is intended for monitoring and safety purposes" & vbCrLf
msg = msg & "- Detection results are AI-based and may not be 100% accurate" & vbCrLf
msg = msg & "- Always follow local laws and regulations when using surveillance software" & vbCrLf & vbCrLf

msg = msg & "EXITING" & vbCrLf
msg = msg & "All recordings are safely saved when the application is closed normally." & vbCrLf & vbCrLf

msg = msg & "Developed for internal and educational use."

MsgBox msg, vbInformation, "Threat Detector Help"

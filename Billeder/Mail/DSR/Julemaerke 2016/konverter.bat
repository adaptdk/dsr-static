# benyttet imagemagick for nedenstående
for %%f in (*.tiff) do call :konv "%%f"

pause

exit /b 0

:konv
  set png="%~n1.png"
  set png=%png:_Page_=_%
  magick convert  -resize x120 %1 %png%
GOTO :EOF

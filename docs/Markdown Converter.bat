echo The full path of the file is: %1
pause

set file="%~nx1"
echo file is: %file%

set folder=%~dp1
echo the folder is: %folder%

set filename-noext=%~n1

echo running pandoc:

echo writing docx ...
pandoc -s %file% -o "%filename-noext%.docx"
echo writing docx ...

echo complete!
pause
## This project is a simple way to transfer the leads from Vicidial to Surefire.

### To sync the leads from Vicidial to Surefire over time you can set up a windows task to run [this](scheduled/run_scheduled.bat) script however often you want.

I know this isn't the best way to do it however, due to the small number of leads that are being transferred, I thought
it would be easier to just do it this way. If you are reading this and are trying to create a better way I would look at
the Vicidial database and transfer it into the Surefire database that way rather than the large overhead from Selenium.
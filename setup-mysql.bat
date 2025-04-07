@echo off
echo Starting MySQL Database Setup...
echo.

REM Check if the database exists, create if it doesn't
echo Creating database (if it doesn't exist)...
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS blockvote;"

REM Run the MySQL seed script
echo Running seed script to create tables and add initial data...
npx tsx scripts/mysql-seed.ts

echo.
echo MySQL setup complete!
echo.
echo You can now start the application with:
echo npm run dev
echo.
pause
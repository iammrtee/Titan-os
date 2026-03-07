@echo off
title TitanOS Autopost Setup
echo.
echo ==================================================
echo   🚀 TitanOS - Multi-Platform Bot Setup
echo ==================================================
echo.

:menu
echo Select which platform you want to link:
echo [1] Instagram / Facebook (Meta)
echo [2] X (Twitter)
echo [3] LinkedIn
echo [4] TikTok
echo [5] EXIT
echo.
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto meta
if "%choice%"=="2" goto xtwitter
if "%choice%"=="3" goto linkedin
if "%choice%"=="4" goto tiktok
if "%choice%"=="5" exit

:meta
echo.
echo Opening Instagram/Facebook login...
cd autopost
node saveAuth.js
cd ..
goto menu

:xtwitter
echo.
echo Opening X (Twitter) login...
cd autopost
node saveAuthX.js
cd ..
goto menu

:linkedin
echo.
echo Opening LinkedIn login...
cd autopost
node saveAuthLinkedIn.js
cd ..
goto menu

:tiktok
echo.
echo Opening TikTok login...
cd autopost
node saveAuthTikTok.js
cd ..
goto menu

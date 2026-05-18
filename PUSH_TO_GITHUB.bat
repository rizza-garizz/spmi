@echo off
echo ==========================================
echo    FORCE PUSH TO GITHUB (rizza2/spmi)
echo ==========================================
echo.
echo Laptop kamu akan meminta login ulang. 
echo Pastikan kamu login pakai akun RIZZA2.
echo.
pause
git -c credential.helper= push -u origin main --force
echo.
echo ==========================================
echo Selesai! Cek di https://github.com/rizza2/spmi
echo ==========================================
pause

@echo off
rem Lance l'agent YouTube depuis la racine du depot (ce fichier vit dans scripts).
cd /d "%~dp0.."
if not exist "logs" mkdir "logs"
node scripts\youtube-culte-agent.mjs >> "logs\youtube-agent.log" 2>&1
echo Done at %date% %time% >> "logs\youtube-agent.log"

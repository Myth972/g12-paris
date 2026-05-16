@echo off
cd /d "C:\Users\Myth972\Documents\g12-paris-infos-medias-main\Production en cours"
node scripts\youtube-culte-agent.mjs
echo Done at %date% %time% >> logs\youtube-agent.log
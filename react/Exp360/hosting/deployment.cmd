#npm run bundle
rm -rf public\*.*
copy /Y ..\build\index.bundle.js public
copy /Y ..\build\client.bundle.js public
mkdir public\static_assets
copy /Y ..\static_assets\*.* public\static_assets
copy /Y ..\index-prod.html public\index.html
#firebase deploy
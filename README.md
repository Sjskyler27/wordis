# Vue game setup
this is a seed for making games with vue

# WHEN YOU DOWNLOAD
update TITLEHERE in package and vite config main.cjs 

main.cjs steamworks will need the key.

update app_background in build

# immediate deployments
netlify attach github no variables needed yet
railway attach github, set port 8080 and copy the websocket url for netlify 

in netlify add VITE_WS_HOST new url and VITE_WS_PORT 8080



# local development
built with node 20.13
npm 10.5.2

get started locally 

npm install

add git ignore 
publish to github

add .env


to run locally 
npm run dev


npm run dev for one instance 
or yarn run dev -- --host 0.0.0.0 --port 5173   to test websockets with 2 instances 


to run local and a executable test 
npm run start 


# Updating Full Website
  can be hosted through netlify and attatched to my private repo any change pushed will be reflected there
  you need to be signed into my github to push changes.
  my macbook and windows desktop are set up for pushing changes.



# EXE
to create window exe you must use a windows machine (my windows desktop is set up for it not my laptop)
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass #this gains execution policy
  npm run build:app 

run the setup.exe in the new folder dist/

C:\Users\skyle\Documents\programming\game\dist creates a setup file here

saves the file here %LOCALAPPDATA%\Programs you can uninstall it later 

to create mac exe
  npm run build:app
it will build two apps, one for intel macs and one for apple silicon macs. intel is game-0.5.0.dmg apple is game-0.5.0-arm64.dmg
run it to install 
command option i to open debug in electron app

# steam upload
when first seting up steam you need a branch for both the windos and mac version

https://partner.steamgames.com/apps/builds/3838530
https://partner.steamgames.com/apps/depotuploads/3838530

go to depot uploads that is where you upload the game the game is the actual application itself in a ziped folder so you need to make an exe then zip it and upload the zip
it will take a while to build and may fail 3 times... then you need to set the branch to default 


# Itch io
to create a dist folder that can be uploaded to itch.io run npm build make sure env mode is prod and zip the dist folder 
note itch io does not like dynamic paths to public there are changes that need to be made to 
Monster.vue to make sure that the images and the actions show up... the electrify logic should be able to work for it though.

# wavedash
brew install wvdsh/tap/wavedash 
wavedash auth login 
create wavedash.toml with game id 
swap env to prod
wavedash build push 
# clean patches 
keeping clean patches for the final build use 
git rebase -i --root allows squashing commits

cleans posted files
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit --amend --no-edit

push up
git push -f origin main

# hosting on netlify
make sure you set the environment variables on netlify
set the build setting build command to npm run build and set the directory to dist

# setting up cloud functions with firebase
You need to have the pay as you go plan, use firebase deploy --only functions, however before paying you can set up firebase emulation to test functionality. 
The functions can then be run via the firebase client allowing reads and writes using functions, rather than giving access to users to read and write to the functions. 




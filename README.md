# Node Starter

## Authors

Michael Hackett (hackett123) created this as a starter template for any Node.js and Express project that wants to integrate a secure user system with a scalable backend and pretty css features. Credit goes out to the developers of each of the packages in the 'dependencies.json' file which lists the third-party APIs present.

## Overview

This is a starter template to save developers many hours of the beginning of their project so that they can spend less time setting up and more time creating unique and memorable content.

## Requirements

Before you're able to run the project, you'll need to do two items.
1. ''' npm install '''
	- this will take care of all the dependencies necessary for the project at hand - the highlights are node, express, ejs, a dynamodb package for interacting with aws dynamoDB, sha256, and a few other useful things like async.

2. For use of this project, clone it into your own repository and add a file in the base directory called "credentials.json" which will hold your AWS key. That file is in the .gitignore, so it's important to match the spelling and casing so that you don't accidentally put your private keys on the github server.

## Running The Base Project

All you need to do is 'cd' into your base directory and run the following:
'''
nodemon app.js
'''
The difference betweenn 'node' and 'nodemon' is that 'nodemon' will restart your server when you edit the backend and update your server when you edit the frontend. So, if you change the layout of your ejs files, just cmd+r it and you'll see the changes without needing to restart the server. When editing the backend, the whole server needs to restart for the changes to propogate - nodemon will restart it for you, but you'll have to log back in to your app (assuming you're using the user system provided.)

## License

This project is protected under an MIT License

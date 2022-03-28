# Webex Room Hub

Webex Room Hub is an open source project to control smart building features such as lights and shades
in office buildings from the Webex Room devices.

It consistes of a light weight middleware server and macros and UI extensions.

Out of the box, it supports a couple of light and shade systems standard at Cisco, but it is easy to replace or
add drivers for any HTTP based smart integration.

The project requires that the customer has:

* Webex devices such as Webex Room Kit, Webex Board, Webex Desk etc
* A smart building setup
* Access to install macros to the devices, either with Control Hub or local device access
* A way to host a docker image that is reachable to video devices and the smart system integrations


These smart integrations are supported out of the box:

* Igor light system
* Molex light system
* Philips Hue light system
* Solartrac 4 shades
* Webex-based Report Issue feedback


## How it works

### UI extensions and macros

The UI extensions and macros are installed on the video devices and allow the user to control lights and shades, and report issues from the same user interface that is used to control the video calls. The macro sends requests to the middle ware server.

### The middle ware server

The middle ware server is a simple on-premise web server (Node-based Docker image) that receives requests from the video device, maps it to the correct lights and shades etc and talks to the light and shades controller.

The middle ware contains a simple admin UI so facility managers can setup the mappings between video devices/rooms and the appropriate smart devices. It also allows facility managers to see logs of incoming and outgoing requests to quickly trouble shott issues or see metrics of how the system is used.

## Installation

* Clone the public Git repository from xxx.
* Create a config file. Eg you can copy config.example.json to config.json
* Set the hosts, tokens etc for the integrations. Remove the examples rooms there if you wish
* Build and serve the Docker image however your managed services allow you to (map to port 8080 for the web server)
* The Dockerfile is pretty standard, there is also a docker-compose.yml if you use Docker Compose
* TODO!!! config setup
* TODO!!! ssh key setup
* Visit the URL of the docker image, it should show a basic admin page for the middle ware
* You are now ready to setup your rooms

## Setting up a new room

Once you have a Room Hub server running, you can configure the mappings between your smart building resources (lights, shades) to the video device.

* Go to the Docs page on the Romm Hub and download the RoomControl.js macro
* Install the macro, but don't enable it yet
  * From Control Hub: locate the device, then tap install macro
  * From local web interface: enter the device ip in a browser, log in, launch macro editor and upload the macro

* Note the serial number of the video device (similar to FDO224416LQ)
* Open the config page on the Room Hub admin page
* Add room
* Enter the device serial number, and the appropriate smart building resources. Save.
* Enable the macro on the device. It will now install the appropriate UI Extensions (Lights, Shades, Report Issue)
* Verify that the UI extensions appear, and use them to control lights and shades in the room
* If you don't have physical access to the room, you can use the preview tool in the UI extensions editor (requires local access) and tap the buttons there to see that the smart integrations respond as you'd expect
* If nothing happens when you press the UI buttons, look in the Log view of the Room Hub admin page. It will show any errors in incoming and outgoing HTTP requests, as well as descriptions. Maybe something has not been configure correctly?

## Voice assistant

The macro contains experimental support for voice assist integration, but this is not in production yet and not documented further here as of today.

## Run / develop locally

Do the same steps as in **Installation** above, but instead of building the Docker, run

* npm install
* npm start

This should start the middle ware server locally. Visit localhost:8080 to test it. Edit the server or front end files and restart server / refresh web page to update.


# Positionly-demo

### 1.Installation

[Node](https://nodejs.org/) has to be installed:

* git clone https://github.com/MaxFlower/Positionly-demo.git
* cd Positionly-demo
* npm install

### 2. Getting started

* node server.js 
* open index.html in your browser

----------------------

### 3. How does it work

* Enter you name in order to connect to server
* Then You can:

  - send message to another users
  - get list of connected users
  - add listeners for any user (enter user name for capturing and click 'Add user's listeners', this user can see results in console)
  - remove listeners (enter user name and click 'Remove user's listeners')
  
----------------------

### 4. How to make useful

* Add for listeners handlers ability to send websocket message with data from event (for example: 
{'type: 'event', data: {name: 'mousedown' descr: 'clientX=314, clientY=338'}})

* Add all event-messages to DB on server side (using POST-request) 

* Develop player for playing saved event records.


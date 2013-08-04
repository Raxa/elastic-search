// import reqired modules
var exec = require('child_process').exec;

// parse command line args
var args = process.argv.splice(2);
// import search app
var App = require('./lib/application').Application;
// start it
var app = new App();
switch(args[0]) {
    // run search server
    case 'run':
        app.start();
        break;
    // start rivers
    case 'river' : 
        app.river(function() {
            console.log('done');
        });
        break;
    // clean index
    case 'clean' : 
        app.clean(function() {
            console.log('done');
        });
        break;
    default:
        console.log('invalid params');
        break;
}








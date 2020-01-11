////////////////////////////////////////////////
//
// Demo device emulator 
//
//
//
// IoT Manager https://play.google.com/store/apps/details?id=ru.esp8266.iotmanager
//
// version     : 1.0
// IoT Manager : 1.5.0 and above
//
////////////////////////////////////////////////

////////////////////////////////////////////////
var config = require("./config");
var host = config.host;
var port = config.port;
var user = config.user;
var pass = config.pass;
////////////////////////////////////////////////

var mqtt = require('mqtt');
var df = require("date-format-lite");
Date.masks.default = 'YYYY-MM-DD hh:mm:ss.SS'

var opt = {
    host: host,
    port: port,
    username: user,
    password: pass,
    clientId: 'iot_heroku_' + Math.random().toString(16).substr(2, 8),
    protocolId: 'MQTT',
    connectTimeout: 3000
};

var garageDoor = 0;
var light1 = 1;

var deviceID = "arduino";
var prefix = "/IoTmanager";
var config = [];
var log = [];

var ready = false;


config.push({
    page: "Home",
    pageId: 1,
    descr: 'Outdoor temp',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/outdoor",
    after: '°C',
    faicon: 'fas fa-tree',
});

config.push({
    pageId: 1,
    descr: 'Kitchen temp',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/kitchen",
    after: '°C',
    icon: 'thermometer',
});

config.push({
    pageId: 1,
    descr: 'Bedroom temp',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/bedroom",
    after: '°C',
    icon: 'thermometer',
});

config.push({
    pageId: 1,
    descr: 'Humidity',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/humidity",
    after: '%'
});

config.push({
    pageId: 1,
    descr: 'CO²',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/co2",
    faicon: 'fas fa-air-freshener',
});

config.push({
    pageId: 1,
    widget: 'toggle',
    descr: 'Kitchen light ',
    topic: prefix + "/" + deviceID + "/light1",
    color: 'orange',
    faicon: 'fas fa-lightbulb',
    faiconOff: 'far fa-lightbulb',
});

deviceID = 'esp8266';

config.push({
    page: "Garage",
    pageId: 2,
    descr: 'Garage door',
    widget: 'toggle',
    topic: prefix + "/" + deviceID + "/garagedoor",
    status: 1,
});

config.push({
    pageId: 2,
    descr: 'Motion sensor',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/motion",
    status: 'no motion',
    color: 'green',
});


var client = mqtt.connect(opt);

client.on('connect', function() {
    Logger('Broker connected');
    ready = true;
    client.subscribe(prefix, { qos: 1 }); // HELLO expected
    client.subscribe(prefix + "/+/+/control", { qos: 1 }); // all command
    pubConfig();
});

client.on('error', function() {
    ready = false;
    Logger('Broker error');
});

client.on('offline', function() {
    ready = false;
    Logger('Broker offline');
});

client.on('message', function(topic, message) {

    Logger("msg: " + topic.toString() + " => " + message.toString());

    if (topic.toString() === prefix && message.toString() == "HELLO") {
        Logger('HELLO detected');
        pubConfig();
        pubStatus();
    }
    if (topic.toString() === prefix + "/arduino/light1/control") {
        light1 = message.toString() == '1' ? 1 : 0;
        client.publish(prefix + "/arduino/light1/status", JSON.stringify({ status: light1 }), { qos: 0 });
    }
    if (topic.toString() === prefix + "/esp8266/garagedoor/control") {
        garageDoor = message.toString() == '1' ? 1 : 0;
        client.publish(prefix + "/esp8266/garagedoor/status", JSON.stringify({ status: garageDoor }), { qos: 0 });
    }

})
////////////////////////////////////////////////
function pubConfig() {
    Logger('Publish config');
    config.forEach(function(item, i, arr) {
        client.publish(prefix + "/" + deviceID + "/config", JSON.stringify(item), { qos: 1 });
    });
}

function Logger(x) {
    console.log(x)
    var t = new Date();
    if (log.length >= 50) {
        log.shift();
    }
    log.push({ date: t.format("YYYY-MM-DD hh:mm:ss.SS"), text: x });
}
////////////////////////////////////////////////
function pubStatus() {
    var outdoor = 10 + Math.round(Math.random() * 5);
    var indoor = 18 + Math.round(Math.random() * 5);
    var bedroom = 22 + Math.round(Math.random() * 5);
    var hum = 50 + Math.round(Math.random() * 20);
    var co2 = Math.random() > 0.5 ? { status: 'OK', color: 'green' } : { status: 'HIGH LEVEL', color: 'red' };
    var motion = Math.random() > 0.5 ? { status: 'no motion', color: 'green' } : { status: 'ALARM', color: 'red' };
    client.publish(config[0].topic + "/status", JSON.stringify({ status: outdoor }));
    client.publish(config[1].topic + "/status", JSON.stringify({ status: indoor }));
    client.publish(config[2].topic + "/status", JSON.stringify({ status: bedroom }));
    client.publish(config[3].topic + "/status", JSON.stringify({ status: hum }));
    client.publish(config[4].topic + "/status", JSON.stringify(co2));
    client.publish(config[5].topic + "/status", JSON.stringify({ status: light1 }));
    client.publish(config[6].topic + "/status", JSON.stringify({ status: garageDoor }));
    client.publish(config[7].topic + "/status", JSON.stringify(motion));
    Logger('publish outdoor:' + outdoor + ' indoor:' + indoor + ' hum:' + hum + ' and other data');
}
////////////////////////////////////////////////
// run main
Logger('Start');
setInterval(function() {
    if (ready) {
        pubStatus();
    } else {
        Logger('Broker not connected');
    }
}, 5000);

///////////// do express
var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('pages/db', { results: log });
});

app.listen(app.get('port'), function() {
    Logger('Node app is running on port', app.get('port'));
});
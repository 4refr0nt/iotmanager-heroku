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
var air = 1;
var vent = false;
var airStatus = {};

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
    icon: 'thermometer',
    order: 10,
});

config.push({
    pageId: 1,
    descr: 'Kitchen temp',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/kitchen",
    after: '°C',
    icon: 'thermometer',
    order: 20,
});

config.push({
    pageId: 1,
    descr: 'Bedroom temp',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/bedroom",
    after: '°C',
    icon: 'thermometer',
    order: 30,
});

config.push({
    pageId: 1,
    descr: 'Humidity',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/humidity",
    after: '%',
    icon: 'water',
    order: 40,
});

config.push({
    pageId: 1,
    descr: 'CO²',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/co2",
    icon: 'body',
    order: 50,
});

config.push({
    pageId: 1,
    widget: 'toggle',
    descr: 'Kitchen light',
    topic: prefix + "/" + deviceID + "/light1",
    color: 'orange',
    icon: 'sunny',
    iconOff: 'moon',
    order: 60,
});

deviceID = 'esp8266';

config.push({
    pageId: 1,
    widget: 'select',
    descr: 'Air conditioning',
    topic: prefix + "/" + deviceID + "/air",
    color: 'blue',
    size: 'small',
    icon: 'snow',
    options: ['Low', 'Medium', 'High'],
    order: 70,
});

config.push({
    page: "Garage",
    pageId: 2,
    descr: 'Garage door',
    widget: 'toggle',
    topic: prefix + "/" + deviceID + "/garagedoor",
    status: 1,
    order: 10,
});

config.push({
    pageId: 2,
    descr: 'Motion sensor',
    widget: 'anydata',
    topic: prefix + "/" + deviceID + "/motion",
    status: 'no motion',
    color: 'green',
    icon: 'walk',
    order: 20,
});

deviceID = 'esp32';

config.push({
    pageId: 2,
    descr: 'Venting',
    widget: 'button',
    topic: prefix + "/" + deviceID + "/venting",
    color: 'orange',
    icon: 'switch',
    fill: 'outline',
    order: 15,
});

config.push({
  pageId : 3,
  page   : 'input',
  widget : 'input',
  topic  : prefix + "/" + deviceID + "/input_num",
  descr  : "Input number",
  size   : 'small',
  color  : 'orange',
  type   : 'number',
  order  : 30,
  status : 321
});

config.push({
  pageId : 3,
  widget : 'input',
  topic  : prefix + "/" + deviceID + "/input_text",
  descr  : "Input text",
  type   : 'text',
  order  : 40,
  status : "some text"
});

config.push({
  pageId : 3,
  widget : 'input',
  topic  : prefix + "/" + deviceID + "/input_time",
  descr  : "Input time",
  type   : 'time',
  order  : 50,
  status : "10:00"
});

config.push({
  pageId : 3,
  widget : 'input',
  topic  : prefix + "/" + deviceID + "/input_date",
  descr  : "Input date",
  type   : 'date',
  size   : 'small',
  order  : 60,
  status : "20.03.2020"
});

config.push({
  order  : 10,
  pageId : 4,
  page   : 'range',
  widget : 'range',
  topic  : prefix + "/" + deviceID + "/range1",
  descr  : "Contrast",
  after  : '%',
  min    : 10, // maybe string
  max    : 90, // maybe string
  status : 70, // maybe string
  debounce: 200, // slow device or slow broker
});

config.push({
  order  : 20,
  pageId : 4,
  widget : 'range',
  topic  : prefix + "/" + deviceID + "/range2",
  descr  : "Brightness",
  descrColor: 'red',
  icon   : 'sunny',
  lsize  : 'small',
  status : '30',
  color  : 'orange',
});

config.push({
  order  : 30,
  pageId : 4,
  widget : 'range',
  topic  : prefix + "/" + deviceID + "/range3",
  descrIcon  : 'aperture',
  k      : 0.0977, // max status - 1023, 1023 * 0.0977 = 100
  status : '500',
});

config.push({
  order  : 10,
  pageId : 5,
  page   : 'progress',
  widget : 'progress-round',
  topic  : prefix + "/" + deviceID + "/progress-round1",
  descr  : 'progress 1',
  descrColor: 'orange',
  icon   : 'globe',
  semicircle : '1',
  max    : 60,
  stroke : 20,
  color  : '#45ccce',
  background: '#777',
  status : '25',
});

config.push({
  pageId : 5,
  order  : 15,
  widget : 'progress-line',
  topic  : prefix + "/" + deviceID + "/progress-line15",
  descr  : 'Current progress',
  icon   : 'cafe',
  max    : 1000,
  after  : 'pcs',
  status : '800',
});

config.push({
  pageId : 5,
  order  : 20,
  widget : 'progress-line',
  topic  : prefix + "/" + deviceID + "/progress-line16",
  descr  : 'Current progress',
  descrColor: 'green',
  icon   : 'cart',
  max    : 10,
  color  : 'green',
  status : '7',
});

config.push({
  pageId : 5,
  order  : 17,
  widget : 'progress-line',
  topic  : prefix + "/" + deviceID + "/progress-line17",
  descr  : 'Current progress',
  icon   : 'car',
  max    : 500,
  color  : 'orange',
  descrColor: 'orange',
  status : '120',
});

config.push({
  order  : 20,
  page   : 'progress',
  widget : 'progress-round',
  topic  : prefix + "/" + deviceID + "/example123",
  descr  : 'progress ',
  status : '25',
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
    if (topic.toString() === prefix + "/esp8266/air/control") {
        air = parseInt(message.toString(), 10);
        setAirStatus();
        client.publish(prefix + "/esp8266/air/status", JSON.stringify(airStatus), { qos: 0 });
    }
    if (topic.toString() === prefix + "/esp32/venting/control") {
        vent = !vent;
        setVentStatus();
        client.publish(prefix + "/esp32/venting/status", JSON.stringify(vent_status), { qos: 0 });
    }
    if (topic.toString() === prefix + "/esp32/input_text/control") {
        client.publish(prefix + "/esp32/input_text/status", JSON.stringify({status: message.toString()}), { qos: 0 });
    }
    if (topic.toString() === prefix + "/esp32/input_num/control") {
        client.publish(prefix + "/esp32/input_num/status", JSON.stringify({status: message.toString()}), { qos: 0 });
    }
    if (topic.toString() === prefix + "/esp32/input_time/control") {
        client.publish(prefix + "/esp32/input_time/status", JSON.stringify({status: message.toString()}), { qos: 0 });
    }
    if (topic.toString() === prefix + "/esp32/input_date/control") {
        client.publish(prefix + "/esp32/input_date/status", JSON.stringify({status: message.toString()}), { qos: 0 });
    }
})

function setAirStatus() {
    airStatus = { status: air };
    if (air == 0) {
        airStatus.color = 'orange';
    } else if (air == 1) {
        airStatus.color = 'green';
    } else {
        airStatus.color = 'blue';
    }
}
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
function setVentStatus() {
    vent_status = { status: vent ? 'ON' : 'OFF' };

    if (vent) {
        vent_status.color = 'red';
        vent_status.fill = 'solid';
    } else {
        vent_status.color = 'green';
        vent_status.fill = 'outline';
    }
}

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
    setAirStatus();
    client.publish(config[6].topic + "/status", JSON.stringify(airStatus));
    client.publish(config[7].topic + "/status", JSON.stringify({ status: garageDoor }));
    client.publish(config[8].topic + "/status", JSON.stringify(motion));
    setVentStatus();
    client.publish(config[9].topic + "/status", JSON.stringify(vent_status));
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
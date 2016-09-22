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
  host       : host,
  port       : port,
  username   : user,
  password   : pass,
  clientId   : 'iot_heroku_' + Math.random().toString(16).substr(2, 8),
  protocolId : 'MQTT',
  connectTimeout: 3000
};


var waterTemp = 20;
var hiTemp    = 40;
var hysteresis= 5;

var deviceID = "boiler-0001";
var prefix   = "/IoTmanager";
var config   = [];
var log      = [];

var ready = false;

// First line
var widget   = "anydata";
var id       = "0"
config[0] = {
  id     : id,
  page   : "boiler",
  pageId : 1,
  widget : widget,
  class1 : "item no-border",
  style2 : "font-size:16px;",
  topic  : prefix + "/" + deviceID + "/" + widget + id,
  class3 : "calm text-center",
  style3 : "font-size:20px;",
  status : "My Home"
};


// Outdoor temp
widget    = "anydata";
id        = "1"
config[1] = {
  id     : id,
  page   : "boiler",
  pageId : 1,
  widget : widget,
  class1 : "item no-border",
  style2 : "font-size:20px;float:left",
  descr  : "Outdoor temp",
  topic  : prefix + "/" + deviceID + "/" + widget + id,
  class3 : "assertive",
  style3 : "font-size:40px;font-weight:bold;float:right",
};

// Indoor temp
widget    = "anydata";
id        = "2"
config[2] = {
  id     : id,
  page   : "boiler",
  pageId : 1,
  widget : widget,
  class1 : "item no-border",
  style2 : "font-size:20px;float:left;line-height:3em",
  descr  : "Indoor temp",
  topic  : prefix + "/" + deviceID + "/" + widget + id,
  class3 : "balanced-bg light padding-left padding-right rounded",
  style3 : "font-size:40px;font-weight:bold;float:right;line-height:1.5em",
};


// Humidity
widget    = "anydata";
id        = "3"
config[3] = {
  id     : id,
  page   : "boiler",
  pageId : 1,
  widget : widget,
  class1 : "item no-border",
  style2 : "font-size:20px;float:left;line-height:3em",
  descr  : "Humidity",
  topic  : prefix + "/" + deviceID + "/" + widget + id,
  class3 : "balanced-bg light padding-left padding-right rounded",
  style3 : "font-size:40px;font-weight:bold;float:right;line-height:1.5em",
};

// CO2
widget    = "anydata";
id        = "4"
config[4] = {
  id     : id,
  page   : "boiler",
  pageId : 1,
  widget : widget,
  class1 : "item no-border",
  style2 : "font-size:30px;float:left",
  descr  : "CO2",
  topic  : prefix + "/" + deviceID + "/" + widget + id,
  class3 : "balanced",
  style3 : "font-size:30px;font-weight:bold;float:right",
};


var client   = mqtt.connect(opt);

client.on('connect', function () {
  Logger('Broker connected');
  ready = true;
  client.subscribe(prefix, { qos : 1 }); // HELLO expected
  client.subscribe(prefix + "/" + deviceID +"/+/control", { qos : 1 }); // all command
  pubConfig();
});

client.on('error', function () {
  ready = false;
  Logger('Broker error');
});

client.on('offline', function () {
  ready = false;
  Logger('Broker offline');
});

client.on('message', function (topic, message) {
  
  Logger("msg: " + topic.toString() + " => " + message.toString());

  if (topic.toString() === prefix && message.toString() == "HELLO" ){
    Logger('HELLO detected');
    pubConfig();
  }
  pubStatus();
})
////////////////////////////////////////////////
function pubConfig() {
    Logger('Publish config');
    client.publish( prefix, deviceID );
    config.forEach(function(item, i, arr) {
      client.publish(prefix + "/" + deviceID + "/config", JSON.stringify(item),{ qos : 1 });
    });    
}

function Logger(x) {
   console.log(x)
   var t = new Date();
   if (log.length >= 100) {
      log.shift();
   }
   log.push({date:t.format("YYYY-MM-DD hh:mm:ss.SS") , text:x});
}
////////////////////////////////////////////////
function pubStatus( force ) {
  var outdoor = 10 + Math.round(Math.random() * 5);
  var indoor = 18 + Math.round(Math.random() * 5);
  var hum = 50 + Math.round(Math.random() * 20);
  client.publish( config[1].topic+"/status", JSON.stringify({ status: outdoor + "°C" }) );
  client.publish( config[2].topic+"/status", JSON.stringify({ status: indoor + "°C" }) );
  client.publish( config[3].topic+"/status", JSON.stringify({ status: hum + "%" }) );
  client.publish( config[4].topic+"/status", JSON.stringify({ status: "normal" }) );
  Logger('publish outdoor:' + outdoor + ' indoor:' + indoor + ' hum:' + hum);
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
  response.render('pages/db', {results: log});
});

app.listen(app.get('port'), function() {
  Logger('Node app is running on port', app.get('port'));
});


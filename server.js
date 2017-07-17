const express = require('express');
const app = express();
const path = require('path');
const cfenv = require('cfenv');
const http = require('https');

//--Config------------------------------
require('dotenv').config();

//---Deployment Tracker---------------------------------------------------------
require("cf-deployment-tracker-client").track();

// configuration ===============================================================
// load local VCAP configuration
var vcapLocal = null
if (require('fs').existsSync('./vcap-local.json')) {
    try {
        vcapLocal = require("./vcap-local.json");
        //console.log("Loaded local VCAP", vcapLocal);
    } catch (e) {
        console.error(e);
    }
}

// get the app environment from Cloud Foundry, defaulting to local VCAP
var appEnvOpts = vcapLocal ? {
    vcap: vcapLocal
} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.isLocal) {
    require('dotenv').load();
}
var port = process.env.VCAP_APP_PORT || 3000;

// Main routes
app.use('/', express.static(__dirname +  '/'));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});



// =====================================
// INVESTMENT PORTFOLIO SECTION =====================
// =====================================

app.post('/api/portfolios', function(req, res){
    console.log("REQUEST:" + req.body.porfolioname);
   var basic_auth= new Buffer(process.env.INVESTMENT_PORFOLIO_USERNAME + ':' + process.env.INVESTMENT_PORFOLIO_PASSWORD).toString('base64');
   var portfolio_name = req.body.porfolioname;
    var options = {
        "method": "POST",
        "hostname": process.env.INVESTMENT_PORFOLIO_BASE_URL,//"investment-portfolio.mybluemix.net",
        "port": null,
        "path": "/api/v1/portfolios",
        "headers": {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": "Basic "+basic_auth
        }
};

var req = http.request(options, function (res) {
  var chunks = [];
  console.log("AUTH:" + basic_auth);

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.write(JSON.stringify({ closed: false,
  data: {'manager':'Vidyasagar Machupalli', 'worker':'John Doe' },
  name: portfolio_name || "default" ,
  timestamp: new Date().toLocaleString() }));
req.end();
});

app.get('/api/portfolios',function(req,response){
    var basic_auth= new Buffer(process.env.INVESTMENT_PORFOLIO_USERNAME + ':' + process.env.INVESTMENT_PORFOLIO_PASSWORD).toString('base64');
    var islatest = req.query.latest;
    var openOnly = req.query.openOnly; 

    var options = {
        "method": "GET",
        "hostname": process.env.INVESTMENT_PORFOLIO_BASE_URL,
        "port": null,
        "path": "/api/v1/portfolios?latest="+ islatest +"&openOnly=" + openOnly,
        "headers": {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": "Basic "+basic_auth
  }
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    //console.log("RESPONSE:" + body.toString());
    response.setHeader('Content-Type','application/json');
    response.type('application/json');
    //response.write();
    response.end(body.toString());
  });
 
});
req.end();
});


// launch ======================================================================
app.listen(port, "0.0.0.0", function() {
    // print a message when the server starts listening
    console.log("server running on  http://localhost:" + port);
});

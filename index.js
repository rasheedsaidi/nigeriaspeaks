/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
//curl -X POST -H "Content-Type: application/json" -d '{"setting_type":"call_to_actions", "thread_state":"new_thread", "call_to_actions":[ { "payload":"Greeting" }] }' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAACGWY2X1wIBAN89xXrvtbaJzsFazrUGieM13vK5X9T1nPoSkPwKspmyzeKZCFWfpnoCSeOo1YUcf9G5Ke4UzGuj5xM0wyic0xiDQwxLOXOCdzBCOwT0IOOdIyNPiAZCQi5oAQJnay51Gctl3Vczc1fPTYeU4bx6PeaEZCVXgZDZD"
//curl -X GET "https://graph.facebook.com/v2.6/me/messenger_profile?fields=persistent_menu&access_token=EAACGWY2X1wIBAN89xXrvtbaJzsFazrUGieM13vK5X9T1nPoSkPwKspmyzeKZCFWfpnoCSeOo1YUcf9G5Ke4UzGuj5xM0wyic0xiDQwxLOXOCdzBCOwT0IOOdIyNPiAZCQi5oAQJnay51Gctl3Vczc1fPTYeU4bx6PeaEZCVXgZDZD"
//curl -X POST -H "Content-Type: application/json" -d '{"whitelisted_domains":["https://emergency-reporting-system.herokuapp.com"]}' "https://graph.facebook.com/v2.6/me/messenger_profile?access_token=EAACGWY2X1wIBAN89xXrvtbaJzsFazrUGieM13vK5X9T1nPoSkPwKspmyzeKZCFWfpnoCSeOo1YUcf9G5Ke4UzGuj5xM0wyic0xiDQwxLOXOCdzBCOwT0IOOdIyNPiAZCQi5oAQJnay51Gctl3Vczc1fPTYeU4bx6PeaEZCVXgZDZD"

/* jshint node: true, devel: true */
'use strict';

const 
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),  
  request = require('request');

var hbs = require('express-handlebars')
var session = require('client-sessions');  
var firebase = require('./firebase');
var app = express();
app.set('port', process.env.PORT || 5000);
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('view engine', 'hbs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(session({
  cookieName: 'session', // cookie name dictates the key name added to the request object 
  secret: '7459)^%($hfdhf^&%($$90-+', // should be a large unguessable string 
  duration: 30 * 60 * 1000, // how long the session will stay valid in ms 
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds 
}));

//firebase.sendFile();


/*
 * Be sure to setup your config values before running this code. You can 
 * set them using environment variables or modifying the config file in /config.
 *
 */

var SESSION_ID = null;
// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.NS_APP_SECRET) ? process.env.NS_APP_SECRET : "696c47493c1d4ab80ab6143d451944f8";

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.NS_VALIDATION_TOKEN) ? (process.env.NS_VALIDATION_TOKEN) : "nigeriaspeaks-secret";

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.NS_PAGE_ACCESS_TOKEN) ? (process.env.NS_PAGE_ACCESS_TOKEN) : "EAACfT2ZAsyzABAAi1oIT8ETkZCZBzolcqUqIgHCAcana0HABPhbHt8BNl4ZCduAhXt6TJZCFGgFcLVBFcOkXQbvzMlWDXZA9dy0mhLCSO8L73WihUWO163hPSKM1WCHmxaqth2OIv5RgZCh5t5hDQAZAXAQaSn16mJzw95gIUMtVvpWvRN5kcUvP";

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = (process.env.NS_SERVER_URL) ? (process.env.NS_SERVER_URL) : "https://nigeriaspeaks.herokuapp.com";

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

app.get('/', function(req, res, next) {
  var countries = ["Nigeria", "Ghana", "Togo", "Cameroon", "Kenya"];
  res.render('index', {title: "Choose Country", countries: countries});
});

/*
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});

app.get('/policy', function(req, res) {
  
    //res.setEncoding('utf-8');
    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf8'});
    res.write("Nigeriaspeaks Policy page is under development");
    res.end();
  
});

app.get('/auth', function(req, res) {  
    req.session.psid = req.query['psid'];
    res.render('auth', {layout:  __dirname + '/views/layouts/auth.hbs'});  
});

app.get('/reports', function(req, res) {
    res.render('reports');  
});

app.get('/auth-hook', function(req, res) {
    res.render('auth-hook',  {layout: __dirname + '/views/layouts/auth.hbs'});
});

app.post('/auth-hook', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    console.log(req.body);
    if(req.body && req.body.uid) {
      var uid = req.body.uid;
      var psid = req.session.psid;
      req.session.uid = uid;
      console.log(req.session);
      firebase.loginUser(psid, uid, function(err, data) {
        if(!err) {
          sendTextMessage(psid, "You've successfully logged in.");
        }
        
      });
      var IMAGE_URL = 'https://nigeriaspeaks.herokuapp.com/images/r2hq.png';
      var location = 'https://www.messenger.com/closeWindow/?image_url=' + IMAGE_URL + '&display_text=Returning to Report2HQ Bot';
      res.send(JSON.stringify({ error: false, uid: req.body.uid}));
      //res.send('<div class="row"><div class="col-md-4 col-md-offset-4 col-sm-8 col-sm-offset-2 text-center>Login successful. Please this window</div></div>');
      /*response.writeHead(302, {
        'Location': location
      });
      response.end(); */
    } else {
      res.send(JSON.stringify({ error: true, uid: ''}));
    }
});

app.get('/tos', function(req, res) {
  
    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf8'});
    res.write("ERS TOS page is under development");
    res.end();
  
});


/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry    
    

    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
          //handleUnknownEvent(messagingEvent);
          sendTextMessage(messagingEvent.sender.id);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }

});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL. 
 * 
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query.account_linking_token;
  var redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user by the developer. This will 
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the 
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger' 
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam, 
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message' 
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some 
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've 
 * created. If we receive a message with an attachment (image, video, audio), 
 * then we'll simply confirm that we've received the attachment.
 * 
 */

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  var nodeIndex = -1;
console.log("data: ");
  firebase.getUID(senderID, function(err, data) {
    
    if(data)
      SESSION_ID = data.uid;
    //setTimeout(function() {
        console.log('SessionID1: ' + SESSION_ID);
    console.log("Received echo")    
        if(!SESSION_ID) { 
          promptLogin(senderID); return;         
        } else {        

  sendTypingOn(senderID);

  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
    promptHelpMessage(senderID);
    return;
  } else if (quickReply) {
    handleQuickReply(senderID, quickReply.payload);
    return;
  }

  if (messageText) {    
    var messageLowerCase = messageText.toLowerCase();
    switch (messageLowerCase) {
      case 'help':
        promptHelpList(senderID);
        break;

      case 'status':
        promptCurrentReport(senderID);
        break;

      case 'continue':
        promptContinue(senderID);
        break;

      case 'reports':
        promptRecentReports(senderID);
        break;

      case 'new report': case 'report':
        processNewReport(senderID);
        break;

      case 'edit':  case 'report-edit':
        promptEdit(senderID);
        break;

      case 'setup-start-btn':
        setupStartButton();
        break;

      case 'setup-menu':
        setupPersistentMenu();
        break;

      case 'setup-greeting':
        sendGreeting();
        break;

      case 'submit': case 'cancel':
        promptReportSubmit(senderID);
        break;

      case 'report-submit':
        processReportSubmit(senderID);
        break;

      case 'skip':
        skipStep(senderID);
        break;

      case 'report-cancel':
        processReportCancel(senderID);
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;      

      case 'generic':
        sendGenericMessage(senderID);
        break;

      default:
        handleTextMessage(senderID, messageText);
        return;
    }
  } else if (messageAttachments) {
    handleAttachment(senderID, messageAttachments);
    return;
  }

  }
      //}, 4000);
    
  });
  return;
}

function handleTextMessage(senderID, messageText) {
  console.log("handleTextMessage with payload: " + messageText);
  setTimeout(function(){
    firebase.getStatus(senderID, function(error, response) {
      if(response) {
        var nodeIndex = parseInt(response.nodeIndex);
        switch(nodeIndex) {
          case 2:
            processReportAddress(senderID, messageText);
            break;
          case 3:
            processReportDescription(senderID, messageText);
            break;
          default:
            promptHelpMessage(senderID);
            break;
        }
      } else {
        promptHelpMessage(senderID);
      }
      return;  
    });
  }, 1000);
}

function handleAttachment(senderID, attachment) {
  //console.log("handleAttachment with payload: " + attachment);
  setTimeout(function(){
    firebase.getStatus(senderID, function(error, response) {
      if(response) {
        var nodeIndex = parseInt(response.nodeIndex);
        switch(nodeIndex) {
          case 1:
            var loc_type = attachment[0].type;
            if(loc_type == "location") {
              var lat = attachment[0].payload.coordinates.lat;
              var lng = attachment[0].payload.coordinates.long;
              var location = {latitude: lat, longitude: lng};
              processReportLocation(senderID, location);
            } else {
              sendTextMessage(senderID, "Invalid location info sent.");
              setTimeout(function() {
                promptReportLocation(senderID);
              }, 2000);
            }
            break;
          case 4:
            var type = attachment[0].type;
            var url = attachment[0].payload.url;
            var media_type = ["audio", "image", "video", "gif"];
            if(media_type.indexOf(type) != -1) {
              processReportMedia(senderID, {"type": type, "url": url});
            } else {
              sendTextMessage(senderID, "Only image, video and audio files please.");
              return;
            }     
            break;
          default:
            promptHelpMessage(senderID);
            break;
        }
      }
      return;  
    });
  }, 1000);
}

function handleQuickReply(senderID, payload) {
  console.log("handleQuickReply with payload: " + payload);
  if(payload.indexOf("findReport") != -1) {
    var parts = payload.split("--");
    if(parts[1]) {
      findReport(senderID, parts[1]);
    }
  } else {
    setTimeout(function(){
      firebase.getStatus(senderID, function(error, response) {
        if(response) {
          var nodeIndex = parseInt(response.nodeIndex);
          if(nodeIndex == 0) {
            var parts = payload.split("--");
            if(parts[0] && parts[1] && parts[0] == "type") {                      
              processReportType(senderID, parts[1]);
            } else {
              sendTextMessage(senderID, "Please select valid report type");
              setTimeout(function() {
                promptReportType(senderID);
              }, 2000);
            }
          } else {
            processQuickReplies(senderID, payload);
          }          
        } else {
          promptHelpMessage(senderID);
        }
        return;  
      });
    }, 1000);
}
}

function handlePostback(senderID, payload) {
  setTimeout(function(){
    firebase.getStatus(senderID, function(error, response) {
      if(response) {
        nodeIndex = parseInt(response.nodeIndex);
        if(nodeIndex == 0) {
          var parts = payload.split("--");
          if(parts[0] && parts[1]) {
            if(parts[0] == "type") {                       
              processReportLocation(parts[1]);
            } else {
              promptHelpMessage(senderID);
            }
          }
        } else {
          processQuickReplies(senderID, payload);
        }          
      } else {
        promptHelpMessage(senderID);
      }
      return;  
    });
  }, 1000);
}



/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s", 
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}

function promptLogin1(senderID) {
  var messageData = {
    recipient: {
      id: senderID
    },
    message: {      
      'text' : "Click to login",
      quick_replies: [{
          "type":"web_url",
          "url": SERVER_URL + "/auth?psid=" + senderID,
          "title":"Login",
          "webview_height_ratio": "full",
          "messenger_extensions": true,  
          "fallback_url": SERVER_URL + "/auth?psid=" + senderID
      }]
    }
  }
  callSendAPI(messageData);
}  

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  firebase.getUID(senderID, function(err, data) {
    
    if(data)
      SESSION_ID = data.uid;
    if(!SESSION_ID) {
      promptLogin(senderID); return;
    } else {

    sendTypingOn(senderID);
    console.log("Received postback for user %d and page %d with payload '%s' " + 
      "at %d", senderID, recipientID, payload, timeOfPostback);

    // The 'payload' param is a developer-defined field which is set in a postback 
    // button for Structured Messages. 
    var payload = event.postback.payload;  

    if (payload === "Greeting") {
      processGreeting(senderID, payload);
      return;
    } else if(payload == "report--new") {
      processNewReport(senderID);
      return;
    } else if(payload == "help") {
      promptHelpList(senderID);
      return;
    } else if(payload == "report--find") {
      promptRecentReports(senderID);
      return;
    } else {

      //if(payload.indexOf("-") > 0)
      processMenuPostback(senderID, payload);
      return;
    }
  }
      
  });
}


function promptLogin(senderID, message="Click to login") {
  var messageData = {
    recipient: {
      id: senderID
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          'text' : message,
          buttons: [{
              "type":"web_url",
              "url": SERVER_URL + "/auth?psid=" + senderID,
              "title":"Login",
              "webview_height_ratio": "full",
              "messenger_extensions": true,  
              "fallback_url": SERVER_URL + "/auth?psid=" + senderID
          }]
        }
      }
    }
  }
  callSendAPI(messageData);
}

function processGreeting(senderID, payload) {
  if (payload === "Greeting") {
    // Get user's first name from the User Profile API
    // and include it in the greeting
    request({
      url: "https://graph.facebook.com/v2.6/" + senderID,
      qs: {
        access_token: PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        var name = bodyObj.first_name;
        greeting = "Hi " + name + ". ";
      }
      var message = greeting + "Welcome to Nigeriaspeaks. Please login to start reporting.";
      promptLogin(senderID, message);
      setTimeout(function() {
        //promptHelpList(senderID);
      }, 2000);
    });
  } else{
    promptHelpMessage(senderID);
  }
  return;
}

function promptHelpMessage(senderID) {
  //console.log("Timestamp: " + firebase.getTimestamp());
  //var message = "Unsupported input. Please type 'help' for guide or use the menu options.";
  //sendTextMessage(senderID, message);
  promptHelpList(senderID);
  
}

function promptHelpList(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Start Reporting",
            subtitle: "Create a new report.",
            //item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: SERVER_URL + "/images/ers-post.png",
            buttons: [{
              type: "postback",
              payload: "report",
              title: "New Report"
            }]
          }, {
            title: "My Reports",
            subtitle: "See your recent reports.",
            //item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: SERVER_URL + "/images/ers-post.png",
            buttons: [{
              type: "postback",
              payload: "reports",
              title: "Show Reports"
            }]
          }, {
            title: "Report Status",
            subtitle: "Check if you have pending reports.",
            //item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: SERVER_URL + "/images/ers-post.png",
            buttons: [{
              type: "postback",
              payload: "status",
              title: "Pending Report"
            }]
          }, {
            title: "Skip Report Step",
            subtitle: "You can skip current report step.",
            //item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: SERVER_URL + "/images/ers-post.png",
            buttons: [{
              type: "postback",
              payload: "skip",
              title: "Skip Step"
            }]
          }, {
            title: "Edit Report",
            subtitle: "Modify current report if any.",
            //item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: SERVER_URL + "/images/ers-post.png",
            buttons: [{
              type: "postback",
              payload: "edit",
              title: "Modify Report"
            }]
          }, {
            title: "Cancel Report",
            subtitle: "Delete current report if any.",
            //item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: SERVER_URL + "/images/ers-post.png",
            buttons: [{
              type: "postback",
              payload: "cancel",
              title: "Cancel Report"
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function promptHelpList1(senderID) {
  
    request({
      url: "https://graph.facebook.com/v2.6/" + senderID,
      qs: {
        access_token: PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        var name = bodyObj.first_name;
        greeting = "Hi " + name + ". Here's the help list: ";
      }
      var message = greeting + "Type 'report' or 'new report' to create a new report, 'status' to check status of current report, 'reports' to view your recent reports or click on the items on the menu.";
      sendTextMessage(senderID, message);
    });
  
}

function processQuickReplies(senderID, payload) {
  var parts = payload.split("--");

  firebase.getStatus(senderID, function(error, response) {
    if(response) {
      switch(payload) {
        case "report--new":
          if(response.status == 0 || response.status == 1) {
            sendTextMessage(senderID, "Please submit pending report before starting a new one.");
            setTimeout(function() {
              promptNext(senderID, response.nodeIndex);
            }, 1000);
          } else {
            processNewReport(senderID);
          }
          break;
        case "report":
          if(response.status == 0 || response.status == 1) {
            promptCurrentReport(senderID);
          } else {
            promptHelpMessage(senderID);
          }
          break;
        case "skip":
          if(response.status == 0 || response.status == 1) {
            skipStep(senderID);
          } else {
            promptHelpMessage(senderID);
          }
          break;
        case "report--cancel":
          if(response.status == 0 || response.status == 1) {
            processReportCancel(senderID);
          } else {
            //promptHelpMessage(senderID);
            sendTextMessage(senderID, "No pending report to cancel");
          }
          break;
        case "edit": case "report--edit":
          if(response.status == 0 || response.status == 1) {
            sendTextMessage(senderID, "Please select edit option");
            setTimeout(function() {
              promptEdit(senderID);
            }, 1000);
          } else {
            //promptHelpMessage(senderID);
            sendTextMessage(senderID, "No pending report to edit");
          }
          break;
        case "report--more":
          if(response.status == 0 || response.status == 1) {
            //sendTextMessage(senderID, "Please select edit option");
            setTimeout(function() {
              promptReportMedia(senderID);
            }, 1000);
          } else {
            sendTextMessage(senderID, "No pending report.");
          }
          break;
        case "reports": case "report--find":
          promptRecentReports(senderID);          
          break;
        case "help":
          promptHelpList(senderID);          
          break;
        case "report--submit":
          processReportSubmit(senderID);          
          break;
        case "edit--type":
          setTimeout(function() {
            promptReportType(senderID);
          }, 1000);
          break;
        case "edit--location":
          setTimeout(function() {
            promptReportLocation(senderID);
          }, 1000);
          break;
        case "edit--address":
          setTimeout(function() {
            promptReportAddress(senderID);
          }, 1000);
          break;
        case "edit--description":
          setTimeout(function() {
            promptReportDescription(senderID);
          }, 1000);
          break;
        case "edit--media":
          setTimeout(function() {
            promptReportMedia(senderID);
          }, 1000);
          break;
        default:
          promptHelpMessage(senderID);          
          break;
      }
      return;
      } else {
      promptHelpMessage(senderID);
      return;    
    }
  });  
}

function skipStep(senderID) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      var nodeNo = parseInt(node.nodeIndex);
      if(nodeNo >= 4) {
        promptReportSubmit(senderID);
      } else {
        var index = nodeNo + 1;
        firebase.setCurrentNodeIndex(senderID, index, function(error, res) {
          promptNext(senderID, index);
          return;
        });
      }
    }
  });
}

function processMenuPostback(senderID, payload) {
  var parts = payload.split("--");

  firebase.getStatus(senderID, function(error, response) {
    if(response) {
      switch(payload) {
        case "report--new": case "report": case "report-new":
          if(response.status == 0 || response.status == 1) {
            sendTextMessage(senderID, "Please submit pending report before starting a new one.");
            setTimeout(function() {
              promptNext(senderID, response.nodeIndex);
            }, 1000);
          } else {
            processNewReport(senderID);
          }
          break;
        case "status":
          if(response.status == 0 || response.status == 1) {
            promptCurrentReport(senderID);
          } else {
            promptHelpMessage(senderID);
          }
          break;
        case "skip":
          if(response.status == 0 || response.status == 1) {
            skipStep(senderID);
          } else {
            promptHelpMessage(senderID);
          }
          break;
        case "report--cancel": case "cancel": case "report-cancel":
          if(response.status == 0 || response.status == 1) {
            processReportCancel(senderID);
          } else {
            //promptHelpMessage(senderID);
            sendTextMessage(senderID, "No pending report to cancel");
          }
          break;
        case "edit": case "report--edit": case "report-edit":
          if(response.status == 0 || response.status == 1) {
            sendTextMessage(senderID, "Please select edit option");
            setTimeout(function() {
              promptEdit(senderID);
            }, 1000);
          } else {
            //promptHelpMessage(senderID);
            sendTextMessage(senderID, "No pending report to edit");
          }
          break;
        case "report--more": case "report-more":
          if(response.status == 0 || response.status == 1) {
            //sendTextMessage(senderID, "Please select edit option");
            setTimeout(function() {
              promptReportMedia(senderID);
            }, 1000);
          } else {
            promptHelpMessage(senderID);
          }
          break;
        case "reports": case "report--find": case "report-find":
          promptRecentReports(senderID);          
          break;
        case "help":
          promptHelpList(senderID);          
          break;
        case "report--submit": case "report-submit":
          processReportSubmit(senderID);          
          break;
        case "edit--type":
          setTimeout(function() {
            promptReportType(senderID);
          }, 1000);
          break;
        case "edit--location":
          setTimeout(function() {
            promptReportLocation(senderID);
          }, 1000);
          break;
        case "edit--address":
          setTimeout(function() {
            promptReportAddress(senderID);
          }, 1000);
          break;
        case "edit--description":
          setTimeout(function() {
            promptReportDescription(senderID);
          }, 1000);
          break;
        case "edit--media":
          setTimeout(function() {
            promptReportMedia(senderID);
          }, 1000);
          break;
        default:
          promptHelpMessage(senderID);          
          break;
      }
      } else {
        switch(payload) {
        case "report--new": case "report": case "report-new":
          processNewReport(senderID);
          break;
        case "status":
          sendTextMessage(senderID, "No pending report found.");
          break;
        case "skip":
          sendTextMessage(senderID, "No pending report found.");
          break;
        case "report--cancel": case "cancel": case "report-cancel":
          sendTextMessage(senderID, "No pending report to cancel.");
          break;
        case "edit": case "report--edit": case "report-edit":
          sendTextMessage(senderID, "No pending report to edit");
          break;
        case "reports": case "report--find": case "report-find":
          promptRecentReports(senderID);          
          break;
        case "help":
          promptHelpList(senderID);          
          break;
        default:
          promptHelpMessage(senderID);          
          break;
        }  
    }
  });  
}

function processMenuPostback1(senderID, payload) {
  var parts = payload.split("--");

  firebase.getStatus(senderID, function(error, response) {
    if(response) {
      if (response.status == 0 || response.status == 1) {

        if(parts[0] && parts[1]) {
          if(parts[0] == "report") {
            if(parts[1] == "new") {
              // complain to the user to finish up
              sendTextMessage(senderID, "Please submit current report before starting a new one.");
              setTimeout(function() {
                promptNext(senderID, response.nodeIndex);
              }, 1000);
            } else if(parts[1] == "location") {
              setTimeout(function() {
                promptReportLocation(senderID);
              }, 1000);
            } else if(parts[1] == "address") {
              setTimeout(function() {
                promptReportAddress(senderID);
              }, 1000);
            }
          } else if(parts[0] == "edit") {
            sendTextMessage(senderID, "Please select edit option");
            setTimeout(function() {
              promptEdit(senderID);
            }, 1000);
          } else if(parts[0] == "type1") {
            //console.log("Type part: " + parts[1]);
            setTimeout(function() {
              processReportType(senderID, parts[1]);
            }, 1000);
          }
        }

      } else if (response.status == 1) {              
      // complain to the user to finish up
      sendTextMessage(senderID, "Please select edit option");
      setTimeout(function() {
        promptEdit(senderID);
      }, 2000);

      } else {              
        promptHelpMessage(senderID);
        return;
      }      
    } else {
      promptHelpMessage(senderID);
      return;    
    }
  });  
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/rift.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendTextMsg(msg) {
  callSendAPI(msg);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/instagram_logo.gif"
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendLocationMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text":"Please share your location:",
      "quick_replies":[
        {
          "content_type":"location",
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: SERVER_URL + "/assets/sample.mp3"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: SERVER_URL + "/assets/allofus480.mov"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a file using the Send API.
 *
 */
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: SERVER_URL + "/assets/test.txt"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "This is test text",
          buttons:[{
            type: "web_url",
            url: "https://www.oculus.com/en-us/rift/",
            title: "Open Web URL"
          }, {
            type: "postback",
            title: "Trigger Postback",
            payload: "DEVELOPER_DEFINED_PAYLOAD"
          }, {
            type: "phone_number",
            title: "Call Phone Number",
            payload: "+16505551234"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: SERVER_URL + "/assets/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: SERVER_URL + "/assets/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = "order" + Math.floor(Math.random()*1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: "Peter Chang",
          order_number: receiptId,
          currency: "USD",
          payment_method: "Visa 1234",        
          timestamp: "1428444852", 
          elements: [{
            title: "Oculus Rift",
            subtitle: "Includes: headset, sensor, remote",
            quantity: 1,
            price: 599.00,
            currency: "USD",
            image_url: SERVER_URL + "/assets/riftsq.png"
          }, {
            title: "Samsung Gear VR",
            subtitle: "Frost White",
            quantity: 1,
            price: 99.99,
            currency: "USD",
            image_url: SERVER_URL + "/assets/gearvrsq.png"
          }],
          address: {
            street_1: "1 Hacker Way",
            street_2: "",
            city: "Menlo Park",
            postal_code: "94025",
            state: "CA",
            country: "US"
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.00,
            total_tax: 57.67,
            total_cost: 626.66
          },
          adjustments: [{
            name: "New Customer Discount",
            amount: -50
          }, {
            name: "$100 Off Coupon",
            amount: -100
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What's your favorite movie genre?",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Action",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
        },
        {
          "content_type":"text",
          "title":"Comedy",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
        },
        {
          "content_type":"text",
          "title":"Drama",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function promptMoreMedia(senderID) { 
  var nodeNo = 4;
  firebase.setCurrentNodeIndex(senderID, nodeNo, function(error, res) {
    setTimeout(function() {
      var ar = [{
        "content_type": "text",
        "title": "More media",
        "payload": "report--more"
    },{
        "content_type": "text",
        "title": "Edit",
        "payload": "edit--new"
    },{
        "content_type": "text",
        "title": "Submit",
        "payload": "report--submit"
    },{
        "content_type": "text",
        "title": "Cancel report",
        "payload": "report--cancel"
    }];
      var msg = {"recipient": {
      id: senderID
      }, "message":{
        "text":"Add more media?",
        "quick_replies": ar
      }
    };
    sendTextMsg(msg);
    return true;
    
  }, 2000);    
    return;
  });  
}

function promptReportAddress(senderID) {
  var index = 2;
  firebase.setCurrentNodeIndex(senderID, index, function(error, res) {
    getCurrentNode(senderID, function(error, report) {
      var address = "";
      if(!error && report) {
        address = (report.location && report.location.address)? " Address: " + report.location.address: "";
      }
      var ar = [{
        "content_type": "text",
        "title": "Skip address",
        "payload": "skip"
    }];
      var msg = {"recipient": {
      id: senderID
      }, "message":{
        "text":"Please enter location address if any:" + address,
        "quick_replies": ar
      }
    };
    sendTextMsg(msg);
      //sendTextMessage(senderID, "Please enter location address if any (exact place):" + address);     
      return;
    });
  });    
}

function promptReportDescription(senderID) {
  var index = 3;
  firebase.setCurrentNodeIndex(senderID, index, function(error, res) {
    getCurrentNode(senderID, function(error, report) {
      var desc = "";
      if(!error && report) {
        desc = (report.description)? " Description: " + report.description: "";
      }
      sendTextMessage(senderID, "Please describe your report:" + desc);          
      return;
    });
  }); 
}

function promptReportMedia(senderID) {
  var nodeNo = 4;
  firebase.setCurrentNodeIndex(senderID, nodeNo, function(error, res) {
    getCurrentNode(senderID, function(error, report) { //console.log(report.media);
      var media = "";      
      if(!error && report) {
        var noFiles = (report.media)? Object.keys(report.media).length: 0;
        var s = (noFiles > 1)? "s.": ".";
        media = (report.media)? "Media: " + noFiles + " file" + s: "";
      }
    setTimeout(function() {
      var ar = [{
        "content_type": "text",
        "title": "Skip adding media",
        "payload": "skip"
    }];
      var msg = {"recipient": {
      id: senderID
      }, "message":{
        "text":"Add image, video or audio clip on incident. You could record or snap the scene or pick a file from saved media. " + media,
        "quick_replies": ar
      }
    };
    sendTextMsg(msg);
    return true;
  });
    
  }, 2000);
    return;
  });  
}

function promptReportSubmit(senderID) { 
    setTimeout(function() {
      var ar = [{
        "content_type": "text",
        "title": "Submit",
        "payload": "report--submit"
    },{
        "content_type": "text",
        "title": "Edit",
        "payload": "report--edit"
    },{
        "content_type": "text",
        "title": "Cancel report",
        "payload": "report--cancel"
    }];
      var msg = {"recipient": {
      id: senderID
      }, "message":{
        "text":"Submit your report?",
        "quick_replies": ar
      }
    };
    sendTextMsg(msg);
    return true;
    
  }, 2000); 
}

function promptNext(senderID, nodeIndex) {
  firebase.getStatus(senderID, function(error, nodeObj) {
      if(nodeObj && nodeObj.status == 0) {
      var node = parseInt(nodeIndex);

      switch(node) {
        case 0:
          promptReportType(senderID);
          break;
        case 1:
          promptReportLocation(senderID);
          break;
        case 2:
          promptReportAddress(senderID);
          break;
        case 3:
          promptReportDescription(senderID);
          break;
        case 4:
          promptReportMedia(senderID);
          break;
        default:
          promptMoreMedia(senderID);
          break;
      }
    } else {
      promptEdit(senderID);
    }
  });  
}

function processNewReport(senderID) {
  firebase.getStatus(senderID, function(error, node) {
    if(!node) {
      firebase.newReport(senderID, function(error, node) {
        if(!error) {
          var nodeIndex = 0;
          promptNext(senderID, nodeIndex);
        }
      });
    } else {
      sendTextMessage(senderID, "Please submit pending report before starting a new one.");
      setTimeout(function() {
        promptNext(senderID, node.nodeIndex);
      }, 1000);
    }
  });
}

function processReportType(senderID, type) {
  //console.log("Type: " + type);
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      firebase.addNode(senderID, node.nodeID, "type", type, function(error, res) {
        if(!error) {
          var nodeNo = 1; //parseInt(node.nodeIndex) + 1
          firebase.setCurrentNodeIndex(senderID, nodeNo, function(error, res) {
            promptNext(senderID, nodeNo);
          });
        } else {
          console.log("Error: " + error);
        }
      });
    }
  });  
}

function processReportSubmit(senderID) {
  getCurrentNode(senderID, function(error, node) {
    if((node && node.type != -1) && (node.location && node.description)) {
      addReportTimestamp(senderID);
      setTimeout(function() {
        firebase.submitReport(senderID, function(error, res) {              
          sendTextMessage(senderID, "Report submitted successfully.");
          return;
        });
      }, 2000);
    } else {
      sendTextMessage(senderID, "Report type, location/address and description are required. Please edit below:");
      setTimeout(function(){
        promptEdit(senderID);
      }, 2000);
      return;
    }  
  });
}

function processReportCancel(senderID) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      firebase.cancelReport(senderID, node.nodeID, function(error, res) {              
        sendTextMessage(senderID, "Report cancelled successfully.");
        return;
      });
    }
  });
}

function promptCurrentReport(senderID) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      firebase.getCurrentReport(senderID, node.nodeID, function(error, res) {
        if(!error && res) {
          console.log(res);
          var type = "n/a";
		  var types = firebase.getTypes();
          if(res.type) {
              type = (res.type && typeof(types[parseInt(res.type) - 1]) != "undefined")? types[parseInt(res.type) - 1]: "n/a";
          }

          var noFiles = (res.media)? Object.keys(res.media).length: 0;
          var s = (noFiles > 1)? "s.": ".";
          var media = (res.media)? ", Media: " + noFiles + " file" + s: "";

          var report = "REPORT TYPE: " + type;
          report += ", DESCRIPTION: " + res.description;
          if(res.location && res.location.address) {
            report += ", ADDRESS: " + res.location.address;
          } else {
            //report += ", ADDRESS: n/d";
          }
          if(res.location && res.location.longitude) {
            report += ", LOCATION - Long: " + res.location.longitude + " Lat: " + res.location.longitude;
          }          
          report += media;    

          sendTextMessage(senderID, report);          
        } else {
          console.log("Error: " + error);
          sendTextMessage(senderID, "Error displaying the selected report.");
        }
      });
    } else {
      sendTextMessage(senderID, "No pending report. Type 'reports' to see your reports.");
    }
  });
}

function findReport(senderID, nodeID) {
    if(nodeID) {
      firebase.getCurrentReport(senderID, nodeID, function(error, res) {
        if(!error && res) {
          //console.log(res);
          var type = "n/a";
          var types = firebase.getTypes();
          if(res.type) {
              type = (res.type && typeof(types[parseInt(res.type) - 1]) != "undefined")? types[parseInt(res.type) - 1]: "n/a";
          }

          var noFiles = (res.media)? Object.keys(res.media).length: 0;
          var s = (noFiles > 1)? "s.": ".";
          var media = (res.media)? ", Media: " + noFiles + " file" + s: "";

          var report = "REPORT TYPE: " + type;
          report += ", DESCRIPTION: " + res.description;
          if(res.location && res.location.address) {
            report += ", ADDRESS: " + res.location.address;
          } else {
            report += ", ADDRESS: n/d";
          }        
          if(res.location && res.location.longitude) {
            report += ", LOCATION - Long: " + res.location.longitude + " Lat: " + res.location.longitude;
          }          
          report += media;    

          sendTextMessage(senderID, report);
          setTimeout(function() {
            promptRecentReports(senderID);
          }, 2000);
        } else {
          console.log("Error: " + error);
          sendTextMessage(senderID, "Error displaying the selected report.");
        }        
      });
    } else {
      Message(senderID, "Unsupported selection!");
    }
}

function getCurrentNode(senderID, callback) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      firebase.getCurrentReport(senderID, node.nodeID, function(error, res) {
        if(!error) {          
          return callback(null, res); 
        } else {
          return callback(error, null);
        }
      });
    } else {
      return callback(error, null);
    }
  });
}

function promptRecentReports(senderID) {  
  firebase.getRecentReportID(senderID, function(error, res) {
    if(!error && res) {
      //var len = Object.keys(res).length
      if(res.length > 0) {
        //sendTextMessage(senderID, JSON.stringify(res));
        showRecentReports(senderID, res);
      }
      else {
        sendTextMessage(senderID, "No recent reports found.");        
      }
    } else {
      console.log("Error: " + error);
      sendTextMessage(senderID, "No recent reports found.");
    }
  });    
}

function promptContinue(senderID) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      promptNext(senderID, node.nodeIndex);
    } else {
      sendTextMessage(senderID, "No pending report found."); 
    }
  });
}

function showRecentReports(senderID, reports) {
  var ar = reports.map(function(node) {
    //console.log(node);
    var type = (node && node.type)? node.type: "n/a";
    var desc = (node && node.description)? node.description.slice(0, 10): "";    
    return {
      "content_type": "text",
      "title": type + ": " + desc,
      "payload": "findReport--" + node.key
    }
  });
    var msg = {"recipient": {
    id: senderID
    }, "message":{
      "text":"Recent reports. Choose report below:",
      "quick_replies": ar
    }
  };
  sendTextMsg(msg);     
  return;
}

function promptReportLocation(senderID) {
  var index = 1;
  firebase.setCurrentNodeIndex(senderID, index, function(error, res) {
    getCurrentNode(senderID, function(error, report) {
      var location = "";
      if(!error && report) {
        location = (report.location && report.location.longitude)? "Longitude: " + report.location.longitude + ", Latitude: " + report.location.latitude: "";
      }     
    
      var ar = [{
          "content_type": "location",
          "title": "Share location",
          "payload": "report-location"
      },{
          "content_type": "text",
          "title": "Skip",
          "payload": "skip"
      },{
          "content_type": "text",
          "title": "Cancel report",
          "payload": "report--cancel"
      }];
        var msg = {"recipient": {
        id: senderID
        }, "message":{
          "text":"Share your location. You need to enable GPS location setting on your device for this feature. " + location,
          "quick_replies": ar
        }
      };
      sendTextMsg(msg);     
      return;
    });
  });  
}

function processReportLocation(senderID, location) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      firebase.addNode(senderID, node.nodeID, "location", location, function(error, res) {
        console.log(res);
        if(!error) {
          var nodeNo = parseInt(node.nodeIndex) + 1;
          firebase.setCurrentNodeIndex(senderID, nodeNo, function(error, res) {
            console.log(res);
            promptNext(senderID, nodeNo);
          });
        }
      });
    }
  });
}

function addReportTimestamp(senderID) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      firebase.addTimestamp(senderID, node.nodeID, function(error, res) {
        return res;
      });
    }
  });
}

function processReportAddress(senderID, address) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      firebase.addNode(senderID, node.nodeID, "location/address", address, function(error, res) {
        console.log(res);
        if(!error) {
          var nodeNo = parseInt(node.nodeIndex) + 1;
          firebase.setCurrentNodeIndex(senderID, nodeNo, function(error, res) {
            console.log(res);
            promptNext(senderID, nodeNo);
          });
        }
      });
    }
  });
}

function processReportDescription(senderID, description) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      firebase.addNode(senderID, node.nodeID, "description", description, function(error, res) {
        console.log(res);
        if(!error) {
          var nodeNo = parseInt(node.nodeIndex) + 1;
          firebase.setCurrentNodeIndex(senderID, nodeNo, function(error, res) {
            console.log(res);
            promptNext(senderID, nodeNo);
          });
        }
      });
    }
  });
}

function processReportMedia(senderID, medium) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {
      firebase.addMedia(senderID, node.nodeID, "media", medium, function(error, res) {
        console.log(res);
        if(!error) {
          var nodeNo = parseInt(node.nodeIndex) + 1;
          //firebase.setCurrentNodeIndex(senderID, nodeNo, function(error, res) {
            //console.log(res);
            promptMoreMedia(senderID);
          //});
        }
      });
    }
  });
}

function promptEdit(senderID) {
  firebase.getStatus(senderID, function(error, node) {
    if(node) {      
      setTimeout(function() {
          var ar = [{
            "content_type": "text",
            "title": "Type",
            "payload": "edit--type"
        },{
            "content_type": "location",
            "title": "Share Location",
            "payload": "edit--location"
        },{
            "content_type": "text",
            "title": "Address",
            "payload": "edit--address"
        }, {
            "content_type": "text",
            "title": "Description",
            "payload": "edit--description"
        },{
            "content_type": "text",
            "title": "Media",
            "payload": "edit--media"
        },{
            "content_type": "text",
            "title": "Cancel report",
            "payload": "report--cancel"
        }];
          var msg = {"recipient": {
          id: senderID
          }, "message":{
            "text":"Select edit options below:",
            "quick_replies": ar
          }
        };
        sendTextMsg(msg);
        return true;
        
      }, 2000);
    } else {
      sendTextMessage(senderID, "No active report to edit.");
    }
  });
}

function promptReportType(senderID) {
  var index = 0;
  firebase.setCurrentNodeIndex(senderID, index, function(error, res) {
    getCurrentNode(senderID, function(error, report) {
      var type = "";
      var types = firebase.getTypes();
      if(!error && report) {
        type = (report.type && typeof(types[parseInt(report.type) - 1]) != "undefined")? "Report type: " + types[parseInt(report.type) - 1]: "";
      }
      var ar = [{
          "content_type": "text",
          "title": "Crime",
          "payload": "type--1"
      },{
          "content_type": "text",
          "title": "Emergency",
          "payload": "type--2"
      },{
          "content_type": "text",
          "title": "Public Opinion",
          "payload": "type--3"
      },{
          "content_type": "text",
          "title": "Public Opinion",
          "payload": "type--3"
      },{
          "content_type": "text",
          "title": "Accident",
          "payload": "type--4"
      },{
          "content_type": "text",
          "title": "Event",
          "payload": "type--5"
      },{
          "content_type": "text",
          "title": "Social Abuse",
          "payload": "type--6"
      },{
          "content_type": "text",
          "title": "Others",
          "payload": "type--7"
      },{
          "content_type": "text",
          "title": "Cancel",
          "payload": "type--cancel"
      }];
        var msg = {"recipient": {
        id: senderID
        }, "message":{
          "text":"Select report type: " + type,
          "quick_replies": ar
        }
      };
      sendTextMsg(msg);        
      return;
    });
  });  
}

function setupStartButton() {
  var messageData1 = {
    message: {
      "get_started": {
        "payload":"Greeting"
      }
    }
  };

  var messageData = {
    message: {
      "setting_type":"call_to_actions",
      "thread_state":"new_thread",
      "call_to_actions":[
        {
          "payload":"Greeting"
        }
      ]
    }
  };

  //var url = "https://graph.facebook.com/v2.6/me/messenger_profile/";
  var url = "https://graph.facebook.com/v2.6/me/thread_settings";
  sendAPI(url, messageData);
}

function sendGreeting() {
  var messageData1 = {
    "greeting":[
    {
      "locale":"default",
      "text":"Hello {{user_first_name}}, Use this platform to quickly report emergencies, abuses, etc and be sure to get a feedback as soon as possible."
    }
  ]
  };

  var messageData = {
    "setting_type":"greeting",
    "greeting": {
      "text":"Hello {{user_first_name}}, Use this platform to quickly report emergencies, abuses, etc and be sure to get a feedback as soon as possible."
    }
  };

  var url = "https://graph.facebook.com/v2.6/me/messenger_profile/";
  //var url = "https://graph.facebook.com/v2.6/me/thread_settings";
  sendAPI(url, messageData1);
}

function addPersistentMenu(){
 request({
    url: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json:{
        setting_type : "call_to_actions",
        thread_state : "existing_thread",
        call_to_actions:[
            {
              "title":"New Report",
              "type":"postback",
              "payload": "report--new"
            },
            {
              "title":"My Reports",
              "type":"postback",
              "payload": "report--find"
            },
            {
              "type":"web_url",
              "title":"Help",
              "url":"http://helloworldng.com/ers-help.php",
              "webview_height_ratio":"full"
            }
          ]
    }

}, function(error, response, body) {
    console.log(response)
    if (error) {
        console.log('Error sending messages: ', error)
    } else if (response.body.error) {
        console.log('Error: ', response.body.error)
    }
})

}

function removePersistentMenu(){
 request({
    url: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json:{
        setting_type : "call_to_actions",
        thread_state : "existing_thread",
        call_to_actions:[ ]
    }

}, function(error, response, body) {
    console.log(response)
    if (error) {
        console.log('Error sending messages: ', error)
    } else if (response.body.error) {
        console.log('Error: ', response.body.error)
    }
})
}


function setupPersistentMenu() {
  var messageData1 = {
    "persistent_menu":[
    {
      "locale":"default",
      "composer_input_disabled":true,
      "call_to_actions":[
        {
          "title":"New Report",
          "type":"postback",
          "payload": "report--new"
        },
        {
          "title":"My Reports",
          "type":"postback",
          "payload": "report--find"
        },
        {
          "type":"web_url",
          "title":"Help",
          "url":"http://helloworldng.com/ers-help.php",
          "webview_height_ratio":"full"
        }
      ]
    }
  ]
  };

  var messageData = {
    "setting_type" : "call_to_actions",
    "thread_state" : "existing_thread",
    "call_to_actions":[
        {
          "title":"New Report",
          "type":"postback",
          "payload": "report--new"
        },
        {
          "title":"My Reports",
          "type":"postback",
          "payload": "report--find"
        },
        {
          "type":"web_url",
          "title":"Help",
          "url":"http://helloworldng.com/ers-help.php",
          "webview_height_ratio":"full"
        }
      ]
    }; 

  var url = "https://graph.facebook.com/v2.6/me/messenger_profile/";
  //var url = "https://graph.facebook.com/v2.6/me/thread_settings";
  sendAPI(url, messageData1);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });  
}

function sendAPI(url, messageData) {
  request({
    uri: url,
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {      
      console.log("Successfully called Send API - modified");      
    } else {
      var err = (body.error && body.error.message)? body.error.message:"";
      console.error("Failed calling Send API", err); // response.statusCode, response.statusMessage, 
    }
  });  
}


// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

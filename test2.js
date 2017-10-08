var clientId = '228562968512.252375053073';
var clientSecret = '2932c03df3ff73fd965a92440f2f9006';
// Instantiates Express and assigns our app variable to it

var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var beep = require('beepbeep');
var player = require('play-sound')(opts = {})

var app = express();
app.use(bodyParser.json());
// Again, we define a port we want to listen to
const PORT=4390;
// Lets start our server
app.listen(PORT, function () {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Example app listening on port " + PORT);
});
// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', function(req, res) {
    res.send('Ngrok is working! Path Hit: ' + req.url);
});


app.get('/oauth', function(req, res) {
    // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
    if (!req.query.code) {
        res.status(500);
        res.send({"Error": "Looks like we're not getting code."});
        console.log("Looks like we're not getting code.");
    } else {
        // If it's there...
        // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
        request({
            url: 'https://slack.com/api/oauth.access', //URL to hit
            qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret}, //Query string data
            method: 'GET', //Specify the method
        }, function (error, response, body) {
            if (error) {
                console.log(error);
            } else {
                res.json(body);
            }
        })
    }
});


let oauthToken = 'xoxb-253981683143-1zurLGarfo66h8aTIdRL0Oet';

app.post('/events', (req, res) => {
  let q = req.body;
  console.log('*** Event triggered');
  console.log(q);
  // To see if the request is coming from Slack
  if (q.token !== 'cJ8fXxe7wOYfRC3M3VQ9nn52') {
    res.sendStatus(400);
    return;
  }
  // App setting validation
  if (q.type === 'url_verification') {
    res.send(q.challenge);
  }
 // // Events
  else if (q.type === 'event_callback') {
    if(!q.event.text) return;
    // Exclude the message from a bot, also slash command
    let regex = /(^\/)/;
    if(q.event.subtype === 'bot_message' || regex.test(q.event.text)) return;
     analyzePerson(q.event);
    res.sendStatus(200);
  }
});


var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

var personality_insights = new PersonalityInsightsV3({
  username: '1ce0a845-edcf-43c5-b8d5-5fe378817d6c',
  password: 'tzj8nXjxflNq',
  version_date: '2016-10-19'
});

personality_insights.profile({
  text: 'Enter more than 100 unique words here...',
  consumption_preferences: true
  },
  function (err, response) {
    if (err)
      console.log('error:', err);
    else
      console.log(JSON.stringify(response, null, 2));
});

function analyzePerson(ev){
	let content = ev.text;
	personality_insights.profile({
		text : content,
		version : '2016-10-19',
	consumption_preferences: true
	},
	function (err, response) {
	  if (err)
	    console.log('error:', err);
	  else
	    {
	    	let message = response.personality.name;
	    	let options = {
        	method: 'POST',
        	uri: 'https://slack.com/api/chat.postMessage',
        	form: {
          	token: oauthToken,
          	channel: ev.channel,
          	text: message,
          	as_user: false,
          	username: 'Jazbati'
        	} 
      	};
      	request(options, (error, response, body) => {
        if (error) {
          console.log(error)
     	}
		});
		}
	});
}

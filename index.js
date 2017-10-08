// Import express and request modules
var express = require('express');
var request = require('request');
var beep = require('beepbeep');
var player = require('play-sound')(opts = {})
var bodyParser = require('body-parser');
// Store our app's ID and Secret. These we got from Step 1. 
// For this tutorial, we'll keep your API credentials right here. But for an actual app, you'll want to  store them securely in environment variables. 
var clientId = '228562968512.252375053073';
var clientSecret = '2932c03df3ff73fd965a92440f2f9006';
// Instantiates Express and assigns our app variable to it
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
// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
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
    analyzeTone(q.event);
    res.sendStatus(200);
  }
});
// Route the endpoint that our slash command will point to and send back a simple response to indicate that ngrok is working
app.post('/command', function(req, res) {
    res.send('We will ring a notification to notify users!!!');
     player.play('urgent.wav', function(err){
            if (err) throw err
            });
});
// app.post('/bcommand', function(req, res) {
//     res.send('Wishing happy birthday !!!');
//      player.play('birthday.mp3', function(err){
//             if (err) throw err
//             });
// });
// IBM Watson Tone Analysis
const watson = require('watson-developer-cloud');
let tone_analyzer = watson.tone_analyzer({
  username: '1b1c25fe-67fc-4f7b-971d-e8295d798c76',
  password: 'Y2lzWBAyUYt0',
  version: 'v3',
  version_date: '2016-05-19'
});
const confidencethreshold = 0.55;
function analyzeTone(ev) {
  let text = ev.text;
  if(text == ':disappointed:')
    text = 'sad';
  let regex = /(^:.*:$)/; // Slack emoji, starts and ends with :
  if(regex.test(text)) {
    text = text.replace(/_/g , ' ');
    text = text.replace(/:/g , '');
  }
  tone_analyzer.tone({text: text}, (err, tone) => {
    if (err) {
      console.log(err);
    } else {
      tone.document_tone.tone_categories.forEach((tonecategory) => {
        if(tonecategory.category_id === 'emotion_tone'){
          console.log(tonecategory.tones);
          count = 0;
          tonecategory.tones.forEach((emotion) => {
            if(emotion.score >= confidencethreshold) { // pulse only if the likelihood of an emotion is above the given confidencethreshold
              if(count==0){
                postEmotion(emotion, ev);
                count += 1;
              }
            }
            else if((emotion.tone_id == 'fear' && emotion.score<=0.5 && emotion.score>=0.3) || (emotion.tone_id == 'sadness' && emotion.score<=0.35 && emotion.score>=0.25)) {
              emotion.tone_id = 'warning';
              if(count==0){
                postEmotion(emotion, ev);
                count += 1;
              }
            }
          })
        }
      })
    }
  });
}
function postEmotion(emotion, ev) {
  console.log('Current Emotion is', emotion.tone_id);
  let username = '';
  request.post('https://slack.com/api/users.info', {form: {token: oauthToken, user: ev.user}}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      username = JSON.parse(body).user.name;
      let message ;
       if(emotion.tone_id == "joy"){
        message  = username + ' is feeling ' + emotion.tone_id +'ful' +" :smile:";
        player.play('joy.mp3', function(err){
            if (err) throw err
            });
      }
      else if(emotion.tone_id == "sadness"){
       message  = username + ' is feeling sad ' + " :disappointed:";
        player.play('sad.mp3', function(err){
            if (err) throw err
            });
      }
      else if(emotion.tone_id == "fear"){
       message  = username + ' is frightened' +" :fearful:";
       player.play('fear.mp3', function(err){
            if (err) throw err
            });
      }
      else if(emotion.tone_id == "warning"){
        message  = 'Stay alert ' +" :rotating_light:";
        player.play('warning.mp3', function(err){
            if (err) throw err
            });
      }
      else if(emotion.tone_id == "anger"){
       message  = username + ' is angry' +" :rage:";
        emotion.tone_id = 'angry';
        beep(2,300);
      }
      
      
      let options = {
        method: 'POST',
        uri: 'https://slack.com/api/chat.postMessage',
        form: {
          token: oauthToken,
          channel: ev.channel,
          text: message,
          as_user: false,
          username: 'Sentimental'
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
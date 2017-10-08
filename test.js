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

app.post('/command', function(req, res) {
    res.send('We will ring a notification to notify users!!!');
     player.play('urgent.wav', function(err){
            if (err) throw err
            });
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

var ans = 0;
var run = 1;
var dt = 0;

app.post('/events', (req, res) => {
  dt += 1;
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

var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

var tone_analyzer = new ToneAnalyzerV3({
  username: '4c630671-f33f-477a-a63f-981bf4215371',
  password: 'jUZvvrf4fb2O',
  version_date: '2016-05-19'
});

tone_analyzer.tone({ text: 'Greetings from Watson Developer Cloud!' },
  function(err, tone) {
    if (err)
      console.log(err);
    else
      console.log(JSON.stringify(tone, null, 2));
});

const confidencethreshold = 0.5;
function analyzeTone(ev) {
	let kaju = 'Result is positive';
	if(dt >= 20)
	{
		dt = 0;
		if(ans<0)
			kaju = 'Result is negative';
		postEmotion(kaju,ev);
	}
  let text = ev.text;
  if(text == ':disappointed:')
    text = 'sad';
  let regex = /(^:.*:$)/; // Slack emoji, starts and ends with :
  if(regex.test(text)) {
    text = text.replace(/_/g , '');
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
          maxe = 0;
          maxo = 0;
          tonecategory.tones.forEach((emotion) => {
            if(emotion.score >= confidencethreshold) { // pulse only if the likelihood of an emotion is above the given confidencethreshold
              if(count==0){
                postEmotion(emotion.tone_id, ev);
                count += 1;
              }
            }
            else if((emotion.tone_id == 'fear' && emotion.score<=0.5 && emotion.score>=0.3) || (emotion.tone_id == 'sadness' && emotion.score<=0.35 && emotion.score>=0.25)) {
              emotion.tone_id = 'warning';
              if(count==0){
                postEmotion(emotion.tone_id, ev);
                count += 1;
              }
            }
            if(emotion.tone_id == 'joy' && maxo<emotion.score)
            	maxo = emotion.score;
            else if(emotion.tone_id != 'joy' && maxe<emotion.score)
            	maxe = emotion.score;
          })
          if(maxe>maxo)
          	ans-=maxe;
          else
          	ans+=maxo;
        }
      })
    }
  });
}

function postEmotion(emotiontone_id, ev) {
  console.log('Current Emotion is', emotiontone_id);
  let username = '';
  request.post('https://slack.com/api/users.info', {form: {token: oauthToken, user: ev.user}}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      username = JSON.parse(body).user.name;
      let message ;
       if(emotiontone_id == "joy"){
        message  = username + ' is feeling joyful :smile:';
        player.play('joy.mp3', function(err){
            if (err) throw err
            });
      }
      else if(emotiontone_id == "sadness"){
       message  = username + ' is feeling sad :disappointed:';
        player.play('sad.mp3', function(err){
            if (err) throw err
            });
      }
      else if(emotiontone_id == "fear"){
       message  = username + ' is frightened :fearful:';
       player.play('fear.mp3', function(err){
            if (err) throw err
            });
      }
      else if(emotiontone_id == "warning"){
        message  = 'Stay alert :rotating_light:';
        player.play('warning.mp3', function(err){
            if (err) throw err
            });
      }
      else if(emotiontone_id == "anger"){
       message  = username + ' is angry :rage:';
        beep(2,300);
      }
      else
      	message = emotiontone_id;
      
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
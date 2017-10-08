var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

var personality_insights = new PersonalityInsightsV3({
  username: '1ce0a845-edcf-43c5-b8d5-5fe378817d6c',
  password: 'tzj8nXjxflNq',
  version_date: '2016-10-19'
});

personality_insights.profile({
  text: ' Vice President Johnson, Mr. Speaker, Mr. Chief Justice, President Eisenhower, Vice President Nixon, President Truman, Reverend Clergy, fellow citizens:We observe today not a victory of party but a celebration of freedom --symbolizing an end as well as a beginning -- signifying renewal as well aschange. For I have sworn before you and Almighty God the same solemn oath ourforbears prescribed nearly a century and three-quarters ago.The world is very different now. For man holds in his mortal hands the power to abolish all forms of human poverty and all forms of human life. And yet the same revolutionary beliefs for which our forebears fought are still atissue around the globe -- the belief that the rights of man come not from the',
  consumption_preferences: true
  },
  function (err, response) {
    if (err)
      console.log('error:', err);
    else
      console.log(JSON.stringify(response, null, 2));
});
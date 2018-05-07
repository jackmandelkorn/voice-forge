const Alexa = require("alexa-sdk");
const AWS = require("aws-sdk");

var pinLength = 6;
var pinStart = 9;
var globalPin;
var self;
var maxWait = 1000; //in seconds

const WELCOME_MESSAGE = "Welcome to Voice Forge! Voice Forge allows you to build and design websites faster using this skill and the voiceforge.io website. To get started, open a computer and navigate to voiceforge.io in your web browser. Once you're ready, you can ask this skill to create elements, style them, type words in them, and much more.";
const WELCOME_END = "What can I do for you?";
const ERROR_MESSAGE = "Something went wrong. Please try saying your command again.";
const EXIT_MESSAGE = "Goodbye!";
const HELP_MESSAGE = "Voice Forge is both an Alexa Skill and a website that allows you to build and design websites faster. This skill will only work properly when the voiceforge.io website is open on your computer's web browser. Once the site is open, make sure your 6 digit pin is correctly entered on the voiceforge.io website, and you'll be good to go. If you don't know your 6 digit pin, you can ask me, \"What's my pin?\" If your pin is entered correctly on the website, you can use this skill to create elements, style them, type in them, and much more. If you need a moment to get set up, just ask me to \"wait\".";
const MISTAKE = "Uh-oh!";
const MISTAKE_END = "Please revise your command and try again.";
const RESPONSES = ["Done.","Gotcha.","Okay.","Done."];
const RESPONSES_END = ["What's next?","What else?","Anything else?","What's next?"];
const WAIT_MESSAGE = "Okay! Say 'Alexa' before your next command to wake me up.";

function respond() {
  return (RESPONSES[Math.floor(Math.random() * RESPONSES.length)] + " " + respondEnd());
}

function respondEnd() {
  return RESPONSES_END[Math.floor(Math.random() * RESPONSES_END.length)];
}

const handlers = {
  'Unhandled': function () {
  	this.emit(":ask", ERROR_MESSAGE, respondEnd());
	},
  'LaunchRequest': function () {
  	this.emit(":ask", WELCOME_MESSAGE + " " + WELCOME_END, WELCOME_END);
	},
	'Create': function () {
    self = this;
    try {
      var content = new Array();
      try {
        var slotParent = this.event.request.intent.slots;
        if (slotParent.CreateElementName.value) {
          if (slotParent.CreateElementName.resolutions.resolutionsPerAuthority[0].status.code === "ER_SUCCESS_NO_MATCH") {
            this.emit(":ask", (MISTAKE + " '" + slotParent.CreateElementName.value + "' is not a valid element name. " + MISTAKE_END), MISTAKE_END);
          }
          else {
            content.push("ElementName");
            content.push(slotParent.CreateElementName.resolutions.resolutionsPerAuthority[0].values[0].value.id);
          }
        }
        if (slotParent.CreateNumber.value) {
          content.push("Number");
          content.push(slotParent.CreateNumber.value);
        }
        if (slotParent.CreateSizeClass.value) {
          if (slotParent.CreateSizeClass.resolutions.resolutionsPerAuthority[0].status.code === "ER_SUCCESS_NO_MATCH") {
            this.emit(":ask", (MISTAKE + " '" + slotParent.CreateSizeClass.value + "' is not a valid size class. " + MISTAKE_END), MISTAKE_END);
          }
          else {
            content.push("SizeClass");
            content.push(slotParent.CreateSizeClass.value);
          }
        }
        if (slotParent.CreateColorClass.value) {
          if (slotParent.CreateColorClass.resolutions.resolutionsPerAuthority[0].status.code === "ER_SUCCESS_NO_MATCH") {
            this.emit(":ask", (MISTAKE + " '" + slotParent.CreateColorClass.value + "' is not a valid color class. " + MISTAKE_END), MISTAKE_END);
          }
          else {
            content.push("ColorClass");
            content.push(slotParent.CreateColorClass.resolutions.resolutionsPerAuthority[0].values[0].value.id);
          }
        }
        if (slotParent.CreateCustomText.value) {
          content.push("CustomText");
          content.push(slotParent.CreateCustomText.value);
        }
      }
      catch (err) {
        console.log(err);
        content = new Array();
        this.emit(":ask", ERROR_MESSAGE, MISTAKE_END);
      }
      var payload = [this.event.request.intent.name,content];
      dynamoPush(payload);
    }
    catch (err) {
      console.log(err);
      this.emit(":ask", ERROR_MESSAGE, MISTAKE_END);
    }
	},
  "CSS": function () {
    self = this;
    try {
      var content = new Array();
      var slotParent = this.event.request.intent.slots;
      if (slotParent.CSSCSSParameter.value) {
        content.push("CSSParameter");
        content.push(slotParent.CSSCSSParameter.resolutions.resolutionsPerAuthority[0].values[0].value.name);
      }
      if (slotParent.CSSCSSValue.value) {
        content.push("CSSValue");
        content.push(slotParent.CSSCSSValue.resolutions.resolutionsPerAuthority[0].values[0].value.name);
      }
      if (slotParent.CSSNumber.value) {
        content.push("Number");
        content.push(slotParent.CSSNumber.value);
      }
      if (slotParent.CSSCSSUnit.value) {
        content.push("CSSUnit");
        content.push(slotParent.CSSCSSUnit.resolutions.resolutionsPerAuthority[0].values[0].value.name);
      }
      var payload = [this.event.request.intent.name,content];
      dynamoPush(payload);
    }
    catch (err) {
      console.log(err);
      this.emit(":ask", ERROR_MESSAGE, MISTAKE_END);
    }
  },
  "Wait": function () {
    self = this;
    try {
      var slotParent = this.event.request.intent.slots;
      if (slotParent.WaitNumber.value) {
        var seconds = parseInt(slotParent.WaitNumber.value);
        if (slotParent.WaitWaitUnits.resolutions.resolutionsPerAuthority[0].values[0].value.name === "minutes") {
          seconds *= 60;
        }
        if (seconds > maxWait) {
          seconds = maxWait;
        }
        waitFor(seconds);
      }
      else {
        waitFor(maxWait);
      }
    }
    catch (err) {
      console.log(err);
      this.emit(":ask", ERROR_MESSAGE, MISTAKE_END);
    }
  },
  "Duplicate": function() {
    self = this;
    dynamoPush(["Duplicate"]);
  },
  "Delete": function () {
    self = this;
    dynamoPush(["Delete"]);
  },
  "Undo": function () {
    self = this;
    dynamoPush(["Undo"]);
  },
  "Redo": function () {
    self = this;
    dynamoPush(["Redo"]);
  },
  "Type": function () {
    self = this;
    try {
      var content = new Array();
      var slotParent = this.event.request.intent.slots;
      var text = slotParent.TypeCustomText.value;
      dynamoPush(["Type",text]);
    }
    catch (err) {
      console.log(err);
      this.emit(":ask", ERROR_MESSAGE, MISTAKE_END);
    }
  },
  "Pin": function () {
    this.emit(":ask",("Your pin is <say-as interpret-as=\"spell-out\">" + globalPin.toString() + "</say-as>"), respondEnd());
  },
  "AMAZON.HelpIntent": function () {
    this.emit(":ask", HELP_MESSAGE + " " + WELCOME_END, respondEnd());
  },
  "AMAZON.CancelIntent": function () {
    this.emit(":tell", EXIT_MESSAGE);
  },
  "AMAZON.StopIntent": function () {
    this.emit(":tell", EXIT_MESSAGE);
  }
};

exports.handler = function(event, context, callback) {
    globalPin = generatePin(event.session.user.userId);
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = "amzn1.ask.skill.925c2829-748b-4453-a34f-d7c610114381";
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function generatePin(data) {
  var ret = '';
  for (var i = pinStart; i < data.length; i++) {
    if (ret.length === pinLength) {
      i = data.length;
    }
    else {
      if (isNaN(data.charAt(i)) === false) {
        ret = ret + data.charAt(i);
      }
    }
  }
  return ret;
}

function dynamoPush(payload) {
  var params = {
    TableName: "voice-forge",
    Key: {
      pin: globalPin.toString()
    },
    UpdateExpression: "set content = :content",
    ExpressionAttributeValues: {
      ":content": JSON.stringify(payload)
    }
  };
  var docClient = new AWS.DynamoDB.DocumentClient();
  docClient.update(params, function(err, data) {
    if (err) {
      console.log(err);
      self.emit(":ask", ERROR_MESSAGE, MISTAKE_END);
    }
    else {
      self.emit(":ask", respond(), respondEnd());
    }
  });
}

function waitFor(seconds) {
  var ret = WAIT_MESSAGE + " ";
  var display = seconds;
  var reps = Math.floor(seconds / 10);
  var add = seconds % 10;
  for (var i = 0; i < reps; i++) {
    ret = ret + '<break time="10s" /> ';
  }
  if (add > 0) {
    ret = ret + '<break time="' + add + 's" /> ';
  }
  ret = ret.trim();
  var unit = "seconds"
  if (seconds === 1) {
    unit = "second";
  }
  if (seconds > 59) {
    unit = "minute";
    display /= 60;
  }
  if (seconds > 119) {
    unit = "minutes";
  }
  display = Math.round(display).toString();
  self.emit(":ask",(ret + " It has been " + display + " " + unit + "."), respondEnd());
}

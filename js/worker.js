importScripts("https://cdnjs.cloudflare.com/ajax/libs/aws-sdk/2.219.1/aws-sdk.js");

var active = true;
var blobDefault = "!IDLE!";
var lag = 300;
AWS.config.update({region: 'us-east-1'});
AWS.config.credentials = new AWS.Credentials("***", "***");
var docClient = new AWS.DynamoDB.DocumentClient();
var blob = JSON.stringify([blobDefault]);
var init = false;
var pin = false;

//init
setInterval(function(){
  if (active) {
    if (pin) {
      reloadDynamo(pin);
    }
  }
},lag);


onmessage = function(e) {
  var text = e.data;
  if (JSON.parse(text) === true || JSON.parse(text) === false) {
    active = JSON.parse(text);
  }
  else {
    pin = JSON.parse(text);
  }
}

function reloadDynamo(pin) {
	var params = {
		TableName: "voice-forge",
		Key: {
      pin: pin.toString()
		}
	};
	docClient.get(params, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			var temp = blob;
      try {
        blob = data.Item.content;
  			if (temp !== blob && !JSON.parse(blob).includes(blobDefault)) {
  				incoming(pin);
  			}
      }
      catch (err) {
        blob = JSON.stringify([blobDefault]);
        incoming(pin);
      }
		}
	});
}

function incoming(pin) {
  if (!JSON.parse(blob).includes(blobDefault)) {
    postMessage(blob);
  }
  active = false;
	var payload = [blobDefault];
	var params = {
		TableName: "voice-forge",
		Key: {
			pin: pin.toString()
		},
		UpdateExpression: "set content = :content",
		ExpressionAttributeValues: {
			":content": JSON.stringify(payload)
		}
	};
	docClient.update(params, function(err, data) {
		if (err) {
			console.log(err);
		}
    else {
      setTimeout(function(){active = true;},(lag * 2));
    }
	});
}

var extension = "";
var projectTitle = "";
var projectDescription = "";
var projectVersion = "";
var projectNeutralUI = false;
var projectWindowX = "";
var projectWindowY = "";
var projectHTML = "";
var projectLoad = false;
var preloadBodyLoad = false;
var globalPin = "";
var updatingProject = false;
var missingModal = false;
AWS.config.update({region: 'us-east-1'});
//RESTRICTED IAM USER
AWS.config.credentials = new AWS.Credentials("***", "***");
var docClient = new AWS.DynamoDB.DocumentClient();

preloadInit();

function preloadInit() {
  if (localStorage.getItem("vf-pin") !== null) {
    var data = localStorage.getItem("vf-pin").toString().trim();
    if (data.length === 6 && parseInt(data)) {
      globalPin = data;
      urlInit();
    }
    else {
      missingModal = true;
    }
  }
  else {
    missingModal = true;
  }
}

function urlInit() {
  var urlArr = window.location.href.split("/");
  if (urlArr.length > 3) {
    extension = decodeURI(urlArr[3]);
  }
  if (extension === "") {
    extension = randomId();
    window.history.pushState("","",("/" + encodeURI(extension)));
  }
  var params = {
    TableName: "voice-forge",
    Key: {
      pin: ("project-" + globalPin + "-" + encodeURI(extension))
    }
  };
  docClient.get(params, function(err, data) {
    if (err) {
      newProject();
    }
    else {
      try {
        var arr = JSON.parse(data.Item.content);
        processProject(arr);
      }
      catch (err) {
        newProject();
      }
    }
  });
}

function processProject(arr) {
  projectHTML = arr[0];
  projectTitle = arr[1];
  projectDescription = arr[2];
  projectVersion = arr[3];
  projectNeutralUI = arr[4];
  projectWindowX = arr[5];
  projectWindowY = arr[6];
  projectLoad = true;
  if (preloadBodyLoad) {
    loadProjectData();
  }
}

function newProject() {
  projectLoad = true;
  if (preloadBodyLoad) {
    loadProjectData();
  }
}

function preloadBody() {
  preloadBodyLoad = true;
  if (missingModal) {
    missingPin();
  }
  else {
    if (projectLoad) {
      loadProjectData();
    }
  }
}

function loadProjectData() {
  document.getElementById("url-input").value = extension;
  document.getElementById("title-input").value = projectTitle;
  if (projectTitle !== "") {
    document.title = projectTitle + " - Voice Forge";
  }
  else {
    document.title = "Voice Forge";
  }
  document.getElementById("description-input").value = projectDescription;
  document.getElementById("version-input").value = projectVersion;
  document.getElementById("neutral-input").checked = JSON.parse(projectNeutralUI);
  if (projectWindowX !== "" && projectWindowY !== "") {
    result.style.width = projectWindowX + "px";
    result.style.height = projectWindowY + "px";
  }
  neutralUpdate();
  setPin(globalPin);
  result.contentWindow.postMessage(JSON.stringify(["rawHTML",projectHTML]), "*");
  onChanges();
}

function onChanges() {
  document.getElementById("url-input").onchange = updateProjectData;
  document.getElementById("title-input").onchange = updateProjectData;
  document.getElementById("description-input").onchange = updateProjectData;
  document.getElementById("version-input").onchange = updateProjectData;
  document.getElementById("neutral-input").onchange = neutralUpdate;
}

function updateProjectData() {
  if (projectLoad && preloadBodyLoad) {
    updatingProject = true;
    result.contentWindow.postMessage(JSON.stringify(["requestHTML",""]), document.origin);
  }
}

function receiveMessage(e) {
  if (e.origin === document.origin && projectLoad && preloadBodyLoad && !e.data.toString().trim().includes('sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl')) {
    updatingProject = false;
    extension = document.getElementById("url-input").value.toString().trim();
    window.history.pushState("","",("/" + encodeURI(extension)));
    projectTitle = document.getElementById("title-input").value.toString().trim();
    projectDescription = document.getElementById("description-input").value.toString().trim();
    projectVersion = document.getElementById("version-input").value.toString().trim();
    projectNeutralUI = document.getElementById("neutral-input").checked.toString().trim();
    projectWindowX = parseInt(result.style.width).toString().trim();
    projectWindowY = parseInt(result.style.height).toString().trim();
    projectHTML = e.data.toString().trim();
    if (projectTitle !== "") {
      document.title = projectTitle + " - Voice Forge";
    }
    else {
      document.title = "Voice Forge";
    }
    var payload = [projectHTML,projectTitle,projectDescription,projectVersion,projectNeutralUI,projectWindowX,projectWindowY];
    var params = {
  		TableName: "voice-forge",
  		Key: {
  			pin: ("project-" + globalPin + "-" + encodeURI(extension))
  		},
  		UpdateExpression: "set content = :content",
  		ExpressionAttributeValues: {
  			":content": JSON.stringify(payload)
  		}
  	};
    if (JSON.stringify(payload) !== "[\"\",\"\",\"\",\"\",\"false\"]") {
      docClient.update(params, function(err, data) {
    		if (err) {
    			console.log(err);
    		}
    	});
    }
  }
  else {
    var pubHTML = e.data.toString().trim();
    var newWindow = window.open('', projectTitle);
    newWindow.document.documentElement.innerHTML = pubHTML;
  }
}

function randomId() {
  return Math.random().toString(36).substr(2);
}

function missingPin() {
  $("#pinMissingModal").modal();
}
function changePinModal() {
  $("#pinChangeModal").modal();
}

function changePin(id) {
  var data = document.getElementById(id).value.toString().trim();
  if (data.length === 6 && parseInt(data)) {
    localStorage.setItem("vf-pin",data);
    location.reload();
  }
  else {
    $("#" + id).addClass("invalid");
    document.getElementById(id).value = "";
  }
}

function neutralUpdate() {
  var el = document.getElementById("neutral-input");
  projectNeutralUI = el.checked.toString();
  if (JSON.parse(el.checked)) {
    $("#side-panel").addClass("neutral");
  }
  else {
    $("#side-panel").removeClass("neutral");
  }
  updateProjectData();
}

function homepage() {
  location.href = "https://voiceforge.io";
}

window.addEventListener("message", receiveMessage, false);

window.onbeforeunload = function(){
  if (!missingModal) {
    updateProjectData();
  }
}

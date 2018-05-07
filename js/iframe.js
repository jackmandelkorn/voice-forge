var columns = 6;
var globalPin = "";
var tagColumn = 2;
var globalSpreadsheetData;
var w;
var globalSpreadsheetElements = new Array();
var defaultBodyAppend = true;
var textPrefixes = ["which says","which reads","reading","saying","that reads","that says"];
var domStack = new Array();
var domPosition = -1;
var domMax = 10;
var domSplitMark = "<div class=\"vf-append-content\"></div>";
var imageUploadObject = false;
var picSumMax = 50;
var globalSource;
var globalOrigin;
var globalPostHTML = false;

setTimeout(function(){
  globalPostHTML = true;
},1000);

function getSelected(document) {
  if (document.getElementsByClassName("vf-selected").length > 0) {
    if (document.getElementsByClassName("vf-selected")[0].tagName.toLowerCase().trim() !== "html" && document.getElementsByClassName("vf-selected")[0].tagName.toLowerCase().trim() !== "body") {
      return document.getElementsByClassName("vf-selected")[0];
    }
    else {
      return document.body;
    }
  }
  else {
    return document.body;
  }
}

function generateElement(el,params) {
  var tokens = el.relation.replace(/\*/g,"~").trim().split(",");
  var colorClasses = ["primary","secondary","success","danger","warning","info","dark"];
  var sizeClasses = ["","-lg","-sm"];
  var sizeClassesDisplay = ["","large","small"];
  var elementCount = ["",0];
  var preset = el.preset.replace(/\*/g,"~");
  var html = el.html.replace(/\*/g,"~");
  for (var c = 0; c < tokens.length; c+=2) {
    var rep = tokens[c + 1];
    if (rep === "ColorClass") {
      if (params.includes("ColorClass")) {
        eval("preset = preset.replace(/" + tokens[c] + "/g,\"" + params[params.indexOf("ColorClass") + 1] + "\")");
        eval("html = html.replace(/" + tokens[c] + "/g,\"" + params[params.indexOf("ColorClass") + 1] + "\")");
      }
      else {
        eval("preset = preset.replace(/" + tokens[c] + "/g,\"primary\")");
        eval("html = html.replace(/" + tokens[c] + "/g,\"primary\")");
      }
    }
    else if (rep === "SizeClass") {
      if (params.includes("SizeClass")) {
        var sizeId = sizeClasses[sizeClassesDisplay.indexOf(params[params.indexOf("SizeClass") + 1])];
        eval("preset = preset.replace(/" + tokens[c] + "/g,\"" + sizeClassesDisplay[sizeClassesDisplay.indexOf(params[params.indexOf("SizeClass") + 1])] + "\")");
        eval("html = html.replace(/" + tokens[c] + "/g,\"" + sizeId + "\")");
        eval("html = html.replace(/>" + sizeId + "/g,\">" + capitalizeFirstLetter(sizeClassesDisplay[sizeClasses.indexOf(sizeId)]) + "\")");
      }
      else {
        eval("preset = preset.replace(/" + tokens[c] + "/g,\"\")");
        eval("html = html.replace(/" + tokens[c] + "/g,\"\")");
      }
    }
    else if (rep === "SizeClassDisplay") {
      if (params.includes("SizeClass")) {
        eval("preset = preset.replace(/" + tokens[c] + "/g,\"" + sizeClassesDisplay[sizeClassesDisplay.indexOf(params[params.indexOf("SizeClass") + 1])] + "\")");
      }
      else {
        eval("preset = preset.replace(/" + tokens[c] + "/g,\"\")");
      }
    }
    else if (rep === "CustomText") {
      if (params.includes("CustomText")) {
        var add = capitalizeFirstLetter(params[params.indexOf("CustomText") + 1].trim());
      }
      else {
        var add = capitalizeFirstLetter(preset.trim());
      }
      eval("html = html.replace(/" + tokens[c] + "/g,add)");
    }
    else if (rep.includes("PresetLoremIpsum")) {
      eval("html = html.replace(/" + tokens[c] + "/g,'" + lorem(parseInt(rep.split("&")[1])) + "')");
    }
    else if (rep.includes("Number")) {
      if (params.includes("Number")) {
        elementCount = [tokens[c],parseInt(params[params.indexOf("Number") + 1])];
      }
      else {
        elementCount = [tokens[c],parseInt(rep.split("&")[1])];
      }
    }
    else {
      eval("preset = preset.replace(/" + tokens[c] + "/g,'[" + rep + "]')");
      eval("html = html.replace(/" + tokens[c] + "/g,'[" + rep + "]')");
    }
  }
  if (elementCount[1] > 0) {
    html = repeatString(html,elementCount[0],elementCount[1]);
  }
  while (html.includes("https://picsum.photos/g/1366/?random")) {
    html = html.replace("https://picsum.photos/g/1366/?random",("https://picsum.photos/g/1366/768/?image=" + Math.round(Math.random() * picSumMax).toString()));
  }
  parent = getSelected(document);
  if (parent !== document.body) {
    parent = parent.parentElement;
  }
  if (defaultBodyAppend) {
    parent = document.body;
  }
  var obj = document.createElement("div");
  parent.appendChild(obj);
  obj.outerHTML = html;
  var obj = parent.childNodes[parent.childNodes.length - 1];
  if (obj.className.toLowerCase().includes("carousel")) {
    obj.childNodes[1].childNodes[1].className = obj.childNodes[1].childNodes[1].className + " active";
    var newId = Math.random().toString().replace('0.', '');
    obj.id = newId;
    var a = obj.getElementsByTagName("a");
    for (var i = 0; i < a.length; i++) {
      a[i].href = "#" + newId;
    }
  }
  if (obj.outerHTML.toLowerCase().includes("button")) {
    var buttons = document.getElementsByTagName("button");
    for (var i = 0; i < buttons.length; i++) {
      try {
        buttons[i].removeEventListener("click",buttonClick);
      }
      catch (err) {}
      buttons[i].addEventListener("click",buttonClick);
    }
  }
  select(obj);
  domChange();
}

function init() {
  w = new Worker("js/worker.js");
	w.onmessage = workerMessage;
	w.postMessage(globalPin);
}

function workerMessage(blob) {
  var data = JSON.parse(blob.data);
  //testing
  var method = data[0].toLowerCase();
  if (data.length > 1) {
    var content = data[1];
  }
  if (method === "create") {
    if (content.includes("ElementName")) {
      if (content[content.indexOf("ElementName") + 1].constructor === String) {
        var str = content[content.indexOf("ElementName") + 1];
        for (var i = 0; i < textPrefixes.length; i++) {
          var rep = " " + textPrefixes[i] + " ";
          if (str.includes(rep)) {
            var arr = str.split(rep);
            content.splice((content.indexOf("ElementName") + 1),1);
            var newEl = arr[0].trim().toLowerCase();
            if (newEl === "heading") {
              newEl = "heading-1";
            }
            content.push([newEl]);
            content.push("CustomText");
            content.push(arr[1].trim());
            i = textPrefixes.length;
          }
        }
      }
      var ind = -1;
      var item = content[content.indexOf("ElementName") + 1];
      for (var b = 0; b < globalSpreadsheetElements.length; b++) {
        if (globalSpreadsheetElements[b].sku === item) {
          ind = b;
        }
      }
      if (ind > -1) {
        var add = globalSpreadsheetElements[ind];
        generateElement(add,content);
      }
    }
  }
  else if (method === "css") {
    if (content.includes("CSSParameter") && (content.includes("CSSValue") || content.includes("Number"))) {
      if (content.includes("CSSValue")) {
        modifyCSS(content[content.indexOf("CSSParameter") + 1],content[content.indexOf("CSSValue") + 1]);
      }
      else {
        if (content.includes("CSSUnit")) {
          modifyCSS(content[content.indexOf("CSSParameter") + 1],(content[content.indexOf("Number") + 1] + content[content.indexOf("CSSUnit") + 1]).trim());
        }
        else {
          modifyCSS(content[content.indexOf("CSSParameter") + 1],content[content.indexOf("Number") + 1]);
        }
      }
    }
  }
  else if (method === "duplicate") {
    parent = getSelected(document);
    if (parent !== document.body) {
      parent = parent.parentElement;
    }
    if (defaultBodyAppend) {
      parent = document.body;
    }
    var obj = getSelected(document).cloneNode(true);
    parent.appendChild(obj);
    select(obj);
    domChange();
  }
  else if (method === "delete") {
    var el = getSelected(document);
    if (el.tagName.toLowerCase().trim() !== "body") {
      getSelected(document).remove();
      domChange();
    }
  }
  else if (method === "undo") {
    undo();
  }
  else if (method === "redo") {
    redo();
  }
  else if (method === "type") {
    getSelected(document).innerHTML = capitalizeFirstLetter(content.trim().toLowerCase());
    domChange();
  }
}

function modifyCSS(param,value) {
  $(getSelected(document)).css(param,value);
  domChange();
}

window.onmessage = function(e){
  globalSource = e.source;
  globalOrigin = e.origin;
  var arr = JSON.parse(e.data);
  var method = arr[0];
  var content = arr[1];
  if (method === "rawHTML" && content.trim().length > 0) {
    var element = document.createElement("div");
    document.body.appendChild(element);
    element.outerHTML = content;
    var obj = document.body.childNodes[document.body.childNodes.length - 1];
    if (obj.outerHTML.toLowerCase().includes("button")) {
      var buttons = document.getElementsByTagName("button");
      for (var i = 0; i < buttons.length; i++) {
        try {
          buttons[i].removeEventListener("click",buttonClick);
        }
        catch (err) {}
        buttons[i].addEventListener("click",buttonClick);
      }
    }
    if (obj.className.toLowerCase().includes("carousel")) {
      var newId = Math.random().toString().replace('0.', '');
      obj.id = newId;
      var a = obj.getElementsByTagName("a");
      for (var i = 0; i < a.length; i++) {
        a[i].href = "#" + newId;
      }
    }
    if (globalPostHTML) {
      domChange();
    }
  }
  else if (method === "requestHTML") {
    postHTML();
  }
  else if (method === "pin") {
    if (globalPin === "") {
      globalPin = content;
      init();
    }
    else {
      globalPin = content;
      w.postMessage(globalPin);
    }
  }
  else if (method === "publish") {
    var tempArr = JSON.parse(content);
    publishHTML(tempArr[0],tempArr[1]);
  }
};

function buttonClick(event) {
  if (!event.x && !event.y && !event.clientX && !event.clientY) {
    event.preventDefault();
    insertHtmlAtCursor("\u00A0");
  }
}

var dbl = false;
var last = false;
var shift = false;
var padding = 5;
var mouse = false;
var space = false;
var dragging = false;
document.addEventListener("click",function(e){
  if (space) {
    space = false;
  }
  else {
    if (!dragging) {
      select(document.elementFromPoint(e.x,e.y));
    }
  }
});
document.addEventListener("keydown",function(e){
  if (e.keyCode == 46 && selected()) {
    if (document.body.contains(selected()) && selected() !== document.body) {
      selected().remove();
    }
  }
  else if (e.keyCode == 16 && selected()) {
    if (mouse) {
      dragging = true;
      drag(e);
    }
    else {
      shift = true;
    }
  }
});
document.addEventListener("keyup",function(e){
  if (e.keyCode == 16) {
    shift = false;
  }
});
document.addEventListener("mousedown",function(e){
  if (selected().contentEditable.toString() === "false") {
    e.preventDefault();
  }
  mouse = true;
  if (shift) {
    dragging = true;
    drag(e);
  }
});
document.addEventListener("mouseup",function(e){
  mouse = false;
  if (dragging) {
    drop(e);
  }
  dragging = false;
});
document.addEventListener("mousemove",function(e){
  if (mouse && dragging) {
    drag(e);
  }
  else {
    if (dragging) {
      drop(e);
    }
    else {
      dragging = false;
    }
  }
});

function select(obj) {
  if (dbl) {
    dbl = false;
    if (obj.tagName.toLowerCase() === "img") {
      imageUploadObject = obj;
      $("#vf-file-upload").click();
    }
    else {
      select(last.parentElement);
    }
  }
  else {
    var objs = document.getElementsByClassName("vf-selected");
    if (objs.length > 0) {
      last = objs[0];
    }
    for (var i = 0; i < objs.length; i++) {
      objs[i].contentEditable = false;
      objs[i].className = objs[i].className.replace("vf-selected","").trim();
    }
    if (!obj.className.includes("vf-selected")) {
      obj.className = obj.className + " vf-selected";
      if (obj.innerText.length > 0 && obj.tagName.toLowerCase !== "body") {
        obj.contentEditable = true;
      }
      else {
        obj.contentEditable = false;
      }
      obj.focus();
    }
    dbl = true;
    setTimeout(function(){
      dbl = false;
    },300);
  }
}

function selected() {
  if (document.getElementsByClassName("vf-selected").length > 0) {
    return document.getElementsByClassName("vf-selected")[0];
  }
  else {
    return document.body;
  }
}

function drag(e) {
  var obj = selected();
  if (!obj.className.includes("vf-dragging")) {
    obj.className = obj.className + " vf-dragging";
  }
  obj.style.left = (e.x + 20) + "px";
  obj.style.top = (e.y + 20) + "px";
  var base = document.elementFromPoint(e.x - padding,e.y - padding);
  var baseComp = document.elementFromPoint(e.x + padding,e.y + padding);
  if (baseComp === base && (base.tagName.toLowerCase() !== "img" && baseComp.tagName.toLowerCase() !== "img") && (base.tagName.toLowerCase() !== "input" && baseComp.tagName.toLowerCase() !== "input")) {
    var parent = base;
    if (document.getElementsByClassName("vf-drag-parent").length > 0) {
      if (document.getElementsByClassName("vf-drag-parent")[0] !== parent) {
        var old = document.getElementsByClassName("vf-drag-parent")[0];
        old.className = old.className.replace("vf-drag-parent","").trim();
        if (!parent.className.includes("vf-drag-parent")) {
          parent.className = parent.className + " vf-drag-parent";
        }
      }
    }
    else {
      if (!parent.className.includes("vf-drag-parent")) {
          parent.className = parent.className + " vf-drag-parent";
        }
    }
  }
  else {
    if (document.getElementsByClassName("vf-drag-parent").length > 0) {
      var prev = document.getElementsByClassName("vf-drag-parent")[0];
      prev.className = prev.className.replace("vf-drag-parent","").trim();
    }
  }
}

function drop(e) {
  var obj = selected();
  dragging = false;
  var base = document.elementFromPoint(e.x - padding,e.y - padding);
  var baseComp = document.elementFromPoint(e.x + padding,e.y + padding);
  if (baseComp === base && (base.tagName.toLowerCase() !== "img" && baseComp.tagName.toLowerCase() !== "img") && (base.tagName.toLowerCase() !== "input" && baseComp.tagName.toLowerCase() !== "input") && dbl === false) {
    var parent = base;
    try {
      parent.appendChild(obj);
    }
    catch (e) {}
  }
  obj.className = obj.className.replace("vf-dragging","").trim();
  var old = document.getElementsByClassName("vf-drag-parent")[0];
  if (old) {
    old.className = old.className.replace("vf-drag-parent","").trim();
  }
  obj.style.top = "";
  obj.style.left = "";
}

function insertHtmlAtCursor(text) {
  if (document.getSelection()) {
    space = true;
    var oldName = "";
    if (document.getSelection().anchorNode.name) {
      oldName = document.getSelection().anchorNode.parentElement.name.toString();
    }
    document.getSelection().anchorNode.parentElement.name = "vf-space-insert";
    var arr = document.getSelection().anchorNode.nodeValue.split("");
    var p1 = document.getSelection().anchorOffset;
    var p2 = document.getSelection().focusOffset;
    if (document.getSelection().anchorOffset > document.getSelection().focusOffset) {
      p2 = document.getSelection().anchorOffset;
      p1 = document.getSelection().focusOffset;
    }
    var place = p1 + 1;
    arr.splice(p1, (p2 - p1), text);
    document.getSelection().anchorNode.nodeValue = arr.join("");
    var obj = document.getElementsByName("vf-space-insert")[0];
    obj.name = oldName;
    document.getSelection().collapse(document.getSelection().anchorNode, Math.min(document.getSelection().anchorNode.length, place));
  }
}

function vfSheets(spreadsheetdata) {
  var data = new Array();
  var tempObj = new Object();
  for (i = columns; i < spreadsheetdata.feed.entry.length; i++) {
    eval("tempObj." + spreadsheetdata.feed.entry[i % columns].gs$cell.$t.toLowerCase().trim() + " = '" + spreadsheetdata.feed.entry[i].gs$cell.$t.replace(/'/g,"\"") + "'");
    if ((i + 1) % columns === tagColumn && !data.includes(tempObj.tag)) {
      data.push(tempObj.tag);
      data.push(new Array());
    }
    if ((i + 1) % columns === 0) {
      data[data.indexOf(spreadsheetdata.feed.entry[i - (columns - tagColumn)].gs$cell.$t.trim()) + 1].push(tempObj);
      globalSpreadsheetElements.push(tempObj);
      tempObj = new Object();
    }
  }
  globalSpreadsheetData = data;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function repeatString(str,rep,amt) {
  if (str.includes("!!!")) {
    var arr = str.split("!!!");
    var add = arr[1].slice();
    arr.splice(1, 1);
    for (var i = amt; i > 0; i--) {
      arr.splice(1, 0, eval("add.replace(/" + rep + "/g,i)"));
    }
    return arr.join("").trim();
  }
  else {
    return str;
  }
}

function periodAway(start,str) {
  var a = 0;
  while (str.charAt(start) !== ".") {
    start++;
    a++;
  }
  return a;
}

function lorem(length) {
  var ret = "";
  var start = Math.floor(Math.random() * (ipsumString.length - length));
  while (periodAway(start,ipsumString) < 10) {
    start = Math.floor(Math.random() * (ipsumString.length - length));
  }
  for (var i = start; i < start + length; i++) {
    ret = ret + ipsumString.charAt(i);
  }
  if (ret.charAt(ret.length - 1) !== ".") {
    ret = ret.trim() + "."
  }
  return capitalizeFirstLetter(ret);
}

function domChange() {
  if (domPosition !== (domStack.length - 1) && domStack.length > 1) {
    domStack = domStack.slice(0,(domPosition + 1));
  }
  if (domStack.length === domMax) {
    domStack.shift();
  }
  domStack.push(document.body.innerHTML.split(domSplitMark)[1].toString().trim());
  domPosition = (domStack.length - 1);
  postHTML();
}

function undo() {
  if (domPosition > 0) {
    var add = document.body.innerHTML.split(domSplitMark)[1].toString().trim();
    if (domStack[domPosition] !== add) {
      if (domStack.length === domMax) {
        domStack.shift();
      }
      domStack.push(add);
    }
    domPosition--;
    document.body.innerHTML = (document.body.innerHTML.split(domSplitMark)[0] + domSplitMark + domStack[domPosition]).toString().trim();
    postHTML();
  }
}

function redo() {
  if (domPosition < (domMax - 1) && domPosition < (domStack.length - 1)) {
    domPosition++;
    document.body.innerHTML = (document.body.innerHTML.split(domSplitMark)[0] + domSplitMark + domStack[domPosition]).toString().trim();
    postHTML();
  }
}

function imageUpload(input) {
  var obj = imageUploadObject;
  file = input.files[0];
  var reader = new FileReader();
  reader.onloadend = function () {
    obj.src = reader.result.toString();
  }
  if (file) {
    reader.readAsDataURL(file);
  }
}

function postHTML() {
  if (globalPostHTML) {
    globalSource.postMessage(document.body.innerHTML.split(domSplitMark)[1].toString().trim(),globalOrigin);
  }
}

function publishHTML(title,description) {
  if (globalPostHTML) {
    var returnHTML = document.documentElement.innerHTML;
    returnHTML = returnHTML.replace('<input type="file" id="vf-file-upload" onchange="imageUpload(this)">','');
    returnHTML = returnHTML.replace('<link rel="stylesheet" href="css/iframe.css">','');
    returnHTML = returnHTML.replace('<meta name="description" content="made with Voice Forge">','<meta name="description" content="' + description + '">');
    returnHTML = returnHTML.replace('<title></title>','<title>' + title + '</title>');
    returnHTML = returnHTML.replace('<body onload="domChange()">','<body>');
    returnHTML = returnHTML.replace('<script src="js/ipsum.js"></script>','');
    returnHTML = returnHTML.replace('<script src="js/iframe.js"></script>','');
    returnHTML = returnHTML.replace('<script src="https://spreadsheets.google.com/feeds/cells/1swnGqmo4RE8nunLvaROOjPHepHndGzJKSPU97Ob1Jp8/od6/public/values?alt=json-in-script&callback=vfSheets"></script>','');
    returnHTML = returnHTML.replace('<div class="vf-append-content"></div>','');
    returnHTML = returnHTML.replace('<script src="bootstrap/util.js"></script>','');
    returnHTML = returnHTML.replace('<link rel="stylesheet" href="bootstrap/bootstrap.min.css">','<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">');
    returnHTML = returnHTML.replace('<script src="bootstrap/jquery-3.2.1.slim.min.js"></script>','<script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>');
    returnHTML = returnHTML.replace('<script src="bootstrap/popper.min.js"></script>','<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>');
    returnHTML = returnHTML.replace('<script src="bootstrap/bootstrap.min.js"></script>','<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>');
    returnHTML = returnHTML.replace('contenteditable="true"','');
    globalSource.postMessage(returnHTML.toString().trim(),"*");
  }
}

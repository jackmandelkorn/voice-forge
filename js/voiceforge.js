var resultFrameDocument = false;
var globalComponentData = false;
var componentsLoadFactor = 1.5;
var zoom = 0.6;
var columns = 6;
var tagColumn = 2;
var picSumMax = 50;

$('[data-toggle="tooltip"]').tooltip();

function getSelected(document) {
  if (document.getElementsByClassName("vf-selected").length > 0) {
  	return document.getElementsByClassName("vf-selected")[0];
  }
  else {
    return document.body;
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
      tempObj = new Object();
    }
  }
  generateComponentList(data,"");
}

function generateComponentList(data,filter) {
  if (!globalComponentData) {
    globalComponentData = data;
  }
  filter = filter.toLowerCase().trim();
  var colorClasses = ["primary","secondary","success","danger","warning","info","dark"];
  var sizeClasses = ["-lg","-sm",""];
  var sizeClassesDisplay = ["large","small",""];
  var parent = document.getElementById("components-search-results");
  parent.innerHTML = "";
  var frames = new Array();
  for (var i = 0; i < data.length; i++) {
    if (data[i].constructor === String) {
      var truth = false;
      var objs = data[i + 1];
      for (var e = 0; e < objs.length; e++) {
        var obj = objs[e];
        var test = obj.preset.toLowerCase().trim() + " " + obj.sku.toLowerCase().trim();
        if (obj.relation.includes("ColorClass")) {
          test += (" " + colorClasses.join(" "));
        }
        if (test.includes(filter)) {
          truth = true;
        }
      }
      if (truth) {
        var el = document.createElement("h6");
        el.className = "text-secondary";
        el.innerHTML = data[i];
        el.style.marginTop = "40px";
        parent.appendChild(el);
        var hr = document.createElement("hr");
        parent.appendChild(hr);
      }
    }
    else {
      for (var a = 0; a < objs.length; a++) {
        var tokens = objs[a].relation.replace(/\*/g,"~").trim().split(",");
        var colorLength = 1;
        var sizeLength = 1;
        if (tokens.includes("ColorClass")) {
          colorLength = colorClasses.length;
        }
        if (tokens.includes("SizeClass")) {
          sizeLength = 2;
        }
        for (var d = 0; d < sizeLength; d++) {
          for (var b = 0; b < colorLength; b++) {
            var objs = data[i];
            var elementCount = ["",0];
            var hint = objs[a].hint.replace(/\*/g,"~");
            var preset = objs[a].preset.replace(/\*/g,"~");
            var html = objs[a].html.replace(/\*/g,"~");
            for (var c = 0; c < tokens.length; c+=2) {
              var rep = tokens[c + 1];
              if (rep === "ColorClass") {
                eval("hint = hint.replace(/" + tokens[c] + "/g,colorClasses[b])");
                eval("preset = preset.replace(/" + tokens[c] + "/g,colorClasses[b])");
                eval("html = html.replace(/" + tokens[c] + "/g,colorClasses[b])");
              }
              else if (rep === "SizeClass") {
                eval("hint = hint.replace(/" + tokens[c] + "/g,sizeClassesDisplay[d])");
                eval("preset = preset.replace(/" + tokens[c] + "/g,sizeClassesDisplay[d])");
                eval("html = html.replace(/" + tokens[c] + "/g,sizeClasses[d])");
                var sizeId = sizeClasses[d];
                eval("html = html.replace(/>" + sizeId + "/g,\">" + capitalizeFirstLetter(sizeClassesDisplay[sizeClasses.indexOf(sizeId)]) + "\")");
              }
              else if (rep === "SizeClassDisplay") {
                eval("hint = hint.replace(/" + tokens[c] + "/g,sizeClassesDisplay[d])");
                eval("preset = preset.replace(/" + tokens[c] + "/g,sizeClassesDisplay[d])");
                if (html.charAt(html.indexOf(tokens[c]) - 1) === ">") {
                  eval("html = html.replace(/" + tokens[c] + "/g,capitalizeFirstLetter(sizeClassesDisplay[d]))");
                }
                else {
                  eval("html = html.replace(/" + tokens[c] + "/g,sizeClassesDisplay[d])");
                }
              }
              else if (rep === "CustomText") {
                var add = capitalizeFirstLetter(preset.trim());
                eval("html = html.replace(/" + tokens[c] + "/g,add)");
                eval("hint = hint.replace(/" + tokens[c] + "/g,'...')");
              }
              else if (rep.includes("PresetLoremIpsum")) {
                eval("html = html.replace(/" + tokens[c] + "/g,'" + lorem(parseInt(rep.split("&")[1])) + "')");
              }
              else if (rep.includes("Number")) {
                elementCount = [tokens[c],parseInt(rep.split("&")[1])];
              }
              else {
                eval("hint = hint.replace(/" + tokens[c] + "/g,'[" + rep + "]')");
                eval("preset = preset.replace(/" + tokens[c] + "/g,'[" + rep + "]')");
                eval("html = html.replace(/" + tokens[c] + "/g,'[" + rep + "]')");
              }
            }
            if (elementCount[1] > 0) {
              html = repeatString(html,elementCount[0],elementCount[1]);
              eval("hint = hint.replace(/" + elementCount[0] + "/g,'" + elementCount[1].toString() + "')")
            }
            while (html.includes("https://picsum.photos/g/1366/?random")) {
              html = html.replace("https://picsum.photos/g/1366/?random",("https://picsum.photos/g/1366/768/?image=" + Math.round(Math.random() * picSumMax).toString()));
            }
            if (filterSearch(preset.toLowerCase().trim() + " " + objs[a].sku.toLowerCase().trim(),filter)) {
              var info = document.createElement("i");
              info.className = "material-icons text-primary components-search-results-info";
              info.innerHTML = "add_circle";
              info.style.zIndex = "1000";
              info.onclick = function(){
                createFromSidebar(this.parentElement.childNodes[Array.from(this.parentElement.childNodes).indexOf(this) + 1]);
              };
              hint = "Ask Alexa, \"" + hint.toLowerCase().trim() + "\"";
              $(info).attr("data-toggle","tooltip");
              $(info).attr("data-placement","top");
              $(info).attr("title",hint);
              info.style.transform = "translateY(" + ((16 + 4) * zoom) + "px)";
              parent.appendChild(info);
              $(info).tooltip();
              var obj = document.createElement("div");
              parent.appendChild(obj);
              obj.outerHTML = html;
              var obj = parent.childNodes[parent.childNodes.length - 1];
              obj.className = obj.className + " components-search-results-element";
              if (obj.outerHTML.toLowerCase().includes("carousel")) {
                obj.childNodes[1].childNodes[1].className = obj.childNodes[1].childNodes[1].className + " active";
              }
            }
          }
        }
      }
    }
  }
}

function createFromSidebar(obj) {
  result.contentWindow.postMessage(JSON.stringify(["rawHTML",obj.cloneNode(true).outerHTML]), '*');
}

function updateFilterSearch() {
  generateComponentList(globalComponentData,document.getElementById("components-search").value.toLowerCase().trim());
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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function searchPress(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      updateFilterSearch();
    }
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

function filterSearch(str,filter) {
  var arr = filter.toLowerCase().trim().split(" ");
  str = str.toLowerCase();
  var truth = true;
  for (var i = 0; i < arr.length; i++) {
    if (!str.includes(arr[i])) {
      truth = false;
    }
  }
  return truth;
}

function exportHTML() {
  result.contentWindow.postMessage(JSON.stringify(["publish",JSON.stringify([projectTitle,projectDescription])]),"*");
}

function setPin(pin) {
  result.contentWindow.postMessage(JSON.stringify(["pin",pin]),"*");
}

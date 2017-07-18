var path = require('path');
var admin = require("firebase-admin");
var firebase = require("firebase");
var fs = require('fs');
var url = require('url');
var http = require('http');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var download = require('download-file');


var app = firebase.initializeApp({ 
	apiKey: "AIzaSyCVqMEpKLAEGmg8tJLIii0GRlOksQJvXsk",
    authDomain: "nigeriaspeaks-9a7b9.firebaseapp.com",
    databaseURL: "https://nigeriaspeaks-9a7b9.firebaseio.com",
    projectId: "nigeriaspeaks-9a7b9",
    storageBucket: "nigeriaspeaks-9a7b9.appspot.com",
    messagingSenderId: "1006403479435"
});
var config = {
  projectId: 'nigeriaspeaks-9a7b9',
  keyFilename: path.join(__dirname, 'public', 'nigeriaspeaks-9a7b9-firebase-adminsdk-aoq4s-100255b2dc.json')
};

var serviceAccount = require(path.join(__dirname, 'public', 'nigeriaspeaks-9a7b9-firebase-adminsdk-aoq4s-100255b2dc.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nigeriaspeaks-9a7b9.firebaseio.com",
  storageBucket: "https://nigeriaspeaks-9a7b9.appspot.com"
});

var DOWNLOAD_DIR = path.join(__dirname, 'public/downloads');
var db = admin.database();
//var storageRef = app.storage();
var storageRef = require('@google-cloud/storage')(config);
var ref = db.ref("content/reports");
var refMain = db.ref("content");

exports.test = function() {
	download_file_wget(DOWNLOAD_DIR + "/images/ns.png");
}

var getTypes = function() {
	var types = ["Crime", "Emergency", "Public Opinion", "Accident", "Event", "Social Abuse", "Others"];
	return types;
}

exports.getTypes = function() {
	var types = getTypes();
	return types;
}

exports.getStatus = function(senderID, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/currentNode");
	try {
		reportRef.once("value", function(data) {
			console.log(data.val());
			return callback(null, data.val());
		});
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.getCurrentNode = function(senderID, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/currentNode/node");
	try {
		reportRef.once("value", function(data) {
			return callback(null, data.val());
		});
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.getCurrentNodeID = function(senderID, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/currentNode/nodeID");
	try {
		reportRef.once("value", function(data) {
			return callback(null, data.val());
		});
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.setStatus = function(senderID, status, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/currentNode/status");
	try {
		reportRef.set(status, function(data) {
			return callback(null, true);
		})
	} catch(error) {
		return callback(error, null);
	}
	
};



exports.submitReport = function(senderID, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/currentNode");
	
	try {
		reportRef.once("value", function(data) {
			var result = data.val();
			var nodeID = (result && result.nodeID)? result.nodeID: null;
			if(nodeID) {
				var newReportRef = ref.child(senderID + "/user-reports/" + nodeID);
				newReportRef.once("value", function(response) {
					var res = response.val();
					if(res) {
						res.senderID = senderID;
						res.reverseTimestamp = 0 - res.timestamp;
						var newRef = refMain.child("reports-all");
						newRef.push(res, function(data) {
							reportRef.set(null, function(data) {
								return callback(null, true);
							})
						})
					} else {
						return callback("Report not found!", null);
					}
					
				})				
			} else {
				return callback("Error locating nodeID", null);
			}			
		});
		
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.cancelReport = function(senderID, nodeID, callback) {
	//query firebase
	var report = {};
	report['user-reports'] = {};
	report['user-reports'][nodeID] = null;
	report['currentNode'] = null;
	var updates = {};
	updates['/user-reports/' + nodeID] = null;
	updates['/currentNode'] = null;
	//var reportRef = ref.child(senderID + "/user-reports/" + nodeID);
	var reportRef = ref.child(senderID);
	try {
		reportRef.update(updates, function(data) {
			return callback(null, true);
		})
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.setCurrentNodeID = function(senderID, node, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/currentNode/nodeID");
	try {
		reportRef.set(node, function(data) {
			return callback(null, true);
		})	
	} catch(error) {
		return callback(error, null);
	}	
};

exports.setCurrentNodeIndex = function(senderID, node, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/currentNode/nodeIndex");
	try {
		reportRef.set(node, function(data) {
			return callback(null, true);
		})	
	} catch(error) {
		return callback(error, null);
	}	
};

exports.findNode = function(senderID, node, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/" + node);
	try {
		reportRef.once("value", function(data) {
			return callback(null, data);
		})	
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.getNodeID = function(senderID, node, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/" + node);
	try {
		reportRef.once("value", function(data) {
			return callback(null, data);
		})	
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.getCurrentReport = function(senderID, nodeID, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/user-reports/" + nodeID);
	try {
		reportRef.once("value", function(data) {
			return callback(null, data.val());
		});
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.getRecentReportID = function(senderID, callback) {
	//query firebase
	var reportRef = ref.child(senderID + "/user-reports");
	try {
		reportRef.orderByKey().limitToLast(5).once("value", function(reports) {
			var data = [];
			reports.forEach(function(childSnapshot) {
				var val = childSnapshot.val();
				var type = "n/a";
				var types = getTypes();
			    if(val.type) {
			        type = (val.type && typeof(types[parseInt(val.type) - 1]) != "undefined")? types[parseInt(val.type) - 1]: "n/a";
			    }
	            data.push({key: childSnapshot.key, type: type, description: val.description});
	          });
			return callback(null, data);
		});	
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.addNode = function(senderID, nodeID, location, text, callback) {
	//query firebase
	if(!text) {
		return;
	}
	var t = {};
	t[text] = text;
	//var newKey = ref.child(senderID + "/currentNode/nodeID").push().key;
	var reportRef = ref.child(senderID + "/user-reports/" + nodeID + "/" + location);
	try {
		reportRef.set(text, function(error) {
			if(error) {
				return callback(null, true);
			} else {
				return callback(error, null);
			}			
		})	
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.loginUser = function(senderID, uID, callback) {
	//query firebase
	if(!senderID || !uID) {
		return;
	}
	
	var reportRef = refMain.child('users/' + senderID);
	try {
		reportRef.set({uid: uID}, function(error) {
			if(error) {
				return callback(null, true);
			} else {
				return callback(error, null);
			}			
		});	
	} catch(error) {
		return callback(error, null);
	}	
};

exports.getUID = function(senderID, callback) {
	//query firebase
	
	var reportRef = refMain.child('users/' + senderID);
	try {
		reportRef.once("value", function(data) {
			return callback(null, data.val());
		})	
	} catch(error) {
		return callback(error, null);
	}
	
};

exports.getTimestamp = function() {
	return admin.database.ServerValue.TIMESTAMP; //firebase.database.ServerValue.TIMESTAMP
}

exports.addTimestamp = function(senderID, nodeID, callback) {
	var reportRef = ref.child(senderID + "/user-reports/" + nodeID + "/timestamp");
	try {
		reportRef.set(db.ServerValue.TIMESTAMP, function(error) {
			if(!error) {
				return callback(null, true);
			} else {
				return callback(error, null);
			}			
		})	
	} catch(error) {
		return callback(error, null);
	}
	
};

var download_file_wget = function(file_url) {

    // extract the file name
    var file_name = url.parse(file_url).pathname.split('/').pop();
    // compose the wget command
    var wget = 'wget -P ' + DOWNLOAD_DIR + ' ' + file_url;
    // excute wget using child_process' exec function

    var child = exec(wget, function(err, stdout, stderr) {
        if (err) throw err;
        else console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
    });
};

var downloadFile = function(url, filename, callback) {
	//var url = "/images/ns.png";
 
	var options = {
		directory: DOWNLOAD_DIR,
		filename: filename
	}
	download(url, options, function(err){
		if (err) throw err
		console.log("meow");
		return callback(null, {{url: url}});
	});
}

exports.addMedia = function(senderID, nodeID, location, medium, callback) {
	//query firebase
	if(!medium) {
		return;
	}
	
	var g = (medium.url.split('?'))[0].split('.');
	var ext = g[g.length - 1];
	var filename = senderID + "-" + (new Date()).getTime() + "." + ext;
	console.log(filename);
	var filen = medium.url;
	downloadFile(filen, filename, function(err, resp) {
		
	if (err) {
		console.log(err);
		return;
	}
	//var bucket = storage.bucket('<projectID>.appspot.com');
	var bucket = storageRef.bucket('images');
	//var mediaRef = storage.child("images/" + filename);
	
	var url = resp.url;
	console.log(url);
	bucket.upload(url, function(err, file) {
		console.log(err);
	  if (!err) {
		// "zebra.jpg" is now in your bucket. 
	  //}
	//});
	//mediaRef.put(file).then(function(snapshot) {
		console.log(file)
		var downloadURL = file.downloadURL;
		medium.filePath = downloadURL;
		var newKey = ref.child(senderID + "/user-reports/" + nodeID + "/media").push().key;
		//var newKey = newKey1.replace(/-/ig, '');
		var reportRef = ref.child(senderID + "/user-reports/" + nodeID + "/media/" + newKey);
		try {
			reportRef.set(medium, function(error) {
				if(error) {
					return callback(null, true);
				} else {
					return callback(error, null);
				}			
			})	
		} catch(error) {
			return callback(error, null);
		}
	}
	});
	
	});
	
	
	
};

exports.newReport = function(senderID, callback) {
	//query firebase
	if(!senderID) {
		return;
	}
	var newKey = ref.child(senderID + "/user-reports").push().key;
	//var newKey = newKey1.replace(/-/ig, '');
	var report = {};
	report = {type: -1, location: {longitude: null, latitude: null, address: null}, description: "", media: null, timestamp: admin.database.ServerValue.TIMESTAMP};
	node = {nodeID: newKey, nodeIndex: 0, status: 0};
	var reportRef = ref.child(senderID + "/user-reports/"+ newKey);
	var nodeRef = ref.child(senderID + "/currentNode");
	try {
		reportRef.set(report, function(error) {
			if(error) {
				return callback(null, true);
			} else {
				nodeRef.set(node, function(err) {
					return callback(error, null);
				});				
			}			
		})	
	} catch(error) {
		return callback(error, null);
	}
	
};
var download_file_curl = function(file_url) {

    // extract the file name
    var file_name = url.parse(file_url).pathname.split('/').pop();
    // create an instance of writable stream
    var file = fs.createWriteStream(DOWNLOAD_DIR + file_name);
    // execute curl using child_process' spawn function
    var curl = spawn('curl', [file_url]);
    // add a 'data' event listener for the spawn instance
    curl.stdout.on('data', function(data) { file.write(data); });
    // add an 'end' event listener to close the writeable stream
    curl.stdout.on('end', function(data) {
        file.end();
        console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
    });
    // when the spawn child process exits, check if there were any errors and close the writeable stream
    curl.on('exit', function(code) {
        if (code != 0) {
            console.log('Failed: ' + code);
        }
    });
};
//download_file_curl(DOWNLOAD_DIR + "/images/ns.png");
exports.sendFile = function() {
	var url = "/images/ns.png";
 
var options = {
    directory: DOWNLOAD_DIR,
    filename: "cat.png"
}
download(url, options, function(err){
    if (err) throw err
    console.log("meow")
})
}

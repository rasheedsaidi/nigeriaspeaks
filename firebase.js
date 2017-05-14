var admin = require("firebase-admin");

//var serviceAccount = require("https://emergency-reporting-system.herokuapp.com/public/pemergency-reporting-firebase-adminsdk-rkh5c-d999d6ebe6.json");

//credential: admin.credential.cert(serviceAccount),
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "emergency-reporting",
    clientEmail: "firebase-adminsdk-rkh5c@emergency-reporting.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCUT3VsMbvpFKxe\n8ol1ttCz4ECTxhc9EC9ijUD0YsdphrjVTZj//jj9luxHka9q+yQ0Y9guk9rtFh8R\n0YpQrDe8JZlfRFz9benIp/KoYKZlAlQPYgdCH2Ddkdx4BrvFurWL1/26Kao/ArQ4\n09oaMU7gXUHXt0GGh5FkSp1Ij9VeGNyet6C97tpmdvsBmILS2YGAybbcltf68rxp\nzC0PbkJhrVmfAmfiBSMtFB7srGTVEO0NXGMozmC5wb1AnVsf24372tO6InD+kMZY\ndLYhkZIwZtJj20Ezb3WfQvZHKedVQvDJTmOrVCvsmykwiC8DP2vZ933SUz4CKE3C\nGDMIjb49AgMBAAECggEABWdvy+V0B2Ytcbg8sgFbUXKWZ8wMBLmWQG0NNNp0ka/L\nBFqzfIBy6yqYqXLxhWBpTU9mDSxuCb2InEmaVJ4x2bU1BXekO8fJgPo9qUz8Qyn2\njijwQsSJ7wjlk6oLJYVMIDBamnHyNiGPF5MAm3u4eAxt3cJbrN87uP/PA1naWHdZ\nP2VNNALCiV0MJIqxirfaH0gJqqKGYIEPvYw3MB0phYcVh2K4UKSOE6e154aHW8+u\n+z7eBriajS7/ywe68EWQXUjjTxh86yC4abgQSkj8nPlIL5fgAnxX7oSwF3yRQM31\ngLWsqNt1sKdZSctn9oWjiVc6Br+vhbBfV6JdJ9ohAQKBgQDDVymjFCxb3JcHZZ5o\nhNPrGXPSdzxu66czTmGjaHhSS9n7EMIpAsmwyX7Qb5lPqeoXS8DZluRx1rcgBMGh\neMRh0E5cQpBDfYasXR4V2azon/yLqQbrVtdLo85dcT/Gk1FGWR9RB8B+adQcOT5D\na1J1VZGik6fSu+NuoS50onj9DQKBgQDCXZRb3F0FmckQK1MSb1HTYz6igFkD9um9\nkjOSMW3UWl7VgBLS4Uhyy5e2V7i5JvddzdhKyxet8eIzh2FNl5l2elDMX5RR/oFc\nL5oprWJsCLUxn87NrPVitRBngPB7Fu7YdrRJQV3NqNSQfQDVhHUapYyEacvD5BUp\nvazEl+ZZ8QKBgQCE+iMoFyWTa3mM2Yqa0EGLfAoyrmT/hYCPFr61BPtT2rsLhP8H\n+BPhO2oO7snJR3xKW5FvDp95N5f2Pgaqq5HUnH+botyedSdm0wUWDtb8jVzYnjpN\nnxJ1NY/YYK3vun3LjAQbn1FVPSneBMH0F21M3vGDYU0P0kQjHaqIT8pZSQKBgQCs\nuwFXybSZf5vh1L7UyT1MwQwu2iVBkrMTF9Tg/TB/4XgaAOG5qx/5dNl04Ox3DxwS\nrxajEW4P1cCSzqM4k5t8YSNhHSfw3l8UD/HPTBkFrY9pdH4S5ryEZikX8szEdxL4\nKDX8TC0S0hFl/tE476gqcCk6m9LMWew81iWt6Nh74QKBgBtb8eZcZ1uesvZqoG3d\nqk7ciCdO5NgPBKEadpc5/nRJW3T4bykCaU8MtS9bvK5djtB+lSEMs5B1ePUoM9Q+\nJ1Az9VUoeZeRl/6yZ2rk08lPk+/XgBBGzLRdFcewotU1o+FwdkOUMKw+LyM6PqXR\nF9XLARmzLfyO/NjbC8qpSNLB\n-----END PRIVATE KEY-----\n"
  }),
  databaseURL: "https://emergency-reporting.firebaseio.com"
});

var db = admin.database();
var ref = db.ref("ers/reports"); //ref.orderByChild("members/235642888").equalTo(235642888);

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
		reportRef.set(null, function(data) {
			return callback(null, true);
		})
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
				var types = ["Traffic", "Fire", "Robbery", "Accident", "Health", "Social Abuse"];
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
	
	var reportRef = ref.child('users/' + senderID);
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
	var reportRef = ref.child('users/' + senderID);
	try {
		reportRef.once("value", function(data) {
			return callback(null, data);
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

exports.addMedia = function(senderID, nodeID, location, medium, callback) {
	//query firebase
	if(!medium) {
		return;
	}
	
	var newKey1 = ref.child(senderID + "/user-reports/" + nodeID + "/media").push().key;
	var newKey = newKey1.replace(/-/ig, '');
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
	
};

exports.newReport = function(senderID, callback) {
	//query firebase
	if(!senderID) {
		return;
	}
	var newKey1 = ref.child(senderID + "/user-reports").push().key;
	var newKey = newKey1.replace(/-/ig, '');
	var report = {};
	report = {type: -1, location: {longitude: null, latitude: null, address: null}, description: "", media: null};
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
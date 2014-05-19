var redis = require('redis');
var db = redis.createClient(); 
var Evernote = require('evernote').Evernote;
var config = require('../config.json');
var callbackUrl = config.HOST_URL + "/oauth_callback";

// home page
exports.index = function(req, res) {
  if(req.session.oauthAccessToken) {
    var token = req.session.oauthAccessToken;
    var client = new Evernote.Client({
      token: token,
      sandbox: config.SANDBOX
    });
    var noteFilter, noteStore, notesMetadataResultSpec;
    noteFilter = new Evernote.NoteFilter;
    notesMetadataResultSpec = new Evernote.NotesMetadataResultSpec;
    notesMetadataResultSpec.includeTitle = true;
    noteStore = client.getNoteStore();
    
    noteStore.findNotesMetadata(noteFilter, 0, 100, notesMetadataResultSpec, function(err, notes) {
      if (err) {
        console.log(err);
      }else{
        res.render('evernote', { notes: notes.notes, token: token });
      }
    });  
  } else {
    res.redirect('/');
  }
};

// OAuth
exports.oauth = function(req, res) {
  var client = new Evernote.Client({
    consumerKey: config.EVERNOTE_API_CONSUMER_KEY,
    consumerSecret: config.EVERNOTE_API_CONSUMER_SECRET,
    sandbox: config.SANDBOX
  });

  client.getRequestToken(callbackUrl, function(error, oauthToken, oauthTokenSecret, results){
    if(error) {
      req.session.error = JSON.stringify(error);
      res.redirect('/evernote');
    }
    else { 
      // store the tokens in the session
      req.session.oauthToken = oauthToken;
      req.session.oauthTokenSecret = oauthTokenSecret;

      // redirect the user to authorize the token
      res.redirect(client.getAuthorizeUrl(oauthToken));
    }
  });

};

// OAuth callback
exports.oauth_callback = function(req, res) {
  var client = new Evernote.Client({
    consumerKey: config.EVERNOTE_API_CONSUMER_KEY,
    consumerSecret: config.EVERNOTE_API_CONSUMER_SECRET,
    sandbox: config.SANDBOX
  });

  client.getAccessToken(
    req.session.oauthToken, 
    req.session.oauthTokenSecret, 
    req.param('oauth_verifier'), 
    function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
      if(error) {
        console.log('error');
        console.log(error);
        res.redirect('/');
      } else {
        // store the access token in the session
        req.session.oauthAccessToken = oauthAccessToken;
        req.session.oauthAccessTtokenSecret = oauthAccessTokenSecret;
        req.session.edamShard = results.edam_shard;
        req.session.edamUserId = results.edam_userId;
        req.session.edamExpires = results.edam_expires;
        req.session.edamNoteStoreUrl = results.edam_noteStoreUrl;
        req.session.edamWebApiUrlPrefix = results.edam_webApiUrlPrefix;
        res.redirect('/evernote');
      }
    });
}; 

// home page
exports.viewNotes = function(req, res) {
  if(req.session.oauthAccessToken) {
    var token = req.session.oauthAccessToken;
    var client = new Evernote.Client({
      token: token,
      sandbox: config.SANDBOX
    });
    noteStore = client.getNoteStore();
    var noteGuid = req.params.guid;
    noteStore.getNoteContent(noteGuid, function(err, noteContent){
        if (err) {
            console.log(err);
        }
        else{
            res.send(noteContent);
        }
    });
    
  } else {
    res.redirect('/');
  }
};

// Clear session
exports.clear = function(req, res) {
  req.session.destroy();
  res.redirect('/');
};
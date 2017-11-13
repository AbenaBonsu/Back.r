// This file contains databse functions.
// All functions will be in the form of: module.exports.[function_name]
// so they can be accessed from outside the file.

// Connect to the remote database
module.exports.connect = function() {
  const pg = require('pg');
  const express = require('express');
  var app = express();
  var username = 'backr@backr'
  var password = 'cse110$$$'
  var tablename = 'groupmembers'

  const config = {
      host: 'backr.postgres.database.azure.com',
      user: username,     
      password: password,
      database: 'postgres',
      port: 5432,
      ssl: true
  };
  const client = new pg.Client(config);

  client.connect(err => {
      if (err) throw err;
      else{
        console.log('connected to database');
      }
  });
  return client;
}

// Create a user in the database
module.exports.addUser = function (username,client,tablename){
  let query = 'INSERT INTO ' + tablename + ' (Name) values ($1)';
  client.query(query,[username], function(err,res) {
    if (err) throw err;
    else{
      console.log('inserted ' + username + ' into database')
    }
  })
}

//create user profile
module.exports.createUser = function (name,age,email,isMaker,shortbio,tablename,client){
  let check = 'SELECT email FROM ' + tablename
  client.query(check, function(err,res) {
    rows = res.rows
    for (var i = 0; i < rows.length; i++){
      if (rows[i]['email'] === email){
        console.log('user already in database')
        return
      }
    }
    let query = 'INSERT INTO ' + tablename + ' (name,age,email,ismaker,shortbio) values ($1,$2,$3,$4,$5)';
    client.query(query,[name,age,email,isMaker,shortbio], function(err,res) {
      if (err) throw err;
      else{
        console.log('inserted ' + email + ' into database')
      }
    })
  })  
}

//create the maker and backer profiles
module.exports.createUserProfile = function (longbio,photos,icons,email,tablename, client){
  let check = 'SELECT email FROM ' + tablename
  client.query(check, function(err,res) {
    rows = res.rows
    for (var i = 0; i < rows.length; i++){
      if (rows[i]['email'] === email){
        console.log('user already in database')
        return
      }
    }
    let query = 'INSERT INTO ' + tablename + ' (longbio,photos,icons,email) values ($1,$2,$3,$4)';
    client.query(query,[longbio,photos,icons,email], function(err,res) {
      if (err) throw err;
      else{
        console.log('inserted ' + email + ' into Maker/Backer')
      }
    })
  })  
}

//get user profile
module.exports.readUser = function (email,tablename,client, callback) {
	let query = 'SELECT * FROM ' + tablename 
  client.query(query, function(err,res) {
    if (err) throw err;
    rows = res.rows;
		for (var i = 0; i < rows.length; i++){
			if (rows[i].email === email){
				var row = rows[i]
				var obj = { 
          "name":row.name,
					"age":row.age,
					"email":row.email,
					"ismaker":row.ismaker,
          "shortbio":row.shortbio
				}
			}
		}
    callback(obj);
	})	
}

//get maker/backer profile
module.exports.readUserProfile = function (email,tablename,client, callback) {
  let query = 'SELECT * FROM ' + tablename
    client.query(query, function(err,res) {
      if (err) throw err;
      rows = res.rows
      for (var i = 0; i < rows.length; i++){
        if (rows[i].email === email){
          var row = rows[i]
          var obj = { 
            "longbio":row.longbio,
            "email":row.email,
            "photos":row.photos,
            "icons":row.icons,
          }
        }
      }
      callback(obj);
    })	
}

//Pass in email, and isMaker to grab all users and select from those the
//Potential matches.
module.exports.getPotentialMatches = function(email,client,isMaker,callback){
  let makerQuery = 'SELECT * FROM maker'
  let backerQuery = 'SELECT * FROM backer'
  let userQuery = 'SELECT * FROM users'
  
  let backer = []
  let maker = []
  let user = []
  let userDict = []

  client.query(makerQuery, function(err,res) {
    if (err) throw err;
    rows = res.rows
    for (var i = 0;i < rows.length; i++){
      if (email === rows[i].email){
        maker = rows[i].swipedon
        break;
      }
    }
    client.query(backerQuery, function(err,res) {
      if (err) throw err;
      rows = res.rows
      for (var i = 0; i < rows.length; i++){
        if (email === rows[i].email){
          backer = rows[i].swipedon
        }
      }
      client.query(userQuery,function(err,res) {
        if (err) throw err;
        rows = res.rows
        for (var i = 0; i < rows.length; i++){
          user.push(rows[i].email)
          userDict[rows[i].email] = {
              "name": rows[i].name,
              "age": rows[i].age
          }
        }
        let potentialMatches;
        let returnedMatches = [];
        if (isMaker){
          potentialMatches = user.filter(function(x) {return maker.indexOf(x) < 0})
        }
        else{
          potentialMatches = user.filter(function(x) {return backer.indexOf(x) < 0})
        }
        //remove the user themselves
        var index = potentialMatches.indexOf(email)
        potentialMatches.splice(index,1)
        query = (isMaker === true) ? backerQuery : makerQuery
        client.query(query, function(err,res){
          if (err) throw err;
          rows = res.rows
          for (var i = 0; i < rows.length; i++){
            email = rows[i].email
            if (potentialMatches.indexOf(email) > -1){
              //user is in the list of potential matches
              returnedMatches.push(
                                  {
                                    "email":email,
                                    "longBio":rows[i].longbio,
                                    "photos":rows[i].photos,
                                    "icons":rows[i].icons,
                                    "name":userDict[email].name,
                                    "age":userDict[email].age
                                  }
              )
            }
          }
          
        console.log(returnedMatches)
        callback(returnedMatches)
        })
      })
    })
  }) 
}

module.exports.getMatches = function(email,client,callback){
  let makerQuery = 'SELECT * FROM maker'
  let backerQuery = 'SELECT * from backer'

  let matches = []
  client.query(makerQuery, function(err,res){
    if (err) throw err;
    rows = res.rows
    for (var i = 0; i < rows.length; i++){
      if (email === rows.email){
        matches = rows.matches
        break;
      }
    }
    client.query(backerQuery, function(err,res){
      if (err) throw err;
      rows = res.rows
      for (var i = 0; i < rows.length; i++){
        if (email === rows.email){
          backerMatches = rows.matches
          for (var j = 0; j < backerMatches.length; j++){
            matches.push(backerMatches[j])
          }
          break;
        }
      }
      console.log(matches)
      callback(matches)
    })
  })
} 



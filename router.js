const url = require('url');
const fs = require('fs');
const path = require('path');

const gallery = require('./handicraft.js');


const options = {
  re : /^\/[a-z]+\/?/,
  length : 20,
  host : 'localhost',
  extensions : {
    '.js' : 'text/javascript',
    '.css' : 'text/css',
    '.png' : 'image/png',
    '.jpg' : 'image/jpeg'
  }
}

function router(req,res){
  let reqUrl = req.url;
  console.log(reqUrl);
  let pathname = url.parse(reqUrl).pathname;
  let route = pathname.match(options.re);
  console.log(route);  
  if(route == null || route.length > options.length)
	route = ''; // I should track those who send inappropriate route . 
  else 
       route = route[0].replace(new RegExp('/','g'),'');
 console.log(route);
  switch(route){
    case 'gallery':
	gallery.router(req,res);
	break;
   case 'public':
	sendFile(req,res);
	break;
  case 'uploads' : 
        sendFile(req,res);
        break;
    default : 
        sendHome(req,res);
	break;      
  }
}


function sendHome(req,res){
  fs.readFile(__dirname + '/views/index.html','utf8',function(err,data){
    if(err)
      console.log("error reading files\n");
    else {
       res.setHeader('Content-Type','text/html');
       let cookie = parseCookies(req);
       res.end(templateEngine(data,{host : options.host}));
    }
  }) 
}


function parseCookies(req){
  let list = {},
	rc = req.headers.cookie;
	rc && rc.split(';').forEach(function(cookie){
	   let parts = cookie.split('=');
	   list[parts.shift().trim()] = decodeURI(parts.join('='));
	})

  return list;
}


var  templateEngine= function(tpl,data){
  let re = /<%([^%>]+)?%>/g,match;
  while(match = re.exec(tpl)){
    tpl = tpl.replace(match[0],data[match[1]])
  }

  return tpl;
}

function sendFile(req,res){
   let file_path = url.parse(req.url).pathname;
   let ext = path.parse(req.url).ext.toLowerCase();
   
   if(ext in options.extensions) {
     fs.exists(__dirname + file_path,function(exists){
        if(exists){
	  fs.readFile(__dirname + file_path,function(err,data){
	     if(err){
	       res.statusCode = 404;
	       res.end();
	     }else{
	       res.setHeader('Content-Type',options.extensions[ext]);
	       res.end(data);
	     }
	  })
	}else{
	  res.statusCode = 404;
	  res.end();
	}
     })
   }
}

module.exports.process = router

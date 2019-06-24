   const  url = require('url')
   const fs = require('fs')
   const path  = require('path')
   const sizeof = require('object-sizeof');
   const addon = require("bindings")("process")
   const database = require('mongodb').MongoClient;

  var files = {};

  const options = {
    temp : "Temp/",
    db : "handi",
    db_url : "mongodb://127.0.0.1:27017"  
  }

  function handicraft(){
  
  }

  function startUpload(data){  

    let that = this;
    let filename = data['name'];
    
    files[that.id+filename] = { 
       size : data['size'],
       uploaded : "",
       downloaded : 0,
       name : filename,
       title : data['title'],
       price : data['price'],
       description : data['description']
    }

    var place = 0;

    try{
      var stat = fs.statSync(options.temp +  filename);
      if(stat.isFile())
        {
	  files[that.id+filename]['downloaded'] = stat.size;
	  place = stat.size / 524288;
	}
     }catch(er){} 
    
    fs.open(options.temp + filename, 'a', 0755, function(err, fd){
	if(err)
	{
        	console.log(err);
	}
	else
	{
	  files[that.id+filename]['handler'] = fd; 
	  that.emit('g-continue', { 'place' : place, percent : 0 ,name : filename});
	}
	});
  }
   
  
  function upload(data){  
   
    let that = this;
    let filename = data['name'];
    
   
    files[that.id+filename]['downloaded'] += data['data'].length;
    files[that.id+filename]['uploaded'] += data['data'];
    galleryName = files[that.id + filename]['title'];

    if(files[that.id+filename]['downloaded'] == files[that.id+filename]['size'])
    { 
	fs.write(files[that.id+filename]['handler'],files[that.id+filename]['uploaded'], null, 'Binary', function(err, w){
        var inp = fs.createReadStream(options.temp + filename);			
					
        var gallery = path.join(__dirname + "/uploads/"+galleryName);
				 
        if(!fs.existsSync(gallery))   fs.mkdirSync(gallery)       	
                
       
        var imagePath = path.join(gallery,filename); 
	var out = fs.createWriteStream(imagePath);
	inp.pipe( out);
	inp.on('close',function(){       
  	   	  
	   addon.process(options.temp + filename,imagePath,function(im_width,im_height){                 
               console.log(im_width + ' ' + im_height);
               that.emit('thumb' , {
                     src : filename,
                     height : im_height,
                     width : im_width,          	  
                     gallery : galleryName
               })                            
                                                 
               insert({
                    gallery : galleryName,
                    price : files[that.id + filename]['price'],
                    description : files[that.id + filename]['description'],
                    src : data['name'],
                    width : im_width,
                    height : im_height
               });                                                   
               
               delete files[that.id + filename];
           });
	});
    }) 
			
  }else if(files[that.id+filename]['uploaded'].length > 10485760){
    	fs.write(files[that.id+filename]['handler'], files[that.id+filename]['uploaded'], null, 'Binary', function(err, w){
	  files[that.id+filename]['uploaded'] = ""; 
  	  var place = files[that.id+filename]['downloaded'] / 524288;
          var percent = (files[that.id+filename]['downloaded'] / files[that.id+filename]['size']) ;
  	  that.emit('g-continue', { 'place' : place, name : filename ,'percent' :  percent});
	});
  }else	{
     var place = files[that.id+filename]['downloaded'] / 524288;
     var percent = (files[that.id+filename]['downloaded'] / files[that.id+filename]['size']) ;     
     that.emit('g-continue', { 'place' : place, name : filename,'percent' :  percent});
  }
   	
 }



function archive(data){
  let socket = this;
  database.connect(options.db_url,{useNewUrlParser : true},function(err,client){
    if(err) throw err;

    let db = client.db(options.db);
    
    db.collection('handicraft').find({})
                               .toArray(function(err,arr){
                                    if(err) throw err;
                                    socket.emit('archive',{data : arr});
                                    client.close();
                                })
  })
}


function insert(data){
  database.connect(options.db_url,{useNewUrlParser : true},function(err,client){
     if(err) throw err;
    
    let db = client.db(options.db);
  
    db.collection('handicraft').updateOne({
      gallery : data.gallery,
      src : data.src        
    },
    {$set : data},{upsert : true},function(err,result){
        if(err) throw err;
       client.close();
    }) 
  })

}



module.exports.router = handicraft
module.exports.upload = upload
module.exports.start = startUpload
module.exports.archive = archive

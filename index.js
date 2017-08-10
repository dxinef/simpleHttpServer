"use strict";
/*
a simple http server
e.g.
cmd : 
node http.js 81
*/

//require
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const process = require("process");
const program = require('commander');

program
  .version('0.1.0')
  .option('-d, --dir [dir]', 'local website path / 网站所在本地路径，默认为当前目录')
  .option('-p, --port [port]', 'port / 监听的端口号，默认为8080')
  .parse(process.argv);

var localPath = program.dir ?  program.dir : process.cwd(),
    port = program.port ? program.port : 8080;

//create server
var server = http.createServer(requestListener); 
server.listen(port);

//server run
console.log("Local path: " + localPath);
console.log("Server runing at: http://localhost:" + port); 

//requestListener
function requestListener(req, res){
	var pathname = url.parse(req.url).pathname;
	var realPath = decodeURI(path.join(localPath, pathname)); //get local file path

	fs.exists(realPath, function (exists) {
		if (!exists) { // if file not found
			output_err(res,404, req.headers.host + req.url + " was not found"); //404 err
		}
		else {
			var isDir = fs.statSync(realPath).isDirectory();
			if(!isDir){ //if path is file
				output_file(realPath,res); 
			}
			else { //if path is file
				if(pathname.slice(-1) != "/") {
					res.writeHead(302, {
					  'Location': pathname + "/"
					});
					res.end();
				}
				output_dir(realPath,req,res);
			}
		}
	});
}

//output_file
function output_file(realPath,res){
	var ext = path.extname(realPath);
	ext = ext ? ext.slice(1) : ''; //file ext name
	var mine = { //mine type
		"html": "text/html",
		"css": "text/css",
		"js": "text/javascript",
		"txt": "text/plain",
		"png": "image/png",
		"gif": "image/gif",
		"jpeg": "image/jpeg",
		"jpg": "image/jpeg",
		"ico": "image/x-icon",
		"json": "application/json",
		"pdf": "application/pdf",
		"svg": "image/svg+xml",
		"swf": "application/x-shockwave-flash",
		"wav": "audio/x-wav",
		"wma": "audio/x-ms-wma",
		"wmv": "video/x-ms-wmv",
		"xml": "text/xml"
	};
	
	fs.readFile(realPath, "binary", function (err, file) { //readfile
		if (err) {
			output_err(res,500,err);
		}
		else {
			var contentType = mine[ext] || "text/plain";
			res.writeHead(200, {
				'Content-Type': contentType
			});
			res.write(file, "binary");
			res.end();
		}
	});
}

//output_dir
function output_dir(realPath,req,res){
	fs.readdir(realPath, function (err, files) { //read dir
		if(err){
	 		output_err(res,404,err);
		}
		else {
			var html = "<h1>" + req.headers.host + " " + decodeURI(req.url) + "</h1>";
			html += "<table><tr><th>filename</th><th>filetype</th></tr>";
			if(req.url != "/") html += "<tr><td><a href=\"..\">..</a></td><td></td></tr>";
			files.forEach(function(file,index,files){
				// var realFile = realPath+"\/"+file;
				var isDir = fs.statSync(realPath+"\/"+file).isDirectory();
				html += [
					"<tr>",
					"<td><a href=\"" + file + "\">" + file + "<\/a><\/td>",
					"<td>"+(fs.statSync(realPath+"\/"+file).isDirectory() ? "dir" : path.extname(file)) + "<\/td>",
					"<\/tr>"
				].join("");
			});
			html += "</table>";
			html = out_template(html);

			res.writeHead(200, {
				'Content-Type': 'text/html'
			});
			res.end(html);
		}
	});
}

//output_err
function output_err(res,code,msg){
	msg = msg || "error";
	res.writeHead(code, {
		'Content-Type': 'text/html'
	});
	msg = out_template(msg);
	res.end(msg);
}

// outTemplate
function out_template(html) {
	return [ //create html page
		"<!DOCTYPE html><html><head><meta charset=\"UTF-8\">",
		"<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,user-scalable=yes\">",
		"<title>"+url+"</title>",
		"<style>",
		"body{font-size:12px;}table{width:100%;border-collapse:collapse;font-size:12px;}th,td{line-height:2em;padding:0 10px;}th{text-align:left;border-bottom:1px solid #ddd;}",
		"</style>",
		"</head><body>",
		html,
		"</body></html>"
	].join("");
}
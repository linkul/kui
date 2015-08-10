'use strict';
var path = require('path'),
    fs = require('fs-extra'),
    os = require('os'),
    prompt = require('prompt');
module.exports = {
    envInfo: {
        isWin: /window/i.test(os.type()),
        ip: (function() {
            var ip = '127.0.0.1';
            var ifaces = os.networkInterfaces();
            // 获取本地IP地址,起服务器时使用ip地址
            Object.keys(ifaces).forEach(function(ifname) {
                var alias = 0;
                ifaces[ifname].forEach(function(iface) {
                    if ('IPv4' !== iface.family || iface.internal !== false) {
                        return;
                    }
                    if (iface.address.indexOf('10.1') >= 0) {
                      ip = iface.address;
                    }
                });
            });
            return ip;
        })()

    },
    projectTask:function(grunt) {

    var curProject = path.basename(__dirname);
    grunt.registerTask('add', function(target) {
        if (!target) {
            grunt.warn('add target must be specified, like add:test.');
        } else if (grunt.file.exists('src/html/' + target)) {
            grunt.warn(target + ' is already exist, use another name.');
        } else {
            var _modJS = '',
                _modCSS = '',

                _modHTML = '';

            var targetFile = {
                html : {
                    fileName : 'index.jade',
                    fileContent : _modHTML
                },
                css : {
                    fileName : 'index.scss',
                    fileContent : _modCSS
                },
                js : {
                    fileName : 'index.js',
                    fileContent : _modJS
                }
            };

            grunt.file.defaultEncoding = 'utf8';
            grunt.file.preserveBOM = false;
            try {
                var fileName = 'src/html/' + target + '/'+ targetFile.html.fileName;
                grunt.file.mkdir('src/html/' + target);
                grunt.file.write(fileName,targetFile.html.fileContent);
                grunt.log.ok('create file:' + fileName);

                fileName = 'src/css/' + target + '/'+ targetFile.css.fileName
                grunt.file.mkdir('src/css/' + target);
                grunt.file.write(fileName,targetFile.css.fileContent);
                grunt.log.ok('create file:' + fileName);

                fileName = 'src/js/' + target + '/'+ targetFile.js.fileName;
                grunt.file.mkdir('src/js/' + target);
                grunt.file.write(fileName,targetFile.js.fileContent);
                grunt.log.ok('create file:' + fileName);
            } catch (e) {
                grunt.fail.fatal(e.message);
            }
        }
    });
grunt.registerTask('project', function(target) {
        //console.log(projects.projectList);
        var projects = fs.readJsonSync('project.json')
        if (!target) {
            grunt.warn('add target must be specified, like add:project.');
        } else if (grunt.file.exists(target)) {
            grunt.warn(target + ' is already exist, use another name.');
        } else {
            var targetName=target.replace(/^m-/,"");
            var _modJS = '',
                _modCSS = '';
            var targetFile = {
                less : {
                    fileName : targetName+'.less',
                    fileContent : _modCSS
                },
                src : {
                    fileName : targetName+'.js',
                    fileContent : _modJS
                },
                images:{},
                css:{},
                js:{}
            };
            grunt.file.defaultEncoding = 'utf8';
            grunt.file.preserveBOM = false;
            try {
                for(var key in targetFile){
                    var dir=target +"/"+ key;
                    grunt.file.mkdir(dir);
                    if(targetFile[key].fileName){
                        var fileName = dir+"/"+targetFile[key].fileName;
                        grunt.file.write(fileName,targetFile[key].fileContent)
                        grunt.log.ok('create file:' + fileName);
                    }
                    else{
                        grunt.log.ok('mkdir:' + dir);
                    }
                }
                projects.projectList.push(target);
                fs.writeJsonSync('project.json', projects);
            } catch (e) {
                grunt.fail.fatal(e.message);
            }
        }
    });
grunt.registerTask('init', function(target) {
        //console.log(projects.projectList);
        function buildProject(){
            var targetName=target.replace(/^m-/,"");
            var _modJS = '',
                _modCSS = '';
            var targetFile = {
                less : {
                    fileName : targetName+'.less',
                    fileContent : _modCSS
                },
                src : {
                    fileName : targetName+'.js',
                    fileContent : _modJS
                },
                images:{},
                css:{},
                js:{}
            };
            grunt.file.defaultEncoding = 'utf8';
            grunt.file.preserveBOM = false;
            try {
                for(var key in targetFile){
                    var dir= key;
                    grunt.file.mkdir(dir);
                    if(targetFile[key].fileName){
                        var fileName = dir+"/"+targetFile[key].fileName;
                        grunt.file.write(fileName,targetFile[key].fileContent)
                        grunt.log.ok('create file:' + fileName);
                    }
                    else{
                        grunt.log.ok('mkdir:' + dir);
                    }
                }
                //projects.projectList.push(target);
                projects.project=targetName;
                fs.writeJsonSync('project.json', projects);
            } catch (e) {
                grunt.fail.fatal(e.message);
            }
        }
        var projects = fs.readJsonSync('project.json')
         if (!target) {
            grunt.warn('add target must be specified, like init:project.');
         } else if (projects.project) {
            var msg="";
            if(projects.project==target){
                msg='已经存在项目 "'+projects.project+'",确定要初始化吗?[y]or[n]';
            }
            else{
                msg='已经存在项目 "'+projects.project+'",确定要重置为"'+target+'"?[y]or[n]';
            }
            var done = this.async();
            prompt.start();
            var property = {
              name: 'yesno',
              message: msg,
              validator: /y[es]*|n[o]?/,
              warning: 'Must respond yes or no',
              default: 'no'
            };
            prompt.get(property, function (err, result) {
                if(result.yesno=="y"){
                    buildProject();
                }
                done();
            });
        } else {
            buildProject();
       }
    });
}
}


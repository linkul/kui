'use strict';
var spawn = require('child_process').spawn,
    fs = require('fs-extra'),
    path = require('path');
module.exports =function(config){
    return function(grunt) {
    var pkg = fs.readJsonSync('package.json');
    var git = require('./task/gitTask');
    var fatal = grunt.fatal;
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    var mProjectList=[],
        sProject,
        isRequire,
        useLess,
        useTpl;
    function checkPrjectList(){
        var projects = fs.readJsonSync('project.json');
        isRequire=projects.requirejs!==false;
        useLess=projects.less!==false
        useTpl=projects.tpl!==false
        if(projects&&projects.projectList){
            for(var i=0;i<projects.projectList.length;i++){
                var hasProject=fs.existsSync(projects.projectList[i]);
                if(hasProject){
                    var hasAdded=false;
                    if(mProjectList.length>0){
                    for(var j=0;j<mProjectList.length;j++){
                        if(mProjectList[j]==projects.projectList[i]){
                            hasAdded=true;
                        }
                    }
                    }
                    if(!hasAdded){
                        mProjectList.push(projects.projectList[i]);
                    }
                }
                else{
                    grunt.log.error("项目："+projects.projectList[i]+"不存在或已删除");
                }
            }
        }
        if(projects.project){
            sProject=projects.project;
        }
        //return  object;
    }
    checkPrjectList();
    // grunt 配置
    var gruntConfig = {
        pkg: pkg,
        currentBranch: 'master',
        watch:(function(){
            var object={
                options: {
                    //livereload: livereloadPort
                }
            };
            function getRequire(project){
                if(isRequire){
                    return  ['newer:copy:'+"dev"+project,"requirejs:"+project];
                }
                else{
                    return  ['newer:copy:'+"dev"+project];
                }
            }
            function getRequireTpl(project){
                if(isRequire){
                    return  ['build-tpl:'+project,"requirejs:"+project];
                }
                else{
                    return  ['build-tpl:'+project];
                }
            }
            if(mProjectList.length>0){
                for(var i=0;i<mProjectList.length;i++){
                    var project=mProjectList[i].replace("m-","");
                    object[project+"js"]={
                        files: [mProjectList[i]+'/src/**/*.js'],
                        tasks: getRequire(project)
                    }
                    if(useTpl){
                        object[project+"tpl"]={
                            files: [mProjectList[i]+'/tpl/**/*.tpl'],
                            tasks:getRequireTpl(mProjectList[i])
                        }
                    }
                    if(useLess){
                        object[project+"css"]= {
                            files: [mProjectList[i]+'/less/**/*.less'],
                            tasks: ['recess:'+project]
                        }
                    }
                }
            }
            if(sProject){
                object[sProject]={
                    files: ['src/**/*.js'],
                    tasks: getRequire(sProject)
                }
                if(useTpl){
                    object[sProject+"tpl"]={
                        files: ['tpl/**/*.tpl'],
                        tasks: getRequireTpl(sProject)
                    }
                }
                if(useLess){
                    object[sProject+"css"]= {
                        files: ['less/**/*.less'],
                        tasks: ['recess:'+sProject]
                    }
                }
            }
            return  object;
        }()),
        jshint: {
            ignore_warning: {
                options: {
                    '-W014': true
                }
            },
            options: {
                reporter: (function() {
                    try {
                        return require('jshint-stylish');
                    } catch (e) {
                        return null;
                    }
                })(), //自定义输出style
                predef: ['require', 'module', 'exports','__dirname'],
                force: true, //不中止task
                strict: true,
                sub: true, // 消除类似 ['hasTown'] is better written in dot notation
                browser: true,
                devel: true, //关闭开发模式，即可以使用`console`、`alert`等的调试函数
                smarttabs: true, // 允许tab空格混写
                // asi: true, // 可以不写分号
                undef: true,
                newcap: false,
                expr: true, // 允许使用三元表达式
                laxcomma: true, // 允许逗号前置的编码风格
                multistr: true//, // 允许多行的string
            },
            all: ['Gruntfile.js', '**/src/**/*.js',"!node_modules/**/*.js"]
        },
        uglify:(function(){
            var object={
                options: {
                    beautify: {
                        ascii_only: true
                    },
                    compress: {
                        warnings: false
                    }
                }
            };
            if(mProjectList.length>0){
                for(var i=0;i<mProjectList.length;i++){
                    object[mProjectList[i]+"js"]={
                        files: [{
                            expand: true,
                            cwd: mProjectList[i]+'/src/',
                            src: ['**/*.js', '!**/*.min.js'],
                            dest: mProjectList[i]+'/js/',
                            ext: '.min.js',
                            extDot : 'last'
                        }]
                    }

                }
            }
            if(sProject){
                object[sProject]={
                    files: [{
                        expand: true,
                        cwd: './src',
                        src: ['**/*.js', '!**/*.min.js'],
                        dest:'./js',
                        ext: '.min.js',
                        extDot : 'last'
                    }]
                }
            }
            return  object;

        }()),
        cssmin:(function(){
            var object={};
            if(mProjectList.length>0){
                for(var i=0;i<mProjectList.length;i++){
                    object[mProjectList[i]+"cssmin"]={
                        expand: true,
                        cwd: mProjectList[i],
                        src: ['/{css,widget}/**/*.css','!/{css,widget}/**/*.min.css'],
                        dest: mProjectList[i],
                        ext: '.min.css'
                    }
                }
            }
            if(sProject){
                object[sProject+"cssmin"]={
                        expand: true,
                        //此处不能使用cwd简写，因为watch监听事件里，filepath是包含cwd的全路径，会导致监听单文件修改失败
                        src: ['{css,widget}/**/*.css','!{css,widget}/**/*.min.css'],
                        dest: './',
                        ext: '.min.css'
                    }
            }
            return  object;

        }()),
        // imagemin: {
        //     build: {
        //         files: [{
        //             expand: true,
        //             cwd: 'src',
        //             src: ['**/*.{png,jpg,gif}'],
        //             dest: 'build'
        //         }]
        //     }
        // },
        copy:(function(){
            var object={
                options: {
                    noProcess: '**/*.{css,png,jpg,jpeg,gif,html,svg,eot,ttf,woff}',
                    process: function(content, srcpath) {
                        return content;
                    }
                }
            };
            if(mProjectList.length>0){
                for(var i=0;i<mProjectList.length;i++){
                    var project=mProjectList[i].replace("m-","");
                    object["dev"+project]={
                        files: [{
                            expand: true,
                            cwd: mProjectList[i]+'/src',
                            src: ['**/*.js','**/!config.js'],
                            dest: mProjectList[i]+'/js'
                        }]
                    }
                }
            }
            if(sProject){
                object["dev"+sProject]={
                    files: [{
                        expand: true,
                        cwd: 'src',
                        src: ['**/*.js','!config.js'],
                        dest: 'js'
                    }]
                }

            }
            object["buildAll"]={
                files: [{
                    expand: true,
                    //cwd: project+'/src',
                    src: ['**/{js,css,images}/**/*.{css,js,png,gif,jpg,jpeg,html,svg,eot,ttf,woff}', '!build/**/*.*', '!**/src/**/*.*',"!node_modules/**/*.*"],
                    dest: 'build'
                }]
            }
            return  object;
        }()),
        clean: {
            all: 'build/'//,
            //docs: 'docs'
        },
        'string-replace': {
            replaceVersion: {
                files: {
                    'src/': ['src/js/config.js']
                },
                options: {
                    replacements: [{
                        pattern: /<%version%>/ig,
                        replacement:'<%= currentBranch %>'
                    }]
                }
            }
        },
        requirejs:(function(){
            var object={};
            if(mProjectList.length>0){
                for(var i=0;i<mProjectList.length;i++){
                    var project=mProjectList[i].replace("m-","");
                    object[project]={
                        options: {
                          name: project,
                          optimize: 'none',
                          baseUrl: mProjectList[i]+"/src",
                          mainConfigFile: "requireJsSetting.js",
                          out: mProjectList[i]+"/js/"+project+".js"
                        }
                    }
                }
            }
            if(sProject){
                object[sProject]={
                    options: {
                      name: "../src/"+project,
                      optimize: 'none',
                      baseUrl: "js",
                      mainConfigFile:"requireJsSetting.js",
                      out: "js/"+sProject+".js"
                    }
                }
            }
            return  object;
        }()),
        recess:
        (function(){
            var object={
                options: {
                    compile: true,
                    banner: ''
                }
            };
            if(mProjectList.length>0){
                for(var i=0;i<mProjectList.length;i++){
                    var project=mProjectList[i].replace("m-","");
                    object[project]={
                        src: [mProjectList[i]+'/less/'+project+'.less'],
                        dest: mProjectList[i]+'/css/'+project+'.css'
                    }
                }
            }
            if(sProject){
                object[sProject]={
                    src: ['less/'+sProject+'.less'],
                    dest: 'css/'+sProject+'.css'
                }
            }
            return  object;
        }())
    };
    //gruntConfig
    // 首先检查是否有最新的npm，至少需要有grunt才能运行
    grunt.registerTask('initGrunt', '更新项目的npm依赖', function() {
        var done = this.async();
        var callback = function() {
            grunt.initConfig(gruntConfig);
            grunt.config.merge(config);
            done();
        };
        callback();
    });
    grunt.task.run(['initGrunt']);
    grunt.registerTask('dev', [
        'jshint',
        'clean:all',
        'recess',
        "cssmin",
        'uglify',
        'copy'
    ]);
    grunt.registerTask('build', [
        'clean:all',
        'copy:buildAll'
    ]);
    grunt.registerTask('build-requirejs-tpl', function (mode_name) {
        var files = {};
        if(!grunt.file.exists(mode_name+"/src/tpl")){
            grunt.file.mkdir(mode_name+"/src/tpl");
        }
        function getFiles(file,type) {
          fs.readdirSync(file)
            .filter(function (path) {
                if(path.indexOf(".")<0){
                  getFiles(file+"/"+path,type);
                }
              return new RegExp('\\.' + type + '$').test(path);
            })
            .forEach(function (path) {
            var file_name=path.replace(".html",""),
                file_content=fs.readFileSync(file + '/' + path, 'utf8'),
                file_={};
                file_[file_name]=file_content;
            var fileString=JSON.stringify(file_).replace(/(\\f|\\n|\\r|\\t|\\v)+/g,"").replace(/\s+/g,' ');
                fileString="define(function(){ var tpl="+fileString+"; return tpl['"+file_name+"'];});"
            var jsfile=file.replace("tpl","src/tpl");
                fs.writeFileSync(jsfile + '/'+file_name+'.js', fileString);
            })
        }
        getFiles(mode_name+"/tpl","tpl");
    });
    grunt.registerTask('build-tpl', function (mode_name) {
        if(!grunt.file.exists(mode_name+"/src/tpl")){
            grunt.file.mkdir(mode_name+"/src/tpl");
        }
        files = {};
        function getFiles(file,type) {
          fs.readdirSync(file)
            .filter(function (path) {
                if(path.indexOf(".")<0){
                  getFiles(file+"/"+path,type);
                }
              return new RegExp('\\.' + type + '$').test(path);
            })
            .forEach(function (path) {
              return files[path] = fs.readFileSync(file + '/' + path, 'utf8');
            })
           var fileString=JSON.stringify(files).replace(/(\\f|\\n|\\r|\\t|\\v)+/g,"").replace(/\s+/g, ' ');
          return 'var _'+ mode_name+"_"+ type + ' = ' + fileString+ ';'
        }
        var files =getFiles(mode_name+"/tpl","tpl");
        fs.writeFileSync(mode_name+"/src/tpl/"+mode_name+'.tpl.js', files);
    });
    //grunt.registerTask('setup', ['shell:precommit']);
    grunt.registerTask('default', ['dev']);
    grunt.registerTask('docs', ['clean:docs', 'copy:build', 'jsdoc']);
    grunt.registerTask('replace', ['string-replace']);
    if(config.registerTask){
        config.registerTask(grunt);
    }
    try {
        require('time-grunt')(grunt);
    } catch (e) {
    }
};
}

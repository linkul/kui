'use strict';
var spawn = require('child_process').spawn,
    fs = require('fs-extra'),
    path = require('path');
module.exports =function(config){
    return function(grunt) {
    var curProject =config.basename?config.basename:path.basename(__dirname);
    var pkg = fs.readJsonSync('package.json');
    var kuiPath="./";
    if(curProject!="kui"){
        kuiPath="./kui/"
    }
    var git = require('./task/gitTask');
    var project=require('./task/projectTask');
    project.projectTask(grunt);
    var fatal = grunt.fatal;
    var livereloadPort = Math.floor(Math.random() * 10000) + 10000;
    var localIp = project.envInfo.ip;
    var port = grunt.option('port') || (project.envInfo.isWin ? 80 : 9876);
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    var checkedProjectList=[],checkedProject,isRequire;
    function checkPrjectList(){
        var projects = fs.readJsonSync('project.json');
        //var object={};
        isRequire=projects.isRequire!==false;
        if(projects&&projects.projectList){
            for(var i=0;i<projects.projectList.length;i++){
                var hasProject=fs.existsSync(projects.projectList[i]);
                if(hasProject){
                    var hasAdded=false;
                    if(checkedProjectList.length>0){
                    for(var j=0;j<checkedProjectList.length;j++){
                        if(checkedProjectList[j]==projects.projectList[i]){
                            hasAdded=true;
                        }
                    }
                    }
                    if(!hasAdded){
                        checkedProjectList.push(projects.projectList[i]);
                    }
                }
                else{
                    grunt.log.error("项目："+projects.projectList[i]+"不存在或已删除");
                }
            }
        }
        if(projects.project){
            checkedProject=projects.project;
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
                    livereload: livereloadPort
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
                    return  ['build-tpl:'+checkedProject,"requirejs:"+project];
                }
                else{
                    return  ['build-tpl:'+checkedProject];
                }
            }
            if(checkedProjectList.length>0){
                for(var i=0;i<checkedProjectList.length;i++){
                    var project=checkedProjectList[i].replace("m-","");
                    object[project+"js"]={
                        files: [checkedProjectList[i]+'/src/**/*.js'],
                        tasks: getRequire(project)
                    }
                    object[project+"tpl"]={
                        files: [checkedProjectList[i]+'/tpl/**/*.tpl'],
                        tasks: ['build-tpl:'+checkedProjectList[i]]
                    }
                    //build-tpl
                    object[project+"css"]= {
                        files: [checkedProjectList[i]+'/less/**/*.less'],
                        tasks: ['recess:'+project]
                    }
                }
            }
            if(checkedProject){
                object[checkedProject]={
                    files: ['src/**/*.js'],
                    tasks: getRequire(checkedProject)
                }
                object[checkedProject+"tpl"]={
                        files: ['tpl/**/*.tpl'],
                        tasks: getRequireTpl(checkedProject)
                    }
                object[checkedProject+"css"]= {
                    files: ['less/**/*.less'],
                    tasks: ['recess:'+checkedProject]
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
            all: ['Gruntfile.js', '**/src/**/*.js']
        },
        uglify: {
            build: {
                options: {
                    beautify: {
                        ascii_only: true
                    },
                    compress: {
                        warnings: false
                    }
                },
                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: ['**/{js}/**/*.js', '**/!{js}/**/*-min.js'],
                    dest: 'build/',
                    ext: '-min.js',
                    extDot : 'last'
                }]
            }
        },
        cssmin: {
            build: {
                expand: true,
                //此处不能使用cwd简写，因为watch监听事件里，filepath是包含cwd的全路径，会导致监听单文件修改失败
                src: ['build/{css,widget}/**/*.css', '!build/{css,widget}/**/*-min.css'],
                dest: '',
                ext: '-min.css',
                extDot: 'last'
            }
        },
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
            if(checkedProjectList.length>0){
                for(var i=0;i<checkedProjectList.length;i++){
                    var project=checkedProjectList[i].replace("m-","");
                    object["dev"+project]={
                        files: [{
                            expand: true,
                            cwd: checkedProjectList[i]+'/src',
                            src: ['**/*.js','**/!config.js'],
                            dest: checkedProjectList[i]+'/js'
                        }]
                    }
                }
            }
            if(checkedProject){
                object["dev"+checkedProject]={
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
                    src: ['**/js/**/*.{css,js,png,gif,jpg,jpeg,html,svg,eot,ttf,woff}', '!build/**/*.*', '**/!src/**/*.*',"!node_modules/**/*.*"],
                    dest: 'build'
                }]
            }
            return  object;
        }()),
        clean: {
            all: 'build/'//,
            //docs: 'docs'
        },
        connect: {
            debug: {
                options: {
                    port: port,
                    hostname: '*',
                    base: '../',
                    middleware: function(connect, options, middlewares) {
                        var combo = require('connect-combo');
                        // Combo support
                        middlewares.push(combo({
                            directory: function(req) {
                                var url = req.url;
                                //去掉版本号
                                url = url.replace(/\/\d+\.\d+\.\d+\//gi, '/');
                                //修正??前面不带/
                                url = url.replace(/([^\/])\?\?/gmi, '$1/??');

                                //connect-combo不支持单文件合并,通过rewrite支持
                                if (/\?\?/gmi.test(url) && !/,/gmi.test(url)) {
                                    url = url.replace(/\?\?/gi, '');
                                }
                                // //支持alitx/??规则目录映射
                                // if (/\/alitx\/\?\?/gmi.test(url)) {
                                //     url = url.replace(/(\/alitx\/\?\?|,)(.*?\/)/gi, '$1$2build/');
                                // }

                                // //支持alitx/dpl/??规则目录映射
                                // url = url.replace(/(\/|,|\?\?)alitx\/(.*?\/)/gi, '$1$2build/');
                                url = url.replace(/(build\/)+/gi, 'build/'); //build目录修正

                                req.url = url;

                                // 修正connect不支持接收POST请求的问题
                                req.method = 'GET';

                                return path.resolve(__dirname, '../');
                            },
                            proxy: 'g.assets.daily.taobao.net',
                            cache: true,
                            log: false,
                            static: false
                        }));

                        if (!Array.isArray(options.base)) {
                            options.base = [options.base];
                        }

                        var directory = options.directory || options.base[options.base.length - 1];
                        options.base.forEach(function(base) {
                            // Serve static files.
                            middlewares.push(connect.static(base));
                        });

                        // Make directory browse-able.
                        middlewares.push(connect.directory(directory));
                        return middlewares;
                    },
                    livereload: livereloadPort,
                    open: 'http://' + localIp + ':'+  port +'/alitx/<%= pkg.name%>/',
                    useAvailablePort: true
                }
            }
        },
        shell: {
            options: {
                callback: function(err, stdout, stderr, cb) {
                    if (err) {
                        grunt.fail.fatal(err);
                    }
                    cb();
                }
            },
            newTag: {
                command: 'git tag publish/<%= currentBranch %>'
            },
            add: {
                command: 'git add .'
            },
            push: {
                command: function(version) {
                    //console.log(version)
                    if(version) {
                        return 'git push origin daily/' + version;
                    }
                    return 'git push';
                }
            },
            commit: {
                command: function(msg) {
                    var command = 'git commit -m "' + grunt.config.get('currentBranch') + ' - ' + grunt.template.today("yyyy-mm-dd HH:MM:ss") + ' ' + msg + '"';
                    return command;
                }
            },
            publish: {
                command: 'git push origin publish/<%= currentBranch %>:publish/<%= currentBranch %>'
            }
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
            //var projects = fs.readJsonSync('project.json');
            var object={};
            //if(projects)

            if(checkedProjectList.length>0){
                for(var i=0;i<checkedProjectList.length;i++){
                    var project=checkedProjectList[i].replace("m-","");
                    object[project]={
                        options: {
                          name: project,
                          optimize: 'none',
                          baseUrl: checkedProjectList[i]+"/src",
                          mainConfigFile: "requireJsSetting.js",
                          out: checkedProjectList[i]+"/js/"+project+".js"
                        }
                    }
                }
            }
            if(checkedProject){
                object[checkedProject]={
                    options: {
                      name: "../src/"+project,
                      optimize: 'none',
                      baseUrl: "js",
                      mainConfigFile:"requireJsSetting.js",
                      out: "js/"+checkedProject+".js"
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
            if(checkedProjectList.length>0){
                for(var i=0;i<checkedProjectList.length;i++){
                    var project=checkedProjectList[i].replace("m-","");
                    object[project]={
                        src: [checkedProjectList[i]+'/less/'+project+'.less'],
                        dest: checkedProjectList[i]+'/css/'+project+'.css'
                    }
                }
            }
            if(checkedProject){
                object[checkedProject]={
                    src: ['less/'+checkedProject+'.less'],
                    dest: 'css/'+checkedProject+'.css'
                }
            }
            return  object;
        }())
    };

    // 首先检查是否有最新的npm，至少需要有grunt才能运行
    grunt.registerTask('initGrunt', '更新项目的npm依赖', function() {
        var done = this.async();
        var callback = function() {
            //require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
            grunt.initConfig(gruntConfig);
            grunt.config.merge(config);
            //console.log(grunt.config)
            done();
        };
        callback();
    });

    grunt.registerTask('checkBranch', '检查分支是否合法', function() {
        var done = this.async();
        git.checkBranch(function(branchNumber) {
            grunt.config.set('currentBranch', branchNumber);
            //grunt.task.run(['copy:config','string-replace:replaceVersion']);
            grunt.log.oklns('currentBranch:' + grunt.config.get('currentBranch'));
            done();
        });
    });
    grunt.task.run(['initGrunt']);

    grunt.registerTask('new', '创建新的daily分支', function(version) {
        var done = this.async();
        git.newBranch(version,function() {
            grunt.task.run(['shell:add','shell:commit:创建新分支'+version,'shell:push:'+version]);
            done();
        });
    });

    grunt.registerTask('dev', [
        'checkBranch'
        //'checkBranch'//,
        // 'jshint',
        // 'clean:all',
        // 'copy:build',
        // 'uglify:build',
        // 'cssmin:build',
        // 'connect:debug',
        // 'watch'
        //'string-replace:replaceVersion'
    ]);

    grunt.registerTask('build', [
        'checkBranch',
        'jshint',
        'clean:all',
        //'compass:build',
        //'coffee:debug',
        //'shell:xtpl',
        //'mtc:build',
        'copy:buildAll'
        //'imagemin:build'
    ]);

    // grunt publish 。慎用！！！！
    grunt.registerTask('publish', 'publish project...', function(msg) {
        msg = msg || 'publish new version';
        var task = grunt.task;
        var done = this.async();
        task.run(['build']);
        // task.run(['shell:add']);
        // task.run(['shell:commit:'+ msg]);
        task.run(['shell:newTag']);
        grunt.log.oklns('created tag publish/' + grunt.config.get('currentBranch'));
        task.run(['shell:publish']);
        grunt.verbose.ok('publish successful!!!  please create the new version branch');
        done();
    });
    // grunt daily 。发布daily！！！！
    grunt.registerTask('daily', 'push daily...', function(msg) {
        msg = msg || 'push daily/'+grunt.config.get('currentBranch');
        var task = grunt.task;
        var done = this.async();
        task.run(['shell:add']);
        task.run(['shell:commit:'+ msg]);
        grunt.log.oklns('push daily/' + grunt.config.get('currentBranch'));
        task.run(['shell:push:'+grunt.config.get('currentBranch')]);
        grunt.verbose.ok('push daily successful!!!');
        done();
    });
    grunt.registerTask('build-tpl', function (mode_name) {
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

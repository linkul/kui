'use strict';
var grunt = require('grunt'),
    path = require('path'),
    fs = require('fs-extra'),
    exec = require('child_process').exec
// request = require('request');

var fatal = grunt.fatal;
module.exports = {
    getCurrentBranch: function(callback) {
        exec('git symbolic-ref --short HEAD', function(error, stdout, stderr) {
            if (error) {
                fatal(error);
            }
            if (callback) {
                callback.call(null, stdout);
            }
        });
    },

    checkBranch: function(callback) {
        var project = fs.readJsonSync('project.json');
        this.getCurrentBranch(function(branchName) {
            var branchNumber = branchName.replace('daily/', '').trim();
            if (!/\d+\.\d+\.\d+/.test(branchNumber)) {
                fatal('当前分支为名字不合法(daily/x.y.z)，请切换到相应的daily分支');
                process.exit(1);
            }
            if (branchNumber !== project.version) {
                grunt.log.writeln('project.json中发布版本号与当前分支不一致，已自动修改为:' + branchNumber);
                project.version = branchNumber;
                fs.writeJsonSync('project.json', project);
            }
            if (callback) {
                callback(branchNumber);
            }
        });
    },



    newBranch: function(version, callback) {
        if (arguments.length < 2 || !/\d+\.\d+\.\d+/ig.test(arguments[0])) {
            fatal('请输入有效分支名x.y.z');
        }
        exec('git checkout -b daily/' + version, function(err, stdout, stderr, cb) {
            grunt.log.oklns(('创建新分支：daily/' + version));
            grunt.config.set('currentBranch', version);
            try {
                var project = fs.readJsonSync('project.json');
                project.version = version;
                fs.writeJsonSync('project.json', project);
                callback(version);
            } catch (e) {
                fatal(e.message, 'project.json');
            }
        });
    }
};

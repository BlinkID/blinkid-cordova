#!/usr/bin/env node

module.exports = function(ctx) {
    // make sure android platform is part of build 
    if (ctx.opts.platforms.indexOf('android') < 0) {
        return;
    }
    var fs = ctx.requireCordovaModule('fs'),
        path = ctx.requireCordovaModule('path'),
        deferral = ctx.requireCordovaModule('q').defer();

    var platformRoot = path.join(ctx.opts.projectRoot, 'platforms/android');
    var androidManifest = path.join(platformRoot, 'AndroidManifest.xml');

    console.log("BlinkID after_prepare hook: ");
    fs.stat(androidManifest, function(err, stats) {
        if (err) {
             deferral.reject('Operation failed');
             console.log("Failed to append largeHeap to AndroidManifest.xml application node");
        } else {
            fs.readFile(androidManifest, 'utf8', function(err, data) {
                var lines = data.split('\n');
                var searchingFor = '<application android:hardwareAccelerated="true"';
                var newManifest = [];
                var largeHeap = 'android:largeHeap="true"';
                lines.forEach(function(line) {
                    if(line.trim().indexOf(searchingFor) != -1 && line.trim().indexOf(largeHeap) == -1) {
                        newManifest.push(line.replace(/\>$/, ' ') + largeHeap + ">");
                    } else {
                        newManifest.push(line);
                    }
                });

                fs.writeFileSync(androidManifest, newManifest.join('\n'));
                console.log("Append largeHeap to AndroidManifest.xml application node: success");
                deferral.resolve();
            });
        }
    });

    return deferral.promise;
};
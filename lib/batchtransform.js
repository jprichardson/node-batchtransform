var fs = require('fs-extra')
  , batch = require('batchflow')
  , path = require('path')
  , nargs = require('nargs');


function BatchTransform(files) {
    this.files = files
    this.transformCallback = null;
    this.errorCallback = function(err) { throw err; };
}

BatchTransform.prototype.transform = function(callback) {
    this.transformCallback = callback;
    return this;
};

BatchTransform.prototype.error = function(callback) {
    this.errorCallback = callback;
    return this;
}

BatchTransform.prototype.end = function(endCallback) {
    var self = this;
    batch(self.files).par().each(function(i, file, done) {
        function writeCallback(file, data) {
            var dir = path.dirname(file);

            function wf(){
                fs.writeFile(file, data, function(err) {
                    if (err) {
                        self.errorCallback(err);
                    }
                    done();
                });
            }

            fs.exists(dir, function(itDoes) {
                if (!itDoes) {
                    fs.mkdir(dir, wf);
                } else {
                    wf();
                }
            })
        }

        fs.exists(file, function(itDoes) {
            if (!itDoes) {
                self.errorCallback(new Error(file + " does not exist."))
                done();
            } else {
                fs.readFile(file, function(err, data) {
                    if (err) {
                        self.errorCallback(err);
                        done();
                    } else {
                        self.transformCallback(i, file, data, writeCallback);
                    }
                })
            }
        })
    }).end(function(results) {
        endCallback();
    });
};


module.exports = function() {
    var files = nargs(arguments);
    return new BatchTransform(files);
}

//PRIVATE METHODS


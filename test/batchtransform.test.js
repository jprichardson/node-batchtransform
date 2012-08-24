var testutil = require('testutil')
  , btf = require('../lib/batchtransform')
  , fs = require('fs-extra')
  , path = require('path')
  , batch = require('batchflow')
  , hogan = require('hogan.js')
  , marked = require('marked')
  , next = require('nextflow');

TEST_DIR = ''

beforeEach(function(done) {
    TEST_DIR = testutil.generateTestPath('test-batchtransform');
    fs.mkdir(TEST_DIR, done);
})

var md = "\n" + 
    "Cool Project\n" +
    "============\n" +
    "\n" +
    "Yo **{{name}}**\n" +
"";



suite('batchtransform')

test('transform scenario', function(done) {
    var files = [
        path.join(TEST_DIR, 't1.md'),
        path.join(TEST_DIR, 't2.md'),
        path.join(TEST_DIR, 't3.md')
    ];

    next({
        ERROR: function(err) {
            done(err);
        },
        createTestFiles: function() {
            var next = this.next;
            batch(files).par().each(function(i, file, done) {
                fs.writeFile(file, md, done);
            }).end(function(){
                next();
            });
        },
        transformTestFiles: function() {
            var next = this.next;
            btf(files).transform(function(i, file, data, write) {
                var bn = path.basename(file, '.md'); // /tmp/blah/t1.md => t1
                var template = hogan.compile(data.toString());
                var newMd = template.render({name: bn});
                var newFile = path.join(TEST_DIR, bn.substr(1), bn + '.html');
                var html = marked(newMd);

                write(newFile, html);
            })
            .error(function(err) {
                throw err;
            })
            .end(function() {
                next();
            });
        },
        checkResults: function() {
            var f1 = path.join(TEST_DIR, '1', 't1.html');
            var f2 = path.join(TEST_DIR, '2', 't2.html');
            var f3 = path.join(TEST_DIR, '3', 't3.html');
            
            T (fs.existsSync(f1))
            T (fs.existsSync(f2))
            T (fs.existsSync(f3))

            var d1 = fs.readFileSync(f1, 'utf8');
            var d2 = fs.readFileSync(f2, 'utf8');
            var d3 = fs.readFileSync(f3, 'utf8');

            T (d1.indexOf('<h1>Cool') >= 0)
            T (d1.indexOf('<strong>t1') >= 0)
            T (d2.indexOf('<h1>Cool') >= 0)
            T (d2.indexOf('<strong>t2') >= 0)
            T (d3.indexOf('<h1>Cool') >= 0)
            T (d3.indexOf('<strong>t3') >= 0)           

            done();
        }
    });
    

})


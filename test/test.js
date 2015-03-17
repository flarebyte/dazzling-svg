(function() {
    /*global describe, it */
    'use strict';
    var dazzlingSvg = require('../');
    //var util = require('util');
    var fs = require('fs');
    //var _ = require('lodash');
    var assert = require('chai').assert;
    var pretty = require('pretty-data').pd;

    var WRITE_EXPECTED = false;


    var UTF8 = {
        "encoding": "utf8"
    };

    var readFixtureSvg = function(name) {
        return fs.readFileSync("fixture/" + name + ".svg", UTF8);
    };

    var checkExpected = function(name, actual) {
        if (WRITE_EXPECTED) {
            fs.writeFileSync("expected/" + name, actual, UTF8);
        }
        var expected = fs.readFileSync("expected/" + name, UTF8);
        assert.equal(actual, expected);
        return expected;
    };

    var checkExpectedJson = function(name, actual) {
        var json = JSON.stringify(actual, null, 2);
        return checkExpected(name, json);
    };

    var checkExpectedSvg = function(name, actual) {
        var svg = pretty.xml(actual);
        return checkExpected(name, svg);
    };


    describe('dazzling-svg node module', function() {
        it('must parse a SVG file with layers and groups', function(done) {
            var cfg = {
                onError: done,
                onAggregating: function(data) {
                    checkExpectedJson("inkscape.layers.plain.json", data);
                    done();
                }
            };
            dazzlingSvg.processSvgAsync("fixture/inkscape.layers.plain.svg", cfg);
        });

        it('must parse a SVG file with an illustration', function(done) {
            var cfg = {
                onError: done,
                onAggregating: function(data) {
                    assert.equal(data.shapes.length, 276);
                    checkExpectedJson("centurion.json", data);
                    done();
                }
            };
            dazzlingSvg.processSvgAsync("fixture/centurion.svg", cfg);
        });

        it('must parse a SVG file with an illustration edited with Inkscape', function(done) {
            var cfg = {
                onError: done,
                onAggregating: function(data) {
                    checkExpectedJson("inkscape.centurion.json", data);
                    done();
                }
            };
            dazzlingSvg.processSvgAsync("fixture/inkscape.centurion.svg", cfg);
        });

        it('must parse a SVG file with layers edited with Inkscape', function(done) {
            var cfg = {
                onError: done,
                onAggregating: function(data) {
                    checkExpectedJson("inkscape.layers.json", data);
                    done();
                }
            };
            dazzlingSvg.processSvgAsync("fixture/inkscape.layers.svg", cfg);
        });

        it('must parse a SVG file with many shapes', function(done) {
            var cfg = {
                onError: done,
                onAggregating: function(data) {
                    checkExpectedJson("inkscape.many-shapes.plain.json", data);
                    done();
                }
            };
            dazzlingSvg.processSvgAsync("fixture/inkscape.many-shapes.plain.svg", cfg);
        });

        it('must parse a SVG file with many shapes edited with Inkscape', function(done) {
            var cfg = {
                onError: done,
                onAggregating: function(data) {
                    checkExpectedJson("inkscape.many-shapes.json", data);
                    done();
                }
            };
            dazzlingSvg.processSvgAsync("fixture/inkscape.many-shapes.svg", cfg);
        });

        it('must optimize svg content with layers', function(done) {
            var svgContent = readFixtureSvg("inkscape.layers.plain");

            dazzlingSvg.optimizeSvg(svgContent, function(err, optimized) {
                if (err) {
                    done(err);
                }
                checkExpectedSvg("inkscape.layers.plain.svg", optimized);
                done();
            });
        });
        it('must optimize svg content with layers using promise', function(done) {
            var svgContent = readFixtureSvg("inkscape.layers.plain");
            dazzlingSvg.optimizeSvgAsync(svgContent).then(function(data) {
                checkExpectedSvg("inkscape.layers.plain.async.svg", data);
            }).then(done);

        });
        it('must optimize svg content from inskcape with layers', function(done) {
            var svgContent = readFixtureSvg("inkscape.layers");

            dazzlingSvg.optimizeSvg(svgContent, function(err, optimized) {
                if (err) {
                    done(err);
                }
                checkExpectedSvg("inkscape.layers.svg", optimized);
                done();
            });
        });
        it('must optimize svg content with centurion', function(done) {
            var svgContent = readFixtureSvg("centurion");

            dazzlingSvg.optimizeSvg(svgContent, function(err, optimized) {
                if (err) {
                    done(err);
                }
                checkExpectedSvg("centurion.svg", optimized);
                done();
            });
        });
        it('must optimize svg content from inkscape with centurion', function(done) {
            var svgContent = readFixtureSvg("inkscape.centurion");

            dazzlingSvg.optimizeSvg(svgContent, function(err, optimized) {
                if (err) {
                    done(err);
                }
                checkExpectedSvg("inkscape.centurion.svg", optimized);
                done();
            });
        });


    });
}.call(this));
'use strict';
var _ = require('lodash');
//var S = require('string');
//var parseXml = require('xml2js').parseString;
var xml2js = require('xml2js');
var fs = require('fs');
var PromiseB = require("bluebird");
var util = require('util');
var SVGO = require('svgo');
var assert = require('chai').assert;
PromiseB.promisifyAll(fs);
PromiseB.promisifyAll(xml2js);

var optimizeSvg = function(content, callback) {
    var plugins = [{
            removeTitle: true
        }, {
            removeDesc: true
        }, {
            convertTransform: false
        }, {
            convertPathData: false
        }

    ];
    var svgo = new SVGO({
        plugins: plugins
    });
    svgo.optimize(content, function optimizing(cont) {
        callback(null, cont.data);
    });
};

var optimizeSvgAsync = PromiseB.promisify(optimizeSvg);

var isSimpleValue = function(value) {
    return _.isString(value) || _.isNumber(value) || _.isBoolean(value) || _.isNull(value);
};

var findAttributes = function(element) {
    if (_.isArray(element)) {
        if (_.size(element) < 1) {
            return null;
        } else {
            return element[0]["$"];
        }
    } else if (_.isPlainObject(element)) {
        return element["$"];
    } else {
        return null;
    }
};

var processRectangle = function(aggreg, element) {
    var attrs = findAttributes(element);
    attrs.Type = "rect";
    aggreg.__.onRectangle(aggreg, attrs);
};

var processPath = function(aggreg, element) {
    var attrs = findAttributes(element);
    attrs.Type = "path";
    aggreg.__.onPath(aggreg, attrs);
};

var traverse = function(aggreg, element) {
    if (_.isPlainObject(element)) {
        _.forIn(element, function(value, key) {
            if (isSimpleValue(value)) {
                //Skip
            } else {

                if (key === "$") {
                    //Skip
                } else if (key === "g") {
                    var attrs = findAttributes(value);
                    aggreg.__.onGroup(aggreg, attrs);
                    traverse(aggreg, value);
                } else if (key === "metadata") {
                    aggreg.__.onMetadata(aggreg, value);
                } else if (key === "defs") {
                    aggreg.__.onDefs(aggreg, value);
                } else if (key === "rect") {
                    if (_.isArray(value)) {
                        _.forEach(value, function(a) {
                            processRectangle(aggreg, a);
                        });
                    } else {
                        processRectangle(aggreg, value);
                    }

                } else if (key === "path") {
                    if (_.isArray(value)) {
                        _.forEach(value, function(a) {
                            processPath(aggreg, a);
                        });
                    } else {
                        processPath(aggreg, value);
                    }

                } else {
                    aggreg.__.onOther(aggreg, value);
                }
            }


        });
    } else if (_.isArray(element)) {
        _.forEach(element, function(a) {
            traverse(aggreg, a);
        });
    }
};

var onTraversing = function(data) {
    var svg = data['svg'];
    var config = data.__;
    var aggregation = {
        "shapes": [],
        "__": config
    };
    traverse(aggregation, svg);
    return aggregation;
};

var defaultConfig = {
    onError: function(e) {
        console.error("*** onError: " + e);
    },
    onAggregating: function(data) {
        console.log("*** onSuccess:" + util.inspect(data));
    },
    onFinally: function() {
        console.log("*** onFinally:");
    },
    onRectangle: function(aggreg, rectangle) {
        aggreg.shapes.push(rectangle);
    },
    onPath: function(aggreg, path) {
        aggreg.shapes.push(path);
    },
    onOther: function(aggreg, element) {
        return element;
    },
    onMetadata: function(aggreg, element) {
        return element;
    },
    onDefs: function(aggreg, element) {
        return element;
    },
    onGroup: function(aggreg, group) {
        return group;
    },
    onParseSvg: function(svg) {
        assert.isDefined(svg, "svg content must exists");
        return xml2js.parseStringAsync(svg);
    },
    onRead: function(filename) {
        var content = fs.readFileAsync(filename, {
            "encoding": "utf8"
        });
        return content;
    },
    onPostRead: function(svg) {
        assert.isTrue(_.isString(svg), "The svg content should be a string");
        assert.isTrue(svg.indexOf("<?xml") !== -1, "the content should have a svg element");
        return optimizeSvgAsync(svg);
    }

};

var processSvgAsync = function(filename, cfg) {
    var config = _.defaults(cfg, defaultConfig);
    var onConfigTraversing = function(data) {
        data["__"] = config;
        var result = onTraversing(data);
        delete result.__;
        return result;
    };
    return config.onRead(filename)
        .then(config.onPostRead)
        .then(config.onParseSvg)
        .then(onConfigTraversing)
        .then(config.onAggregating)
        .catch(config.onError)
        .done();
};

module.exports = {
    "processSvgAsync": processSvgAsync,
    "optimizeSvg": optimizeSvg,
    "optimizeSvgAsync": optimizeSvgAsync
};

require('pkginfo')(module,'name', 'version', 'description');

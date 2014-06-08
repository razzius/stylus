/*!
 * Stylus - SourceMap
 * Copyright(c) 2014 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Compiler = require('./compiler')
  , SourceMapGenerator = require('source-map').SourceMapGenerator
  , basename = require('path').basename
  , sep = require('path').sep
  , fs = require('fs');

/**
 * Initialize a new `SourceMap` generator with the given `root` Node
 * and the following `options`.
 *
 * @param {Node} root
 * @api public
 */

var SourceMap = module.exports = function SourceMap(root, options){
  options = options || {};
  this.column = 1;
  this.lineno = 1;
  this.inline = options.sourcemap.inline;
  this.contents = {};
  this.filename = options.filename;
  this.rootUrl = options.sourcemap.rootUrl;
  this.map = new SourceMapGenerator({
    file: basename(this.filename, '.styl') + '.css',
    sourceRoot: this.rootUrl || null
  });
  Compiler.call(this, root, options);
};

/**
 * Inherit from `Compiler.prototype`.
 */

SourceMap.prototype.__proto__ = Compiler.prototype;

/**
 * Generate and write source map.
 *
 * @return {String}
 * @api private
 */

var compile = Compiler.prototype.compile;
SourceMap.prototype.compile = function(){
  var css = compile.call(this)
    , url = this.normalizePath(this.filename) + '.map'
    , map;

  if (this.inline) {
    map = JSON.stringify(this.map.toJSON());
    url = 'data:application/json;base64,' + new Buffer(map).toString('base64');
  }
  return css + '/*# sourceMappingURL=' + url + ' */';
};

/**
 * Add mapping information.
 *
 * @param {String} str
 * @param {Node} node
 * @return {String}
 * @api private
 */

SourceMap.prototype.out = function(str, node){
  if (node && node.lineno) {
    var filename = this.normalizePath(node.filename);

    this.map.addMapping({
      original: {
        line: node.lineno,
        column: node.column - 1
      },
      generated: {
        line: this.lineno,
        column: Math.max(this.column - 1, 0)
      },
      source: filename
    });

    if (this.inline && !(filename in this.contents)) {
      this.map.setSourceContent(filename, fs.readFileSync(node.filename, 'utf-8'));
      this.contents[filename] = true;
    }
  }

  this.update(str);
  return str;
};

/**
 * Update current line and column numbers.
 *
 * @param {String} str
 * @api private
 */

SourceMap.prototype.update = function(str){
  var lines = str.match(/\n/g)
    , idx = str.lastIndexOf('\n');

  if (lines) this.lineno += lines.length;
  this.column = ~idx ? str.length - idx : this.column + str.length;
};

/**
 * Normalize path with `\`.
 *
 * @param {String}
 * @return {String}
 * @api private
 */

SourceMap.prototype.normalizePath = function(path){
  return '\\' == sep
    ? path.replace(/\\/g, '/')
    : path;
};

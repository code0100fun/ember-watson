'use strict';

var j          = require('jscodeshift');
var Inflected  = require('inflected');
var underscore = Inflected.underscore.bind(Inflected);
var dasherize  = Inflected.dasherize.bind(Inflected);
var emberData  = require('./helpers/ember-data');

function normalize(string) {
  return dasherize(underscore(string));
}

module.exports = function transformEmberDataModelLookups(source){

  var root = j(source.toString());

  root
    .find(j.CallExpression)
    .forEach(function(path) {
      var node = path.node;

      if (emberData.isRelationshipMacro(node)) {
        replaceArguments(path);
      }

      if (emberData.isStoreMethod(node)) {
        replaceArguments(path);
      }
    });


  function rebuildArguments(args) {
    var reargs        = args.slice();
    var modelNameNode = reargs[0];
    var modelName = normalize(extractName(modelNameNode));

    var newModelNameNode = j.literal(modelName);
    reargs[0] = newModelNameNode;

    return reargs;
  }

  function replaceArguments(path) {
    var node = path.node;

    var rebuilt = j.callExpression(node.callee, rebuildArguments(node.arguments));
    path.replace(rebuilt);
  }

  function extractName(node) {
    var modelName = '';

    if (j.Literal.check(node)) {
      modelName     = normalize(node.value);
    } else if (j.MemberExpression.check(node)) {
      modelName     = normalize(node.property.name);
    } else if (j.Identifier.check(node)) {
      modelName     = normalize(node.name);
    }

    return modelName;
  }

  return root.toSource({tabWidth: 2, quote: 'single'});
};

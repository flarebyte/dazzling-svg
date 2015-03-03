#!/usr/bin/env node
'use strict';
var meow = require('meow');
var dazzlingSvg = require('./');

var cli = meow({
  help: [
    'Usage',
    '  dazzling-svg <input>',
    '',
    'Example',
    '  dazzling-svg Unicorn'
  ].join('\n')
});

dazzlingSvg(cli.input[0]);

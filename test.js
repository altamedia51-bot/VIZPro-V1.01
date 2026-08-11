const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><canvas id="c" width="400" height="400"></canvas>`);
const canvas = dom.window.document.getElementById('c');
// jsdom doesn't support canvas drawing natively without the 'canvas' package.

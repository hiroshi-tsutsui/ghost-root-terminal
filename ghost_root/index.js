require('@babel/register');
const React = require('react');
const { render } = require('ink');
const Shell = require('./src/Shell').default;

render(React.createElement(Shell));

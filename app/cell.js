/* @flow */
const     _ = require('lodash');
const     $ = require('jquery');
const React = require('react');
var      cx = require('classnames');
const assert     = require('chai').assert;

const colors = ['#52BE80', '#BB8FCE', '#E59866', '#C0392B'];


const Cell = React.createClass({
    propTypes: {
        i    : React.PropTypes.number.isRequired,
        j    : React.PropTypes.number.isRequired,
        size : React.PropTypes.number.isRequired,
        value: React.PropTypes.number.isRequired
    }
    , shouldComponentUpdate(nextProps: any): boolean {
        return (   (this.props.i    !== nextProps.i)
                || (this.props.j    !== nextProps.j)
                || (this.props.size !== nextProps.size)        
                || (this.props.value!== nextProps.value));
    }
    , render: function() {
        assert.isTrue( _.isInteger(this.props.value) && (this.props.value>=0) && (this.props.value<4) );
        const cellStyle = {width: `${this.props.size}px`,
                           height: `${this.props.size}px`,
                           background: colors[this.props.value],
                           color: 'black',
                           display: 'inline-block'
                          };
        const cellInner = {
            width: '100%',
            height: '100%',            
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${this.props.size*0.8}px`
        };
        return (
            <div style={cellStyle}>
                <div style={cellInner}>                
                {this.props.value}
                </div>
            </div>
        );
    }


});

// $SuppressFlowFinding: this is just to showcase the functionality
const a : number = 'anything but';


export default Cell;


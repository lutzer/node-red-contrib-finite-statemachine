const { StateMachine } = require('./statemachine.js');
const { distinctUntilChanged, tap } = require('rxjs/operators');
const _ = require('lodash');

const FSM_NAME = 'finite-state-machine';

module.exports = function (RED) {
	function StateMachineNode (config) {
		RED.nodes.createNode(this, config);
		
		var node = this;
		var nodeContext = this.context();

		console.log(config)
		
		// create new state machine
		try {
			nodeContext.machine = new StateMachine(JSON.parse(config.fsmDefinition));
			setNodeStatus(nodeContext.machine.getState().status)
		} catch (err) {
			node.status({fill: 'red', shape: 'ring', text: 'no valid definitions'});
			return;
		}
		
		// react to all changes
		nodeContext.allChangeListener = nodeContext.machine.pipe( 
			config.sendStateWithoutChange ? tap() : distinctUntilChanged( ({state}) => _.isEqual(state)) ).subscribe(({state}) => {
			setNodeStatus(state.status)
			sendOutput({
				topic: 'state',
				payload: state
			}, null, null);
		});
		
		// send initial state after 100ms
		if (config.sendInitialState) {
			setTimeout( () => {
				nodeContext.machine.next(nodeContext.machine.getState());
			},100);
		}
		
		node.on('input', function (msg) {
			if (msg.topic === 'reset') {
				nodeContext.machine.reset();
			} else {
				var action = {
					type: msg.topic,
					data : _.isObject(msg.payload) ? msg.payload : {}
				}
				try {
					nodeContext.machine.triggerAction(action);
				} catch (err) {
					if (config.showTransitionErrors) {
						node.error({ code: err.code, msg: err.message}, msg);
					}
				}
			}
		});
		
		node.on('close', function () {
			nodeContext.stateChangeListener.unsubscribe();
		});
		
		function sendOutput(changed = null) {
			node.send([changed])
		}

		function setNodeStatus(state) {
			node.status({fill: 'green', shape: 'dot', text: 'state: ' + state});
		}
	}
	RED.nodes.registerType(FSM_NAME, StateMachineNode);
};

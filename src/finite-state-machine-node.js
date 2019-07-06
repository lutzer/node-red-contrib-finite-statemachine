const { StateMachine } = require('./statemachine.js');
const _ = require('lodash');
const { distinctUntilChanged } = require('rxjs/operators');

const FSM_NAME = 'finite-state-machine';

module.exports = function (RED) {
	function StateMachineNode (config) {
		RED.nodes.createNode(this, config);

		var node = this;
		var nodeContext = this.context();

		// init
		node.status({fill: 'red', shape: 'ring', text: 'no valid definitions'});

		// create new state machine
		try {
			nodeContext.machine = new StateMachine(JSON.parse(config.fsmDefinition));
		} catch (err) {
			node.error(err.message, { message: err.message } );
			return;
        }
        
        // react to all changes
        nodeContext.allChangeListener = nodeContext.machine.pipe( distinctUntilChanged() ).subscribe((state) => {
			node.status({fill: 'green', shape: 'dot', text: 'state: ' + state.status});
			sendOutput({
				topic: 'state',
				payload: state
			}, null, null);
        });

		// react to status changes
		nodeContext.stateChangeListener = nodeContext.machine.pipe(distinctUntilChanged( (prev, curr) => {
            return prev.status === curr.status;
        })).subscribe((state) => {
			sendOutput(null, {
				topic: 'state',
				payload: state
			}, null );
        });

        // react to data changes
        nodeContext.dataChangeListener = nodeContext.machine.pipe(distinctUntilChanged( (prev, curr) => {
            return _.isEqual(prev.data, curr.data);
        })).subscribe((state) => {
			sendOutput(null, null, {
				topic: 'state',
				payload: state
			});
		});
		
		// initialize node status
		nodeContext.machine.next(nodeContext.machine.getState());
       
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
						node.error( err.message, { message: err.message } );
					}
				}
            }
		});

		node.on('close', function () {
            nodeContext.stateChangeListener.unsubscribe();
			nodeContext.dataChangeListener.unsubscribe();
			nodeContext.allChangeListener.unsubscribe();
        });
        
        function sendOutput(changed = null, statusChanged = null, dataChanged = null) {
            node.send([changed, statusChanged, dataChanged])
        }
	}
	RED.nodes.registerType(FSM_NAME, StateMachineNode);
};

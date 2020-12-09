/* global describe it */

const _ = require('lodash');
const assert = require('assert');
const { StateMachine } = require('../src/statemachine.js');

const createTestMachine = () => {
	return new StateMachine({
		state: { status: 'STOPPED' },
		transitions: {
			'STOPPED': {
				'push': 'RUNNING',
				'hit': 'BROKEN'
			},
			'RUNNING': {
				'pull': 'STOPPED',
				'hit': 'BROKEN'
			},
			'BROKEN': {
				'fix': 'STOPPED'
			}
		}
	});
};

const createDataTestMachine = () => {
	return new StateMachine({
		state: { status: 'STOPPED', data : { val : 'init'} },
		transitions: {
			'STOPPED': {
				'push': { status: 'RUNNING' },
				'hit': { status :'BROKEN', data: { val: 'broken', reason: 'hit' } }
			},
			'RUNNING': {
				'pull': 'STOPPED',
				'hit': 'BROKEN'
			},
			'BROKEN': {
				'fix': { status: 'STOPPED', data : { val : undefined, reason: undefined } }
			}
		}
	});
}

describe('Statemachine Tests', function () {
	it('should be able to create a statemachine', () => {
		let fsm = new StateMachine({
			state: { status: 'TEST' },
			transitions: {}
		});
		assert(fsm);
	});

	it('should be able to create a statemachine and get the possible transitions', () => {
		let fsm = new StateMachine({
			state: { status: 'INITIAL'},
			transitions: {
				'INITIAL': {
					'push': 'RUNNING',
					'hit': 'BROKEN'
        }
			}
		});

		let transitions = fsm.getCurrentTransitions();
		assert(_.isEqual(_.keys(transitions), ['push', 'hit']));
	});

	it('should throw an error with the wrong transition table', () => {
		assert.throws( () => {
			new StateMachine({
				state: { status: 'INITIAL'},
				transitions: {
					'INITIAL': {
						'push': 2,
						'hit': 'BROKEN'
					}
				}
			});
		}, Error)

		assert.throws( () => {
			new StateMachine({
				state: { status: 'INITIAL'},
				transitions: {
					'INITIAL': {
						'push': { invalid : 0 },
						'hit': 'BROKEN'
					}
				}
			});
		}, Error)
	});

	it('should be able to transition to a new state', () => {
		let fsm = createTestMachine();

		fsm.triggerAction({ type: 'push' });

		let newState = fsm.getState();

		assert(_.isEqual(newState, {status: 'RUNNING', data: {} }));
	});

	it('should be able to transition to a new state and then reset', () => {
		let fsm = createTestMachine();

		fsm.triggerAction({ type: 'push' });

		assert.equal(fsm.getState().status, 'RUNNING');

		fsm.reset();

		assert.equal(fsm.getState().status, 'STOPPED');
	});

	it('should be able to add aditoninal data to state', () => {
		let fsm = createTestMachine();

		fsm.triggerAction({ type: 'push', data: { x: 5 } });

		let newState = fsm.getState();
		assert.equal(newState.data.x, 5);
    });
    
    it('should be able to add aditoninal data to state and then update it', () => {
		let fsm = createTestMachine();

        fsm.triggerAction({ type: 'push', data: { x: 1, y: 1 } });
        
        fsm.triggerAction({ type: 'pull', data: { x: 2, z: 2 } });

        let newState = fsm.getState();
		assert(  _.isEqual(newState.data, { x: 2, y: 1, z : 2}));
	});

	it('should throw an error if transition is not defined', () => {
		let fsm = createTestMachine();

		try {
			fsm.triggerAction({ type: 'test' });
			assert.fail();
		} catch (e) {
			assert.equal(e.code, 12);
		}
	});

	it('should throw an error if transition is not possible', () => {
		let fsm = createTestMachine();

		try {
			fsm.triggerAction({ type: 'pull' });
			assert.fail();
		} catch (e) {
			assert.equal(e.code, 12);
		}
	});

	it('should be able to subscribe to state change', (done) => {
		let fsm = createTestMachine();

		fsm.observable.subscribe( ({state}) => {
			assert.equal(state.status, "RUNNING");
			done();
		})

		fsm.triggerAction({ type: 'push' });
	})

	it('should set data as defined in the transition table', () => {
		let fsm = createDataTestMachine();

		fsm.triggerAction({ type: 'push' });
		assert.equal(fsm.getState().data.val, 'init');
		assert.equal(fsm.getState().status, 'RUNNING');

		fsm.triggerAction({ type: 'pull'})
		assert.equal(fsm.getState().status, 'STOPPED');

		fsm.triggerAction({ type: 'hit'})
		assert.equal(fsm.getState().data.val, 'broken');
		assert.equal(fsm.getState().data.reason, 'hit');
		assert.equal(fsm.getState().status, 'BROKEN');

		fsm.triggerAction({ type: 'fix'})
		assert.equal(fsm.getState().data.val, undefined);
		assert.equal(fsm.getState().data.reason, undefined);
		assert.equal(fsm.getState().status, 'STOPPED');

	});
	
	it('should merge action data with transition table data', () => {
		let fsm = createDataTestMachine();

		fsm.triggerAction({ type: 'push', data : { test : 'pushData' } });
		assert.equal(fsm.getState().data.val, 'init');
		assert.equal(fsm.getState().data.test, 'pushData');
		assert.equal(fsm.getState().status, 'RUNNING');

		fsm.triggerAction({ type: 'pull'})
		assert.equal(fsm.getState().status, 'STOPPED');

		fsm.triggerAction({ type: 'hit', data : { val : 'hitData' }})
		assert.equal(fsm.getState().data.val, 'hitData');
		assert.equal(fsm.getState().data.reason, 'hit');
		assert.equal(fsm.getState().status, 'BROKEN');

	});
	
	it('setState() should be able to set the state manualy', () => {
		let fsm = createDataTestMachine();

		fsm.setState({ status: 'RUNNING'})
		assert.equal(fsm.getState().status, 'RUNNING')
	});
	
	it('setState() should throw an error if set to a not existing state', () => {
		let fsm = createTestMachine();

		try {
			fsm.setState({ status: 'WALKING'})
			assert.fail();
		} catch (e) {
			assert.equal(e.code, 5);
		}
	});

	it('setState() should throw an error if there is no status property', () => {
		let fsm = createTestMachine();

		try {
			fsm.setState({ foo: 'WALKING'})
			assert.fail();
		} catch (e) {
			assert.equal(e.code, 4);
		}
	});
});

/* global describe it */

const _ = require('lodash');
const assert = require('assert');
const { StateMachine } = require('./../src/statemachine.js');

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
			assert.equal(e.code, 13);
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

		fsm.subscribe( (state) => {
			assert.equal(state.status, "RUNNING");
			done();
		})

		fsm.triggerAction({ type: 'push' });
	})
});

const _ = require('lodash');
const { fromJS } = require('immutable');
const { Subject } = require('rxjs');

class StatemachineError extends Error {
	constructor (msg, errorCode = '0') {
		super();

		// Custom debugging information
		this.message = msg;
		this.code = errorCode;
	}
}

class StateMachine extends Subject {
	constructor (options) {
		super();

		if (!_.isObject(options.state)) {
			throw new StatemachineError('No inital state specified.', 1);
		}

		if (!_.isObject(options.transitions)) {
			throw new StatemachineError('No transitions specified.', 2);
		}

		if (!_.isString(options.state.status)) {
			throw new StatemachineError('state must contain a status field of type string', 3);
		}

		this._initialState = _.extend({ data: {} }, options.state);
		this._transitions = options.transitions;

		// set initial state
		this._state = fromJS( this._initialState );

		// publish initial state
		this.next(this._state.toJS());
	}

	triggerAction (action) {
		if (!_.isString(action.type)) {
			throw new StatemachineError('action must contain a type.', 14);
		}

		let possibleActions = this.getCurrentTransitions();

		if (_.isEmpty(possibleActions)) {
			throw new StatemachineError('no possible transitions to go to a new state.', 11);
		}

		if (!_.has(possibleActions, action.type)) {
			if (_.includes(this.getAllTransitions(), action.type)) {
				throw new StatemachineError('transition ' + action.type + ' not possible in the current state.', 12);
			} else {
				throw new StatemachineError('transition ' + action.type + ' not definied in transition object.', 13);
			}
		}

		let newState = possibleActions[action.type];

        // check if there are additional data arguments supplied
        if (_.has(action, 'data')) {
            var data = _.isObject(action.data) ? action.data : {}
            // set new state
            this._state = this._state.set('status', newState).mergeDeep({ data: data });
        } else {
            this._state = this._state.set('status', newState);
        }
		
		// publish new state
		this.next(this._state.toJS());
	}

	getCurrentTransitions () {
		let possibleActions = _.get(this._transitions, this._state.get('status'));
		return possibleActions || {};
	}

	getAllTransitions () {
		let transitions = _.reduce(_.values(this._transitions), (result, value) => {
			result.push(..._.keys(value));
			return result;
		}, []);

		return _.uniq(transitions);
	}

	reset () {
		this._state = fromJS(this._initialState);
		this.next(this._state.toJS());
	}

	getState () {
		return this._state.toJS();
	}
};

exports.StateMachine = StateMachine;

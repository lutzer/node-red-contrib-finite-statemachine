const _ = require('lodash');
const { fromJS } = require('immutable');
const { Subject } = require('rxjs');
const { publish, share } = require("rxjs/operators");

class StatemachineError extends Error {
	constructor (msg, errorCode = '0') {
		super();

		// Custom debugging information
		this.message = msg;
		this.code = errorCode;
	}
}

function parseTransitionEntry(transition) {
	if (_.isString(transition))
		return { status : transition, data : {}}
	else if (_.isObject(transition))
		return { status : transition.status, data: transition.data || {} }
}

class StateMachine {

	subject = null

	constructor (options) {
		this.subject = new Subject()

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

		// validate transition table entries
		_.values(options.transitions).forEach( (stateTransitions) => {
			_.values(stateTransitions).forEach( (state) => {
				if (!_.isString(state) && !_.has(state, 'status'))
					throw new StatemachineError('Transition table has no status field: ' + JSON.stringify(state), 4);
			})
		})

		this._transitions = options.transitions;

		// set initial state
		this._state = fromJS( this._initialState );

		// publish initial state
		this.subject.next({ state: this._state.toJS() });
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
			throw new StatemachineError('transition not possible from the current state.', 12);
		}


		let transition = parseTransitionEntry(possibleActions[action.type])

		// check if there are additional data arguments supplied
		let data =	Object.assign({}, transition.data, _.isObject(action.data) ? action.data : {})
				
		// set new state
		this._state = this._state.set('status', transition.status).mergeDeep({ data: data });
		
		// publish new state
		this.subject.next({ state: this._state.toJS(), action: action });
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
		this.subject.next(this._state.toJS());
	}

	getState () {
		return this._state.toJS();
	}

	get observable () {
		return this.subject.pipe(share())
	}
};

exports.StateMachine = StateMachine;

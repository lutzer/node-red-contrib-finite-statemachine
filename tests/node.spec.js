const assert = require('assert');
const helper = require("node-red-node-test-helper");
const { fromEvent } = require('rxjs');
const { promisify } = require("util");

helper.init(require.resolve('node-red'));

const load = function(helper, node, flow) {
  return new Promise( (resolve, reject) => {
    helper.load(node, flow, (err) => {
      if (err) { 
        reject(err) 
        return 
      }
      resolve()
    })
  })
}

const listen = function(node, event) {
  return new Promise( (resolve) => {
    node.on(event, (msg) => {
      resolve(msg)
    })
  })
}

const timeout = function(timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout)
  })
}

describe('Node Tests', function () {

  beforeEach(function (done) {
      helper.startServer(done);
  })

  afterEach(function (done) {
      helper.unload();
      helper.stopServer(done);
  })

  const StateMachineNode = require('./../src/finite-state-machine-node');

  const definitions = {
    state: { status: 'STOPPED' },
    transitions: {
      'STOPPED': {
        'push': 'RUNNING',
        'hit': 'BROKEN'
      },
      'RUNNING': {
        'pull': 'STOPPED',
        'hit': 'BROKEN',
        'restart' : 'RUNNING'
      },
      'BROKEN': {
        'fix': 'STOPPED'
      }
    }
  }

  it('should create statemachine node', async function() {
    var flow = [
        { id: 'statemachine', type: 'finite-state-machine', name: "test" }
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode("statemachine");
    n.should.have.property('name', 'test');
  });
  
  it('should display green status on statemachine node', async function() {

    var flow = [
        { 
          id: 'statemachine', 
          type: 'finite-state-machine', 
          fsmDefinition: JSON.stringify(definitions),
          sendInitialState:false, 
          sendStateWithoutChange:false,
          showTransitionErrors:true
        }
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var status = n.status.args[0][0]
    assert(status.fill == 'green')
  }); 

  it('should display red status on wrong fsm', async function() {

    var flow = [
        { 
          id: 'statemachine', 
          type: 'finite-state-machine', 
          fsmDefinition: '',
          sendInitialState:false, 
          sendStateWithoutChange:false,
          showTransitionErrors:true
        }
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var status = n.status.args[0][0]
    assert(status.fill == 'red')
  }); 

  it('should trigger transition', async function() {

    var flow = [
        { 
          id: 'statemachine', 
          type: 'finite-state-machine', 
          fsmDefinition: JSON.stringify(definitions),
          sendInitialState:false, 
          sendStateWithoutChange:false,
          showTransitionErrors:true,
          wires: [['out']]
        },
        { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    n.receive({ topic: 'push'})

    let msg = await listen(out,'input')
    assert(msg.payload.status == 'RUNNING')
  });

  it('should reset to inital state on control:reset', async function() {

    var flow = [
        { 
          id: 'statemachine', 
          type: 'finite-state-machine', 
          fsmDefinition: JSON.stringify(definitions),
          sendInitialState:false, 
          sendStateWithoutChange:false,
          showTransitionErrors:true,
          wires: [['out']]
        },
        { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    n.receive({ topic: 'push'})
    let msg = await listen(out,'input')
    assert(msg.payload.status == 'RUNNING')

    n.receive({ control: 'reset'})
    msg = await listen(out,'input')
    assert(msg.payload.status == 'STOPPED')
  });
  
  it('msg should change data object of statemachine', async function() {

    var flow = [
        { 
          id: 'statemachine', 
          type: 'finite-state-machine', 
          fsmDefinition: JSON.stringify(definitions),
          sendInitialState:false, 
          sendStateWithoutChange:false,
          showTransitionErrors:true,
          wires: [['out']]
        },
        { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    n.receive({ topic: 'push', payload: { x: 5} })

    let msg = await listen(out,'input')
    assert(msg.payload.data.x == 5)
  });

  it('should not output when state is unchanged and sendStateWithoutChange:false', async function() {

    var flow = [
        { 
          id: 'statemachine', 
          type: 'finite-state-machine', 
          fsmDefinition: JSON.stringify(definitions),
          sendInitialState:false, 
          sendStateWithoutChange:false,
          showTransitionErrors:true,
          wires: [['out']]
        },
        { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    n.receive({ topic: 'push' })
    let msg = await listen(out,'input')
    assert(msg.payload.status == 'RUNNING')

    n.receive({ topic: 'restart' })
    msg = await Promise.race([listen(out,'input'), timeout(200)])
    assert(msg === undefined)
  });

  it('should send output when state is unchanged and sendStateWithoutChange:true', async function() {

    var flow = [
        { 
          id: 'statemachine', 
          type: 'finite-state-machine', 
          fsmDefinition: JSON.stringify(definitions),
          sendInitialState:false, 
          sendStateWithoutChange:true,
          showTransitionErrors:true,
          wires: [['out']]
        },
        { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    n.receive({ topic: 'push' })
    let msg = await listen(out,'input')
    assert(msg.payload.status == 'RUNNING')

    n.receive({ topic: 'restart' })
    msg = await Promise.race([listen(out,'input'), timeout(200)])
    assert(msg.payload.status == 'RUNNING')
  });

  it('should send initial state when sendInitialState:true', async function() {

    var flow = [
        { 
          id: 'statemachine', 
          type: 'finite-state-machine', 
          fsmDefinition: JSON.stringify(definitions),
          sendInitialState:true, 
          sendStateWithoutChange:true,
          showTransitionErrors:true,
          wires: [['out']]
        },
        { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    let msg = await listen(out,'input')
    assert(msg.payload.status == 'STOPPED')
  });

  it('should not send initial state when sendInitialState:false', async function() {

    var flow = [
        { 
          id: 'statemachine', 
          type: 'finite-state-machine', 
          fsmDefinition: JSON.stringify(definitions),
          sendInitialState:false, 
          sendStateWithoutChange:true,
          showTransitionErrors:true,
          wires: [['out']]
        },
        { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    msg = await Promise.race([listen(out,'input'), timeout(200)])
    assert(msg === undefined)
  });

  it('should be able to sync the state on control:sync', async function() {

    var flow = [
      { 
        id: 'statemachine', 
        type: 'finite-state-machine', 
        fsmDefinition: JSON.stringify(definitions),
        sendInitialState:false, 
        sendStateWithoutChange:false,
        showTransitionErrors:true,
        wires: [['out']]
      },
      { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    n.receive({ control: 'sync', payload: { status: 'RUNNING'} })

    let msg = await listen(out,'input')
    assert(msg.payload.status == 'RUNNING')
  });

  it('should be able to query the state on control:query', async function() {

    var flow = [
      { 
        id: 'statemachine', 
        type: 'finite-state-machine', 
        fsmDefinition: JSON.stringify(definitions),
        sendInitialState:false, 
        sendStateWithoutChange:false,
        showTransitionErrors:true,
        wires: [['out']]
      },
      { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    n.receive({ control: 'query' })

    let msg = await listen(out,'input')
    assert(msg.payload.status == "STOPPED" )
  });

  it('should pass original message through when triggering a transition', async function() {

    var flow = [
      { 
        id: 'statemachine', 
        type: 'finite-state-machine', 
        fsmDefinition: JSON.stringify(definitions),
        sendInitialState:false, 
        sendStateWithoutChange:false,
        showTransitionErrors:true,
        wires: [['out']]
      },
      { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    const randVal = Math.random()
    n.receive({ topic: 'push', someValue: randVal })

    let msg = await listen(out,'input')

    assert(msg.payload.status == "RUNNING")
    assert(msg.trigger.someValue == randVal)
  });

  it('should accept wrong transition and dont do anything', async function() {

    var flow = [
      { 
        id: 'statemachine', 
        type: 'finite-state-machine', 
        fsmDefinition: JSON.stringify(definitions),
        sendInitialState:false, 
        sendStateWithoutChange:false,
        showTransitionErrors:true,
        wires: [['out']]
      },
      { id: 'out', type: 'helper'}
    ];

    await load(helper, StateMachineNode, flow)
    var n = helper.getNode('statemachine');
    var out = helper.getNode('out');

    const randVal = Math.random()
    n.receive({ topic: 'invalidtransition'})

    msg = await Promise.race([listen(out,'input'), timeout(200)])
    assert(msg === undefined)
  });

})
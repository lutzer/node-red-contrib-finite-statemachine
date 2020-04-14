<style>
div.shell pre code {
    background: none;
    color: #ccc;
}
code.node {
    border-radius: 6px;
    border: 1px solid #B68181;
    background: #fff0f0;
    color: #555;
    white-space:nowrap;
}
</style>

# xxx ToDos:
- Flows einfügen
- Pull Request

'------------< schnipp >-------------------'



# Node Red State Machine

A finite state machine implementation for node red. Displays also a graphical representation of the state machine.

![node-settings](images/node-settings.png)

## Install in Node Red

### In Node-red

* Via Manage Palette -> Search for "node-red-contrib-finite-statemachine"

### In Terminal

* go in node-red install folder, in os x its usually: `~/.node-red`
* run `npm install node-red-contrib-finite-statemachine`

## Usage

### Input object elements
The inputs of the <code class="node">finite state machine</code> is defined by a json object:

- *state* holds the initial state. It shall contain a *status* field and may contain a *data* object.
- *transitions* holds the possible states as keys (shown as upper case strings). As values it contains one or more key/value pairs, consisting of the transition string (lower case strings) and the resulting state.
- sending a msg to the node containing a `msg.topic` set to a transition string will trigger a state change.
- `msg.topic`= *reset* is a reserved transition to reset the machine to its initial state, so *reset* shall not be used in the transition table.

### Output object elements

The <code class="node">finite state machine</code> contains the following outputs:
- *changed*: Outputs the new state when there is any valid transition. 
This may be a transition to a different state or also a transition to the actual state (see example "Simple state machine with data object").
- *statusChanged*: Outputs the new state only when the state machine transitioned to a different state.
- *dataChanged*: Outputs the new state only when the data object is changed.


### Basic structure

```json
{
  "state": {
    "status": "IDLE",
    "data" : { "x": 5 }
  },
  "transitions": {
    "IDLE": {
      "run": "RUNNING"
    },
    "RUNNING": {
      "stop": "IDLE",
      "set": "RUNNING"
    }
  }
}
```

### Handling of the *"data"* object
- The data object in the "state" object is set to the defined value at the first start of the flow (initialization). 
- The contents of the *data* object may be changed or extended by sending a `msg` with a valid transition (within `msg.topic`) containing a JSON object as payload. 

**Note:** Sending a `msg` without a valid transition cannot change the *data* object (see example below).


### Further information
Check node-reds info panel to see more information on how to use the state machine.


## Example flows

### Minimal state machine

This example shows a state machine with two states without any *data*-object. 

There is only one `msg.topic` ("toggleState") which toggles between the two states IDLE and RUNNING.


```json
{
   "state": {
     "status": "IDLE"
   },
   "transitions": {
     "IDLE": {
       "toggleState": "RUNNING"
     },
     "RUNNING": {
       "toggleState": "IDLE"
     }
  }
}
```

![flow-simple](images/flow-simple.png)

```json
[{"id":"606ff60d.502dd","type":"tab","label":"Flow 4","disabled":false,"info":""},{"id":"a68cfab2.bbc9d8","type":"finite-state-machine","z":"606ff60d.502dd","name":"","fsmDefinition":"{\"state\":{\"status\":\"IDLE\"},\"transitions\":{\"IDLE\":{\"toggleState\":\"RUNNING\"},\"RUNNING\":{\"toggleState\":\"IDLE\"}}}","sendInitialState":false,"showTransitionErrors":true,"x":580,"y":360,"wires":[["debb4bee.65426"],[],[]]},{"id":"debb4bee.65426","type":"debug","z":"606ff60d.502dd","name":"any change","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":810,"y":340,"wires":[]},{"id":"1b3e4469.9e18bc","type":"inject","z":"606ff60d.502dd","name":"","topic":"toggleState","payload":"","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":290,"y":360,"wires":[["a68cfab2.bbc9d8"]]},{"id":"e6111ee1.cf3e6","type":"comment","z":"606ff60d.502dd","name":"sending topic \"toggleState\" toggles between the two states","info":"","x":410,"y":280,"wires":[]}]
```



### Simple state machine with data object

Set finite state machine definiton to:

```json
{
  "state": {
    "status": "IDLE",
    "data" : { "x": 5 }
  },
  "transitions": {
    "IDLE": {
      "run": "RUNNING"
    },
    "RUNNING": {
      "stop": "IDLE",
      "set": "RUNNING"
    }
  }
}
```
#### State description
This example gives a state machine with two states (IDLE, RUNNING) and three transitions. Two of them (*run*, *stop*) change between the two states, the third (*set*) is used only to change the *data* object contents in the state RUNNING.

#### Output behaviour
The difference between the outputs *"any change"* and *"status changed"* can be seen in *state* "RUNNING": In case of a msg with`msg.topic`= "set" the output *"any change"* is activated, output *"status changed"* is not activated.
The output *"data changed"* can only be activated in state "RUNNING" via the lower two injects: These are able to change the value of the "data" variables and therefore can activate the outputs *"any change"* and *"data changed"* (but not output *"status changed"*).

![flow](images/flow.png)

```json
[{"id":...}]
```



### State machine with feedback flow

Set finite state machine definiton to:

```json
{
  "state": {
    "status": "IDLE"
  },
  "transitions": {
    "IDLE": {
      "run": "RUNNING"
    },
    "RUNNING": {
      "stop": "IDLE"
    }
  }
}
```

This example gives a self-stopping behaviour after a defined amount of time: Transition *run* triggers the state machine to *state* RUNNING, the feedback loop activates the transition *stop* after a delay of 5 seconds so that the state machine changes back to *state* IDLE.

![](images/flow-feedback.png)

```json
[{"id":...}]
```



### Changing the "data" object

The *data* object can only be changed or extended during a valid transition. I.e. the JSON object contents sent in a `msg` containing no valid transtion within the `msg.topic` does not lead to any *data* object changes.

Therefore see example "State machine with feedback flow" above: To be able to change the *data* object in the *state* RUNNING, the transition *run* is defined: This transition does not change the *state* but may change the *data* object within *state* RUNNING. The two lower injections can change the *data* object only in the *state* RUNNING. 
In the example the JSON message of the upper set injection contains:

![change-data-object](images/change-data-object.png)

As can seen this changes the present "data" object element "x" to a numerical value of '2' and adds an additional "data" object element "name" with the string "peter".


## Development

* run `npm install`
* install grunt `npm install -g grunt-cli`
* build with `npm run build`

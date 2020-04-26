 xxx ToDos v1
- Schritt 1: Doku Inputs und Outputs zuerst machen
- Beispiele: Zuerst in Node-RED, dann hier die Doku der Beispiele
-- Beispiel mit rbe-Nodes in eigenem Abschnitt anstatt section "Output behaviour"
- Alle Screenshots neu machen (wg. 1 Ausgang) und alte Images löschen
- Alle Exports neu machen

Inhaltsverzeichnis final prüfen 


xxx suchen



# Node Red State Machine
A finite state machine (FSM) implementation for node red. Displays also a graphical representation of the state machine.
![node-appearance](images/node-appearance.png)
Fig. 1: Node appearance

### Table of contents
1. [Installation](#installation)
	1.1 [In Node-RED](#installation_in_node-red)
	1.2 [In a shell](#installation_in_a_shell)
2. [Usage](#usage)
    2.1 [Node configuration](#node_conifguration)
    2.1.1 [Basic FSM structure](#basic_fsm_structure)
    2.1.2 [Optional *data* object](#optional_data_object)
    2.2 [Input](#input)
    2.3 [Output](#output)
    2.4 [Handling of the *data* object](#handling_of_the_data_object)
    2.5 [Further information](#further_information)
3. [Example flows](#example_flows)
	3.1 [Minimal state machine](#minimal_state_machine)
	3.2 [Simple state machine with data object](#simple_state_machine_with_data_object)
	3.3 [State machine with feedback](#state_machine_with_feedback)
	3.4 [Changing the *data* object](#changing_the_data_object)
4. [Development](#development)
5. [Hints for upgrading from earlier versions](#hints_for_upgrading)




<a name="installation"></a>
## Installation

<a name="installation_in_node-red"></a>
### In Node-RED

* Via Manage Palette -> Search for "node-red-contrib-finite-statemachine"

<a name="installation_in_a_shell"></a>
### In a shell

* go to the Node-RED installation folder, in OS X it's usually: `~/.node-red`
* run `npm install node-red-contrib-finite-statemachine`


<a name="usage"></a>
## Usage

<a name="node_conifguration"></a>
### Node Configuration
![node-settings](images/node-settings.png)
Fig. 2: Node properties


<a name="basic_fsm_structure"></a>
#### Basic FSM structure
The statemachine of `finite state machine` is defined by a JSON object within the line *FSM* (Finite State Machine):

- *state* holds the initial state. It shall contain a *status* field.
- *transitions* holds the possible states as keys (shown as upper case strings). As values it contains one or more key/value pairs, consisting of the transition string (lower case strings) and the resulting state.
- additional *data* fields are optional.

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
            "stop": "IDLE",
            "set": "RUNNING"
        }
    }
}
``` 
Fig. 3: Basic FSM structure definition (only with transitions)


<a name="optional_data_object"></a>
#### Optional *data* object
The optional *data* object may be used in the (initial) "state" definition as well as in every transition definition. Whenever a valid transition occurs the *data* portion of its transition definition is handled.
In addition, transitions with and without *data* definitions may be mixed arbitrarily.

Fig. 4 shows *data* definition portions within the *state* object and in transitions.

```json
"state": {
    "status": "IDLE",
    "data": {
        "x": 99
    }
}
```

```json
"transitions": {
    "RUNNING": {
        "stop": {
            "status": "IDLE",
            "data": {
                "x": 0
            }
        },
        "set": "RUNNING"
    }
}
```
Fig. 4: *data* object portions



<a name="input"></a>
### Input

The input topics of the  `finite state machine`  are defined by the transition table setup in the [node configuration](#node_conifguration).

- sending a `msg` to the node containing a `msg.topic` set to a defined transition string triggers a state change.
- `msg.topic`= *reset* is a reserved transition to reset the machine to its initial state (*"state"*), therefore *reset* shall not be used as a transition name in the transition table.


<a name="output"></a>
### Output

The output of `finite state machine` sends a  `msg` whenever there is a valid transition. 
Remark: This also may be a valid transition without any state change.

The output contains:
- *status*: Outputs the state of the FSM.
- *data*: Outputs the *data* object of the FSM.


<a name="handling_of_the_data_object"></a>
### Handling of the *"data"* object
- The *data* object within the "state" definition initializes the *data* object at the first start of the flow.
- The contents of the *data* object within the "transitions" definition sets the *data* object at the according transition.
- The contents of the *data* object may also be changed or extended by sending a `msg` with a valid transition (within `msg.topic`) containing a JSON object as payload with a *data* definition.

**Note:** Sending a `msg` without a valid transition cannot change the *data* object (see example below).


<a name="further_information"></a>
### Further information
Check Node-REDs info panel to see more information on how to use the state machine.


<a name="example_flows"></a>
## Example flows

<a name="minimal_state_machine"></a>
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
Fig. 5: Minimal state machine JSON object


![flow-simple](images/flow-minimal.png)
Fig. 6: Minimal state machine


```json
[{"id":"70d24837.fa7bb8","type":"finite-state-machine","z":"9b6215d1.9ceba8","name":"","fsmDefinition":"{\"state\":{\"status\":\"IDLE\"},\"transitions\":{\"IDLE\":{\"toggleState\":\"RUNNING\"},\"RUNNING\":{\"toggleState\":\"IDLE\"}}}","sendInitialState":false,"showTransitionErrors":true,"x":480,"y":240,"wires":[["236d8d.5ef6da74"]]},{"id":"236d8d.5ef6da74","type":"debug","z":"9b6215d1.9ceba8","name":"","active":true,"tosidebar":false,"console":false,"tostatus":true,"complete":"payload","targetType":"msg","x":720,"y":240,"wires":[]},{"id":"701f2b41.e4ecb4","type":"inject","z":"9b6215d1.9ceba8","name":"","topic":"toggleState","payload":"","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":250,"y":240,"wires":[["70d24837.fa7bb8"]]},{"id":"a75e8c2f.0b2378","type":"comment","z":"9b6215d1.9ceba8","name":"sending topic \"toggleState\" toggles between the two states","info":"","x":420,"y":180,"wires":[]}]
```
Fig. 7: Minimal state machine flow


<a name="simple_state_machine_with_data_object"></a>
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
Fig. xxx: Simple state machine JSON object

#### State description
This example gives a state machine with two states (IDLE, RUNNING) and three transitions. Two of them (*run*, *stop*) change between the two states, the third (*set*) is used only to change the *data* object contents in the state RUNNING.

#### Output behaviour
The difference between the outputs *"any change"* and *"status changed"* can be seen in *state* "RUNNING": In case of a `msg` with`msg.topic`= "set" the output *"any change"* sends a `msg`, output *"status changed"* does not send a `msg`.
The output *"data changed"* can only send a `msg` in the state "RUNNING" via the lower two inject nodes: They are able to change the value of the "data" variables and therefore output a `msg` to the outputs *"any change"* and *"data changed"* (but not at output *"status changed"*).

![flow](images/flow.png)
Fig. xxx: Simple state machine


```json
[{"id":"378a3460.e755fc","type":"tab","label":"Simple state machine with data object","disabled":false,"info":""},{"id":"67adcdd8.8b41d4","type":"finite-state-machine","z":"378a3460.e755fc","name":"","fsmDefinition":"{\"state\":{\"status\":\"IDLE\",\"data\":{\"x\":5}},\"transitions\":{\"IDLE\":{\"run\":\"RUNNING\"},\"RUNNING\":{\"stop\":\"IDLE\",\"set\":\"RUNNING\"}}}","sendInitialState":false,"showTransitionErrors":true,"x":600,"y":260,"wires":[["1a35a82.2e59ad8"],["324d3672.55ac32"],["b85f26d6.b8f418"]]},{"id":"1a35a82.2e59ad8","type":"debug","z":"378a3460.e755fc","name":"any change","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":830,"y":220,"wires":[]},{"id":"c882ea0f.8236e","type":"inject","z":"378a3460.e755fc","name":"","topic":"reset","payload":"","payloadType":"str","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":210,"y":120,"wires":[["67adcdd8.8b41d4"]]},{"id":"4117af3.0c6505","type":"comment","z":"378a3460.e755fc","name":"sending topic \"reset\" will set the state machine to its initial state","info":"","x":380,"y":80,"wires":[]},{"id":"324d3672.55ac32","type":"debug","z":"378a3460.e755fc","name":"status change","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":840,"y":260,"wires":[]},{"id":"b85f26d6.b8f418","type":"debug","z":"378a3460.e755fc","name":"\"data\" change","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":840,"y":300,"wires":[]},{"id":"976ee3eb.97e4f","type":"inject","z":"378a3460.e755fc","name":"","topic":"run","payload":"","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":210,"y":240,"wires":[["67adcdd8.8b41d4"]]},{"id":"7ae46f5b.127bc8","type":"inject","z":"378a3460.e755fc","name":"","topic":"set","payload":"{\"x\" : 2, \"name\" : \"peter\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":280,"y":400,"wires":[["67adcdd8.8b41d4"]]},{"id":"4fa32a8f.24719c","type":"inject","z":"378a3460.e755fc","name":"","topic":"set","payload":"{\"y\" : 3}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":440,"wires":[["67adcdd8.8b41d4"]]},{"id":"1622d35c.3a4f1d","type":"comment","z":"378a3460.e755fc","name":"any other topic will trigger a transition","info":"","x":290,"y":200,"wires":[]},{"id":"1196d485.ba7693","type":"inject","z":"378a3460.e755fc","name":"","topic":"stop","payload":"","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":210,"y":280,"wires":[["67adcdd8.8b41d4"]]},{"id":"1e02858b.9b841a","type":"comment","z":"378a3460.e755fc","name":"by sending a JSON object as payload you can add data to the state","info":"","x":380,"y":360,"wires":[]}]
```
Fig. xxx: Simple state machine flow


<a name="state_machine_with_feedback"></a>
### State machine with feedback

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
Fig. xxx: State machine with feedback JSON object

This example gives a self-stopping behaviour after a defined amount of time: Transition *run* triggers the state machine to *state* RUNNING, the feedback loop activates the transition *stop* after a delay of 5 seconds so that the state machine changes back to *state* IDLE.

![](images/flow-feedback.png)
Fig. xxx: State machine with feedback


```json
[{"id":"e7cbb08b.ea53","type":"tab","label":"State machine with feedback flow","disabled":false,"info":""},{"id":"b4a9f9f7.51a2a8","type":"finite-state-machine","z":"e7cbb08b.ea53","name":"","fsmDefinition":"{\"state\":{\"status\":\"IDLE\",\"data\":{\"x\":5}},\"transitions\":{\"IDLE\":{\"run\":\"RUNNING\"},\"RUNNING\":{\"stop\":\"IDLE\",\"set\":\"RUNNING\"}}}","sendInitialState":false,"showTransitionErrors":true,"x":480,"y":160,"wires":[["d6bb83dc.a1bad8"],[],[]]},{"id":"8c71a3b6.8311d","type":"inject","z":"e7cbb08b.ea53","name":"","topic":"run","payload":"","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":270,"y":160,"wires":[["b4a9f9f7.51a2a8"]]},{"id":"d6bb83dc.a1bad8","type":"switch","z":"e7cbb08b.ea53","name":"onRUNNING","property":"payload.status","propertyType":"msg","rules":[{"t":"eq","v":"RUNNING","vt":"str"}],"checkall":"true","repair":false,"outputs":1,"x":690,"y":140,"wires":[["d3e923f3.8d2478"]]},{"id":"d3e923f3.8d2478","type":"delay","z":"e7cbb08b.ea53","name":"delay 5s","pauseType":"delay","timeout":"5","timeoutUnits":"seconds","rate":"1","nbRateUnits":"1","rateUnits":"second","randomFirst":"1","randomLast":"5","randomUnits":"seconds","drop":false,"x":760,"y":300,"wires":[["d1f104bf.095cf8"]]},{"id":"d1f104bf.095cf8","type":"change","z":"e7cbb08b.ea53","name":"set msg.topic to stop","rules":[{"t":"set","p":"topic","pt":"msg","to":"stop","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":220,"y":200,"wires":[["b4a9f9f7.51a2a8"]]},{"id":"d90fb97c.0299d8","type":"comment","z":"e7cbb08b.ea53","name":"sending topic \"run\" will trigger the machine which is stopped 5 seconds later","info":"","x":390,"y":100,"wires":[]}]
```
Fig. xxx: State machine with feedback flow



<a name="changing_the_data_object"></a>
### Changing the "data" object

# xxx möglicherweise hier gar nicht mehr notwenig

The *data* object can only be changed or extended during a valid transition. I.e. the JSON object contents sent in a `msg` containing no valid transition within the `msg.topic` does not lead to any *data* object changes.

Therefore see example "State machine with feedback flow" above: To be able to change the *data* object in the *state* RUNNING, the transition *run* is defined: This transition does not change the *state* but may change the *data* object within *state* RUNNING like the two lower injections do.
In the example the definition of the upper set injection is like follows:

![change-data-object](images/change-data-object.png)

As can seen this changes the present "data" object element "x" to a numerical value of '2' and adds an additional "data" object element "name" with the string "peter".



<a name="development"></a>
## Development

* run `npm install`
* install grunt `npm install -g grunt-cli`
* build with `npm run build`



<a name="hints_for_upgrading"></a>
## Hints for upgrading from node versions 0.2.11 and earlier to version 1.x.x
Kleines Beispiel mit rbe-Node zum Herausfiltern und als Hinweis für die Umsteiger von 0.2.11 auf 1.x.x, um mit den bisherigen Ausgängen kompatibel zu bleiben


Fig. xxx: State machine with rbe evaluation

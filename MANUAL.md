
# Node Red State Machine Manual

### Table of contents
1. [Installation](#installation)  
	1.1 [In Node-RED](#installation_in_node-red)  
	1.2 [In a shell](#installation_in_a_shell)  
2. [Usage](#usage)  
    2.1 [Node configuration](#node_conifguration)  
    2.2 [Input](#input)  
    2.3 [Output](#output)  
    2.4 [Handling of the data object](#handling_of_the_data_object)  
    2.5 [Further information](#further_information)  
3. [Example flows](#example_flows)  
	3.1 [Minimal state machine](#minimal_state_machine)  
	3.2 [Simple state machine with data object](#simple_state_machine_with_data_object)  
	3.3 [State machine with feedback](#state_machine_with_feedback)  
	3.4 [Changing the data object](#changing_the_data_object)  
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
**Fig. 1:** Node properties


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
**Fig. 2:** Basic FSM structure definition (only with transitions)


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
**Fig. 3:** *data* object portions



<a name="input"></a>
### Input

The input topics of the  `finite state machine`  are defined by the transition table setup in the [node configuration](#node_conifguration).

- sending a `msg` to the node containing a `msg.topic` set to a defined transition string triggers a state change.
- `msg.control`= *reset* sets the machine to its initial state (*"state"*)
- `msg.control`= *sync* is used to set the state manually. Its payload needs to be a JSON object, containing a *status* field
- `msg.control`= *query* triggers a state query event and the current state is sent to the output of the state machine. The option *Always send state change* needs to be enabled for this.

<a name="output"></a>

### Output

The output of `finite state machine` sends a  `msg` whenever there is a valid transition.
Remark: This also may be a valid transition without any state change.

The output contains:
- *payload.status*: Outputs the state of the FSM.
- *payload.data*: Outputs the *data* object of the FSM.
- *payload.trigger*: Contains the original message that triggerd the state change.




<a name="handling_of_the_data_object"></a>
### Handling of the *"data"* object
- The *data* object within the "state" definition initializes the *data* object at the first start of the flow.
- The contents of the *data* object within the "transitions" definition sets the *data* object at the according transition.
- The contents of the *data* object may also be changed or extended by sending a `msg` with a valid transition (within `msg.topic`) containing the field *data* with a JSON object.

**Note:** Sending a `msg` without a valid transition cannot change the *data* object (see example below).


<a name="further_information"></a>
### Further information
Check Node-REDs info panel to see more information on how to use the state machine.


<a name="example_flows"></a>
## Example flows
***
**Remark**: Example flows are present in the examples subdirectory. In Node-RED they can be imported via the import function and then selecting *Examples* in the vertical tab menue.
***

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
**Fig. 4:** Minimal state machine JSON object


![flow-minimal](images/flow-minimal.png)  
[**MinimalStateMachineFlow.json**](examples/MinimalStateMachineFlow.json)  

**Fig. 5:** Minimal state machine


<a name="simple_state_machine_with_data_object"></a>
### Simple state machine with data object

Set finite state machine definiton to:

```json
{
  "state": {
    "status": "IDLE",
    "data": {
      "x": 99
    }
  },
  "transitions": {
    "IDLE": {
      "run": {
        "status": "RUNNING",
        "data": {
          "x": 42
        }
      }
    },
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
}
```
**Fig. 6:** Simple state machine JSON object

#### State description
This example gives a state machine with two states (IDLE, RUNNING) and three transitions. Two of them (*run*, *stop*) change between the two states, the third (*set*) is used only to externally change the *data* object contents in the state RUNNING via an input `msg` with an appropriate `msg.topic` = "set".


![flow-simple](images/flow.png)  
[**SimpleStateMachineFlow.json**](examples/SimpleStateMachineFlow.json)  

**Fig. 7:** Simple state machine


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
**Fig. 8:** State machine with feedback JSON object

This example gives a self-stopping behaviour after a defined amount of time: Transition *run* triggers the state machine to *state* RUNNING, the feedback loop activates the transition *stop* after a delay of 5 seconds so that the state machine changes back to *state* IDLE.

![flow-with-feeback](images/flow-feedback.png)  
[**FeedbackStateMachineFlow.json**](examples/FeedbackStateMachineFlow.json)  

**Fig. 9:** State machine with feedback


<a name="changing_the_data_object"></a>
### Changing the "data" object

During a valid transition the *data* object can be changed or extended via the nodes input (externally) or changed via the node transition definition (internally).

Sending a `msg` containing no valid transition within the `msg.topic` cannot lead to any *data* object changes.

Therefore see example "Simple state machine with data object" above: To be able to change the *data* object externally in the *state* RUNNING, the transition *set* is defined: This (valid) transition does not change the *state* but may change the *data* object within *state* RUNNING like the two lower injections do.
In the example the definition of the upper set injection is like follows:

![change-data-object](images/change-data-object.png)  
**Fig. 10:** Properties of a `msg`with a JSON *data* object

As can seen this changes the present "data" object element "x" to a numerical value of '2' and adds an additional "data" object element "name" with the string "peter".



<a name="development"></a>
## Development

* run `npm install`
* install grunt `npm install -g grunt-cli`
* build with `npm run build`



<a name="hints_for_upgrading"></a>
## Hints for upgrading from node versions 0.2.11 and earlier to version 1.x.x
The `finite state machine` node of earlier versions contained three different outputs. In the actual node there is only one output present. Typically only this one output is needed.
If one needs to have the other two output functions there is the possibility of "emulating" them via the node `rbe` (*Report by Exception* node). This node is able to filter the output in a manner that the old additional two outputs are present.

![compatibility mode](images/flow-with-rbe.png)  
[**CompatibleOutputsFlow.json**](examples/CompatibleOutputsFlow.json)  

**Fig. 11:** Flow with `rbe` node generating compatible outputs

As an example the `rbe`node *stateChanged* may be configured like shown in Fig. 16.

![compatibility mode](images/rbe-configuration.png)  
**Fig. 12:** Configuration of the `rbe` node

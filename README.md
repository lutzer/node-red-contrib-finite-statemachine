
# Node Red State Machine
A finite state machine (FSM) implementation for node red. Displays also a graphical representation of the state machine.  
![node-appearance](images/node-appearance.png)

** v0.2.1 handles the data object differently: transition messages that contain a data object now need to have the data set in msg.data instead of msg.payload **

## Installation

### In Node-RED
* Via Manage Palette -> Search for "node-red-contrib-finite-statemachine"

### In a shell
* go to the Node-RED installation folder, in OS X it's usually: `~/.node-red`
* run `npm install node-red-contrib-finite-statemachine`

## Usage

You can find detailed usage information in the [Usage Manual](https://github.com/lutzer/node-red-contrib-finite-statemachine/blob/master/MANUAL.md).

### Node Configuration
![node-settings](images/node-settings.png)

#### Basic FSM structure
The statemachine of `finite state machine` is defined by a JSON object within the line *FSM* (Finite State Machine):

- *state* holds the initial state. It shall contain a *status* field.
- *transitions* holds the possible states as keys (shown as upper case strings). As values it contains one or more key/value pairs, consisting of the transition string (lower case strings) and the resulting state.
- additional *data* fields are optional. (See [Usage Manual](https://github.com/lutzer/node-red-contrib-finite-statemachine/blob/master/MANUAL.md))

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

### Input
The input topics of the  `finite state machine`  are defined by the transition table setup in the node configuration.

- sending a `msg` to the node containing a `msg.topic` set to a defined transition string triggers a state change.
- `msg.control`= *reset* sets the machine to its initial state (*"state"*)
- `msg.control`= *sync* is used to set the state manually. Its payload needs to be a JSON object, containing a *status* field
- `msg.control`= *query* triggers a state query event and the current state is sent to the output of the state machine. The option *Always send state change* needs to be enabled for this.

### Output

The output of `finite state machine` sends a  `msg` whenever there is a valid transition.
Remark: This also may be a valid transition without any state change.

The *payload* contains:
- *status*: Outputs the state of the FSM.
- *data*: Outputs the *data* object of the FSM. Read more about the data object in the [Usage Manual](https://github.com/lutzer/node-red-contrib-finite-statemachine/blob/master/MANUAL.md).


### Further information
Check Node-REDs info panel to see more information on how to configure the state machine.


## Example
***
**Remark**: Example flows are present in the examples subdirectory. In Node-RED they can be imported via the import function and then selecting *Examples* in the vertical tab menue.
***

For more examples, read the [Usage Manual](https://github.com/lutzer/node-red-contrib-finite-statemachine/blob/master/MANUAL.md).

### Minimal state machine

This example shows a state machine with two states. There is only one `msg.topic` ("toggleState") which toggles between the two states IDLE and RUNNING.


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
![flow-minimal](images/flow-minimal.png)
[**MinimalStateMachineFlow.json**](examples/MinimalStateMachineFlow.json)  



## Development

* run `npm install`
* install grunt `npm install -g grunt-cli`
* build with `npm run build`
* create link in node-red folder by running `npm install <local dir>` within the node-red install directory

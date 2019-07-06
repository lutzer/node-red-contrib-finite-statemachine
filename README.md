# NODE RED STATEMACHINE

A finite state machine implementation for node red. Displays also a graphical representation of the state machine.

![node-settings](images/node-settings.png)

## Install in Node Red

### Inside Node-red

* Via Manage Palette -> Search for "node-red-contrib-finite-statemachine"

### From Terminal

* go in node-red install folder, in os x its usually: `~/.node-red`
* run `npm install node-red-contrib-finite-statemachine`

## Usage

Check node-reds info panel to see how to use the state machine

### Example Flow

Set finite state machine definiton to:

```javascript
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
​   }
  }
}
```

![flow](images/flow.png)



### Feedback Flow

Set finite state machine definiton to:

```javascript
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
      "stop": "IDLE"
    }
  }
}
```

![flow-feedback](images/flow-feedback.png)

## Development

* run `npm install`
* install grunt `npm install -g grunt-cli`
* build with `npm run build`

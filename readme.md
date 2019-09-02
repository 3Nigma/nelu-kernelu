A modern, Promise ready, NodeJS Jupyter _5.2.3_ Kernel with comm and display support. This work was heavily inspired by [Nicolas Riesco](https://github.com/n-riesco)'s [IJavascript kernel](https://github.com/n-riesco/ijavascript) and is, in some sense, a continuation of that.

## Supported features
* Allows plain cell results  
![plain results](/imgs/own/nk_execute_plain.png)
* Resolves promisified values into plain results  
![promise results](/imgs/own/nk_execute_promise.png)
* Masks `undefined` results
* Permits creating and working with comms from within a cell (via Jupyter `comm_create` and `comm_msg`)
* Capable of handling comm messages originating from the kernel
* Able to display custom MIME specific content (via Jupyter `display_create` messages)
* Can print strings (via `stream` messages) 
* Supports kernel restarting via the Notebook UI 
* Has error stack tracing

## Installing
Requires NodeJS v10+ installed on the machine that hosts the Jupyter Notebook server alongside the NeluKernelu JS kernel.
**TODO**

## Restricted features
Due to security considerations, the following NodeJS objects are not available to be used from within a cell:
* global
* process

# API
Whenever a Notebook is started which targets this NodeJS kernel, a special `kernel` object is created and made available on each and every code cell. This object exposes kernel functionality into cell-space. 

## Getting the running user-name
To get the current running user-name, just call `kernel.userName`. This is helpful to deduce the current user especially in hub-like (+ oAuth) environments.

## Logging messages 
can be achieved via doing a `kernel.print()` call passing in the `string` that you want shown underneath the cell like so:  
![kernel.print(string)](/imgs/own/nk_kernel_print_string.png)
If you want to get fancy, you can also work with formattable constructs the same way you would go using [util.format](https://nodejs.org/api/util.html#util_util_format_format_args). Thus, you can do things like:  
![kernel.print(format[, ...args])](/imgs/own/nk_kernel_print_format.png)
Note: By design, `console.log` does not have the same effect as `kernel.print`. Using the traditional `console.log` has the effect of logging to the system console instead of the user's notebook.

## Dealing with communication channels (comms)
### Opening comms
The user can currently open a Jupyter communication channel (comm, for short) in one of two ways:
* through `kernel.newComm()` which creates a new comm that has a target name of `jknb.comm` and an initial data payload of `{}` (empty JS object) _or_
* through `kernel.newCommFor()` which takes in 3 parameters offering increased flexibility:
  * targetName - _mandatory_, the comm's target name
  * initialData - _optional_ (defaults to `{}`), the comm's initial-data object payload
  * metaData - _optional_ (defaults to `{}`), the comm's metadata object payload
Both these methods yeild a new `SessionKernelComm` instance which can be used to both send and receive messages.

### Sending data through comms
can be achieved via calls to a comm's instance `SessionKernelComm.send()` method. The only _mandatory_ argument being the JS object that we want to be broadcasted on that comm.

### Receiving data via comms
is done subscribing to the "message" event of the desired `SessionKernelComm` instance like so:
```
wComm.on("message", ({ data }) => kernel.print(JSON.stringify(data)));
```
The registered message handler will receive one parameter which will always be an object with a single property, `data` that carries whatever payload received through that comm.

## Displaying into the output cell
To display something into an output cell, you need to call `kernel.display` on an instance of a class that extends `JupyterDisplayableMessage` in which you overwrite `_toDisplay()` returning whatever JS object you would like to display as a result.
Here's an example:  
![kernel.display(JupyterDisplayableMessage)](/imgs/own/nk_kernel_display.png)

## Still needs to be done
* Handling of `comm_close` messages
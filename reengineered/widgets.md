## Resources
    List of builtins: https://ipywidgets.readthedocs.io/en/latest/examples/Widget%20List.html
    Styling: https://ipywidgets.readthedocs.io/en/latest/examples/Widget%20Styling.html
    Custom: https://ipywidgets.readthedocs.io/en/latest/examples/Widget%20Custom.html
    Integrating them into the UI: https://github.com/jupyter-widgets/ipywidgets/tree/master/examples

## Initializing a view/model from the kernel to the UI
{
    "header": {
        "version": "5.3",
        "date": "2019-08-20T19:41:40.746987Z",
        "session": "fd57345b-728ff0e2bc5fb88b378e2cfc",
        "username": "jupyter-victor.adascalitei-e167b",
        "msg_type": "comm_open",
        "msg_id": "3ffd3d6e-e865cac29152fa4c2163b30d"
    },
    "msg_id": "3ffd3d6e-e865cac29152fa4c2163b30d",
    "msg_type": "**comm_open**",
    "parent_header": {
        "msg_id": "8e1590d795704d9cb723e51899b06970",
        "username": "username",
        "session": "deb71f36b29341fe89c8ecebd1ee357f",
        "msg_type": "execute_request",
        "version": "5.2",
        "date": "2019-08-20T19:41:40.726460Z"
    },
    "metadata": {
        "version": "2.0.0"
    },
    "content": {
        "data": {
            "state": {
                "_dom_classes": [],
                "_model_module": "@jupyter-widgets/controls",
                "_model_module_version": "1.4.0",
                "_model_name": "IntSliderModel",
                "_view_count": null,
                "_view_module": "@jupyter-widgets/controls",
                "_view_module_version": "1.4.0",
                "_view_name": "IntSliderView",
                "continuous_update": true,
                "description": "",
                "description_tooltip": null,
                "disabled": false,
                "layout": "IPY_MODEL_b11d26f934724332ac4eca0bacd96513",
                "max": 100,
                "min": 0,
                "orientation": "horizontal",
                "readout": true,
                "readout_format": "d",
                "step": 1,
                "style": "IPY_MODEL_9d24403a5aa64a928177d186499de66e",
                "value": 0
            },
            "buffer_paths": []
        },
        "comm_id": "**71f3707ac7d846988613853152cbbbf9**",
        "target_name": "jupyter.widget",
        "target_module": null
    },
    "buffers": [],
    "channel": "iopub"
}

## Displaying the widget
{
    "header": {
        "version": "5.3",
        "date": "2019-08-20T19:41:41.430249Z",
        "session": "fd57345b-728ff0e2bc5fb88b378e2cfc",
        "username": "jupyter-victor.adascalitei-e167b",
        "msg_type": "display_data",
        "msg_id": "78be07bd-3964d713e9cd3da1a24270a0"
    },
    "msg_id": "78be07bd-3964d713e9cd3da1a24270a0",
    "msg_type": "**display_data**",
    "parent_header": {
        "msg_id": "8506d2c0de484147bc3d8aabe9c97311",
        "username": "username",
        "session": "deb71f36b29341fe89c8ecebd1ee357f",
        "msg_type": "execute_request",
        "version": "5.2",
        "date": "2019-08-20T19:41:41.424311Z"
    },
    "metadata": {},
    "content": {
        "data": {
            "text/plain": "IntSlider(value=0)",
            "**application/vnd.jupyter.widget-view+json**": {
                "version_major": 2,
                "version_minor": 0,
                "model_id": "**71f3707ac7d846988613853152cbbbf9**"
            }
        },
        "metadata": {},
        "transient": {}
    },
    "buffers": [],
    "channel": "iopub"
}

## Sending an update from the widget to the kernel
{
    "header": {
        "msg_id": "8fc9cd4b03734cf599c30c6f8fff30d2",
        "username": "username",
        "session": "deb71f36b29341fe89c8ecebd1ee357f",
        "msg_type": "**comm_msg**",
        "version": "5.2"
    },
    "metadata": {},
    "content": {
        "comm_id": "71f3707ac7d846988613853152cbbbf9",
        "data": {
            "method": "update",
            "state": {
                "value": 14
            },
            "buffer_paths": []
        }
    },
    "buffers": [],
    "parent_header": {},
    "channel": "shell"
}

## Sending an update from the kernel to the widget
{
    "header": {
        "version": "5.3",
        "date": "2019-08-21T07:24:18.797611Z",
        "session": "fd57345b-728ff0e2bc5fb88b378e2cfc",
        "username": "jupyter-victor.adascalitei-e167b",
        "msg_type": "comm_msg",
        "msg_id": "9890c13a-f00852c8097798ac10196977"
    },
    "msg_id": "9890c13a-f00852c8097798ac10196977",
    "msg_type": "**comm_msg**",
    "parent_header": {
        "msg_id": "b1a06e81c5a746cb956f6dd4899748ec",
        "username": "username",
        "session": "deb71f36b29341fe89c8ecebd1ee357f",
        "msg_type": "execute_request",
        "version": "5.2",
        "date": "2019-08-21T07:24:18.791583Z"
    },
    "metadata": {},
    "content": {
        "data": {
            "method": "update",
            "state": {
                "value": 8
            },
            "buffer_paths": []
        },
        "comm_id": "71f3707ac7d846988613853152cbbbf9"
    },
    "buffers": [],
    "channel": "iopub"
}

## Restore widget state when UI acceses the notebook after the models have been created
    // Steps that needs to be done:
    // 1. Register comm target
    // 2. Get any widget state from the kernel and open comms with existing state
    // 3. Check saved state for widgets, and restore any that would not overwrite
    //    any live widgets.

    // Register with the comm manager. (1)
    this.comm_manager.register_target(this.comm_target_name, _.bind(this.handle_comm_open,this));

    // Attempt to reconstruct any live comms by requesting them from the back-end (2).
    var that = this;
    this._get_comm_info().then(function(comm_ids) {

        // Create comm class instances from comm ids (2).
        var comm_promises = Object.keys(comm_ids).map(function(comm_id) {
            return that._create_comm(that.comm_target_name, comm_id);
        });

        // Send a state request message out for each widget comm and wait
        // for the responses (2).
        return Promise.all(comm_promises).then(function(comms) {
            return Promise.all(comms.map(function(comm) {
                var update_promise = new Promise(function(resolve, reject) {
                    comm.on_msg(function (msg) {
                        base.put_buffers(msg.content.data.state, msg.content.data.buffer_paths, msg.buffers);
                        // A suspected response was received, check to see if
                        // it's a state update. If so, resolve.
                        if (msg.content.data.method === 'update') {
                            resolve({
                                comm: comm,
                                msg: msg
                            });
                        }
                    });
                });
                comm.send({
                    method: 'request_state'
                }, that.callbacks());
                return update_promise;
            }));
        }).then(function(widgets_info) {
            return Promise.all(widgets_info.map(function(widget_info) {
                return that.new_model({
                    model_name: widget_info.msg.content.data.state._model_name,
                    model_module: widget_info.msg.content.data.state._model_module,
                    model_module_version: widget_info.msg.content.data.state._model_module_version,
                    comm: widget_info.comm,
                }, widget_info.msg.content.data.state);
            }));
        }).then(function() {
            // Now that we have mirrored any widgets from the kernel...
            // Restore any widgets from saved state that are not live (3)
            if (widget_md && widget_md['application/vnd.jupyter.widget-state+json']) {
                var state = notebook.metadata.widgets['application/vnd.jupyter.widget-state+json'];
                state = filter_existing_model_state(that, state);
                return that.set_state(state);
            }
        }).then(function() {
            // Rerender cells that have widget data
            that.notebook.get_cells().forEach(function(cell) {
                var rerender = cell.output_area && cell.output_area.outputs.find(function(output) {
                    return output.data && output.data[MIME_TYPE];
                });
                if (rerender) {
                    that.notebook.render_cell_output(cell);
                }
            });
        });
    });
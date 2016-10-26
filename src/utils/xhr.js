var EVENTS = ['loadstart', 'progress', 'abort', 'error', 'load', 'timeout', 'loadend'], RW_PROPERTIES = ['onreadystatechange', 'timeout', 'withCredentials', 'responseType'], R_PROPERTIES = ['upload', 'readyState', 'status', 'statusText', 'responseText', 'responseXML', 'response'], METHODS = ['setRequestHeader', 'send', 'abort', 'getResponseHeader', 'getAllResponseHeaders',
    'overrideMimeType', 'addEventListener', 'removeEventListener', 'open'];
export function setXHROption(options, xhr) {
    if (options === void 0) { options = {}; }
    options.ajax = options.ajax || {};
    options.ajax.xhr = xhr;
    return options;
}
function _apply(wrapper, fct) {
    var ret = [];
    if (wrapper._use_native) {
        ret.push(fct(wrapper._native));
    }
    ret.push(fct(wrapper._proxy));
    return ret[0];
}
function proxyMethod(methodName) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return _apply(this, function (xhr) {
            return xhr[methodName].bind(xhr).apply(void 0, args);
        });
    };
}
function proxyProperty(_this, propertyName, writable) {
    if (writable === void 0) { writable = undefined; }
    var descriptor = {
        configurable: true,
        get: function () { return _apply(_this, function (xhr) { return xhr[propertyName]; }); }
    };
    if (writable) {
        descriptor.set = function (val) {
            _apply(_this, function (xhr) { return xhr[propertyName] = val; });
        };
    }
    Object.defineProperty(_this, propertyName, descriptor);
}
function proxyEventProperty(_this, eventName) {
    var eventPropertyName = "on" + eventName.toLowerCase();
    var descriptor = {
        configurable: true,
        get: function () { return _apply(_this, function (xhr) { return xhr[eventPropertyName]; }); },
        set: function (handler) { return _apply(_this, function (xhr) { return xhr[eventPropertyName] = handler; }); }
    };
    Object.defineProperty(_this, eventPropertyName, descriptor);
}
var ProxyXHR = (function () {
    function ProxyXHR() {
        this.headers = {};
        this.onload = function () { };
        this.onerror = function () { };
        this.onreadystatechange = function () { };
        this.readyState = XMLHttpRequest.UNSENT;
        this.status = 0;
        this.listeners = {};
        for (var _i = 0, EVENTS_1 = EVENTS; _i < EVENTS_1.length; _i++) {
            var event_1 = EVENTS_1[_i];
            this.listeners[event_1] = [];
            this['on' + event_1] = function () { };
        }
    }
    ProxyXHR.prototype.abort = function () { };
    ProxyXHR.prototype.open = function (method, url) {
        this.method = method;
        this.url = url;
        this.setReadyState(XMLHttpRequest.OPENED);
    };
    ProxyXHR.prototype.addEventListener = function (eventName, handler) {
        this.listeners[eventName].push(handler);
    };
    ProxyXHR.prototype.setReadyState = function (state) {
        this.readyState = state;
        this.onreadystatechange();
    };
    ProxyXHR.prototype.setRequestHeader = function (key, value) {
        this.headers[key] = value;
    };
    ProxyXHR.prototype._callListeners = function (event) {
        for (var _i = 0, _a = this.listeners[event]; _i < _a.length; _i++) {
            var listener = _a[_i];
            listener();
        }
    };
    ProxyXHR.prototype.success = function (data) {
        console.info('recieved xhr wrapper request', this);
        this.raw_data = data;
        this.status = data.status;
        this.responseText = data.data;
        this.setReadyState(XMLHttpRequest.DONE);
        this.onload();
        this._callListeners('load');
    };
    ProxyXHR.prototype.error = function (data) {
        this.status = data.status;
        this.responseText = data.error;
        this.setReadyState(XMLHttpRequest.DONE);
        this.onerror();
        this._callListeners('error');
    };
    return ProxyXHR;
}());
export function getXHR(overrides, use_native) {
    if (overrides === void 0) { overrides = {}; }
    var wrapper = function () {
        var _this = this;
        this._use_native = use_native;
        if (use_native) {
            this._native = new XMLHttpRequest();
        }
        this._proxy = new ProxyXHR();
        /* Proxy events */
        EVENTS.forEach(function (elem) {
            proxyEventProperty(_this, elem);
        });
        /* Proxy read/write properties */
        RW_PROPERTIES.forEach(function (elem) {
            proxyProperty(_this, elem, true);
        });
        /* Proxy read-only properties */
        R_PROPERTIES.forEach(function (elem) {
            proxyProperty(_this, elem);
        });
    };
    var _loop_1 = function (method) {
        if (!(method in overrides)) {
            wrapper.prototype[method] = proxyMethod(method);
        }
        else {
            wrapper.prototype[method] = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                return overrides[method].bind(this._proxy).apply(void 0, [this._native].concat(args));
            };
        }
    };
    /* Proxy methods */
    for (var _i = 0, METHODS_1 = METHODS; _i < METHODS_1.length; _i++) {
        var method = METHODS_1[_i];
        _loop_1(method);
    }
    ;
    return wrapper;
}

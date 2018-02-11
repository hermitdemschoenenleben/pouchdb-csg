var EVENTS = ['loadstart','progress','abort','error','load','timeout','loadend'],
    RW_PROPERTIES = ['onreadystatechange','timeout','withCredentials', 'responseType'],
    R_PROPERTIES = ['upload','readyState','status','statusText','responseText','responseXML', 'response'],
    METHODS = ['setRequestHeader','send','abort','getResponseHeader','getAllResponseHeaders',
               'overrideMimeType', 'addEventListener', 'removeEventListener', 'open'];

/*
export interface XHRData {
 data?: string | {},
 error?: string,
 status: number,
 headers?: {
   [keys: string]: string
 }
}*/

export function setXHROption(options={}, xhr) {
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
  return function(...args) {
    return _apply(this, function(xhr) {
      return xhr[methodName].bind(xhr)(...args);
    });
  }
}

function proxyProperty(_this, propertyName, writable=undefined) {
  var descriptor = {
    configurable: true,
    get: function() {
      return _apply(_this, function(xhr) {
        return xhr[propertyName]
      });
    }
  };
  if (writable) {
    descriptor.set = function(val) {
      return _apply(_this, function(xhr) {
        xhr[propertyName] = val
      });
    }
  }
  Object.defineProperty(_this, propertyName, descriptor);
}

function proxyEventProperty(_this, eventName) {
  var eventPropertyName = "on" + eventName.toLowerCase();
  var descriptor = {
    configurable: true,
    get: function() {
      return _apply(_this, function(xhr) {
        return xhr[eventPropertyName]
      })
    },
    set: function(handler) {
      return _apply(_this, function(xhr) {
        xhr[eventPropertyName] = handler;
      })
    }
  };
  Object.defineProperty(_this, eventPropertyName, descriptor);
}

class ProxyXHR {
  constructor() {
    this.url = undefined; // string;
    this.method = undefined // string;
    this.headers = {};
    this.onload = function() {};
    this.onerror = function() {};
    this.onreadystatechange = function() {};
    this.readyState = XMLHttpRequest.UNSENT;
    this.status = 0;
    this.listeners = {};
    this.raw_data = undefined;
    this.responseText = undefined;

    for (let event of EVENTS) {
      this.listeners[event] = [];
      this['on' + event] = function() {}
    }
  }

  abort() {}

  open(method, url) {
    this.method = method;
    this.url = url;
    this.setReadyState(XMLHttpRequest.OPENED);
  }

  addEventListener(eventName, handler) {
    this.listeners[eventName].push(handler);
  }

  setReadyState(state) {
    this.readyState = state;
    this.onreadystatechange();
  }

  setRequestHeader(key, value) {
    this.headers[key] = value;
  }

  _callListeners(event) {
    for (let listener of this.listeners[event]) {
      listener();
    }
  }

  success(data) {
    console.info('recieved xhr wrapper request', this);
    this.raw_data = data;
    this.status = data.status;
    this.responseText = data.data;
    this.setReadyState(XMLHttpRequest.DONE)
    this.onload();
    this._callListeners('load');
  }

  error(data) {
    this.status = data.status;
    this.responseText = data.error;
    this.setReadyState(XMLHttpRequest.DONE)
    this.onerror();
    this._callListeners('error');
  }
}



export function getXHR(overrides={}, use_native) {
  let wrapper = function() {
    this._use_native = use_native;
    if (use_native) {
      this._native = new XMLHttpRequest();
    }
    this._proxy = new ProxyXHR();

    /* Proxy events */
    EVENTS.forEach(function(elem) {
      return proxyEventProperty(this, elem);
    });
    /* Proxy read/write properties */
    RW_PROPERTIES.forEach(function(elem) {
      return proxyProperty(this, elem, true);
    });
    /* Proxy read-only properties */
    R_PROPERTIES.forEach(function(elem) {
      return proxyProperty(this, elem);
    });
  }

  /* Proxy methods */
  for (let method of METHODS) {
    if (!(method in overrides)) {
      wrapper.prototype[method] = proxyMethod(method);
    } else {
      wrapper.prototype[method] = function(...args) {
        return overrides[method].bind(this._proxy)(this._native, ...args);
      }
    }
  };

  return wrapper;
}

var EVENTS = ['loadstart','progress','abort','error','load','timeout','loadend'],
    RW_PROPERTIES = ['onreadystatechange','timeout','withCredentials', 'responseType'],
    R_PROPERTIES = ['upload','readyState','status','statusText','responseText','responseXML', 'response'],
    METHODS = ['setRequestHeader','send','abort','getResponseHeader','getAllResponseHeaders',
               'overrideMimeType', 'addEventListener', 'removeEventListener', 'open'];

export interface XHRData {
 data?: string | {},
 error?: string,
 status: number,
 headers?: {
   [keys: string]: string
 }
}

export function setXHROption(options: any={}, xhr) {
  options.ajax = options.ajax || {};
  options.ajax.xhr = xhr;
  return options;
}

function _apply(wrapper, fct: Function) {
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
  var descriptor: any = {
    configurable: true,
    get: () => _apply(_this, xhr => xhr[propertyName])
  };
  if (writable) {
    descriptor.set = (val) => {
      _apply(_this, xhr => xhr[propertyName] = val);
    }
  }
  Object.defineProperty(_this, propertyName, descriptor);
}

function proxyEventProperty(_this, eventName) {
  var eventPropertyName = "on" + eventName.toLowerCase();
  var descriptor = {
    configurable: true,
    get: () => _apply(_this, xhr => xhr[eventPropertyName]),
    set: handler => _apply(_this, xhr => xhr[eventPropertyName] = handler)
  };
  Object.defineProperty(_this, eventPropertyName, descriptor);
}

class ProxyXHR {
  url: string;
  method: string;
  headers = {};
  onload: Function = function() {};
  onerror: Function = function() {};
  onreadystatechange: Function = function() {};
  readyState = XMLHttpRequest.UNSENT;
  status: number = 0;
  listeners = {};
  raw_data: any;
  responseText: any;

  constructor() {
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

  setReadyState(state: number) {
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

  success(data: XHRData) {
    console.info('recieved xhr wrapper request', this);
    this.raw_data = data;
    this.status = data.status;
    this.responseText = data.data;
    this.setReadyState(XMLHttpRequest.DONE)
    this.onload();
    this._callListeners('load');
  }

  error(data: XHRData) {
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
    EVENTS.forEach((elem) => {
      proxyEventProperty(this, elem);
    });
    /* Proxy read/write properties */
    RW_PROPERTIES.forEach((elem) => {
      proxyProperty(this, elem, true);
    });
    /* Proxy read-only properties */
    R_PROPERTIES.forEach((elem) => {
      proxyProperty(this, elem);
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

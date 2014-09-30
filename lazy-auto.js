/*!
 * Lazy JS v1.0.7
 * https://github.com/fineswap/lazy-js
 *
 * Copyright (C) 2013-2014 Fineswap Blog & App
 * http://fineswap.com/
 *
 * Released under the MIT license
 * http://en.wikipedia.org/wiki/MIT_License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

(function(window, NULL, undefined) {
  'use strict';

  // Mentioned few times in the code, declare them here to gain better minification.
  var TRUE = !0,
      FALSE = !1,
      DOCUMENT = 'document',
      ELEMENT = 'Element',
      HEAD = 'head',
      LOADED = 'loaded',
      PROTOTYPE = 'prototype',
      FIRSTCHILD = 'firstChild',
      READYSTATE = 'readyState',
      CALL = 'call',
      SHIFT = 'shift',
      PUSH = 'push',
      SUBSTR = 'substr',
      LOAD = 'load',
      ADD = 'add',
      LENGTH = 'length',
      HANDLERS = 'handlers',
      QUEUE = 'queue',
      PREFIX = 'prefix',
      ONLOAD = 'on' + LOAD,
      LOADING = LOAD + 'ing',
      ONREADYSTATECHANGE = 'onreadystatechange',
      CLASSNAME = 'className',
      REMOVECHILD = 'removeChild',
      GETELEMENTSBYTAGNAME = 'get' + ELEMENT + 'sByTagName',
      TOLOWERCASE = 'toLowerCase',
      SLICE = 'slice',
      REPLACE = 'replace',
      CANSTART = 'canStart',
      ONSUCCESS = 'onSuccess',
      ONPROGRESS = 'onProgress',
      ONCHUNK = 'onChunk',
      ONERROR = 'onError',

      document = window.document,
      html = document[GETELEMENTSBYTAGNAME]('html')[0] || document[DOCUMENT + ELEMENT],
      head = document[HEAD] || document[GETELEMENTSBYTAGNAME](HEAD)[0],

      noop = function() {},

      is = function(object, type, classType) {
        if(undefined === object || NULL === object) {
          return FALSE;
        }
        classType = window.Object[PROTOTYPE].toString[CALL](object)[SLICE](8, -1)[TOLOWERCASE]();
        return classType === type[TOLOWERCASE]();
      },

      isFunction = function(handler) {
        return is(handler, 'function');
      },

      isArray = function(object) {
        return is(object, 'array');
      },

      cloneArray = function(array, startFrom) {
        return window.Array[PROTOTYPE].slice[CALL](array, startFrom || 0);
      },

      defaultStartHandler = function() {
        return TRUE;
      },

      defaultErrorHandler = function(chunkId, src) {
        throw 'Unable to load: ' + src + ' [' + chunkId + ']';
      },

      // Fire the specified callback inside a Lazy JS object.
      // 'this' points to the target LazyJS instantiated object.
      fireCallback = function(handlerId) {
        var self = this, callback = self[HANDLERS][handlerId];
        if(is(callback, 'string')) {
          callback = window[callback];
        }
        return isFunction(callback)
          ? callback.apply(self, cloneArray(arguments, 1))
          : undefined;
      },

      trim = function(string) {
        return !string ? '' : string[REPLACE](/(^\s+|\s+$)/g, '');
      },

      addClass = function(cls) {
        html[CLASSNAME] = trim(html[CLASSNAME] + ' ' + cls);
      },

      removeClass = function(cls) {
        html[CLASSNAME] = trim(html[CLASSNAME][REPLACE](
          new RegExp('\\s*' + cls + '\\s*', 'g'), ' ')
        );
      },

      getTime = function() {
        return +new window.Date();
      },

      // Create a new script element, and load a script from the provided URL.
      // 'this' points to the target LazyJS instantiated object.
      loadScript = function(src, successCallback, errorCallback) {
        var self = this,
            script = document['create' + ELEMENT]('script'),
            timer,
            onLoad = function() {
              script[ONLOAD] = NULL;
              head[REMOVECHILD](script);
              successCallback(src, getTime() - timer);
            },
            onError = function() {
              self.quit = TRUE;
              script[ONLOAD] = script[ONREADYSTATECHANGE] = NULL;
              head[REMOVECHILD](script);
              errorCallback(src);
            };

        if(!self.quit) {
          script.src = src;
          script.async = TRUE;
          script.type = 'text/javascript';
          script.onerror = onError;
          script[ONLOAD] = onLoad;
          script[ONREADYSTATECHANGE] = function() {
            if(LOADED === this[READYSTATE] || 'complete' === this[READYSTATE]) {
              script[ONREADYSTATECHANGE] = NULL;
              onLoad();
            }
          };

          try {
            timer = getTime();
            if(head[FIRSTCHILD]) {
              head.insertBefore(script, head[FIRSTCHILD]);
            } else {
              head.appendChild(script);
            }
          } catch (e) {
            onError();
          }
        }
      },

      // Load a bunch of scripts asynchronously.
      // 'this' points to the target LazyJS instantiated object.
      loadAsync = function(chunkId, queue, successCallback, errorCallback) {
        var self = this,
            size = queue[LENGTH],
            loaded = 0,
            src,
            timeElapsed = 0,
            removeIdClass = function() {
              // Remove class from HTML element.
              removeClass(self[PREFIX] + '-' + chunkId);
            },
            onSuccess = function(src, time) {
              loaded++;
              fireCallback[CALL](self, ONPROGRESS, chunkId, src, time);
              timeElapsed += time;
              if(loaded === size) {
                removeIdClass();
                addClass(self[PREFIX] + '-' + chunkId + '-' + LOADED);
                successCallback(chunkId, timeElapsed);
              }
            },
            onError = function(src) {
              // Call the error handler only once.
              removeIdClass();
              errorCallback(chunkId, src);
            };

        // Add class to the HTML element.
        addClass(self[PREFIX] + '-' + chunkId);

        // Go over list of scripts and load them one after the other.
        while(!!(src = queue[SHIFT]())) {
          loadScript[CALL](self, src, onSuccess, onError);
        }
      },

      // Load a bunch of scripts synchronously.
      // 'this' points to the target LazyJS instantiated object.
      loadSync = function() {
        var self = this,
            fired,
            queue,
            removeIdClass = function() {
              // Remove class from HTML element.
              removeClass(self[PREFIX] + '-' + LOADING);
            },
            errorCallback = function(chunkId, src) {
              if(!fired) {
                // Call the error handler only once.
                fired = TRUE;
                removeIdClass();
                fireCallback[CALL](self, ONERROR, chunkId, src);
              }
            },
            loadNextChunk = function(chunkId, timeElapsed) {
              // Load them asynchronously.
              if(!self.quit) {
                // Fire a callback to update the app.
                if(chunkId) {
                  fireCallback[CALL](self, ONCHUNK, chunkId, timeElapsed);
                }

                // Get next bunch of scripts.
                queue = self[QUEUE][SHIFT]();

                // If there are more scripts, load them now.
                if(queue && queue[LENGTH]) {
                  loadAsync[CALL](self, queue[0], queue[1], loadNextChunk, errorCallback);
                } else {
                  // Finished loading all scripts!
                  removeIdClass();

                  // Call the onSuccess handler.
                  fireCallback[CALL](self, ONSUCCESS);

                  // Delete this property, we don't need it anymore.
                  self[ONLOAD] = undefined;
                }
              }
            };

        // Pull for 10 seconds only (quite a long time in Web realm, anyway.)
        if(getTime() < self[ONLOAD] + 9999) {
          // Pull until canStart handler approves the start sequence.
          if(TRUE !== fireCallback[CALL](self, CANSTART)) {
            setTimeout(loadSync, 100);
          } else {
            // Add relevant class to the HTML element.
            addClass(self[PREFIX] + '-' + LOADING);

            // Start loading the first chunk of scripts.
            loadNextChunk(FALSE);
          }
        } else {
          fireCallback[CALL](self, ONERROR, '*');
        }
      },

      // Lazy JS exposed implementation.
      /* jshint maxcomplexity:30 */
      LazyJS = (function() {
        var LazyJS = function(config) {
              var self = this, key, value, length, configCopy, loop, pos;

              // Make sure that new LazyJS() is always used.
              if(!(self instanceof LazyJS)) {
                throw 'LazyJS must be instantiated using the new operator.';
              }

              if(config) {
                if(!isArray(config) || 0 === config[LENGTH] || config[LENGTH] % 2) {
                  throw 'Configuration must be an Array holding even number of entries.';
                }

                // Clone original Array.
                configCopy = cloneArray(config);
              }

              // Define the prefix used for class identifiers on the HTML element.
              self[PREFIX] = 'lazy';

              // Queue of scripts to load.
              self[QUEUE] = [];

              // Object holding the handlers.
              self[HANDLERS] = {};

              // Default handler to call before Lazy JS starts loading scripts.
              self[HANDLERS][CANSTART] = defaultStartHandler;

              // Default handler to call when a script has loaded successfully.
              self[HANDLERS][ONPROGRESS] = noop;

              // Default handler to call when a chunk of scripts has loaded successfully.
              self[HANDLERS][ONCHUNK] = noop;

              // Default handler when all scripts have been loaded successfully.
              self[HANDLERS][ONSUCCESS] = noop;

              // Default handler when an error is detected while loading any of the scripts.
              self[HANDLERS][ONERROR] = defaultErrorHandler;

              // Go over list of keys and check whether scripts have been defined.
              if(configCopy) {
                length = configCopy[LENGTH];
                for(loop = 0; length > loop;) {
                  key = configCopy[loop++];
                  value = configCopy[loop++];

                  // Process the meta-data.
                  switch(key) {
                    // These might be defined in the HTML code.
                    case 'can-start':
                    case 'on-progress':
                    case 'on-chunk':
                    case 'on-success':
                    case 'on-error':
                      // Make the variable point to the callable function name.
                      pos = key.indexOf('-');
                      key = key[SUBSTR](0, pos)
                        + key.charAt(++pos).toUpperCase()
                        + key[SUBSTR](++pos, 7);

                    /* falls through */
                    case CANSTART:
                    case ONPROGRESS:
                    case ONCHUNK:
                    case ONSUCCESS:
                    case ONERROR:
                      // This will set the appropriate handler.
                      self[key](value);
                      break;

                    case PREFIX:
                      self[key] = value;
                      break;

                    default:
                      // Default behavior is to add the list of scripts. Scripts must be
                      // separated by a space character if more than one is listed.
                      if(!isArray(value)) {
                        value = value.split(' ');
                      }

                      // Add the scripts along with their identifier.
                      self[ADD](key, value);
                  }
                }
                configCopy = NULL;
              }
            },

            LazyJSPrototype = LazyJS[PROTOTYPE];

        // Define the prototype of Lazy JS.

        // Default handler before Lazy JS starts loading scripts.
        LazyJSPrototype[CANSTART] = function(handler) {
          if(!handler) {
            return this[HANDLERS][CANSTART];
          }
          return (this[HANDLERS][CANSTART] = handler);
        };

        // Define a callback when a script has loaded successfully.
        LazyJSPrototype[ONPROGRESS] = function(handler) {
          if(!handler) {
            return this[HANDLERS][ONPROGRESS];
          }
          return (this[HANDLERS][ONPROGRESS] = handler);
        };

        // Define a callback when a chunk of scripts has loaded successfully.
        LazyJSPrototype[ONCHUNK] = function(handler) {
          if(!handler) {
            return this[HANDLERS][ONCHUNK];
          }
          return (this[HANDLERS][ONCHUNK] = handler);
        };

        // Define a callback when all scripts have been loaded successfully.
        LazyJSPrototype[ONSUCCESS] = function(handler) {
          if(!handler) {
            return this[HANDLERS][ONSUCCESS];
          }
          return (this[HANDLERS][ONSUCCESS] = handler);
        };

        // Define a callback when an error is detected while loading any of the scripts.
        LazyJSPrototype[ONERROR] = function(handler) {
          if(!handler) {
            return this[HANDLERS][ONERROR];
          }
          return (this[HANDLERS][ONERROR] = handler);
        };

        // Add a list of scripts to load asynchronously.
        LazyJSPrototype[ADD] = function(chunkId, scripts) {
          if(!isArray(scripts)) {
            scripts = [scripts];
          }
          if(scripts && scripts[LENGTH]) {
            this[QUEUE][PUSH]([chunkId, scripts]);
          }
        };

        // Fire-off the loading process and start loading all enqueued scripts!
        LazyJSPrototype[LOAD] = function() {
          var self = this;
          if(!self[QUEUE][LENGTH]) {
            // Queue is empty... Run the success handler.
            self[HANDLERS][ONSUCCESS]();
          } else if(!self[ONLOAD]) {
            // Mark start time for the loading process.
            self[ONLOAD] = getTime();

            // Load chunks synchronously.
            loadSync[CALL](self);
          }
        };

        return LazyJS;
      })();

  // Check the DOM tree for meta-data holding scripts to load.
  setTimeout(function() {
    var RE_DATA_PREFIX = /^data-/,
        TEST = 'test',
        NODENAME = 'nodeName',
        scripts = document[GETELEMENTSBYTAGNAME]('script'),
        length = scripts[LENGTH],
        loop = 0,
        variable,
        value,
        attributes,
        config = [];

    // We use a do-while loop since there exists at least one <script> tag;
    // the same one that loaded us!
    do {
      variable = scripts[loop];

      // Is it our own script? Check both original/minified source.
      if(/lazy[\w\._-]*(\.min)?\.js/[TEST](variable.getAttribute('src'))) {
        // Get the element's attributes.
        attributes = variable.attributes;

        // There's a 'src' attribute, so we need to check for more than one.
        if(1 < attributes[LENGTH]) {
          // Go over list of attributes and start analyzing them.
          for(loop = 0; attributes[LENGTH] > loop; loop++) {
            variable = attributes.item(loop);

            // If the attribute starts with 'data-', process it.
            if(RE_DATA_PREFIX[TEST](variable[NODENAME])) {
              value = variable.nodeValue;
              variable = variable[NODENAME][REPLACE](RE_DATA_PREFIX, '');
              if(variable) {
                config[PUSH](variable, value);
              }
            }
          }
        }

        // Only one instance of Lazy JS is ever considered!
        loop = length;
      }
    } while(length > ++loop);

    // If config is not empty, then load the scripts!
    if(0 < config[LENGTH]) {
      (new LazyJS(config))[LOAD]();
    }

    config = NULL;
  }, 50);

  // Expose Lazy JS implementation.
  window.LazyJS = LazyJS;

})(window, null);

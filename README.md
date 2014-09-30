Lazy JS
=======

A minimalist, powerful and asynchronous lazy loader for JavaScript files. In order to use Lazy JS,
no changes need to be made to the original scripts. If used correctly, however, Lazy JS could
drastically speed up loading of external JavaScript files while not locking up the UI.

The minified size of the simple version is around 3Kb (1.5Kb gzipp'ed or [Zopfli][zopfli]'ed),
and with only a few extra bytes, Lazy JS may also scan the document for inline scripts'
meta-data to load.

Lazy JS comes in two flavors for your consideration:

1. **Normal version**:  
   Lazy JS is defined and a single variable is exposed to global scope for use.
2. **Automatic version**:  
   In addition to the above, the automatic version has a routine that scans the DOM looking
   for &lt;script&gt; elements. Once found, these are checked for meta-data about which scripts to
   load.

How Lazy JS works
-----------------

A well-behaved Web app should load external scripts on-demand and as-needed. This is especially
true for mobile devices where resources are jealously kept to a minimum. Furthermore, any script
that is loaded, although not actively running, is still taking up resources -- particularly
memory and stack.

Due to these understandings, Lazy JS was built with the fundamental principle that an app may be
divided into separate parts, each part relies on the one preceding it. While these parts rely 
on one another, one part (called *chunk* in Lazy JS) includes one or more, unrelated scripts
that load *asynchronously*.

This technique allows you to divide the app's scripts into chunks (that load *synchronously*,
one after the other) and each chunk into various scripts (that load *asynchronously*, in
parallel). Each chunk has a unique identifier which is sent to the various configurable callbacks.

Documentation
-------------

Both versions introduce the variable **LazyJS** to global scope which is basically an Object.
Configuration options are passed as an Array (to preserve order of appearance), each two items
in the array correspond to a *key* and its associated *value*.

Recognized keys are one or more of the following:

- <code>prefix</code>: *String*, defaults to *'lazy'*  
  The prefix is used by Lazy JS to formulate CSS class names to add to the
  main HTML element during loading of the scripts. For example, when loading a *'libs'* chunk,
  Lazy JS adds a class name *'lazy-libs'* to the HTML element. Once loading has finished
  successfully, the class name is replaced with *'lazy-libs-loaded'*.

- <code>baseURI</code>: *String*, defaults to *''*  
  Base URI is used by Lazy JS to build the final URL of all scripts. This is great for setting
  logical paths to scripts, and then setting this option to the base URI, which could change
  between environments (development, production, etc.)

- <code>canStart()</code>: *Callback* *(default handler returns true always)*  
  Before beginning to load any of the scripts, Lazy JS calls this function. If the function
  returns *true*, Lazy JS starts the loading process, but not before that. Lazy JS will continue
  to check this function (for 10 seconds) until it returns *true*. While loading is in progress,
  the class name *'lazy-loading'* (prefix may change, of course) is added to main HTML element.

- <code>onProgress(*chunkId*, *script*, *timeElapsed*)</code>: *Callback*  
  Each time a script is successfully loaded by Lazy JS, this function is called, along with its
  associated chunk ID, the script's URL and time it took to load it.

- <code>onChunk(*chunkId*, *timeElapsed*)</code>: *Callback*  
  Each time a bunch of scripts belonging to the same chunk are successfully loaded by Lazy JS,
  this function is called, along with the chunk ID and the overall time required to load them.

- <code>onSuccess()</code>: *Callback*  
  When all chunks have been successfully loaded, this function is called. The function is called
  only once.

- <code>onError(*chunkId*, *script*)</code>: *Callback*  
  When any script, in any chunk, fails to load, this function is called (only once). The
  associated chunk ID and the script's URL are passed as well. Once an error occurs in the loading
  process, Lazy JS cancels all pending operations.  
  A special case: When Lazy JS doesn't get *true* for 10 seconds from <code>canStart()</code>
  handler, <code>onError()</code> handler is called with *chunkId* equal to '*'.

Any unrecognized key is considered a *chunk ID*, and its value may either be an Array of scripts,
a String holding a list of scripts separated by spaces or a String holding one script entry.

Once instantiated, a Lazy JS object may call these methods to further tune its workings:

- .<code>canStart(*[handler]*)</code>  
  .<code>onProgress(*[handler]*)</code>  
  .<code>onChunk(*[handler]*)</code>  
  .<code>onSuccess(*[handler]*)</code>  
  .<code>onError(*[handler]*)</code>  
  A series of methods to set a new callback, or get the current one, for the appropriate event.

- .<code>add(*chunkId*, *scripts*)</code>  
  Add a new chunk of scripts identified by the unique ID *chunkId*. *scripts* may be passed as
  an Array of Strings, or a String holding scripts separated by a space, or a single String entry.
  
- .<code>load()</code>  
  Kick-start the loading sequence. load() will call <code>canStart()</code> handler for up to
  10 seconds waiting for a *true* response. Once received, loading starts.

Examples
--------

This is a simple example of using Lazy JS normal version:

    <!DOCTYPE html>
    <html>
      <head>
        ...
      </head>
      <body>
        ...
        <script type="text/javascript" src="/path/to/lazy.js"></script>
        <script type="text/javascript">
          // Use a closure to sandbox the logic.
          (function(LazyJS) {
            (new LazyJS([
              'prefix', 'myapp',

              'onError', function() {
              },

              // Chunk 'libs' includes 4 scripts, which load asynchronously (as an Array).
              'libs', ['json2.js', 'jquery.js', 'sass.js', 'md5.js'],

              // After 'libs' loads, chunk 'plugins' starts loading (as a String).
              'plugins', 'jquery-ui.js plugin.js another-plugin.js',

              // Finally, this chunk includes just one script to load (one entry).
              'app', 'launch.js'
            ])).load();
          })(LazyJS);
        </script>
      </body>
    </html>

The same can done in just one line using Lazy JS automatic version:

    <!DOCTYPE html>
    <html>
      <head>
        ...
        <script type="text/javascript">
          function lazyCanStart() { return true; }
          function lazyOnProgress(chunkId, scriptUrl, timeElapsed) { ... }
          function lazyOnChunk(chunkId, timeElapsed) { ... }
          function lazyOnSuccess() { ... }
          function lazyOnError(chunkId, scriptUrl) { ... }
        </script>
      </head>
      <body>
        ...
      <script data-can-start="lazyCanStart"
              data-base-uri="//production.cdn.example.com/"
              data-on-progress="lazyOnProgress"
              data-on-chunk="lazyOnChunk"
              data-on-success="lazyOnSuccess"
              data-on-error="lazyOnError"
              data-prefix="myapp"
              data-libs="json2.js jquery.js sass.js md5.js"
              data-plugins="jquery-ui.js plugin.js another-plugin.js"
              data-app="launch.js"
              type="text/javascript" src="lazy-auto.js"></script>
      </body>
    </html>

A note about "DOM Ready"
------------------------

Lazy JS does not wait till DOM's ready; once its <code>load()</code> method is called, and
<code>canStart()</code> returns *true*, loading initiates. Waiting for the DOM is left to
your discretion.

I could have incorporated the necessary code to achieve this (my [DOM Ready][dom-ready] closure
does just that), but I decided against it since Lazy JS may be included in various environments
and apps.

In any case, I would recommend inserting any &lt;script&gt; elements just before the closing 
&lt;/body&gt; element, for two main reasons:

1. All HTML code would be fully loaded at that point;
2. The UI will not lock up waiting for &lt;script&gt;'s to load and be parsed.

This will most likely ensure that your app doesn't even need to wait for a DOM ready event, and
you may then kick-start Lazy JS's loading frenzy at once.

Terms of Use
------------

[MIT License][mitlicense]

[mitlicense]: http://en.wikipedia.org/wiki/MIT_License        "MIT License"
[modernizr]:  http://modernizr.com/                           "Modernizr"
[dom-ready]:  https://github.com/noordawod/dom-ready          "DOM Ready"
[zopfli]:     https://code.google.com/p/zopfli/               "Zopfli"

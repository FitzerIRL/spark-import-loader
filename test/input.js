
var baseUrl = "http://www.pxscene.org/examples/px-reference/gallery/";


// TODO: auto detect import definitions
px.configImport({"browser:" : "browser/"});


px.import({  scene:      'px:scene.1.js',
              keys:      'px:tools.keys.js',
              ListBox: 'browser:listbox.js',
              EditBox: 'browser:editbox.js'
}).then( function importsAreReady(imports)
{
  var url   = "";
  var helpShown = false;

  var scene = imports.scene;
  var keys  = imports.keys;
  var root  = imports.scene.root;

  // MORE CODE
  // MORE CODE
  // MORE CODE
  
}).catch( function importFailed(err){
  console.error("SVG >> Import failed: " + err);
});

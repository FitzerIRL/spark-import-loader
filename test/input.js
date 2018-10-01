
var baseUrl = "http://www.pxscene.org/examples/px-reference/gallery/";

px.configImport({
  "browser:" : "myTest/browser/",
  "utils:"   : "myTest/utils/", 
  "test:"    : "myTest/test/", 
});


px.configImport({
  "browser22:" : "myTest/browser22",
  "utils22:"   : "myTest/utils22/", 
  "test22:"    : "myTest/test22/", 
});

px.configImport({
  "root:": px.getPackageBaseFilePath() + "/",
  "gui:":  px.getPackageBaseFilePath() + "/gui/",
  "src:":  px.getPackageBaseFilePath() + mypath + "/src/"
});

px.import({  scene:      'px:scene.1.js',
              keys:      'px:tools.keys.js',
              ListBox:   'browser:listbox.js',  FooBox:   'utils:Foobox.js',
              EditBox:   'test:browser:editbox.js'
}).then( function importsAreReady(imports)
{

  // MORE CODE
}).catch( function importFailed(err){
  console.error("Import Test: " + err);
});

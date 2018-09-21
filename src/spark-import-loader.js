const loaderUtils    = require("loader-utils");
const removeComments = require('remove-comments');

module.exports = function(source, map) {

    const options = loaderUtils.getOptions(this);

    console.log("SPARK IMPORT LOADER: " + JSON.stringify(options) + "\n");

    var newSource = removeComments(source); // copy to modify

    newSource = parseImports(options.base, newSource); // modifies string

    this.callback(
        null,
        newSource,
        map
    );
};

function resolveBase(base, str)
{
    var myStr = str;
    var reBase = /\s*([^ +]*)\s*\+/;
    var match  = reBase.exec(myStr);
    var key    = "(none)"

    //console.log("## >> match: ["+match+"]  key: [" + key +"]    str: [" + str + "]");

    if(match)
    {
        key = match[1];

        var reQuote = /.*(["']+).*/;
        var quote   = reQuote.exec(myStr);

        if(match && base[key])
        {
            var name = quote[1] + base[key] + quote[1];

            return myStr.replace(key, name);
        }
    }

    return str; // Not Found
}

/*

px.import({ scene:     'px:scene.1.js',
            keys:      'px:tools.keys.js',
            ListBox:   'utils:browser:listbox.js',
            EditBox:   'utils:test:browser:editbox.js'
}).then( function importsAreReady(imports)
{

    Convert to -

        import.ref = "EditBox"
        import.key = "browser"
        import.val = "editbox.js"
*/

function parseImports(base, str)
{
    var rePxImport = /.*px\.import\s*\(\s*\{([^}]*?)\}\s*\).then\s*\(.*\((.*)\)[^{]*\{/g;
    var reJsonList = /.*\(\s*\{([^}]*)\}\s*\).*/g;
    var reJsonPair = /\s*([^:]*)\:\s*([^,]*),?/g;

    var myStr  = str; // to modify param

    var myImports = [];

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    var matchImports = null;

    var importVar  = ""
    var importList = [];

    matchImports = rePxImport.exec(myStr);  // Found 'px.import()' statement
    if (matchImports !== null)
    {
        // console.log("## REGEX: " + matchImports[1]);

        importVar = matchImports[2];
        // console.log("## PROMISE var: " + importVar)

        var matchList = reJsonList.exec(matchImports[0]);  // Found import list
        if(matchList !== null)
        {
            // console.log("## JSON: " + matchList[1]);

            var matchPair = null;
            while( (matchPair = reJsonPair.exec(matchImports[1])) !== null)
            {
                // console.log("## IMPORT LINE: " + matchPair[0]);

                var line  = matchPair[0];
                var token = matchPair[1];
                var value = matchPair[2];

                // whitespace
                line = line.trim();

                // single quotes
                value = value.replace(/\'/g, "");

                // double quotes
                value = value.replace(/\"/g, "");

                // newlines
                value = value.replace(/\n/g, "");

                // Found import list
                if(value.startsWith("px:"))
                {
                    continue; // SKIP px imports
                }
                else
                {
                    //console.log("##  PAIR: " + token + " >> "+ value);
                    var pxPath = value.split(':');

                    var filePath = "";
                    pxPath.map( (v,i) =>
                    {
                        filePath += v;
                        if(v.indexOf(".") < 0 )
                            filePath += "/";
                    })

                    importList.push({ token: token, line: line, path: filePath});

                    //console.log("##  PATH: " + filePath);
                }
            }//WHILE
        }
        else
        {
            console.log("## JSON: ** NOT FOUND ** ");
        }
    }//ENDIF

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Assemble resulting prefix...
    //

    if(matchImports !== null)
    {
        var prefix = ""

        if(importList.length > 0)
        {
            // Create '__webpack_require__()' in place of 'px.import()' of modules
            importList.map( (obj,i) =>
            {
                prefix += "\n  " + importVar + "." + obj.token + " = require('./" + obj.path + "')";
            })
            prefix+= "\n\n";

            myStr = myStr.replace(matchImports[0], matchImports[0] + prefix);

            importList.map( (obj,i) =>
            {
                myStr = myStr.replace(obj.line, " // __SPARK_IMPORT_LOADER__ " + obj.line);
            })
        }
    }

//    console.log(" -------- prefix: \n\n" + prefix);
//    console.log(" -------- RESULT: \n\n" + myStr);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    return myStr;
}

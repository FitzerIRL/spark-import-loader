var loaderUtils = require('loader-utils');
var removeComments = require('remove-comments');

var configList = [];

module.exports = function(source, map) 
{
    const options = loaderUtils.getOptions(this);

    console.log("SPARK IMPORT LOADER: ");

    // this.addDependency(loaderUtils);
    // this.addDependency(removeComments);

    var base = (     options !== null && 
                options.base !== null) ? options.base : null;

  //  console.log("SPARK IMPORT LOADER: base > " + JSON.stringify(base) );

    parseConfigImports(source, base); // copy to modify

    var newSource = removeComments(source); // copy to modify
        newSource = parseImports(newSource, base); // modifies string

    this.callback( null, newSource, map );
}

function parseConfigImports(str, base)
{
/*

    px.configImport({
        "browser1:" : "browser1/", 
        "browser2:" : "browser2/", 
    });

*/
    const rePxConfigImport = /.*px\.configImport\s*\(\s*\{([^}]*?)\}\s*\)[;]+/g; // px.configImport({ .... })
    const reJsonPair = /\s*["']{1}(.*)["']{1}\s*\:\s*([^,]*),?/g; // { JSON PAIRS }

    var matchConfig = null;

    var myStr = str; // to modify param

    // Parse 'px.configImport()' statements
    while((matchConfig = rePxConfigImport.exec(myStr)) != null)// Found 'px.configImport()' statement
    {
    //    console.log("########   parseConfigImports() >>   MATCH1: " + matchConfig[1]);

        // Parse JSON pairs
        var matchPair = null;
        while( (matchPair = reJsonPair.exec(matchConfig[1])) !== null)
        {
            var line  = matchPair[0];
            var token = matchPair[1];
            var value = matchPair[2];

            // trailing whitespace
            line = line.trim();

            // single quotes
            value = value.replace(/\'/g, "");

            // double quotes
            value = value.replace(/\"/g, "");

            // newlines
            value = value.replace(/\n/g, "");

            // colon
            token = token.replace(/:/g, "");

            // single quotes
            token = token.replace(/\'/g, "");

            // double quotes
            token = token.replace(/\"/g, "");

            // newlines
            token = token.replace(/\n/g, "");

            if(base)
                {
                var splitConcat = value.split("+");
                splitConcat.map(v =>
                {
                    var key = v.trim();
                    var val = (base[key] != null) ? base[key] : "";

                    // console.log("#######   base["+key+"] > " + val );

                    if( val )
                    {
                        if(val.endsWith('/') == false)
                        {
                            val += "/";
                        }
                        value = value.replace(key, "'" + val + "'");
                    }
                });

                value = value.replace(/\s*\+\s*/g, "");

                // single quotes
                value = value.replace(/\'/g, "");

                // double quotes
                value = value.replace(/\"/g, "");

                value = value.replace(/\/\//g, "/"); // remove dupes
            }//ENDIF

            // console.log("#######   token: "+token+" > " + value );

            var obj = {}
            obj[token] = value;

            configList.push(obj);

        }//WHILE
    }//WHILE

    // console.log("########   parseConfigImports()  ["+configList.length+"]  configList: " + JSON.stringify(configList) )
}


function parseImports(str, base)
{
    const rePxImport = /.*px\.import\s*\(\s*\{([^}]*?)\}\s*\).then\s*\(.*\((.*)\)[^{]*\{/g; // px.import({})
    const reJsonPair = /\s*([^:]*)\:\s*([^,]*),?/g; // { JSON PAIRS }

    var myStr = str; // to modify param

    var matchImports = null;
 
    while((matchImports = rePxImport.exec(myStr)) != null)// Found 'px.import()' statement
    {
        var importVar  = ""
        var importList = [];

        // console.log("## REGEX: " + matchImports[1]);

        importVar = matchImports[2];

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
            if(value == "optimus" || value == "ws" || value == "http"|| value == "https")
            {
                // console.log("##  SKIP: " + token + " >> "+ value);
                continue; // SKIP 'allowed' modules
            }
            else
            {
                // console.log("##  PAIR: " + token + " >> "+ value);
                var pxPath = value.split(':');

                var filePath = "";
                pxPath.map( (v,i) =>
                {
                    var config = configList.find(function (obj) { return obj[v] !== undefined });

                    //  console.log("##  v:  ["+v+"]   config: " + JSON.stringify(config) );

                    filePath += (config !== undefined && i == 0) ? config[v] : v; // use config Path

                    if( i > 0 && v.indexOf(".") < 0 )
                        filePath += "/";
                })

                importList.push({ token: token, line: line, path: filePath});

                // console.log("## LINE:  >>"+line+"<<    PATH: " + filePath);
            }
        }//WHILE

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // Assemble resulting prefix...
        //
        try
        {
            // console.log("## matchImports["+matchImports.length+"]:  >>"+JSON.stringify(matchImports)+"<< ");

            if(matchImports !== null)
            {
                var prefix = ""

                if(importList.length > 0)
                {
                    // Create '__webpack_require__()' in place of 'px.import()' of modules
                    importList.map( (obj) =>
                    {
                        prefix += "\n  " + importVar + "." + obj.token + " = require('" + obj.path + "')";
                    })
                    prefix+= "\n\n";

                    var newImports = matchImports[0] + prefix;

                    // console.log(" -------- matchImports[0]: \n\n" + matchImports[0]);

                    myStr = myStr.replace(matchImports[0], newImports); // JEST >> REJECT - WHy ??

                    importList.map( (obj) =>
                    {
                        myStr = myStr.replace(obj.line, " // __SPARK_IMPORT_LOADER__ " + obj.line);
                    })
                }
            }//ENDIF
        }
        catch(e)
        {
            console.error("##  Caught exception - err: "+e );
        }
    }//WHILE

//    console.log(" -------- prefix: \n\n" + prefix);
//    console.log(" -------- RESULT: \n\n" + myStr);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    return myStr;
}
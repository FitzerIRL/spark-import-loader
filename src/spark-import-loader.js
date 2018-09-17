const loaderUtils = require("loader-utils");

module.exports = function(source, map) {

    const options = loaderUtils.getOptions(this);

    console.log("SPARK IMPORT LOADER: " + JSON.stringify(options) + "\n");

    var newSource = source; // copy to modify

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

px.import({ scene:      'px:scene.1.js',
             keys:      'px:tools.keys.js',
             ListBox: 'browser:listbox.js',
             EditBox: 'browser:editbox.js'
}).then( function importsAreReady(imports)
{

    Convert to -

        import.ref = "EditBox"
        import.key = "browser"
        import.val = "editbox.js"
*/

function parseImports(base, str)
{
    var reJson = /.*\.import\s*\(\s*\{([^}]*)\}\s*\).*/g;
    var myStr  = str; // to modify param

    var myImports = [];

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    var m = null;

    do
    {
        m = reJson.exec(myStr);
        if (m !== null)
        {
            try
            {
                var raw = m[1];
                    raw = raw.replace(/ /g,  "");
                    raw = raw.replace(/\n/g, "");

                var props = raw.split(',');

                // Parse JSON (ish) string to Object
                props.map(p =>
                {
                    var tup = p.split(':');
                    var obj = {};

                    if(tup && tup.length == 3)
                    {
                        var ref = tup[0];
                        var key = tup[1].replace(/^\s+|\s+$/g, "");
                        var val = tup[2].replace(/^\s+|\s+$/g, "");

                        // commas
                        key = key.replace(/,/g, "");
                        val = val.replace(/,/g, "");

                        // // single quotes
                        key = key.replace(/\'/g, "");
                        val = val.replace(/\'/g, "");

                        // // double quotes
                        key = key.replace(/\"/g, "");
                        val = val.replace(/\"/g, "");

                        obj['ref'] = ref;
                        obj['key'] = key;
                        obj['val'] = val;

                        if(key !== 'px') // built-in import ... SKIP !
                        {
                            if(typeof(obj.ref) !== 'undefined')
                            {
                                obj.key = resolveBase(base, obj.key);
                            }

                            myImports.push(obj)
                        }
                    }
                    // else
                    // {
                    //     console.log("## props >> props: " + props.length);
                    //     props.map( (pp, i) => { console.log("## props >> pp["+i+"]: " + pp);})
                    //     console.log("## BAD >> m[1]: " + m[1]);
                    // }
                });//map
            }
            catch(e)
            {
                console.log( "## FATAL:  Parse failed ! - "+ m.length + "\n" + "\n Error: [" + e + "]" );
            }
        }
    } while (m);


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Assemble resulting prefix...
    //
    var prefix = ""

    myImports.map( ( i, n) => { prefix += "var " + i.ref + "__ = require('./" + i.key + "/" + i.val + "'); // ## __spark-import-loader__ ## \n" })

    prefix += "\n\n"

    //console.log(" -------- prefix: \n\n" + prefix);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    return prefix + myStr;
}

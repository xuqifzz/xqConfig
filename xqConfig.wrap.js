(function(){
    var nodeCss=[
        "themes/default/easyui.css",
        "themes/color.css",
        "themes/icon.css",
        "themes/xqform.css",
    ]

    var loadJs=[
        'js/jquery.min.js',
        'js/jquery.easyui.min.js',
        'js/underscore-min.js',
        'js/moment.min.js',
        'js/xqConfig.js',
        'js/xqConfig.cache.js',
        'js/xqConfig.prop.js',
        'js/xqConfig.singleEntityConfig.js',
        'js/xqConfig.multiEntityConfig.js',
        'js/xqConfig.getUserInputData.js',
        'js/xqConfig.treeEntityConfig.js'
    ]


    var file, scripts = document.getElementsByTagName("script");   
    file = scripts[scripts.length - 1].getAttribute("src"); 
    var idex =file.lastIndexOf('/');
    if(idex == -1){
        file="";
    }else{
        file = file.substring(0,idex+1);
    }

    //  document.write('<script src="' + s + '"><\/script>')
    for(var i=0;i<nodeCss.length;i++){
        document.write('<link rel="stylesheet" type="text/css" href="'+ file + nodeCss[i]  +'">')
    }

    for(var i=0;i<loadJs.length;i++){
        document.write('<script src="' + file + loadJs[i]    +'"></script>')
    }


})();



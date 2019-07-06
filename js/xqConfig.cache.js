(function () {

    var CacheLoader = function(exeFun,hashFun){

        this.exeFun = exeFun;
        this.hashFun = hashFun;
        this.cache ={};

    }
    var p = CacheLoader.prototype;

    p.execute = function(cacheItem,paramList,callBackFun){
        var proxyFun = function(result){
            cacheItem.result = result;
            cacheItem.loadOk = true;
            callBackFun(result);
            _.each(cacheItem.waitList,function(fun){
                fun(result);
            });
            cacheItem.waitList = null;

        }
        var paramList2 = paramList.concat([proxyFun]);
        this.exeFun.apply(null,paramList2);
    }
    
    p.call = function(paramList,callBackFun){
        var hash = this.hashFun(paramList);
        var item = this.cache[hash];
        if(item){
            if(item.loadOk){
                callBackFun(item.result);
            }else{
                item.waitList.push(callBackFun);
            }

        }else{
            item = {loadOk :false,waitList:[]};
            this.cache[hash] = item;

            this.execute(item,paramList,callBackFun);
        }


    }


    var defaultHashFun = function(paramList){
        return  paramList.join("|_|_|");


    }



    xqConfig.toolFun.cacheAsynFun = function(exeFun,hashFun){
        var cacheLoader = new CacheLoader(exeFun,hashFun || defaultHashFun);
        return function(){
            var paramList = [];
            var callBackFun = arguments[arguments.length -1];
            for(var i=0; i< arguments.length -1;i++){
                paramList.push(arguments[i]);
            }
            cacheLoader.call(paramList,callBackFun);
        }
    }

})();
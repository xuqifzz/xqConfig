var xqConfig = window.xqConfig || {};

//环境配置
(function () {

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (str) {
            return !this.indexOf(str);
        }
    }

    var disableenableConfig = _
    var oldfun = $.fn.datagrid.defaults.editors.combobox.setValue;

    $.fn.datagrid.defaults.editors.combobox.setValue = function (target, value) {
        if(value === null || value === undefined)
            value="";
        else
            value = value.toString();
        return oldfun(target, value);
    }

    var oldfun2 = $.fn.datagrid.defaults.editors.datetimebox.setValue;
    $.fn.datagrid.defaults.editors.datetimebox.setValue = function (target, value) {
        if (value) {
            value = moment(parseInt(value));
        } else {
            value = moment();
        }

        return oldfun2(target, value.format("MM/DD/YYYY HH:mm:ss"));
    }

    var trimlastjin = function (str) {
        if (str && str.length > 0 && str[str.length - 1] == '#') {
            return str.substring(0, str.length - 1);
        }
        return str;
    }

    xqConfig.getUrlVars = function () {
        var vars = [],
            hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = trimlastjin(hash[1]);
        }
        return vars;
    }



})();

//工具函数
(function () {
    var toolFun = xqConfig.toolFun = {};

    var list2map = function (list1, list2) {
        var length = Math.min(list1.length, list2.length);
        var res = {};
        for (var i = 0; i < length; i++) {
            res[list1[i]] = list2[i]
        }
        return res;
    }

    var mapfun = function (map1, fun) {
        var res = {};
        for (var k in map1) {
            res[k] = fun(map1[k]);
        }
        return res;
    }
    var list2keyMap = function (list, key) {
        var dict = {}
        _.each(list, function (v) {
            dict[v[key]] = v;
        });
        return dict;
    }

    var excludeEntityByField = function (list, key, removekeyList) {
        if (removekeyList && removekeyList.length > 0) {
            return _.filter(list, function (t) {
                return !_.some(removekeyList, function (tt) {
                    return t[key] == tt;
                });
            })
        }
        return list;
    }


    var list2Prop = function (list) {
        var res = xqConfig.props.getPropConfig(list[2]);

        var cfg = {
            pname: list[0],
            title: list[1],
            defaultvalue: list[3],
            descr: list[4] ? list[4] : null,
        }
        return _.extend(res, cfg);
    }


    var loadJsons = function (listCfg, allDownFun) {
        var nowCount = 0;
        var fun1 = function () {
            if (nowCount == listCfg.length) {
                allDownFun();
            }
        }
        fun1();
        _.each(listCfg, function (cfg) {
            $.getJSON(cfg.url, function (res) {
                cfg.fun(res);
                nowCount++;
                fun1();
            })
        })
    }

    toolFun.list2Prop = list2Prop;
    toolFun.list2map = list2map;
    toolFun.mapfun = mapfun;
    toolFun.list2keyMap = list2keyMap;

    toolFun.loadJsons = loadJsons;

})();








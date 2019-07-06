//属性定义
(function () {
    var toolFun = xqConfig.toolFun;
    var config_props = xqConfig.props = {};
    var nullProp = config_props.nullProp = {
        editor: null,
        show: null
    };


    //常量键值对编辑器
    (function () {

        var kvdict = {}
        var kvitem = {}
        kvitem.disable = ['禁用', "false"];
        kvitem.enable = ['启用', "true"];
        kvdict.enable = [kvitem.disable, kvitem.enable];

        kvitem.yes = ['是', 1];
        kvitem.no = ['否', 0];

        kvdict.yesno = [kvitem.yes, kvitem.no];


        var transkvitem = function (item) {
            return toolFun.list2map(['text', 'value'], item);
        }

        var transkvdict = function (kvdictItem) {
            return _.map(kvdictItem, transkvitem);
        }

        var getcomboeditor = function (combo) {
            return {
                "type": "combobox",
                "options": {
                    "valueField": 'value',
                    "textField": 'text',
                    "editable": false,
                    "data": combo
                }
            }
        }

        var strbool = function (v) {
            if (v === false || v === true) {
                return v.toString();
            }
            return v;
        }

        var checkbool = function (v) {
            if (v === "false") {
                return false;
            } else if (v === "true") {
                return true;
            }
            return v;
        }

        var getshowfun = function (combo) {
            var item = combo;
            return function (value, fun) {
                value = strbool(value);
                var res = _.find(combo, function (x) {
                    return x.value == value;
                });
                res = res ? res.text : value;
                fun(res);
            }
        }

        var isNotEmpty = function (v) {
            return v || v === 0;
        }
        var getTransValuefun = function (combo) {
            var item = combo;
            return function (strvalue) {
                var res = _.find(combo, function (x) {
                    return x.value.toString() == strvalue;
                });
                res = isNotEmpty(res) ? res.value : strvalue;
                res = checkbool(res)
                return res;

            }
        }

        var transcombo = function (combo) {
            return {
                editor: getcomboeditor(combo),
                show: getshowfun(combo),
                transValue: getTransValuefun(combo)
            }
        }

        var transDirectValueCombo = function (list) {
            var list2 = [];
            _.each(list, function (item) {
                list2.push({
                    "text": item,
                    "value": item
                });
            })
            return transcombo(list2);
        }




        var comboboxDict = toolFun.mapfun(kvdict, transkvdict);
        var constkveditor = toolFun.mapfun(comboboxDict, transcombo);

        var regComboProp = function (name, list) {
            constkveditor[name] = transcombo(transkvdict(list));
        }




        config_props.transDirectValueCombo = transDirectValueCombo;
        config_props.constkveditor = constkveditor;
        config_props.regComboProp = regComboProp;



    })();


    //字符串编辑器
    (function () {


        var noedit = function (ptype) {
            if (ptype == 'noedit') {
                return nullProp;
            }
        }

        var timestampProp = {
            editor: 'datetimebox',
            show: function (value, fun) {
                var ss = moment(value);
                fun(ss.format("YYYY-MM-DD HH:mm:ss"));

            },
            transValue: function (value) {
                if (typeof value == 'number') {
                    return value;
                }
                var ss = moment(value, 'MM/DD/YYYY HH:mm:ss')
                return ss.toDate().getTime();
            }
        }

        var timestamp = function (ptype) {
            if (ptype == "timestamp") {
                return timestampProp;
            }
        }

        var constKVSelect = function (ptype) {
            return config_props.constkveditor[ptype];
        }

        var numberboxPre = 'numberbox';
        var numberbox = function (ptype) {

            if (ptype.startsWith(numberboxPre)) {
                var tmp = ptype.substring(numberboxPre.length)
                var bitpoint = tmp ? parseInt(tmp) : 0;
                return {
                    editor: {
                        "type": "numberbox",
                        "options": {
                            precision: bitpoint
                        }
                    },
                    show: function (value, fun) {
                        var tmp = value == null ? '' : value;
                        fun(tmp);

                    },
                    transValue: function (value) {
                        if (value === '' || value == null)
                            return null;
                        return parseFloat(value)
                    }
                }
            }
        }

        var combobox = function (ptype) {
            if (ptype.startsWith('combo_')) {
                var tmpstr = ptype.substring('combo_'.length);
                var tmplist = ptype.split('||');
                return config_props.transDirectValueCombo(tmplist);
            }
        }

        config_props.StringCheckFunList = [noedit, timestamp, constKVSelect, combobox, numberbox]
    })();



    var calcStringPropInfo = function (ptype) {
        var res = null;
        _.find(config_props.StringCheckFunList, function (fun) {
            return (res = fun(ptype));
        })
        return res ? res : {
            editor: ptype,
            show: null,
        };

    }

    var getPropInfo = function (ptype) {
        if (ptype == 'noedit') {
            return nullProp;
        }

        if ('string' == typeof ptype) {
            return calcStringPropInfo(ptype);
        }

        return ptype;

    }
    config_props.getPropInfo = _.memoize(getPropInfo);


    (function () {
        var PropConfig = function (propInfo) {
            this.propInfo = propInfo;
        }
        var p = PropConfig.prototype;


        //实际值显示
        p.getShowStr = function (v, fun) {
            if (this.propInfo.show) {
                this.propInfo.show(v, fun);
            } else {
                fun(v);
            }

        }

        //编辑器返回的属性转换为实际值
        p.transValue = function (v) {
            if (this.propInfo.transValue) {
                return this.propInfo.transValue(v);
            }
            return v;
        }

        //编辑属性时的editor
        p.getEditor = function () {
            return this.propInfo.editor;
        }

        // //创建新对象时的editor
        // p.getNewEditor = function(){

        // }




        config_props.getPropConfig = function (ptype) {
            var propInfo = config_props.getPropInfo(ptype);
            var res = new PropConfig(propInfo);
            res.ptype = ptype;
            return res;
        };




    })();


    (function () {

        var constDB = null;
        var setConstDB = function (db) {
            constDB = db;
        }



        var getSelectProp = function (type,context) {
            var propInfo = null;
            var cache = {}
            cache.waitFunList = [];
            cache.comboxRef = null;
            cache.waitLoading = true;

            var tmpFun = _.bind(function (data) {
                //  this.data = data;
                propInfo.editor.options.data = data;

                cache.dataMap = {}
                _.each(data, function (item) {
                    cache.dataMap[item.value] = item.text;
                });

                _.each(cache.waitFunList, function (waitItem) {
                    show(waitItem.v, waitItem.fun);
                })


                if (cache.comboxRef) {
                    cache.comboxRef.combobox({
                        data: data
                    });
                }
            }, this);

            var tryLoad = function () {
                if (cache.waitLoading) {
                    type.getData(tmpFun,context);
                    cache.waitLoading = false;
                }
            }



            var show = function (v, fun) {
                tryLoad();
                if (v === null || v === undefined) {
                    fun("");
                } else if (cache.dataMap) {
                    fun(cache.dataMap[v] || v);
                } else {
                    cache.waitFunList.push({
                        fun: fun,
                        v: v
                    });
                }
            }
            var transValue = function (v) {
                //  if(type.isInt){
                var res = parseInt(v);
                res = isNaN(res) ? v : res;
                if (res === "") {
                    res = null;
                }
                return res;

                // }
                // return v;
            }
            propInfo = {
                show: show,
                transValue: transValue,
                editor: {
                    "type": "combobox",
                    "options": {
                        "valueField": 'value',
                        "textField": 'text',
                        "editable": false,
                        onBeforeLoad: function () {
                            tryLoad();
                            cache.comboxRef = $(this);
                        }
                    }

                }
            };
            return propInfo;
        }


        var getTreeProp = function (type,context) {
            var propInfo = null;
            var cache = {}
            cache.waitFunList = [];
            cache.treeRef = null;
            cache.waitLoading = true;

            var buildDataMap = function(data){
                _.each(data,function(item){
                    cache.dataMap[item.id] = item.text;
                    if(item.children){
                        buildDataMap(item.children);
                    }
                })

            }

            var tmpFun = _.bind(function (data) {
                //  this.data = data;
                propInfo.editor.options.data = data;

                cache.dataMap = {}
                buildDataMap(data);
                _.each(cache.waitFunList, function (waitItem) {
                    show(waitItem.v, waitItem.fun);
                })

                if (cache.treeRef) {
                    cache.treeRef.combobox({
                        data: data
                    });
                }
            }, this);

            var tryLoad = function () {
                if (cache.waitLoading) {
                    type.getData(tmpFun,context);
                    cache.waitLoading = false;
                }
            }


            var show = function (v, fun) {
                tryLoad();
                if (v === null || v === undefined) {
                    fun("");
                } else if (cache.dataMap) {
                    fun(cache.dataMap[v] || v);
                } else {
                    cache.waitFunList.push({
                        fun: fun,
                        v: v
                    });
                }
            }
            var transValue = function (v) {
                //  if(type.isInt){
                var res = parseInt(v);
                res = isNaN(res) ? v : res;
                if (res === "") {
                    res = null;
                }
                return res;

                // }
                // return v;
            }
            propInfo = {
                show: show,
                transValue: transValue,
                editor: {
                    "type": "combotree",
                    "options": {                   
                        "editable": false,
                        onBeforeLoad: function () {
                            tryLoad();
                            cache.treeRef = $(this);
                        }
                    }

                }
            };
            return propInfo;
        }



        var PropDefine = function (name, title, type, editable, defaultValue, descr,calcWithContext) {
            this.name = name;
            this.title = title;
            this.type = type;
            this.editable = editable;
            this.defaultValue = defaultValue;
            this.descr = descr;
            this.calcWithContext = calcWithContext;
            // if (typeof type == 'string') {
            //     this.propInfo = config_props.getPropInfo(type);
            // };

            // if (type.type == 'select') {
            //     this.propInfo = getSelectProp(type);
            // }
            this.propInfo = this.createPropInfo(type);


        }

        var p = PropDefine.prototype;

        p.createPropInfo = function(type,context){
            if (typeof type == 'string') {
                return  config_props.getPropInfo(type);
            };

            if (type.type == 'select') {
                return  getSelectProp(type,context);
            }
            if (type.type == 'tree') {
                return  getTreeProp(type,context);
            }
            return null;
        }

        //实际值显示
        p.getShowStr = function (v, fun) {
            if (this.propInfo.show) {
                this.propInfo.show(v, fun);
            } else {
                fun(v);
            }

        }

        //编辑器返回的属性转换为实际值
        p.transValue = function (v) {
            if (this.propInfo.transValue) {
                return this.propInfo.transValue(v);
            }
            return v;
        }

        //编辑属性时的editor
        p.getEditor = function (context) {
            if (this.editable == 1 || this.editable == 3) {
                if (this.calcWithContext) {
                    return this.createPropInfo(this.type,context).editor;
                } else {
                    return this.propInfo.editor;
                }

            }
            return null;

        }
        // //创建新对象时的editor
        p.getNewEditor = function (context) {
            if (this.editable == 1 || this.editable == 2) {
                if (this.calcWithContext) {
                    return this.createPropInfo(this.type,context).editor;
                } else {
                    return this.propInfo.editor;
                }

            }
            return null;

        }
        xqConfig.props.PropDefine = PropDefine;

    })();





})();
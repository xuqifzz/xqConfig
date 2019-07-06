(function () {

    var getIdInfo = function (idstr) {
        var res = {
            isVtNode: false

        }

        if (idstr.startsWith('vtnode||')) {
            res.isVtNode = true;
            var tmp = idstr.split("||");
            res.subCategory = tmp[2];
            idstr = tmp[1];
        }
        var idex = idstr.lastIndexOf('_');
        res.id = parseInt(idstr.substring(idex + 1));
        res.category = idstr.substring(0, idex);
        if (res.category == 'vtroot' && res.id == 0) {
            res.isRoot = true;
        }
        return res;
    }


    var btnCfg = [{
            id: 'add',
            tip: '添加新项',
            check: function () {
                return this.funs.addFun;
            },
            icon: 'icon-add',
            click: function () {
                var node = this.treeCtrl.tree("getSelected");
                if (node == null || !node.attributes.subCategory) {
                    return;
                }
                var subCategory = node.attributes.subCategory;
                var idInfo = getIdInfo(node.id);
                var subEntityDefine=this.entityDefines[subCategory];
                if(subEntityDefine.forbidMark == 1 || subEntityDefine.forbidMark == 3){
                    return;
                }


                var fieldList = this.entityDefines[subCategory].fieldList;
                fieldList = _.filter(fieldList,function(field){
                    return field.name != 'parent';
                });

                var tmpFun2 = _.bind(function (newItem) {
                    if (newItem) {
                        this.reloadNode(node);
                        console.log(newItem);
                    }
                }, this);


                var tmpFun = _.bind(function (newItem) {
                    this.funs.addItem(subCategory, newItem, idInfo.id, tmpFun2);
                }, this);
                var context={parentId:idInfo.id,category:subCategory};
                xqConfig.getUserInputData(fieldList, '添加' + subEntityDefine.title, {}, tmpFun,context);
            }
        },
        {
            id: 'remove',
            tip: '删除选中项',
            icon: 'icon-remove',
            click: function () {
                var node = this.treeCtrl.tree("getSelected");
                if (node == null) {
                    return;
                }
                var idInfo = getIdInfo(node.id);
                if (idInfo.isVtNode) {
                    return;
                }

                var entityDefine = this.entityDefines[idInfo.category];
                if(entityDefine.forbidMark == 2 || entityDefine.forbidMark == 3){
                    return;
                }

                var tmpFun2 = _.bind(function () {
                    // this.treeCtrl.tree('remove', node.target);
                    var parentNode = this.treeCtrl.tree('getParent', node.target);
                    this.reloadNode(parentNode);

                }, this);

                var tmpFun = _.bind(function (r) {
                    if (r) {
                        this.funs.deleteItem(idInfo.category, idInfo.id, tmpFun2);
                    }

                }, this);

                $.messager.confirm('确认删除', "确定要删除该项吗? 所有子项都会被删除且无法恢复", tmpFun);


            }
        }
    ];

    //  var idProp = [xqConfig.toolFun.list2Prop(['id', 'ID', 'text', null])];
    var idProp = [new xqConfig.props.PropDefine('id', 'ID', 'text', 0, null)];

    var treeEntityConfig = function (parentSelector) {
        var layOutDiv = this.layOutDiv = $('<div  style="overflow:hidden"></div>').appendTo(parentSelector);
        layOutDiv.layout({
            fit: true
        });
        var leftTreeWidth = 240;
        var headHeight = 26;
        layOutDiv.layout('add', {
            region: 'west',
            width: leftTreeWidth,
        });
        var jqWsetPanel = this.jqWsetPanel = layOutDiv.layout('panel', 'west');
        var layOutWest = this.layOutWest = $('<div  style="overflow:hidden"></div>').appendTo(jqWsetPanel);
        layOutWest.layout({
            fit: true
        });
        layOutWest.layout('add', {
            region: 'north',
            height: headHeight,
        });
        var jqMenuDiv = this.jqMenuDiv = layOutWest.layout('panel', 'north');
        jqMenuDiv.css("overflow", "hidden");

        layOutWest.layout('add', {
            region: 'center'
        });
        var treePanel = this.treePanel = layOutWest.layout('panel', 'center');
        var treeCtrl = this.treeCtrl = $('<ul></ul>').appendTo(treePanel);

        var addSubItemFun = _.bind(function (node, subItems) {
            var tmp = this.calcChildren(subItems);
            this.treeCtrl.tree("append", {
                parent: node.target,
                data: tmp
            });
            node.loadok = 1;
            this.treeCtrl.tree("collapse", node.target);
            this.treeCtrl.tree("expand", node.target);
            this.treeCtrl.tree("update", {
                target: node.target,
                iconCls: null
            });

        }, this);

        var addItemFun = _.bind(function (idInfo, node) {

            this.treeCtrl.tree("update", {
                target: node.target,
                iconCls: "tree-loading"
            });

            if (idInfo.isRoot) {
                this.funs.getAllItem(idInfo.subCategory, function (subItems) {
                    addSubItemFun(node, subItems);
                });
            } else {
                this.funs.getChildren(idInfo.category, idInfo.id, idInfo.subCategory, function (subItems) {
                    addSubItemFun(node, subItems);

                });
            }

        }, this);

        var onBeforeExpandFun = _.bind(function (node) {
            if (!node.loadok) {
                var idInfo = getIdInfo(node.id);
                if (idInfo.isVtNode) {
                    addItemFun(idInfo, node);


                } else if (node.attributes.children.length == 1) {
                    var idInfo2 = getIdInfo(node.attributes.children[0].id);
                    addItemFun(idInfo2, node);


                }
            }

        }, this);

        var onSelectFun = _.bind(function (node) {
            //  this.propEditor.refreshGrid()


            var idInfo = getIdInfo(node.id);
            if (!idInfo.isVtNode) {
                var tmpFun = _.bind(function (tmpItem) {
                    var content = tmpItem.content;
                    content.id = idInfo.id;
                    var onchangeFun = _.bind(function (change) {
                        this.funs.updateItem(tmpItem.category, tmpItem.id, change, _.noop);
                        if (change['title']) {
                            this.treeCtrl.tree('update', {
                                target: node.target,
                                text: change['title']
                            });
                        }
                        node.attributes.content  = _.extend(node.attributes.content,change);
                    }, this);
                    var fieldList = idProp.concat(this.entityDefines[idInfo.category].fieldList);
                    fieldList = _.filter(fieldList,function(field){
                        return field.name != 'parent';
                    });
                    var context ={id:idInfo.id,category:idInfo.category,content:content}
                    this.propEditor.refreshGrid(fieldList, content, onchangeFun,context);
                }, this);
                this.funs.getItem(idInfo.category, idInfo.id, tmpFun);

            } else {
                this.propEditor.refreshGrid([], {}, null)
            }

            //  console.log(node);

        }, this);

        treeCtrl.tree({
            onBeforeExpand: onBeforeExpandFun,
            onSelect: onSelectFun

        });


        layOutDiv.layout('add', {
            region: 'center'
        });
        var jqDiv = this.jqDiv = layOutDiv.layout('panel', 'center');

        var propEditor = this.propEditor = new xqConfig.singleEntityConfig(jqDiv);
        // propEditor.setWorkMode('new');
        this.initMenu();

    }

    var p = treeEntityConfig.prototype;


    p.initMenu = function () {
        if (!this.jqMenuDiv) return;
        this.jqMenuDiv.html('');
        _.each(btnCfg, function (cfg) {
            // var atxt = cfg.text || "";
            // // <a href="#" class="easyui-linkbutton" plain="true" onclick="filterManager.openFilterDlg()" title="过滤设置">滤</a>
            // var atiem = $('<a href="#" plain="true" title="' + cfg.tip + '">' + atxt + '</a>').appendTo(this.jqMenuDiv);
            // var btnOpt = {}
            // if (cfg.icon) {
            //     btnOpt.iconCls = cfg.icon;
            // }
            // atiem.linkbutton(btnOpt);

            // atiem.bind('click', _.bind(cfg.click, this));
            this.addButton(cfg);

        }, this)


    }


    p.addButton = function (cfg) {
        if (!this.jqMenuDiv) return;
        var atxt = cfg.text || "";
        // <a href="#" class="easyui-linkbutton" plain="true" onclick="filterManager.openFilterDlg()" title="过滤设置">滤</a>
        var atiem = $('<a href="#" plain="true" title="' + cfg.tip + '">' + atxt + '</a>').appendTo(this.jqMenuDiv);
        var btnOpt = {}
        if (cfg.icon) {
            btnOpt.iconCls = cfg.icon;
        }
        atiem.linkbutton(btnOpt);

        atiem.bind('click', _.bind(cfg.click, this));

    }

    p.reloadNode = function (node) {
        node.children = null;
        node.loadok = null;
        this.treeCtrl.tree('reload', node.target);
    }

    p.getChildrenCategoryNames = function (category) {
        // var res = [];
        // _.each(this.entityDefines, function (v, k) {
        //     if (v.parent == category) {
        //         res.push(k);
        //     }
        // })
        // return res;

        var res = this.entityDefines[category].children || [];
        return res;
    }


    p.getChildrenFolders = function (item) {
        var children = this.getChildrenCategoryNames(item.category);

        return _.map(children, function (child) {
            var entity = this.entityDefines[child];
            return {
                id: 'vtnode||' + item.category + "_" + item.id + '||' + child,
                text: entity.title,
                state: "closed",
                attributes: {
                    subCategory: child
                }
            }
        }, this);


    }

    p.getItemNode = function (item) {
        var newId = item.category + "_" + item.id;
        var children = this.getChildrenFolders(item);
        var attributes = {
            children: children,
            content: item.content,
        };
        if (children.length == 1) {
            attributes.subCategory = children[0].attributes.subCategory;
        }

        var state = children.length == 0 ? "open" : "closed";
        var res = {
            id: newId,
            text: item.content.title,
            state: state,
            attributes: attributes
        };
        if (children.length > 1) {
            res.children = children;
        }
        return res;
    }

    p.calcChildren = function (items) {
        return _.map(items, this.getItemNode, this);
    }

    p.refreshTree = function (entityDefines, initCategoryList, funs) {
        this.entityDefines = entityDefines;
        this.funs = funs;
        this.initCategoryList = initCategoryList;

        var initNodeList = [];
        _.each(initCategoryList, function (category) {
            var entityDescr = entityDefines[category];
            var item = {
                id: 'vtnode||vtroot_0||' + category,
                text: entityDescr.title,
                state: "closed",
                attributes: {
                    subCategory: category
                }
            }
            initNodeList.push(item);

        }, this);

        this.treeCtrl.tree('loadData', initNodeList);

        // var fun = _.bind(function (roots) {
        //     var items = this.calcChildren(roots);
        //     this.treeCtrl.tree('loadData', items);
        // }, this);

        // funs.getRoots(fun);

    }

    xqConfig.treeEntityConfig = treeEntityConfig;

})();
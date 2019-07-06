(function () {
    var multiEntityConfig = function (parentSelector, boolWithMenu) {

        this.boolWithMenu = boolWithMenu;
        var headHeight = 0;
        if (!boolWithMenu) {
            var jqDiv = this.jqDiv = $('<div  style="overflow:hidden"></div>').appendTo(parentSelector);

        } else {
            var layOutDiv = this.layOutDiv = $('<div  style="overflow:hidden"></div>').appendTo(parentSelector);
            layOutDiv.layout({
                fit: true
            });
            headHeight = 26;
            layOutDiv.layout('add', {
                region: 'north',
                height: headHeight,
            });
            var jqMenuDiv = this.jqMenuDiv = layOutDiv.layout('panel', 'north');
            jqMenuDiv.css("overflow", "hidden");

            layOutDiv.layout('add', {
                region: 'center'
            });
            var jqDiv = this.jqDiv = layOutDiv.layout('panel', 'center');
            jqDiv.css("overflow", "hidden");

        }
        var grid = this.grid = $('<table width="800px"  ></table>').appendTo(jqDiv);
        this.jqDiv.panel({
            border: false,
            fit: true,
            onResize: function (w, h) {
                grid.datagrid({
                    "height": h - headHeight,
                    "width": w
                });
            }
        });

        this.jqDiv.panel('resize');
        grid.datagrid({
            data: [],
            fitColumns: true,
            ctrlSelect: true,
            selectOnCheck: false
        });
    }

    var p = multiEntityConfig.prototype;


    var btnCfg = [{
            id: 'add',
            tip: '添加新项',
            check: function () {
                return this.funs.addFun;
            },
            icon: 'icon-add',
            click: function () {
                xqConfig.getUserInputData(this.addPropInfoList, '添加新项', {}, _.bind(function (item) {
                    this.funs.addFun(item, _.bind(function (newItem) {
                        if (newItem) {
                            this.addData([newItem]);
                        }
                    }, this));
                }, this))
            }
        },
        {
            id: 'remove',
            tip: '删除选中项',
            check: function () {
                return this.funs.removeFun;
            },
            icon: 'icon-remove',
            click: function () {
                this.deleteData(_.bind(function (deleted, fun) {
                    if (deleted.length > 0) {
                        tipmsg = "确定要删除选中的" + deleted.length + "行数据吗?";
                        $.messager.confirm('确认删除', tipmsg, _.bind(function (r) {
                            this.funs.removeFun(deleted, _.bind(fun, this));
                        }, this));
                    }

                }, this))
            }
        },
        {
            id: 'submit',
            tip: '提交选中的修改项',
            check: function () {
                return this.funs.submitFun;
            },
            icon: 'icon-save',
            click: function () {
                this.submitChanges(_.bind(function (changes, fun) {
                    this.funs.submitFun(changes, _.bind(function (r) {
                        fun(r);
                        if (r) {
                            $.messager.show({
                                title: '提交成功',
                                msg: '此次提交包含' + changes.length + '行数据修改',
                                timeout: 5000,
                                showType: 'slide'
                            });
                        }

                    }, this));

                }, this));
            }
        },
        {
            id: 'undo',
            tip: '撤销选中的修改项',
            check: function () {
                return true;
            },
            icon: 'icon-undo',
            click: function () {
                this.cancelEdit();

            }
        },
        {
            id: 'allSelect',
            tip: '全选所有行',
            check: function () {
                return true;
            },
            text: '全',
            click: function () {
                this.allSelect();

            }
        },
        {
            id: 'antiSelect',
            tip: '反选所有行',
            check: function () {
                return true;
            },
            text: '反',
            click: function () {
                this.antiSelect();

            }
        },


    ]


    p.initMenu = function () {
        if (!this.jqMenuDiv) return;
        this.jqMenuDiv.html('');
        _.each(btnCfg, function (cfg) {
            this.addButton(cfg);
        }, this)


    }

    p.addButton = function (cfg) {
        if (cfg.check) {
            var checkFun = _.bind(cfg.check, this);
            if (!checkFun())
                return;
        }


        var atxt = cfg.text || "";
        var atiem = $('<a href="#" plain="true" title="' + cfg.tip + '">' + atxt + '</a>').appendTo(this.jqMenuDiv);
        var btnOpt = {}
        if (cfg.icon) {
            btnOpt.iconCls = cfg.icon;
        }
        atiem.linkbutton(btnOpt);
        atiem.bind('click', _.bind(cfg.click, this));


    }

    var isEmpty = function (v) {
        return v !== 0 && !v;
    };

    var checkEmpty = function (v) {
        if (v === 0) return false;
        return !v;
    };

    var checkEqual = function (v1, v2) {
        if (v1 === v2) return true;
        if (v1 == v2) {
            return !(v1 === 0 || v2 === 0);
        }
        return checkEmpty(v1) && checkEmpty(v2);

    };

    p.formatterFactory = function (prop) {
        var grid = this.grid;
        return function (val, row,rowIndex) {
            var bchanged = false;
            var val = prop.transValue(val);
            var hasReturn = false;
            prop.getShowStr(val, function (showValue) {
                val = showValue;
                if (hasReturn) {
                    grid.datagrid('refreshRow', rowIndex)
                }
            });
            hasReturn = true;
            if (!checkEqual(row[prop.name], row['cached_' + prop.name])) {
                bchanged = true;
                if (val === '') {
                    val = '[置为空]';
                }
            }
            if (bchanged) {
                val = ' <font color = "blue">' + val + '</font>'
            }
            return val;
        }
    }

    var sorterFun = function (v1, v2) {
        v1 = isEmpty(v1) ? '' : v1;
        v2 = isEmpty(v2) ? '' : v2;
        if (typeof (v1) == 'number' && typeof (v2) ==
            'number') return v1 - v2;
        v1 = '' + v1;
        v2 = '' + v2;
        if (v1 == v2) return 0;
        return v1 > v2 ? 1 : -1;
    }


    p.endEdit = function () {
        if (this.curEditRow == 0 || this.curEditRow) {
            this.grid.datagrid('endEdit', this.curEditRow);
            this.curEditRow = null;
            return true;
        }
        return false;
    }

    p.getCol = function (field) {
        return _.find(this.cols, function (c) {
            return c.field == field;
        })
    }
    p.removeAllEditor = function () {
        _.each(this.cols, function (c) {
            c.editor = null;
        });
    }

    p.setEditor = function (field) {
        var col = this.getCol(field);
        col.editor = col.propInfo.getEditor();
        return col.editor;
    }

    var clickRow = function (index, row) {
        this.endEdit();
    }

    var dblClickCell = function (index, field, value) {
        console.log(field);
        this.endEdit();
        var grid = this.grid;

        if (this.setEditor(field)) {
            grid.datagrid('selectRow', index);
            this.edittingRows = grid.datagrid('getSelections');
            grid.datagrid('beginEdit', index);
            this.curEditRow = index;
            var ed = grid.datagrid('getEditor', {
                index: index,
                field: field
            });
            $(ed.target).focus();
        }

    }

    p.refreshRows = function (rows) {
        _.each(rows, function (row) {
            var rowIndex = this.grid.datagrid('getRowIndex', row);
            this.grid.datagrid('refreshRow', rowIndex);
        }, this);
    }

    var afterEdit = function (index, row, changes) {
        var fields = _.keys(changes);
        this.removeAllEditor();
        _.each(fields, function (field) {
            var col = this.getCol(field);
            var value = col.propInfo.transValue(changes[field]);
            _.each(this.edittingRows, function (currow) {
                currow[field] = value;
            });
            //  col.editor = null;
        }, this);
        this.refreshRows(this.edittingRows);
    }

    p.allSelect = function () {
        this.grid.datagrid('selectAll');
    }

    p.antiSelect = function () {
        var grid = this.grid;
        var nowSelects = grid.datagrid('getSelections');
        grid.datagrid('selectAll');
        _.each(nowSelects, function (row) {
            grid.datagrid('unselectRow', grid.datagrid('getRowIndex', row));
        })

    }


    p.initRowProp = function (dataList) {
        _.each(dataList, function (entity) {
            _.each(this.propList, function (prop) {
                if (entity[prop.name] === undefined || entity[prop.name] === null) {
                    entity[prop.name] = prop.defaultvalue;
                }
                entity['cached_' + prop.name] = entity[prop.name];
            });
        }, this);
    }
    p.addData = function (newDataList) {
        this.initRowProp(newDataList);
        this.initDataList = newDataList.concat(this.initDataList);
        this.grid.datagrid({
            data: this.initDataList
        });

    }

    p.saveSelectedRows = function () {
        this.selectedRowsReocrd = this.grid.datagrid('getSelections');

    }
    p.loadSelectdRows = function () {
        var grid = this.grid;
        if (this.selectedRowsReocrd) {
            _.each(this.selectedRowsReocrd, function (row) {
                grid.datagrid('selectRow', grid.datagrid('getRowIndex', row));
            })
        }
        this.selectedRowsReocrd = null;
    }


    var sortCol = function (sort, order) {
        var grid = this.grid;
        console.log(sort + ' ' + order);
        this.saveSelectedRows();
        var nowLines = this.initDataList;
        nowLines.sort(function (v1, v2) {
            if (order == 'asc') {
                return sorterFun(v1[sort], v2[sort]);
            } else {
                return sorterFun(v2[sort], v1[sort]);
            }

        });
        grid.datagrid({
            data: nowLines
        });
        this.loadSelectdRows();


    }


    p.refreshGrid = function (propList, keyFields, initDataList, funs) {

        this.initDataList = initDataList;
        var cols = this.cols = [];
        this.keyFields = keyFields || [];
        this.funs = funs;
        this.submitFun = funs.submitFun;
        this.propList = propList;

        this.addPropInfoList = _.filter(this.propList, function (p) {
            return !_.some(this.keyFields, function (f) {
                return p.name == f;
            }, this);
        }, this);
        _.each(propList, function (prop) {
            cols.push({
                field: 'cached_' + prop.name,
                name: prop.name,
                title: prop.title,
                width: 100,
                formatter: this.formatterFactory(prop),
                isShow: !prop.defaultHide,
                sortable: true,
                sorter: sorterFun,
                propInfo: prop
            });
        },this);
        this.initMenu();

        this.initRowProp(initDataList);


        this.grid.datagrid({
            columns: [cols],
            data: initDataList,
            onDblClickCell: _.bind(dblClickCell, this),
            onClickRow: _.bind(clickRow, this),
            onAfterEdit: _.bind(afterEdit, this),
            onSortColumn: _.bind(sortCol, this)

        });
        console.log(1);

    }

    p.filterKeyFieldByRow = function (row) {
        var keyItem = {};
        _.each(this.keyFields, function (keyField) {
            keyItem[keyField] = row[keyField];
        })
        return keyItem;
    }

    p.filterKeyField = function (list) {
        return _.map(list, this.filterKeyFieldByRow, this);
    }



    p.deleteData = function (fun) {
        var pthis = this;
        var nowlines = this.grid.datagrid('getSelections');

        if (!nowlines || nowlines.length == 0) return;
        var deleteds = this.filterKeyField(nowlines);

        if (deleteds.length > 0) {

            fun(deleteds, function (r) {
                if (r) {
                    pthis.initDataList = _.difference(pthis.initDataList, nowlines);
                    pthis.grid.datagrid({
                        data: pthis.initDataList
                    });
                }

            });
        }
    }
    p.cancelEdit = function () {

        var rows = this.grid.datagrid('getSelections');
        this.initRowProp(rows);
        this.refreshRows(rows);


    }

    p.submitChanges = function (fun) {
        var changes = [];

        var changedRows = [];
        var nowlines = this.grid.datagrid('getSelections');
        var pthis = this;



        if (!nowlines || nowlines.length == 0) return;
        _.each(nowlines, function (row) {
            var change = {
                content: {},
                nochanged: 1
            }
            _.each(this.keyFields, function (keyField) {
                change[keyField] = row[keyField];
            })

            _.each(this.cols, function (col) {
                if (!checkEqual(row[col.name], row[col.field])) {
                    row[col.name] = row[col.field];
                    change.content[col.name] = row[col.name];
                    delete change['nochanged'];
                }
            });

            if (!change.nochanged) {
                changes.push(change);
                changedRows.push(row);
            }
        }, this);

        if (changes.length > 0) {

            fun(changes, function (r) {
                if (r) {
                    pthis.refreshRows(changedRows);
                }
            });

            // var postdata = {
            //     updateList: JSON.stringify(changes)
            // };
            // $.post("/zsec/admin/setConfig", postdata, function () {
            //     refreshRows(changedRows);
            //     $.messager.show({
            //         title: '提交成功',
            //         msg: '此次提交包含' + changes.length + '行,共计' + changeCount + '处修改',
            //         timeout: 5000,
            //         showType: 'slide'
            //     });

            // });
        }



    }


    xqConfig.multiEntityConfig = multiEntityConfig;
})();
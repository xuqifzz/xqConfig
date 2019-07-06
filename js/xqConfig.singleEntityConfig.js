(function () {

    function formatPropGrid(value, row, rowIndex) {


        //console.log(this);
     //   var rValue = row.propInfo.transValue(value);
   
        var retValue = value;

        var hasReturn = false;
        row.propInfo.getShowStr(value, function (showValue) {
            retValue = showValue;
            if (hasReturn) {
                row.propGrid.propertygrid('refreshRow', rowIndex)
            }

        });


        hasReturn = true;
        return retValue;
    }
    $.extend($.fn.propertygrid.defaults.columns[0][1], {
        formatter: formatPropGrid
    });

    var isNotEmpty=function(v){
        return v || v ===0;
    }
    var ifEmpty=function(v,defaultValue){
        return isNotEmpty(v) ? v : defaultValue;
    }

    var handleReset = function(){
       // var row = this.propGrid.propertygrid('getSelected')

    //    var newvalue = {};
    //    newvalue[row.props.pname] = row.props.defaultvalue;
    //    row.value = row.props.defaultvalue;
    //    $('#ctrlpropgrid').propertygrid('refreshRow', curproprow.index);
    //    var postdata = {
    //        category: curnode.attributes.nodetype,
    //        id: curnode.attributes.id,
    //        content: JSON.stringify(newvalue)
    //    };

    //    $.post(cfgurl.updateItem, postdata);
        if( this.curRow){
            var row = this.curRow.row;
            var newvalue = {};
            newvalue[row.propInfo.name] = row.propInfo.defaultValue;
            this.submitFun(newvalue);
            row.value = row.propInfo.defaultValue;
            this.propGrid.propertygrid('refreshRow', this.curRow.index);

        }


    }


    var singleEntityConfig = function (jqDiv) {
        this.jqDiv = jqDiv;
        this.propGrid = $('<table style="width:100%"></table>').appendTo(jqDiv);
        this.propGrid.propertygrid({});
        this.workMode = 'edit';

        this.resetBtn = $('<a href="#">重置选中属性</a>').appendTo(jqDiv);
        this.fieldDescr = $('<div></div>').appendTo(jqDiv);
       
        this.resetBtn.linkbutton({
            iconCls: 'icon-undo'
        });
       this.resetBtn.bind('click', _.bind(handleReset,this));

       // this.fieldDescr.hide();
        this.resetBtn.hide();
        
    }

    var p = singleEntityConfig.prototype;

    p.setWorkMode = function (workMode) {
        this.workMode = workMode;
    }

    p.getEditor = function(prop){
        return this.workMode == 'new' ? prop.getNewEditor(this.context) : prop.getEditor(this.context);
    }

    var onSelectFun = function(index, row) {
        this.curRow = {
            row: row,
            index: index
        };
        if (row.descr) {
            this.fieldDescr.text(row.descr);
        } else {
            this.fieldDescr.text('');
        }
        if (row.editor) {

            this.resetBtn.show();
        } else {
            this.resetBtn.hide();
        }
    }

    p.refreshGrid = function (propList, initData, submitFun,context) {
        console.log(context);
        this.context = context;
        this.curRow = null;
        this.propList = propList;
        this.initData = initData;
        this.submitFun = submitFun;
        this.propGrid.propertygrid({
            data: [],
            onEndEdit: function (index, row, changes) {
                var newvalue = {};
                newvalue[row.propInfo.name] = row.value = row.propInfo.transValue(row.value);
                submitFun(newvalue);
            },
            onSelect: _.bind(onSelectFun,this)

        });

        this.rowCount =0;
        _.each(propList, function (prop) {
            var editor = this.getEditor(prop);

            var row = {
                name: prop['title'],
                value: ifEmpty(initData[prop['name']],prop['defaultValue']),
                group: 'default',
                propInfo: prop,
                editor: editor,
                propGrid: this.propGrid,
                descr:prop.descr
            };
            if (initData[prop['name']] === 0) row.value = 0;
            if (this.workMode == 'new' && editor == null) {
                return;
            }
            this.propGrid.propertygrid('appendRow', row);
            this.rowCount++;
        }, this);


    }
    p.getAllValue = function () {
        var res = {};
        _.each(this.propGrid.propertygrid("getData").rows, function (row) {
            res[row.propInfo.name] = row.value;
        });
        return res;
    }


    xqConfig.singleEntityConfig = singleEntityConfig;
})();
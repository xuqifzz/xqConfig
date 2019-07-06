


(function () {
    
        var dlg = null;
        var sec = null;
    
        var initdlg = function () {
            if (!dlg) {
                dlg = $('<div id="xqConfigUserInputDiv">').appendTo('body');
                var gridDiv = $('<div width="100%">').appendTo(dlg);
                sec = new xqConfig.singleEntityConfig(gridDiv);
                sec.setWorkMode('new');
    
            }
    
        }
    
        var getUserInputData = function (propList, title, initData, fun,context) {
            initdlg();
            sec.refreshGrid(propList, initData, function () {},context);
            var dlgHeight = 120 + 36 * sec.rowCount;
    
            dlg.dialog({
                title: title,
                width: 400,
                height: dlgHeight,
                closed: true,
                modal: true,
                buttons: [{
                    iconCls: "icon-ok",
                    text: '确 定',
                    handler: function () {
                        fun(sec.getAllValue());
                        dlg.dialog('close');
                    }
                }]
            });
            dlg.dialog('open');
            
    
        }
    
        xqConfig.getUserInputData = getUserInputData;
    
    
    
    })();
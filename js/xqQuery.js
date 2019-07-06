var xqQuery = {};



(function () {
    "use strict";
    var regViewList = xqQuery.regViewList = [];

    var ViewLoader = function (parentSelector, boolWithDate) {
        this.boolWithDate = boolWithDate;
        var headHeight = 0;
        if (boolWithDate) {
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

        } else {
            var jqDiv = this.jqDiv = $('<div  style="overflow:hidden"></div>').appendTo(parentSelector);
        }
        this.initMenu();
        

    }


    var p = ViewLoader.prototype;

    p.initMenu = function () {
        if (!this.jqMenuDiv) return;
        this.jqMenuDiv.html('');
        $('<span>开始日期:</span>').appendTo(this.jqMenuDiv);
        var startDayUi = this.startDayUi = $('<input type="text" />').appendTo(this.jqMenuDiv);
        startDayUi.datebox({
            required: true
        });
        $('<span>结束日期:</span>').appendTo(this.jqMenuDiv);
        var endDayUi = this.endDayUi = $('<input type="text" />').appendTo(this.jqMenuDiv);
        endDayUi.datebox({
            required: true
        });

        var tmpd = moment().format('MM/DD/YYYY');
        startDayUi.datebox('setValue', tmpd);
        endDayUi.datebox('setValue', tmpd);

        var logQueryBtn = this.logQueryBtn = $('<a href="#" plain="true" title="查询日志">查询日志</a>').appendTo(this.jqMenuDiv);
        logQueryBtn.linkbutton({});
        logQueryBtn.bind('click', _.bind(function () {
            var startday = startDayUi.datebox('getValue');
            var endday = endDayUi.datebox('getValue');
            var sm = moment(startday, 'MM/DD/YYYY'); //.format('YYYY-MM-DD HH:mm:ss')
            var em = moment(endday, 'MM/DD/YYYY').add(1, 'd');
            var startpoint = sm.toDate().getTime();
            var endpoint = em.toDate().getTime();
            this.queryLog(startpoint, endpoint);
        }, this));





    }

    p.refreshViews = function (cfgInfo, funs) {
        this.clean();
        this.tab = $("<div></div>");
        this.jqDiv.append(this.tab);
        this.cfgInfo = cfgInfo;
        this.funs = funs;
        this.tab.tabs({
            fit: true
        });
        var tabindex = 0;

        if (cfgInfo.realtimeInterval) {
            this.rtTick = setInterval(_.bind(function () {
                this.refreshRealtimeValue();
            }, this), cfgInfo.realtimeInterval);
        }

        _.each(regViewList, function (vc) {
            if (vc.check(cfgInfo)) {
                this.tab.tabs('add', {
                    title: vc.title,
                    index: tabindex
                });
                var tabpannel = this.tab.tabs("getTab", tabindex);
                var view = new vc(tabpannel, cfgInfo);
                this.viewList.push(view);

                tabindex++;


            }
        }, this);
        this.tab.tabs('select',0);



    }

    p.refreshRealtimeValue = function () {
        this.funs.getVarValue(_.bind(function (value) {
            _.each(this.viewList, function (view) {
                if (view.newValueHandler) {
                    view.newValueHandler(value);
                }
            });
        }, this));
    }

    p.queryLog = function (startpoint, endpoint) {
        this.funs.getVarLog(startpoint, endpoint, _.bind(function (logs) {
            _.each(this.viewList, function (view) {
                if (view.refreshLogHandler) {
                    view.refreshLogHandler(logs);
                }

            });
        }, this));

    }

    p.clean = function () {
        if (this.rtTick) {
            clearInterval(this.rtTick);
            this.rtTick = null;
        }

        _.each(this.viewList, function (v) {
            v.clean();
        });
        this.viewList = [];
        if (this.tab) {
            this.tab.remove();
            this.tab = null;
        }
    }


    xqQuery.ViewLoader = ViewLoader;


})();


(function () {
    "use strict";

    var gettimestr = function (t) {
        if (!t)
            t = new Data();
        return moment(t).format("YYYY/MM/DD HH:mm:ss");
    }
    xqQuery.gettimestr = gettimestr;

    var getEchartsDafaultOpt = function (cfgInfo) {

        return {
            title: {

            },
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    params = params[0];
                    if (params.value == null || params.value[1] == null) return null;
                    var date = new Date(params.name);
                    var val = params.value[1];
                    return xqQuery.gettimestr(date) + ' ' + val;


                },
                axisPointer: {
                    animation: false
                }
            },
            xAxis: {
                type: 'time',
                splitLine: {
                    show: false
                }
            },
            yAxis: {
                type: 'value',
                boundaryGap: [0, '100%'],
                splitLine: {
                    show: false
                }
            },
            dataZoom: [{
                show: true,
                start: 80,
                end: 100,
                handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                handleSize: '80%',
                handleStyle: {
                    color: '#fff',
                    shadowBlur: 3,
                    shadowColor: 'rgba(0, 0, 0, 0.6)',
                    shadowOffsetX: 2,
                    shadowOffsetY: 2
                }
            }, {
                type: 'inside',
                start: 80,
                end: 100,
            }],
            series: [{
                name: '模拟数据',
                type: 'line',
                showSymbol: false,
                hoverAnimation: false,
                step: '', //end
                markLine: {
                    silent: true,
                    symbolSize: 5,
                    label: {
                        normal: {
                            show: true,
                            position: "middle",
                            formatter: function (params) {
                                return params.name + ":" + params.value
                            }
                        }
                    },
                }
            }]
        };;

    }

    xqQuery.getEchartsDafaultOpt = getEchartsDafaultOpt;

}());


(function () {
    "use strict";



    var gettimestr = xqQuery.gettimestr;

    var ConstructFunction = function (panel, cfgInfo) {
        this.cfgInfo = cfgInfo;
        this.panel = panel;

        var tmp = this.panel.panel('body');

        this.echarts = tmp;

        this.echartsInst = echarts.init(this.echarts[0]);
        var pthis = this;
        this.panel.panel({
            onResize: function (w, h) {
                pthis.updateLiveChartSize(w, h);
            }
        });
        this.initEChart()
    }
    ConstructFunction.check = function (cfgInfo) {
        return true;
    }

    ConstructFunction.title = '实时曲线';

    var p = ConstructFunction.prototype;

    p.newValueHandler = function (v) {
        var data = this.data;
        var now = new Date();
        data.shift();
        data.push({
            name: now.toString(),
            value: [
                gettimestr(now),
                v
            ]
        });
        this.echartsInst.setOption({
            series: [{
                data: data
            }]
        });
    }


    p.initEChart = function () {
        var cfgInfo = this.cfgInfo;
        var now = +new Date();
        var maxnum = 200;
        now = new Date(+now - maxnum * 1000);
        var data = this.data = [];
        for (var i = 0; i < maxnum; i++) {
            data.push({
                name: now.toString(),
                value: [
                    gettimestr(now),
                    null
                ]
            });
            now = new Date(+now + 1000);
        }

        var option = xqQuery.getEchartsDafaultOpt();
        option.title.text = cfgInfo.name + '实时曲线';
        option.series[0].data = data;
        var v = [];
        if (cfgInfo.hiValue != null) {
            v.push({
                name: '高报警值',
                yAxis: cfgInfo.hiValue,
                lineStyle: {
                    normal: {
                        color: "red",
                    }
                }
            })
        }
        if (cfgInfo.loValue != null) {
            v.push({
                name: '低报警值',
                yAxis: cfgInfo.loValue,
                lineStyle: {
                    normal: {
                        color: "#FFA500",
                    }
                }
            })
        }
        option.series[0].markLine.data = v;


        this.echartsInst.setOption(option);

        var pthis = this;


    }

    p.updateLiveChartSize = function (w, h) {
        var wwidth = Math.max(w - 50, 300);
        var wheight = Math.max(h - 40, 300);
        this.echarts.width(wwidth);
        this.echarts.height(wheight);
        if (this.echartsInst && this.echartsInst) {
            this.echartsInst.resize();
        }

    }



    p.clean = function () {
        clearInterval(this.timeTicket);
        this.echartsInst.clear();
        this.echartsInst.dispose();
        this.echarts.remove();
    }
    xqQuery.regViewList.push(ConstructFunction);

}());



(function () {
    "use strict";

    var gettimestr = xqQuery.gettimestr;

    var ConstructFunction = function (panel, cfgInfo) {
        this.cfgInfo = cfgInfo;
        this.panel = panel;

        var tmp = this.panel.panel('body');
        //  this.echarts = $("<div>2222222222222</div>");
        this.echarts = tmp;
        //  panel.append(this.eachts);
        this.echartsInst = echarts.init(this.echarts[0]);

        var pthis = this;
        this.panel.panel({
            onResize: function (w, h) {
                pthis.updateLiveChartSize(w, h);
            }
        });
        this.initEChart();

    }
    ConstructFunction.check = function (cfgInfo) {
        return true;
    }

    ConstructFunction.title = '历史曲线';

    var p = ConstructFunction.prototype;

    p.refreshLogHandler = function (logs) {
        var data = [];
        for (var i = 0; i < logs.length; i++) {
            var logItem = logs[i];
            data.push({
                name: new Date(logItem.logTime).toString(),
                value: [
                    gettimestr(logItem.logTime),
                    logItem.value
                ]
            });
        }
        this.echartsInst.setOption({
            series: [{
                data: data
            }]
        });
    }


    p.initEChart = function () {
        var cfgInfo = this.cfgInfo;
        var data = [];


        var option = xqQuery.getEchartsDafaultOpt();
        option.title.text = cfgInfo.name + '历史曲线';
        option.series[0].data = data;
        var v = [];
        if (cfgInfo.hiValue != null) {
            v.push({
                name: '高报警值',
                yAxis: cfgInfo.hiValue,
                lineStyle: {
                    normal: {
                        color: "red",
                    }
                }
            })
        }
        if (cfgInfo.loValue != null) {
            v.push({
                name: '低报警值',
                yAxis: cfgInfo.loValue,
                lineStyle: {
                    normal: {
                        color: "#FFA500",
                    }
                }
            })
        }
        option.series[0].markLine.data = v;
        this.echartsInst.setOption(option);

    }


    // p.initEChart = function (result) {
    //     var cfgInfo = this.cfgInfo;       
    //     var data = [];
    //     for (var i = 0; i < result.length; i++) {
    //         var logItem = result[i];
    //         data.push({
    //             name: gettimestr(logItem.logTime),
    //             value: [
    //                 gettimestr(logItem.logTime),
    //                 logItem.value
    //             ]
    //         });
    //     }

    //     var option = xqQuery.getEchartsDafaultOpt();
    //     option.title.text = cfgInfo.name + '历史曲线';
    //     option.series[0].data = data;
    //     var v = [];
    //     if (cfgInfo.hiValue != null) {
    //         v.push({
    //             name: '高报警值',
    //             yAxis: cfgInfo.hiValue,
    //             lineStyle: {
    //                 normal: {
    //                     color: "red",
    //                 }
    //             }
    //         })
    //     }
    //     if (cfgInfo.loValue != null) {
    //         v.push({
    //             name: '低报警值',
    //             yAxis: cfgInfo.loValue,
    //             lineStyle: {
    //                 normal: {
    //                     color: "#FFA500",
    //                 }
    //             }
    //         })
    //     }
    //     option.series[0].markLine.data = v;
    //     this.echartsInst.setOption(option);

    // }

    p.updateLiveChartSize = function (w, h) {
        var wwidth = Math.max(w - 50, 300);
        var wheight = Math.max(h - 40, 300);
        this.echarts.width(wwidth);
        this.echarts.height(wheight);
        if (this.echartsInst && this.echartsInst) {
            this.echartsInst.resize();
        }

    }



    p.clean = function () {
        this.echartsInst.clear();
        this.echartsInst.dispose();
        this.echarts.remove();



    }
    xqQuery.regViewList.push(ConstructFunction);

}());





(function () {
    "use strict";

 

    var ConstructFunction = function (panel, cfgInfo) {
        this.cfgInfo = cfgInfo;
        this.panel = panel;

        var grid = this.grid = $('<table width="800px"  ></table>').appendTo(panel);
        var headHeight = 0;
        this.panel.panel({
            border: false,
            fit: true,
            onResize: function (w, h) {
                grid.datagrid({
                    "height": h - headHeight,
                    "width": w
                });
            }
        });

        this.panel.panel('resize');
        grid.datagrid({
            data: [],
            fitColumns: true,
            columns:[[
                {field:'logTime',title:'时间',width:100},
                {field:'value',title:'值',width:100}
        
            ]]
        });



    }
    ConstructFunction.check = function (cfgInfo) {
        return true;
    }

    ConstructFunction.title = '历史数据';

    var p = ConstructFunction.prototype;

    p.refreshLogHandler = function (logs) {
        var data = [];
        for (var i = 0; i < logs.length; i++) {
            var logItem = logs[i];
            data.push({
                logTime: moment(logItem.logTime).format("YYYY-MM-DD HH:mm:ss"),             
                value: logItem.value             
            });
        }
        this.grid.datagrid({
            data: data
        });
    }





    p.clean = function () {

        this.grid.remove();


    }
    xqQuery.regViewList.push(ConstructFunction);

}());
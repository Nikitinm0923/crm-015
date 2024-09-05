import {
  getSymbolPriceHistory,
  getSymbolPriceHistoryInAir,
} from "../helper/firebaseHelpers";
import { timezoneList } from "../helper/helpers";
import { useSelector } from "react-redux";
import accessibility from "highcharts/modules/accessibility";
import annotationsAdvanced from "highcharts/modules/annotations-advanced";
import brokenAxis from "highcharts/modules/broken-axis";
import dragPanes from "highcharts/modules/drag-panes";
import fullScreen from "highcharts/modules/full-screen";
import Highcharts from "highcharts/highstock";
import HighchartsMore from "highcharts/highcharts-more";
import HighchartsReact from "highcharts-react-official";
import Hollowcandlestick from "highcharts/modules/hollowcandlestick";
import indicatorsAll from "highcharts/indicators/indicators-all";
import priceIndicator from "highcharts/modules/price-indicator";
import React, { useEffect, useState, useRef } from "react";
import stockTools from "highcharts/modules/stock-tools";

accessibility(Highcharts);
annotationsAdvanced(Highcharts);
brokenAxis(Highcharts);
dragPanes(Highcharts);
fullScreen(Highcharts);
HighchartsMore(Highcharts);
Hollowcandlestick(Highcharts);
indicatorsAll(Highcharts);
priceIndicator(Highcharts);
stockTools(Highcharts);

const TIMEFRAMES = [
  {
    label: "1m",
    value: ["minute", [1]],
  },
  {
    label: "15m",
    value: ["minute", [15]],
  },
  {
    label: "1h",
    value: ["hour", [1]],
  },
  {
    label: "4h",
    value: ["hour", [4]],
  },
  {
    label: "1d",
    value: ["day", [1]],
  },
  {
    label: "1w",
    value: ["week", [1]],
  },
];

export default function TradingView({
  hide,
  index,
  locale,
  plotLine = 0,
  selectedSymbol,
  theme,
}) {
  const [dataGroup, setDataGroup] = useState(TIMEFRAMES[0].value);
  const [loading, setLoading] = useState(true);
  const [symbolName] = useState(selectedSymbol);
  const [timezone, setTimeZone] = useState(timezoneList[0]);
  const chartRef = useRef();
  const mySeries = useRef({});
  const symbol = useSelector((state) =>
    state.symbols.find((s) => s.symbol === symbolName)
  );
  const timeFrameRef = useRef();

  useEffect(() => {
    const chart = chartRef.current.chart;
    if (!mySeries.current || !Object.keys(mySeries.current).length || !chart)
      return;
    for (let key in mySeries.current) {
      chart.addSeries(mySeries.current[key], true, false);
    }
  });

  // useEffect(() => {
  //   const stockToolbar = document.querySelector(
  //     "#chart > .h-100 .highcharts-stocktools-toolbar.stocktools-toolbar"
  //   );
  //   if (!stockToolbar) return;
  //   stockToolbar.childNodes.forEach((li) => {
  //     if (li.childElementCount !== 3) return;
  //     const [btn, btn2, submenu] = li.childNodes;
  //     btn.addEventListener("click", () => btn2.click());
  //   });
  // });

  const options = {
    chart: {
      type: "candlestick",
      events: {
        remove: function () {},
        addSeries: function (e) {
          if (e.options.type) {
            mySeries.current[e.options.type] = { ...e.options };
          }
        },
      },
    },
    time: {
      timezone,
    },
    scrollbar: {
      liveRedraw: false,
    },
    xAxis: {
      overscroll: ["EURUSD", "EURUSDT"].includes(symbolName) ? "4%" : "1%",
      gridLineWidth: 1,
      events: {
        afterSetExtremes(e) {
          if (!e.dataMin || loading) return;
          const diff = (e.min - e.dataMin) / (1000 * 60);
          console.log("diff = ", diff);
          if (diff && diff > 30) return;
          this.chart.showLoading();
          const loadingCallback = () => {
            this.chart.hideLoading();
            setLoading(false);
          };
          setLoading((p) => {
            if (p === false)
              getSymbolPriceHistoryInAir({
                id: symbol.id,
                date: new Date(e.dataMin).toISOString().slice(0, 10),
                setState: processChartData,
                dataGroup,
                setLoading: loadingCallback,
                isTimeframeClick: false,
              });
            return true;
          });
        },
      },
    },
    rangeSelector: {
      buttons: [
        {
          type: "hour",
          count: 1,
          text: "1h",
          events: {
            click: function () {
              timeFrameRef.current.querySelectorAll("button")[0].click();
              localStorage.setItem("zoom-" + symbolName, JSON.stringify("1h"));
            },
          },
        },
        {
          type: "hour",
          count: 2,
          text: "2h",
          events: {
            click: function () {
              timeFrameRef.current.querySelectorAll("button")[0].click();
              localStorage.setItem("zoom-" + symbolName, JSON.stringify("2h"));
            },
          },
        },
        {
          type: "hour",
          count: 6,
          text: "6h",
          events: {
            click: function () {
              localStorage.setItem("zoom-" + symbolName, JSON.stringify("6h"));
            },
          },
        },
        {
          type: "day",
          count: 1,
          text: "1d",
          events: {
            click: function () {
              timeFrameRef.current.querySelectorAll("button")[2].click();
              localStorage.setItem("zoom-" + symbolName, JSON.stringify("1d"));
            },
          },
        },
        {
          type: "week",
          count: 1,
          text: "1w",
          events: {
            click: function () {
              timeFrameRef.current.querySelectorAll("button")[4].click();
              localStorage.setItem("zoom-" + symbolName, JSON.stringify("1w"));
            },
          },
        },
      ],
      inputEnabled: false,
      allButtonsEnabled: true,
    },
    navigator: {
      adaptToUpdatedData: false,
    },
    stockTools: {
      gui: {
        buttons: [
          "advanced",
          "crookedLines",
          "currentPriceIndicator",
          "flags",
          "fullScreen",
          "indicators",
          "lines",
          "measure",
          "simpleShapes",
          "toggleAnnotations",
          "typeChange",
          "zoomChange",
        ],
        definitions: {
          typeChange: {
            items: [
              "typeCandlestick",
              "typeHollowCandlestick",
              "typeLine",
              "typeOHLC",
            ],
          },
        },
      },
      events: {
        remove: function (e) {},
      },
    },
    exporting: {
      buttons: {
        contextButton: {
          align: 'center',  // Align button to the center
          verticalAlign: 'bottom',  // Position button at the bottom
          y: -10,  // Adjust if needed to move slightly upwards
        }
      }
    },
    plotOptions: {
      candlestick: {
        color: "var(--chart-loss-color)",
        lineColor: "var(--chart-loss-color)",
        upColor: "var(--chart-gain-color)",
        upLineColor: "var(--chart-gain-color)",
      },
    },
    yAxis: [
      {
        height: "80%",
        plotLines: [
          {
            value: plotLine,
            color: "var(--chart-gain-color)",
            label: {
              text: plotLine,
              align: "right",
              style: {
                color: "var(--main-text-color)",
              },
              x: -50,
            },
          },
        ],
      },
      {
        top: "80%",
        height: "20%",
        offset: 0,
      },
    ],
    series: [
      {
        id: symbol.id,
        name: symbolName,
        color: "var(--chart-loss-color)",
        lineColor: "var(--chart-loss-color)",
        upColor: "var(--chart-gain-color)",
        upLineColor: "var(--chart-gain-color)",
        lastPrice: {
          enabled: true,
          label: {
            enabled: true,
          },
        },
        dataGrouping: {
          enabled: true,
          smoothed: true,
          units: [dataGroup],
          forced: true,
        },
        events: {
          remove: function () {},
        },
      },
      {
        id: `volume-${symbol.id}`,
        type: "column",
        name: "Volume",
        yAxis: 1,
      },
    ],
    navigation: {
      iconsURL: "stock-icons/",
    },
  };

  const processChartData = (
    data,
    addPrevDayData,
    timeframe,
    isTimeframeClick
  ) => {
    if (!chartRef.current) return;
    const chart = chartRef.current.chart;
    const series = chart.series[0];
    const volumeSeries = chart.series[1];
    const lastPoint = series.options?.data.at(-1);
    const lastVolumePoint = volumeSeries.options?.data.at(-1);

    const allData = [];
    const volumeData = [];

    data.forEach((d) => {
      allData.push([d.time, d.open, d.high, d.low, d.close]);
      if (d.volume) volumeData.push([d.time, d.volume]);
    });

    if (lastPoint) {
      const xAxis = series.xAxis;
      const dataMin = xAxis.dataMin;
      if (addPrevDayData) {
        if (allData.length)
          series.setData(
            allData.concat(series.options.data),
            false,
            false,
            false
          );
        if (volumeData.length)
          volumeSeries.setData(
            volumeData.concat(volumeSeries.options.data),
            false,
            false,
            false
          );
        if (allData.length) chart.redraw();
        if (isTimeframeClick && timeframe !== "1minute") {
          const buttons = chart.rangeSelector.buttons;
          const clickEvent = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          if (timeframe === "1day") {
            const button1w = buttons[4].element;
            button1w.dispatchEvent(clickEvent);
          } else {
            xAxis.setExtremes(dataMin, xAxis.dataMax);
          }
        }
      } else {
        const newData = allData.filter((d) => d[0] > lastPoint[0]);
        const newVolume = volumeData.filter((d) => d[0] > lastVolumePoint[0]);
        const newLastPoint = allData.at(-1);
        if (
          !newData.length &&
          lastPoint[0] === newLastPoint[0] &&
          lastPoint[4] !== newLastPoint[4]
        ) {
          series.removePoint(series.data.length - 1, false, false);
          series.addPoint(newLastPoint, true, false, false);
        } else {
          newData.forEach((d) => series.addPoint(d, true, false, false));
          newVolume.forEach((d) =>
            volumeSeries.addPoint(d, true, false, false)
          );
          if (loading) setLoading(false);
        }
      }
    } else {
      if (allData.length) series.setData(allData, false, false, false);
      if (volumeData.length)
        volumeSeries.setData(volumeData, false, false, false);
      chart.hideLoading();
      chart.redraw();
      window.document.getElementById("sidebar").style.pointerEvents = "unset";
      const xAxis = series.xAxis;
      xAxis.setExtremes(
        xAxis.dataMax - (xAxis.dataMax - xAxis.dataMin) / 15,
        xAxis.dataMax
      );
      if (loading) setLoading(false);
      const buttons = chart.rangeSelector.buttons;
      const clickEvent = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      const range = JSON.parse(localStorage.getItem("zoom-" + symbolName));
      if (range) {
        const idx =
          range === "1h"
            ? 0
            : range === "2h"
            ? 1
            : range === "6h"
            ? 2
            : range === "1d"
            ? 3
            : range === "1w"
            ? 4
            : null;
        if (idx !== null) {
          const button1h = buttons[idx].element;
          button1h.dispatchEvent(clickEvent);
        }
      }
    }
  };

  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current.chart;
      window.document.getElementById("sidebar").style.pointerEvents = "none";
      chart.showLoading();
    }
    const unsub = getSymbolPriceHistory(symbol.id, processChartData);
    return () =>
      unsub.then((unsub) => {
        if (unsub) unsub();
      });
  }, []);

  const handleTimeFrame = (timeframe) => {
    const timeFrameLabel = timeframe.value.flat().reverse().join("");
    if (dataGroup.flat().reverse().join("") === timeFrameLabel) return;
    if (!chartRef.current) return;
    setDataGroup(timeframe.value);
    const chart = chartRef.current.chart;
    if (timeFrameLabel === "1minute") {
      const buttons = chart.rangeSelector.buttons;
      const clickEvent = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      const button1h = buttons[0].element;
      button1h.dispatchEvent(clickEvent);
      return;
    }
    chart.showLoading();
    const xAxis = chart.xAxis[0];
    const loadingCallback = () => {
      chart.hideLoading();
    };
    getSymbolPriceHistoryInAir({
      id: symbol.id,
      date: new Date(xAxis.dataMin).toISOString().slice(0, 10),
      setState: processChartData,
      dataGroup: timeframe.value,
      setLoading: loadingCallback,
      isTimeframeClick: true,
    });
  };

  return (
    <div className={hide ? "d-none" : "h-100"}>
      <HighchartsReact
        constructorType={"stockChart"}
        containerProps={{ style: { height: "87%" } }}
        highcharts={Highcharts}
        options={options}
        ref={chartRef}
      />
      <div
        className="float-start flex align-items-center gap-2"
        id="timeframe"
        ref={timeFrameRef}
      >
        <label>Timeframe</label>
        {TIMEFRAMES.map((timeframe, i) => (
          <button
            key={i}
            className={timeframe.value === dataGroup ? "selected" : ""}
            onClick={() => handleTimeFrame(timeframe)}
          >
            {timeframe.label}
          </button>
        ))}
      </div>
      <select
        className="float-end border-0 text-end"
        id="timezone"
        onChange={(e) => setTimeZone(e.target.value)}
        value={timezone}
      >
        {timezoneList.map((timezone, i) => (
          <option key={i} value={timezone}>
            {timezone}
          </option>
        ))}
      </select>
    </div>
  );
}

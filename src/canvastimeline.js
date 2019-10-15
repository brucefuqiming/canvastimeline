"use strict";

class Canvastimeline {
  constructor(parentEl) {
    this._view = parentEl;
    if (!document.getElementById("canvastimeline-css-stylesheet")) {
      let sle = document.createElement("style");
      sle.id = "canvastimeline-css-stylesheet";
      sle.appendChild(document.createTextNode(""));
      document.head.appendChild(sle);
      const style = sle.sheet;

      style.insertRule(`.canvastl_marker {position: absolute;
      left: -100px;
      top: 0px;
      height: 500px;
      width: 30px;
      background: rgb(128, 128, 12, 0.5);
      z-index: 3;}`);

      style.insertRule(`.canvastl_scheduler_wrapper {
			position: relative;
			width: 100%;
			height: 100%;
			box-sizing: border-box;
		}`);

      style.insertRule(`.canvastl_scheduler {
			width: 100%;
			max-width: 1890px;
			height: 600px;
			overflow: auto;
			border: 1px solid #eee;
			box-sizing: border-box;
			position: relative;
		}`);

      style.insertRule(`.canvastl_level_0, .canvastl_level_1 {
			position: absolute;
			left: 30px;
			top: 50px;
		}`);

      style.insertRule(`.canvastl_side_canvas {
      position: -webkit-sticky;
			position: sticky;
			left: 0;
			margin: 0;
			padding: 0;
			margin-top: -4px;
			background: #ffffff;
			opacity: 1;
			z-index: 4;
			border-right: 3px solid #eee;
		}`);

      style.insertRule(`.canvastl_top_canvas {
			position: -webkit-sticky;
			position: sticky;
			top: 0;
			background: rgb(255, 255, 255);
			box-shadow: 0px 1px 0px #eee;
			border-bottom: none;
			opacity: 1;
			z-index: 5;
			margin: 0;
			padding: 0;
		}`);

      style.insertRule(`.canvastl_res_header {
			position: absolute;
			left: 0;
			top: 0;
			z-index: 6;
			background: #ffffff;
			border: 1px solid #eee;
			border-right: 3px solid #eee;
		}`);
      style.insertRule(`.canvastimeline-loader {
        position: absolute;
        display: none;
        left: 50%;
        top: 50%;
        z-index: 1;
        width: 120px;
        height: 120px;
        margin: -60px 0 0 -60px;
        border: 16px solid #f3f3f3;
        border-radius: 50%;
        border-top: 15px solid #1CA1C1;
        -webkit-animation: spin 1s linear infinite;
        animation: spin 1s linear infinite;
      }`);

      style.insertRule(`@-webkit-keyframes spin {
        0% { -webkit-transform: rotate(0deg); }
        100% { -webkit-transform: rotate(360deg); }
      }`);

      style.insertRule(`@keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }`);

    }

    this._viewType = "month";
    this._cellHeight = 30;
    this._cellWidth = 40;
    this._numResources = 1;
    this._daysInRange = 31;
    this._granularity = 1;
    this._colsInTbl = this._daysInRange * this._cellWidth;
    this._rowsInTbl = this._numResources * this._cellHeight;
    this._days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    this._months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    this._monthWidths = [];
    this._dayWidths = [];
    this._numWidths = [];
    this._curFirstOfRange = null;
    this._resColWidth = 0;
    this._bgHeight = 0;
    this._eventOverlap = true;
    this._schedulerWrapper = document.createElement("div");
    this._schedulerWrapper.height = this._view.height;
    this._schedulerWrapper.width = this._view.width;
    this._schedulerWrapper.className = "canvastl_scheduler_wrapper";
    this._marker = document.createElement("div");
    this._marker.className = "canvastl_marker";
    this._loader = document.createElement("div");
    this._loader.className = "canvastimeline-loader";
    this._scheduler = document.createElement("div");
    this._scheduler.className = 'canvastl_scheduler';
    this._scheduler.height = this._view.height;
    this._scheduler.width = this._view.width;
    this._scheduler.style.height = this._view.style.height;
    this._background = document.createElement("canvas");
    this._background.className = "canvastl_level_0";
    this._background.width = 1860;
    this._background.height = 1500;
    this._eventLayer = document.createElement("canvas");
    this._eventLayer.className = "canvastl_level_1";
    this._eventLayer.width = 1860;
    this._eventLayer.height = 1500;
    this._resLayer = document.createElement("canvas");
    this._resLayer.className = "canvastl_side_canvas";
    this._resLayer.width = 30;
    this._resLayer.height = 1500;
    this._headerLayer = document.createElement("canvas");
    this._headerLayer.className = "canvastl_top_canvas";
    this._headerLayer.width = 1890;
    this._headerLayer.height = 50;
    this._resHeaderLayer = document.createElement("canvas");
    this._resHeaderLayer.className = "canvastl_res_header";
    this._resHeaderLayer.width = 30;
    this._resHeaderLayer.height = 50;
    this._backgroundCtx = this._background.getContext("2d");
    this._eventLayerCtx = this._eventLayer.getContext("2d");
    this._resLayerCtx = this._resLayer.getContext("2d");
    this._headerLayerCtx = this._headerLayer.getContext("2d");
    this._resHeaderLayerCtx = this._resHeaderLayer.getContext("2d");
    this._schedulerWrapper.appendChild(this._resHeaderLayer);
    this._schedulerWrapper.appendChild(this._loader);
    this._scheduler.appendChild(this._headerLayer);
    this._scheduler.appendChild(this._resLayer);
    this._scheduler.appendChild(this._background);
    this._scheduler.appendChild(this._eventLayer);
    this._scheduler.appendChild(this._marker);
    this._schedulerWrapper.appendChild(this._scheduler);
    this._view.appendChild(this._schedulerWrapper);
    this._resources = [];
    this.sidecols = [];
    this._resources = new Map();
    this._resourcesIdx = new Map();
    this._sidecols = new Map();
    this._helpArray = [];
    this._maxCellHeight = this._cellHeight;
    this._onEventLayerClick = null;
    this._onContextMenu = null;
    this._getEventText = function(ev) {
      return ev.name;
    };

    this._backgroundCtx.font = "12px Arial";
    for (let i = 1; i < 32; i++) {
      this._numWidths[i - 1] = this._backgroundCtx.measureText('' + i).width;
    }
    this._days.forEach((d, idx) => {
      this._dayWidths[idx] = this._backgroundCtx.measureText(d).width;
    });
    this._months.forEach((m, idx) => {
      this._monthWidths[idx] = this._backgroundCtx.measureText(m).width;
    });

    this._eventLayer.onclick = this.clickHandler.bind(this);
    this._eventLayer.oncontextmenu = this.contextMenu.bind(this);
  }


  destroy(removeParent) {
    this._eventLayer.removeEventListener("click", this.findEventByXY);
    this._eventLayer.removeEventListener("contextmenu", this.contextMenu);
    while (this._view.firstChild) {
      this._view.removeChild(this._view.firstChild);
    }
    let pV = this._view;
    console.log(pV);
    Object.keys(this).forEach((k) => {
      try {
        delete this[k];
      } catch(err) {
        console.log(k);
      }
    });
    if(removeParent) {
      pV.parentNode.removeChild(pV);
    }
    pV = null;
  }

  prepareResources(resources) {
    this._resourcesIdx.clear();
    this._resources.clear();
    this._sidecols.clear();
    this._resColWidth = 0;
    this._helpArray = [];
    let curPosX = 0;
    this.sidecols.forEach((s, idx) => {
      let newX = {};
      Object.keys(s).forEach((k) => {
        this._resColWidth += s[k];
        newX[s] = s[k];
        this._helpArray.push({
          name: k,
          posX: curPosX,
          width: s[k]
        });
        curPosX += s[k];
      });
      this._sidecols.set(idx, newX);
    });
    resources.forEach((r, idx) => {
      r.events = [];
      r.idx = idx;
      // in case a resource is missing an attribute we add an empty string here
      this._helpArray.forEach(function (header) {
        if (!r.hasOwnProperty(header.name)) {
          r[header.name] = "";
        }
      });
      this._resources.set(r.id, r);
      this._resourcesIdx.set(idx, r.id);
    });
  }

  showMarkerAtDate(startDate, endDate) {
    this._marker.style.left = this.getXPos(startDate.getTime()) + this._resColWidth + "px";
    this._marker.style.width = this.getWidth(startDate.getTime(), endDate.getTime()) + "px";
    this._marker.style.height = this._bgHeight + this._resHeaderLayer.height + "px";
  }

  hideMarker() {
    this._marker.style.width = "30px";
    this._marker.style.left = "-100px";
  }

  removeEventsAndResetResourceGeometry() {
    let curY = 0;
    this._maxCellHeight = this._cellHeight;
    this._resources.forEach((value, key, map) => {
      value.yPos = curY;
      value.height = this._cellHeight;
      curY += this._cellHeight;
      value.events = [];
    });
    this._bgHeight = this._resources.size * this._cellHeight;
  }

  showLoader() {
    this._loader.style.display = "block";
  }

  hideLoader() {
    this._loader.style.display = "none";
  }

  setCellWidth(val) {
    this._cellWidth = val;
  }

  calcTicksAndWidth() {
    switch (this._viewType) {
      case "year":
        this._granularity = 1;
        const year = this._curFirstOfRange.getFullYear();
        if(year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
          this._daysInRange = 366;
        } else {
          this._daysInRange = 365;
        }
        break;
      case "month":
        this._granularity = 1;
        this._daysInRange = new Date(this._curFirstOfRange.getFullYear(), this._curFirstOfRange.getMonth() + 1, 0).getDate();
        break;
      case "week":
        this._daysInRange = 7;
        this._granularity = 1;
        break;
      case "week-hours":
        this._daysInRange = 7;
        this._granularity = 24;
        break;
      case "week-12hours":
        this._daysInRange = 7;
        this._granularity = 2;
        break;
      case "day":
        this._daysInRange = 1;
        this._granularity = 24;
        break;
      case "day-2hours":
        this._daysInRange = 1;
        this._granularity = 12;
        break;
      default:
        throw new Error("View Type is not set correctly!");
    }

    this._numTicksInRange = 86400 * this._daysInRange * 1000;
    this._colsInTbl = this._daysInRange * this._cellWidth * this._granularity;
    this._scheduler.style.maxWidth = this._colsInTbl + this._resColWidth + 'px';
  }

  // for mondays only at the moment...
  calcMonday(d) {
    const currentWeekDay = d.getDay();
    let wkStart = new Date(new Date(d).setDate(d.getDate() - (currentWeekDay == 0 ? 6 : currentWeekDay -1)));
    wkStart.setHours(0);
    wkStart.setMinutes(0);
    wkStart.setSeconds(0);
    wkStart.setMilliseconds(0);
    return wkStart
  }

  prepareRange() {
    this.calcTicksAndWidth();
    this.removeEventsAndResetResourceGeometry();
    this.setSizesAndPositionsBeforeRedraw();
    this.drawDayLines();
    this.drawResources();
  }

  prevRange() {
    switch (this._viewType) {
      case "month":
        this._curFirstOfRange.setMonth(this._curFirstOfRange.getMonth() -1);
        break;
      case "year":
        this._curFirstOfRange.setFullYear(this._curFirstOfRange.getFullYear() - 1);
        break;
      case "week":
      case "week-hours":
      case "week-12hours":
        this._curFirstOfRange.setDate(this._curFirstOfRange.getDate() - 7);
        break;
      case "day":
      case "day-2hours":
        this._curFirstOfRange.setDate(this._curFirstOfRange.getDate() - 1);
        break;
      default:
        throw new Error("View type is not supported!");
    }
    this.prepareRange()
  }

  nextRange() {
    switch (this._viewType) {
      case "year":
        this._curFirstOfRange.setYear(this._curFirstOfRange.getFullYear() + 1);
        break;
      case "month":
        this._curFirstOfRange.setMonth(this._curFirstOfRange.getMonth() + 1);
        break;
      case "week":
      case "week-hours":
      case "week-12hours":
        this._curFirstOfRange.setDate(this._curFirstOfRange.getDate() + 7);
        break;
      case "day":
      case "day-2hours":
        this._curFirstOfRange.setDate(this._curFirstOfRange.getDate() + 1);
        break;
      default:
        throw new Error("View Type is not set correctly!");
    }
    this.prepareRange();
  }

  setViewType(typeStr) {
    if(typeStr === 'week') {
      this._viewType = 'week';
      this._granularity = 1;
    } else if(typeStr === 'month') {
      this._viewType = 'month';
      this._granularity = 1;
    } else if(typeStr === 'year') {
      this._viewType = 'year';
      this._granularity = 1;
    } else if(typeStr === 'week-hours') {
      this._viewType = 'week-hours';
      this._granularity = 24;
    } else if(typeStr === 'week-12hours') {
      this._viewType = 'week-12hours';
      this._granularity = 2;
    } else if(typeStr === 'day') {
      this._viewType = 'day';
      this._granularity = 24;
    } else if(typeStr === 'day-2hours') {
      this._viewType = 'day-2hours';
      this._granularity = 12;
    } else {
      throw new Error("View Type invalid!");
    }
  }

  setRangeStartDate(d) {
    switch (this._viewType) {
      case "month":
        this._curFirstOfRange = new Date();
        this._curFirstOfRange.setFullYear(d.getFullYear());
        this._curFirstOfRange.setMonth(d.getMonth());
        this._curFirstOfRange.setDate(1);
        this._curFirstOfRange.setHours(0);
        this._curFirstOfRange.setMinutes(0);
        this._curFirstOfRange.setSeconds(0);
        this._curFirstOfRange.setMilliseconds(0);
        break;
      case 'year':
        this._curFirstOfRange = new Date(d.getFullYear(), 0, 1);
        break;
      case "week":
      case "week-hours":
      case "week-12hours":
        this._curFirstOfRange = this.calcMonday(d);
        break;
      case "day":
      case "day-2hours":
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);
        this._curFirstOfRange = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        break;
      default:
        throw new Error("View type is not supported!");
    }
    this.prepareRange();
  }

  getXPos(St) {
    return this._colsInTbl * ((St - this._curFirstOfRange.getTime()) / this._numTicksInRange);
  }

  getWidth(S, E) {
    return this._colsInTbl * ((E - S) / this._numTicksInRange);
  }

  getYPos(resource_id) {
    return (this._resources.get(resource_id).idx * this._cellHeight) + 1;
  }

  parseDate(str) {
    const twoParts = str.split(/[ T]/);
    const datePart = twoParts[0].split("-");
    const timePart = twoParts[1].split(":");
    return new Date(datePart[0], datePart[1] - 1, datePart[2], timePart[0], timePart[1], timePart[2]);
  }

  loadEvents(arrayOfEventObjects) {
    let failureArray = [];
    try {
      for (let ev of arrayOfEventObjects) {
        /*
         * think about storing the Date on the event not only the initial strings
         * for performance reasons as comparing the Date (a number) with the visible range
         * could be faster like that?
        * */
        let startDate = this.parseDate(ev.start);
        let endDate = this.parseDate(ev.end);
        ev.minx = this.getXPos(startDate.getTime());
        ev.width = this.getWidth(startDate.getTime(), endDate.getTime());
        try {
          ev.miny = this.getYPos(ev.resource_id);
          this._resources.get(ev.resource_id).events.push(ev);
        } catch (err) {
          failureArray.push(ev);
        }
      }
    } catch (err) {
      console.log(err);
      throw new Error("Event Object Array does not match signature!");
    }
    // adjust yPos values in case of overlaps
    let prevY = 0;
    this._resources.forEach((value, key, map) => {
      if (value.events.length) {
        value.yPos = prevY;
        let possibleMultiArray = this.separate(value.events);
        value.events = [];
        let maxHeightFactor = 0;
        let maxWidthOfEvent = 0;
        possibleMultiArray.forEach((ar) => {
          const isConflict = (x, w, lvl, id) => {
            const l = value.events.length;
            let e;
            for (let i = 0; i < l; i++) {
              e = value.events[i];
              //if(e.id != id) {
              if (e.miny == lvl && x <= e.minx + e.width && w >= e.minx) {
                return true;
              }
              //}
            }
            return false;
          };
          for (let e of ar) {
            let curLevel = 0;
            if (maxWidthOfEvent < e.width) {
              maxWidthOfEvent = e.width;
            }
            while (isConflict(e.minx, e.minx + e.width, value.yPos + curLevel * this._cellHeight + 1, e.id)) {
              curLevel++;
            }
            e.miny = value.yPos + curLevel * this._cellHeight + 1;
            value.events.push(e);
            if (curLevel > maxHeightFactor) {
              maxHeightFactor = curLevel;
            }
          }
        });
        maxHeightFactor += 1;
        value.max_event_width = maxWidthOfEvent;
        if (this._maxCellHeight < maxHeightFactor * this._cellHeight) {
          this._maxCellHeight = maxHeightFactor * this._cellHeight;
        }
        value.height = maxHeightFactor > 0 ? maxHeightFactor * this._cellHeight : this._cellHeight;
        prevY += value.height;
      } else {
        value.max_event_width = 0;
        value.height = this._cellHeight;
        value.yPos = prevY;
        prevY += this._cellHeight;
      }
    });
    this._bgHeight = prevY;
  }

  loadAndDrawEvents(events) {
    this.loadEvents(events);
    this.setSizesAndPositionsBeforeRedraw();
    this.drawDayLines();
    this.drawResources();
    this.drawEvents();
  }

  removeEvent(ev) {
     const { id, resource_id } = ev;
     if(id && resource_id) {
       const ref = this._resources.get(resource_id);
      if(!ref) {
        throw new Error("Resource not found");
      }
       let idx = ref.events.findIndex(function(item) {
         return item.id == id;
       });
       if(idx !== -1) {
         const removed = ref.events.splice(idx, 1)[0];
         this._adjustResourceRow(ref);
       } else {
         throw new Error("Event not found");
       }
     } else {
       throw new Error("Missing identifier id and/or resource_id");
     }
  }

  _adjustResourceRow(ref) {
    let prevHeight = ref.height;
    ref.events.forEach(function (ev) {
      ev.miny = ref.yPos + 1;
    });
    let possibleMultiArray = this.separate(ref.events);
    ref.events = [];
    let maxHeightF = 0;
    let maxWidthOfEvent = 0;
    possibleMultiArray.forEach((ar) => {
      const isConflict = (x, w, lvl, id) => {
        const l = ref.events.length;
        let e;
        for (let i = 0; i < l; i++) {
          e = ref.events[i];
          //if(e.id != id) {
          if (e.miny == lvl && (x <= e.minx + e.width && w >= e.minx)) {
            return true;
          }
          //}
        }
        return false;
      };

      for (let e of ar) {
        let curLevel = 0;
        if (maxWidthOfEvent < e.width) {
          maxWidthOfEvent = e.width;
        }
        while (isConflict(e.minx, e.minx + e.width, ref.yPos + curLevel * this._cellHeight + 1, e.id)) {
          curLevel++;
        }
        e.miny = ref.yPos + curLevel * this._cellHeight + 1;
        ref.events.push(e);
        if (curLevel > maxHeightF) {
          maxHeightF = curLevel;
        }
      }
    });
    maxHeightF += 1;
    ref.max_event_width = maxWidthOfEvent;
    if (this._maxCellHeight < maxHeightF * this._cellHeight) {
      this._maxCellHeight = maxHeightF * this._cellHeight;
    }
    ref.height = maxHeightF > 0 ? maxHeightF * this._cellHeight : this._cellHeight;
    const diff = ref.height - prevHeight;
    if (diff) {
      let ref2;
      this._bgHeight += diff;
      for (let i = ref.idx + 1; i < this._resources.size; i++) {
        ref2 = this._resources.get(this._resourcesIdx.get(i));
        ref2.yPos += diff;
        ref2.events.forEach(function (ev) {
          ev.miny += diff;
        });
      }
      this.setSizesAndPositionsBeforeRedraw();
      this.drawDayLines();
      this.drawResources();
      this.drawEvents();
    } else {
      this.drawEvents(ref);
    }
  }

  addEvent(ev) {
    const st = performance.now();
    const ref = this._resources.get(ev.resource_id);
    let prevHeight = ref.height;
    let startDate = this.parseDate(ev.start);
    let endDate = this.parseDate(ev.end);
    ev.minx = this.getXPos(startDate.getTime());
    ev.width = this.getWidth(startDate.getTime(), endDate.getTime());
    ev.miny = ref.yPos + 1;
    if (ref.events.length) {
      ref.events.push(ev);
     this._adjustResourceRow(ref);
    } else {
      ref.events.push(ev);
      ref.max_event_width = ev.width;
      ref.events.push(ev);
      this.drawEvents(ref);
    }
  }

  clickHandler(ev) {
    if(this._onEventLayerClick) {
      this.findEventByXY(ev, this._onEventLayerClick);
    }
  }

  contextMenu(ev) {
    ev.preventDefault();
    if(this._onContextMenu) {
      this.findEventByXY(ev, this._onContextMenu);
    }
  }

  findEventByXY(ev, cb) {
    const rect = ev.target.getBoundingClientRect();
    const x = ev.clientX - rect.left; //x position within the element.
    const y = ev.clientY - rect.top;
    let startIdx = y / this._maxCellHeight - 1;
    let endIdx = this._resources.size - 1;
    if (startIdx < 0) startIdx = 0;
    let ref;
    // binary search for events coming but it's more tricky as it's a range
    let start = startIdx, end = endIdx, id, mid;
    while (start <= end) {
      mid = Math.floor((start + end) / 2);
      id = this._resourcesIdx.get(mid);
      ref = this._resources.get(id);
      let l = ref.events.length, ev;
      if (ref.yPos <= y && ref.yPos + ref.height >= y) {
        for (let i = 0; i < l; i++) {
          ev = ref.events[i];
          if ((ev.minx <= x && ev.minx + ev.width >= x) && (ev.miny <= y && ev.miny + this._cellHeight - 1 >= y)) {
            return cb(ev, ref.id);
          }
        }
        return;
      } else if (ref.yPos < y) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
  }

  drawEvents(ref) {
    if(ref) {
      this._eventLayerCtx.clearRect(0, ref.yPos + 1, this._colsInTbl, ref.height);
      ref.events.forEach((ev) => {
        this._eventLayerCtx.fillStyle = ev.background || "#1CA1C1";
        this._eventLayerCtx.fillRect(ev.minx, ev.miny, ev.width, this._cellHeight - 1);
        this._eventLayerCtx.fillStyle = ev.color || "#ffffff";
        let txt = this._getEventText(ev).split('\n');
        txt.forEach((t, idx) => {
          this._eventLayerCtx.fillText(t, (ev.minx < 0 ? 4 : ev.minx + 4), ev.miny + 10 + (idx * 12), ev.width - 6);
        });
      });
    } else {
      this._resources.forEach((r) => {
        r.events.forEach((ev) => {
          this._eventLayerCtx.fillStyle = ev.background || "#1CA1C1";
          this._eventLayerCtx.fillRect(ev.minx, ev.miny, ev.width, this._cellHeight - 1);
          this._eventLayerCtx.fillStyle = ev.color || "#ffffff";
          let txt = this._getEventText(ev).split('\n');
          txt.forEach((t, idx) => {
            this._eventLayerCtx.fillText(t, (ev.minx < 0 ? 4 : ev.minx + 4), ev.miny + 10 + (idx * 12), ev.width - 6);
          });
          //this._eventLayerCtx.fillText(this._getEventText(ev), (ev.minx < 0 ? 4 : ev.minx + 4), ev.miny + 10, ev.width - 6);
        });
      });
    }
    this._eventLayerCtx.stroke();
  }

  separate(array) {
    array.sort((a, b) => {
      if (a.start < b.start)
        return -1;
      if (a.start > b.start)
        return 1;
      return 0;
    });
    const getMax = (array) => {
      if (array.length == 0) return false;
      // this should be faster than sorting?
      let max = "0000-00-00 00:00:00";
      array.forEach(function(item) {
        if(item.end > max) max = item.end;
      });
      return max;
    };
    let retval = [];
    let z = 0;
    retval[z] = [array[0]];
    let l = array.length;
    for (let i = 1; i < l; i++) {
      if ((array[i].start >= array[i - 1].start)
        &&
        (array[i].start < getMax(retval[z]))
      ) {
        retval[z].push(array[i]);
      } else {
        z++;
        retval[z] = [array[i]];
      }
    }
    return retval;
  }

  setSizesAndPositionsBeforeRedraw() {
    this._resLayer.width = this._resHeaderLayer.width = this._resColWidth;
    this._resLayer.height = this._eventLayer.height = this._background.height = this._bgHeight;
    this._eventLayer.width = this._background.width = this._colsInTbl;
    this._headerLayer.width = this._colsInTbl + this._resColWidth;
    this._eventLayer.style.left = this._background.style.left = this._resColWidth + 'px';
    this._backgroundCtx.font = "12px Arial";
    this._eventLayerCtx.font = "12px Arial";
    this._resLayerCtx.font = "12px Arial";
    this._headerLayerCtx.font = "12px Arial";
    this._resHeaderLayerCtx.font = "12px Arial";
  }

  drawResources() {
    this._resHeaderLayerCtx.beginPath();
    this._helpArray.forEach((obj) => {
      this._resHeaderLayerCtx.fillText(obj.name, obj.posX + 2, this._resHeaderLayer.height - 6, obj.width - 2);
    });

    this._resLayerCtx.fillStyle = "#333";
    this._resLayerCtx.textBaseline = "top";
    this._resLayerCtx.lineWidth = 1;
    this._resLayerCtx.strokeStyle = '#eee';
    this._resLayerCtx.translate(0.5, 0.5);
    this._resLayerCtx.beginPath();
    this._helpArray.forEach((obj, idx) => {
      if (idx) {
        this._resLayerCtx.moveTo(obj.posX, 0);
        this._resLayerCtx.lineTo(obj.posX, this._resLayer.height);
      }
    });
    this._resHeaderLayerCtx.stroke();

    this._resources.forEach((value, key, map) => {
      this._helpArray.forEach((obj) => {
        this._resLayerCtx.fillText(value[obj.name], obj.posX, value.yPos + 2, obj.width - 2);
      });

      this._resLayerCtx.moveTo(0, value.yPos);
      this._resLayerCtx.lineTo(this._resColWidth, value.yPos);
    });

    this._resLayerCtx.stroke();
    this._resLayerCtx.translate(-0.5, -0.5);
  }

  drawDayLines() {
    let weekDate = new Date(this._curFirstOfRange);
    weekDate.setDate(weekDate.getDate() - 1);
    this._backgroundCtx.lineWidth = 1;
    this._backgroundCtx.translate(0.5, 0.5);
    this._backgroundCtx.strokeStyle = "#eee";
    this._headerLayerCtx.textBaseline = "top";
    this._headerLayerCtx.fillStyle = '#333';
    this._backgroundCtx.beginPath();
    let curX;
    for (let i = 0; i < this._daysInRange; i++) {
      weekDate.setDate(weekDate.getDate() + 1);
      curX = i * this._granularity * this._cellWidth;
      this._headerLayerCtx.fillStyle = (i % 2 === 0) ? "#f9f9f9" : "#fdfdfd";
      this._headerLayerCtx.fillRect(i * this._granularity * this._cellWidth + this._resColWidth, 0, this._granularity * this._cellWidth, this._resHeaderLayer.height);
      this._headerLayerCtx.fillStyle = "#333";
      this._headerLayerCtx.fillText(weekDate.getDate().toString(10), (i * this._granularity  * this._cellWidth) + (this._cellWidth * this._granularity / 2) + this._resColWidth - this._numWidths[weekDate.getDate() - 1] / 2, 14);
      this._headerLayerCtx.fillText(this._days[weekDate.getDay()], i * this._granularity  * this._cellWidth + (this._cellWidth * this._granularity / 2) + this._resColWidth - this._dayWidths[weekDate.getDay()] / 2, 25);
      for(let k = 0; k < this._granularity; k++) {
        this._backgroundCtx.moveTo(curX + (k * this._cellWidth), 0);
        this._backgroundCtx.lineTo(curX + (k * this._cellWidth), this._bgHeight);
        // if we want hours (granularity > 1)
        if(this._granularity > 1) {
          this._headerLayerCtx.fillText((24 / this._granularity * k).toString(10), curX + (k * this._cellWidth) + this._resColWidth - this._resHeaderLayerCtx.measureText((24 / this._granularity * k).toString(10)).width / 2, 35);
        }
      }

    }
    let z;
    switch(this._viewType) {
      case "year":
        let curDaysInMonth, sumOfDays = 0;
        for(let i = 0; i < 12; i++) {
          curDaysInMonth = new Date(this._curFirstOfRange.getFullYear(), i + 1, 0).getDate();
          sumOfDays += curDaysInMonth;
          this._headerLayerCtx.fillText(this._months[i], sumOfDays * this._cellWidth - (curDaysInMonth / 2 * this._cellWidth) + this._resColWidth - this._monthWidths[i] / 2, 2);
        }
        break;
      case "month":
        z = this._curFirstOfRange.getMonth();
        this._headerLayerCtx.fillText(this._months[z], this._colsInTbl / 2 + this._resColWidth - this._monthWidths[z] / 2, 2);
        break;
      case "week":
      case "week-hours":
      case "week-12hours":
        z = new Date(this._curFirstOfRange);
        z.setDate(z.getDate() + 6);
        const nameStr = this._curFirstOfRange.toLocaleDateString() + ' - ' + z.toLocaleDateString();
        const w = this._headerLayerCtx.measureText(nameStr);
        this._headerLayerCtx.fillText(nameStr, (this._colsInTbl / 2) + this._resColWidth - (w.width / 2), 2);
        break;
      case "day":
      case "day-2hours":
        const dayStr = this._curFirstOfRange.toLocaleDateString();
        const dw = this._headerLayerCtx.measureText(dayStr);
        this._headerLayerCtx.fillText(dayStr, (this._colsInTbl / 2) + this._resColWidth - (dw.width / 2), 2);
      default:
    }
    this._resources.forEach((value, key, map) => {
      this._backgroundCtx.moveTo(0, value.yPos);
      this._backgroundCtx.lineTo(this._colsInTbl, value.yPos);
    });
    this._backgroundCtx.translate(-0.5, -0.5);
    this._backgroundCtx.stroke();
    this._headerLayerCtx.stroke();
  }

  initCalendar(obj) {
    if (!obj.hasOwnProperty("resources")) {
      obj.resources = [];
    }
    if (obj.hasOwnProperty("sidecols")) {
      this.sidecols = obj.sidecols;
    }
    if (obj.hasOwnProperty("onEventLayerClick")) {
      if (typeof obj.onEventLayerClick === "function") {
        this._onEventLayerClick = obj.onEventLayerClick;
      }
    }
    if (obj.hasOwnProperty("onContextMenu")) {
      if(typeof obj.onContextMenu === "function") {
        this._onContextMenu = obj.onContextMenu;
      }
    }
    if (obj.hasOwnProperty("getEventText")) {
      if (typeof obj.getEventText === "function") {
        this._getEventText = obj.getEventText;
      }
    }
    if (obj.hasOwnProperty("inFrame")) {
      this._scheduler.style.height = "100vH";
      document.body.style.margin = "0";
    }
    if(obj.hasOwnProperty("dayNames")) {
      this._days = obj.dayNames;
      this._days.forEach((d, idx) => {
        this._dayWidths[idx] = this._backgroundCtx.measureText(d).width;
      });
    }
    if(obj.hasOwnProperty("monthNames")) {
      this._months = obj.monthNames;
      this._months.forEach((m, idx) => {
        this._monthWidths[idx] = this._backgroundCtx.measureText(m).width;
      });
    }
    if(obj.hasOwnProperty("viewType")) {
      if(["month","week","year","week-hours","week-12hours","day","day-2hours"].indexOf(obj.viewType) !== -1) {
        this.setViewType(obj.viewType);
        console.log(obj.viewType);
      } else {
        throw new Error("View Type unknown!");
      }
    }

    this.prepareResources(obj.resources);
    if (obj.hasOwnProperty("start")) {
      this.setRangeStartDate(obj.start);
    } else {
      this.setRangeStartDate(new Date());
    }
    this.setSizesAndPositionsBeforeRedraw();
    this.drawDayLines();
    this.drawResources();
  }

}


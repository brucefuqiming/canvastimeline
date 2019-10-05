class Canvastimeline {
  constructor(parentEl) {
    this._view = parentEl;
    if (!document.getElementById("canvastimeline-css-stylesheet")) {
      let sle = document.createElement("style");
      sle.id = "canvastimeline-css-stylesheet";
      sle.appendChild(document.createTextNode(""));
      document.head.appendChild(sle);
      const style = sle.sheet;
      style.insertRule(`.canvastl_scheduler_wrapper {
			position: relative;
			width: 100%;
			height: 100%;
		}`);

      style.insertRule(`.canvastl_scheduler {
			max-width: 1890px;
			height: 600px;
			overflow: auto;
			position: relative;
		}`);

      style.insertRule(`.canvastl_level_0,
		.canvastl_level_1 {
			position: absolute;
			left: 30px;
			top: 30px;
		}`);

      style.insertRule(`.canvastl_side_canvas {
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
			border-bottom: 1px solid #eee;
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

    this._cell_height = 30;
    this._cell_width = 80;
    this._num_resources = 1;
    this._days_in_month = 31;
    this._cols_in_tbl = this.days_in_month * this._cell_width;
    this._rows_in_tbl = this._num_resources * this._cell_height;
    this._days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    this._dayWidths = [];
    this._numNums = [];
    this._numWidths = [];
    this._curFirstOfMonth = null;
    this._CurMonth = 0;
    this._CurYear = 0;
    this._res_col_width = 0;
    this._bgHeight = 0;
    this._event_overlap = true;
    this._scheduler_wrapper = document.createElement("div");
    this._scheduler_wrapper.height = this._view.height;
    this._scheduler_wrapper.width = this._view.width;
    this._scheduler_wrapper.className = "canvastl_scheduler_wrapper";
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
    this._eventlayer = document.createElement("canvas");
    this._eventlayer.className = "canvastl_level_1";
    this._eventlayer.width = 1860;
    this._eventlayer.height = 1500;
    this._reslayer = document.createElement("canvas");
    this._reslayer.className = "canvastl_side_canvas";
    this._reslayer.width = 30;
    this._reslayer.height = 1500;
    this._headerlayer = document.createElement("canvas");
    this._headerlayer.className = "canvastl_top_canvas";
    this._headerlayer.width = 1890;
    this._headerlayer.height = 30;
    this._resheaderlayer = document.createElement("canvas");
    this._resheaderlayer.className = "canvastl_res_header";
    this._resheaderlayer.width = 30;
    this._resheaderlayer.height = 30;
    this._background_ctx = this._background.getContext("2d");
    this._eventlayer_ctx = this._eventlayer.getContext("2d");
    this._reslayer_ctx = this._reslayer.getContext("2d");
    this._headerlayer_ctx = this._headerlayer.getContext("2d");
    this._resheaderlayer_ctx = this._resheaderlayer.getContext("2d");
    this._scheduler_wrapper.appendChild(this._resheaderlayer);
    this._scheduler_wrapper.appendChild(this._loader);
    this._scheduler.appendChild(this._headerlayer);
    this._scheduler.appendChild(this._reslayer);
    this._scheduler.appendChild(this._background);
    this._scheduler.appendChild(this._eventlayer);
    this._scheduler_wrapper.appendChild(this._scheduler);
    this._view.appendChild(this._scheduler_wrapper);
    this._prevScrollTop = 0;
    this._prevScrollLeft = 0;
    this._resources = [];
    this.sidecols = [];
    this._resources = new Map();
    this._resources_idx = new Map();
    this._sidecols = new Map();
    this._helpArray = [];
    this._max_cell_height = this._cell_height;
    this._onEventFound = null;

    this._background_ctx.font = "12px Arial";
    for (let i = 1; i < 32; i++) {
      this._numWidths[i - 1] = this._background_ctx.measureText('' + i).width;
    }
    this._days.forEach((d, idx) => {
      this._dayWidths[idx] = this._background_ctx.measureText(d).width;
    });

    this._eventlayer.onclick = (ev) => {
      // make this work "always"
      const rect = ev.target.getBoundingClientRect();
      const x = ev.clientX - rect.left; //x position within the element.
      const y = ev.clientY - rect.top;
      let minIdx = ev.y / this._max_cell_height;
      this.findEventByXY(x, y, minIdx, this._resources.size - 1);
      //let minIdx = ev.layerY / this._max_cell_height;
      //this.findEventByXY(ev.layerX, ev.layerY, minIdx, this._resources.size - 1);
    };
  }

  prepareResources(resources) {
    // the resoucres_idx is useful for indexing if we do not allow event overlap
    // if we do allow it we need to calculate min and max to save on cycles until we find rescource
    this._resources_idx.clear();
    this._resources.clear();
    this._sidecols.clear();
    this._res_col_width = 0;
    this._helpArray = [];
    let curPosX = 0;
    this.sidecols.forEach((s, idx) => {
      let newX = {};
      Object.keys(s).forEach((k) => {
        this._res_col_width += s[k];
        newX[s] = s[k];
        this._helpArray.push({
          name: k,
          posX: curPosX
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
      this._resources_idx.set(idx, r.id);
    });
  }

  removeEventsAndResetResourceGeometry() {
    let curY = 0;
    this._max_cell_height = this._cell_height;
    this._resources.forEach((value, key, map) => {
      value.yPos = curY;
      value.height = this._cell_height;
      curY += this._cell_height;
      value.events = [];
    });
    this._bgHeight = this._resources.size * this._cell_height;
  }

  showLoader() {
    this._loader.style.display = "block";
  }

  hideLoader() {
    this._loader.style.display = "none";
  }

  calcTicksAndWidth() {
    this._days_in_month = new Date(this._CurYear, this._CurMonth + 1, 0).getDate();
    this._numTicksInMonth = 86400 * this._days_in_month * 1000;
    this._cols_in_tbl = this._days_in_month * this._cell_width;
  }

  prepareMonth() {
    this.calcTicksAndWidth();
    this.removeEventsAndResetResourceGeometry();
    this.setSizesAndPositionsBeforeRedraw();
    this.drawDayLines();
    this.drawResources();
  }

  prevMonth() {
    this._curFirstOfMonth.setMonth(this._curFirstOfMonth.getMonth() - 1);
    this._CurMonth = this._curFirstOfMonth.getMonth();
    this._CurYear = this._curFirstOfMonth.getFullYear();
    this.prepareMonth()
  }

  nextMonth() {
    this._curFirstOfMonth.setMonth(this._curFirstOfMonth.getMonth() + 1);
    this._CurMonth = this._curFirstOfMonth.getMonth();
    this._CurYear = this._curFirstOfMonth.getFullYear();
    this.prepareMonth();
  }

  setMonth(d) {
    this._curFirstOfMonth = new Date();
    this._curFirstOfMonth.setFullYear(d.getFullYear());
    this._curFirstOfMonth.setMonth(d.getMonth());
    this._curFirstOfMonth.setDate(1);
    this._curFirstOfMonth.setHours(0);
    this._curFirstOfMonth.setMinutes(0);
    this._curFirstOfMonth.setSeconds(0);
    this._curFirstOfMonth.setMilliseconds(0);
    this._CurMonth = d.getMonth();
    this._CurYear = d.getFullYear();

    this.calcTicksAndWidth();
  }

  getXPos(St) {
    return this._cols_in_tbl * ((St - this._curFirstOfMonth.getTime()) / this._numTicksInMonth)
  }

  getWidth(S, E) {
    return this._cols_in_tbl * ((E - S) / this._numTicksInMonth);
  }

  // is useful without event overlap only, really
  getYPos(resource_id) {
    return (this._resources.get(resource_id).idx * this._cell_height) + 1;
  }

  parseDate(str) {
    const twoParts = str.split(/[ T]/);
    const datePart = twoParts[0].split("-");
    const timePart = twoParts[1].split(":");
    return new Date(datePart[0], datePart[1] - 1, datePart[2], timePart[0], timePart[1], timePart[2]);
  }

  loadEvents(arrayOfEventObjects) {
    let failureArray = [], maximum_resource_height = this._cell_height;
    try {
      for (let ev of arrayOfEventObjects) {
        let startDate = this.parseDate(ev.start);
        let endDate = this.parseDate(ev.end);
        ev.minx = this.getXPos(startDate.getTime());
        ev.width = this.getWidth(startDate.getTime(), endDate.getTime());
        try {
          // maybe we can save on this getYPos call in case we use event_overlap = true
          ev.miny = this.getYPos(ev.resource_id);
          this._resources.get(ev.resource_id).events.push(ev);
        } catch (err) {
          // this one most probably has a resource_id that has not been initialized with the _resources
          failureArray.push(ev);
        }
      }
    } catch (err) {
      console.log(err);
      alert("Event Object Array does not match signature!");
    }
    // make the yPos values for each event match in case of overlaps
    let prevY = 0;
    this._resources.forEach((value, key, map) => {
      if (value.events.length) {
        value.yPos = prevY;
        let possibleMultiArray = this.separate(value.events);
        value.events = [];
        let maxHeightFactor = 0;
        let maxWidthOfEvent = 0;
        possibleMultiArray.forEach((ar) => {
          let helper = [];
          ar.sort(function (a, b) {
            if (a.start < b.start)
              return -1;
            if (a.start > b.start)
              return 1;
            return 0;
          });

          let cnt = ar.length;
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
            while (isConflict(e.minx, e.minx + e.width, value.yPos + curLevel * this._cell_height + 1, e.id)) {
              curLevel++;
            }
            e.miny = value.yPos + curLevel * this._cell_height + 1;
            value.events.push(e);
            if (curLevel > maxHeightFactor) {
              maxHeightFactor = curLevel;
            }
          }
        });
        maxHeightFactor += 1;
        value.max_event_width = maxWidthOfEvent;
        if (this._max_cell_height < maxHeightFactor * this._cell_height) {
          this._max_cell_height = maxHeightFactor * this._cell_height;
        }
        value.height = maxHeightFactor > 0 ? maxHeightFactor * this._cell_height : this._cell_height;
        prevY += value.height;
      } else {
        value.max_event_width = 0;
        value.height = this._cell_height;
        value.yPos = prevY;
        prevY += this._cell_height;
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

  addEvent(ev) {
    const ref = this._resources.get(ev.resource_id);
    let prevHeight = ref.height;
    let startDate = this.parseDate(ev.start);
    let endDate = this.parseDate(ev.end);
    ev.minx = this.getXPos(startDate.getTime());
    ev.width = this.getWidth(startDate.getTime(), endDate.getTime());
    ev.miny = ref.yPos + 1;
    if (ref.events.length) {
      ref.events.push(ev);
      // equalize them here to correct anything that was set to other y Level before
      ref.events.forEach(function (ev) {
        ev.miny = ref.yPos + 1;
      });
      let possibleMultiArray = this.separate(ref.events);
      ref.events = [];
      let maxHeightF = 0;
      let maxWidthOfEvent = 0;
      possibleMultiArray.forEach((ar) => {
        ar.sort(function (a, b) {
          if (a.start < b.start)
            return -1;
          if (a.start > b.start)
            return 1;
          return 0;
        });

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
          while (isConflict(e.minx, e.minx + e.width, ref.yPos + curLevel * this._cell_height + 1, e.id)) {
            curLevel++;
          }
          e.miny = ref.yPos + curLevel * this._cell_height + 1;
          ref.events.push(e);
          if (curLevel > maxHeightF) {
            maxHeightF = curLevel;
          }
        }
      });
      maxHeightF += 1;
      ref.max_event_width = maxWidthOfEvent;
      if (this._max_cell_height < maxHeightF * this._cell_height) {
        this._max_cell_height = maxHeightF * this._cell_height;
      }
      ref.height = maxHeightF > 0 ? maxHeightF * this._cell_height : this._cell_height;
      const diff = ref.height - prevHeight;
      this._bgHeight += diff;
      //yPos needs to be applied to all following resources
      if (diff) {
        let ref2;
        for (let i = ref.idx + 1; i < this._resources.size; i++) {
          ref2 = this._resources.get(this._resources_idx.get(i));
          ref2.yPos += diff;
          ref2.events.forEach(function (ev) {
            ev.miny += diff;
          });
        }
      }

      // redrawing from actual yPos only works if we do not have to change the height of the 3 involved canvases.
      // so in the future check first if bgHeight has changed at all and then maybe only redraw the changed part
      // optimally just make a copy of all lower parts and then re-insert that at the new position after drawing
      // the actually changed row...
      this.setSizesAndPositionsBeforeRedraw();
      this.drawDayLines();
      this.drawResources();
      this.drawEvents();
    } else {
      ref.events.push(ev);
      ref.max_event_width = ev.width;
      ref.events.push(ev);
      this.drawEvents();
    }
  }

  findEventByXY(x, y, startIdx, endIdx) {
    // don't bother if no one is interested...
    if (!this._onEventFound) return;
    startIdx = parseInt(startIdx) - 1;
    endIdx = parseInt(endIdx);
    if (startIdx < 0) startIdx = 0;
    let ref;
    // binary search for resources doesnt work properly for events yet because they're not ordered properly
    let start = startIdx, end = endIdx, id, mid;
    while (start <= end) {
      mid = Math.floor((start + end) / 2);
      id = this._resources_idx.get(mid);
      ref = this._resources.get(id);
      let l = ref.events.length, ev;
      if (ref.yPos <= y && ref.yPos + ref.height >= y) {
        for (let i = 0; i < l; i++) {
          ev = ref.events[i];
          if ((ev.minx <= x && ev.minx + ev.width >= x) && (ev.miny <= y && ev.miny + this._cell_height - 1 >= y)) {
            return this._onEventFound(ev);
          }
        }
      }
      return;
    }
  else
    if (ref.yPos < y) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
}

drawEvents()
{
  this._resources.forEach((r) => {
    r.events.forEach((ev) => {
      this._eventlayer_ctx.fillStyle = "#1CA1C1";
      this._eventlayer_ctx.fillRect(ev.minx, ev.miny, ev.width, this._cell_height - 1);
      this._eventlayer_ctx.fillStyle = "#ffffff";
      this._eventlayer_ctx.fillText(ev.name, ev.minx + 4, ev.miny + 10);
    });
  });
  this._eventlayer_ctx.stroke();
}

separate(array)
{
  array.sort((a, b) => {
    if (a.start < b.start)
      return -1;
    if (a.start > b.start)
      return 1;
    return 0;
  });
  const getMax = (array) => {
    if (array.length == 0) return false;
    array.sort(function (a, b) {
      if (a.end < b.end)
        return 1;
      if (a.end > b.end)
        return -1;
      return 0;
    });
    return array[0].end;
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

setSizesAndPositionsBeforeRedraw()
{
  this._reslayer.width = this._resheaderlayer.width = this._res_col_width;
  this._reslayer.height = this._eventlayer.height = this._background.height = this._bgHeight; //cell_height * _resources.size;
  this._eventlayer.width = this._background.width = this._cols_in_tbl;
  this._headerlayer.width = this._cols_in_tbl + this._res_col_width;
  this._eventlayer.style.left = this._background.style.left = this._res_col_width + 'px';
  this._background_ctx.font = "12px Arial";
  this._eventlayer_ctx.font = "12px Arial";
  this._reslayer_ctx.font = "12px Arial";
  this._headerlayer_ctx.font = "12px Arial";
  this._resheaderlayer_ctx.font = "12px Arial";
}

drawResources()
{

  this._helpArray.forEach((obj) => {
    this._resheaderlayer_ctx.fillText(obj.name, obj.posX + 2, this._cell_height / 2);
  });

  this._resheaderlayer_ctx.stroke();
  this._reslayer_ctx.fillStyle = "#333";
  this._reslayer_ctx.textBaseline = "top";
  this._reslayer_ctx.lineWidth = 1;
  this._reslayer_ctx.strokeStyle = '#eee';
  this._reslayer_ctx.translate(0.5, 0.5);

  this._helpArray.forEach((obj, idx) => {
    if (idx) {
      this._reslayer_ctx.moveTo(obj.posX, 0);
      this._reslayer_ctx.lineTo(obj.posX, this._reslayer.height);
    }
  });
  this._resheaderlayer_ctx.translate(-0.5, -0.5);

  this._resources.forEach((value, key, map) => {
    this._helpArray.forEach((obj) => {
      this._reslayer_ctx.fillText(value[obj.name], obj.posX, value.yPos)
    });
    this._reslayer_ctx.moveTo(0, value.yPos);
    this._reslayer_ctx.lineTo(this._res_col_width, value.yPos);
  });

  this._reslayer_ctx.stroke();
}

drawDayLines()
{
  let curDay = this._curFirstOfMonth.getDay();

  this._background_ctx.lineWidth = 1;
  this._background_ctx.translate(0.5, 0.5)
  this._background_ctx.strokeStyle = "#eee";
  this._headerlayer_ctx.textBaseline = "top";
  this._headerlayer_ctx.fillStyle = '#333';
  for (let i = 0; i < this._days_in_month; i++) {
    this._background_ctx.moveTo(i * this._cell_width, 0);
    this._background_ctx.lineTo(i * this._cell_width, this._bgHeight);
    this._headerlayer_ctx.fillText(i + 1, i * this._cell_width + (this._cell_width / 2) + this._res_col_width - this._numWidths[i] / 2, 4);
    this._headerlayer_ctx.fillText(this._days[curDay], i * this._cell_width + (this._cell_width / 2) + this._res_col_width - this._dayWidths[curDay] / 2, 16);
    if (curDay < 6) {
      curDay++;
    } else {
      curDay = 0;
    }
  }
  this._resources.forEach((value, key, map) => {
    this._background_ctx.moveTo(0, value.yPos);
    this._background_ctx.lineTo(this._cols_in_tbl, value.yPos);
  })
  this._background_ctx.translate(-0.5, -0.5);
  this._background_ctx.stroke();
  this._headerlayer_ctx.stroke();
}

initCalendar(obj)
{
  if (!obj.hasOwnProperty("resources")) {
    obj.resources = [];
  }
  if (obj.hasOwnProperty("sidecols")) {
    this.sidecols = obj.sidecols;
  }
  if (obj.hasOwnProperty("onEventFound")) {
    if (typeof obj.onEventFound === "function") {
      this._onEventFound = obj.onEventFound;
    }
  }
  if (obj.hasOwnProperty("inFrame")) {
    this._scheduler.style.height = "100vH";
    document.body.style.margin = "0";
  }

  this.prepareResources(obj.resources);
  if (obj.hasOwnProperty("start")) {
    this.setMonth(obj.start);
  } else {
    this.setMonth(new Date());
  }
  this.setSizesAndPositionsBeforeRedraw();
  this.drawDayLines();
  this.drawResources();
}

}


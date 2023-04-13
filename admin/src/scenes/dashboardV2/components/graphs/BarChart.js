import React, { useEffect, useState } from "react";
import { graphColors } from "./graph-commons";
import GraphTooltip from "./GraphTooltip";

export default function BarChart({ values, tooltips, title, noValue = false, unit = "", className = "", max }) {
  const [bars, setBars] = useState([]);

  useEffect(() => {
    if (values && values.length > 0) {
      const colors = graphColors[values.length];
      const maxValue = max ? max : Math.max(...values);
      setBars(
        values.map((value, idx) => {
          return {
            color: colors[idx],
            height: Math.min(Math.round((value / maxValue) * 100), 100) + "%",
            value: value + (unit ? unit : ""),
            tooltip: tooltips && tooltips.length > idx ? tooltips[idx] : undefined,
          };
        }),
      );
    } else {
      setBars([]);
    }
  }, [values]);

  return (
    <div className={` ${className}`}>
      <div className="flex flex-col items-center h-[100%]">
        <div className="flex flex-grow-1">
          {bars.map((bar, idx) => (
            <div className="group relative flex flex-col items-center mr-[6px] last:mr-0" key={"bar-" + idx}>
              <div className="flex-grow-1 relative w-[16px]">
                <div className="absolute left-[0px] right-[0px] bottom-[0px] rounded-full hover:scale-[1.05]" style={{ height: bar.height, backgroundColor: bar.color }}></div>
              </div>
              {!noValue && bar.value !== null && bar.value !== undefined && <div className="">{bar.value}</div>}
              {bar.tooltip && <GraphTooltip className="">{bar.tooltip}</GraphTooltip>}
            </div>
          ))}
        </div>
        {title && <div className="text-gray-900 text-sm font-bold mt-[10px]">{title}</div>}
      </div>
    </div>
  );
}

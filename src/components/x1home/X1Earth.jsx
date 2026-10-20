import React from "react";
import { Image } from "@/components/ui/image";

const ASSETS = "https://www.strategicmindsai.com/v2-assets/";

export default function X1Earth() {
  return (
    <div className="v2-earth" aria-hidden="true">
      <Image src={ASSETS + "connected-earth.jpg"} alt="" width="1254" height="306" />
      <svg className="v2-network" viewBox="0 0 1254 306" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <path className="v2-network-track" d="M104 230 Q276 56 464 205" />
        <path className="v2-network-flow" d="M104 230 Q276 56 464 205" />
        <path className="v2-network-track" d="M464 205 Q670 25 860 181" />
        <path className="v2-network-flow" d="M464 205 Q670 25 860 181" />
        <path className="v2-network-track" d="M860 181 Q1011 35 1171 232" />
        <path className="v2-network-flow" d="M860 181 Q1011 35 1171 232" />
        <path className="v2-network-track" d="M261 253 Q599 81 1015 253" />
        <path className="v2-network-flow" d="M261 253 Q599 81 1015 253" />
        <circle className="v2-network-beacon" cx="104" cy="230" r="3.6" />
        <circle className="v2-network-beacon" cx="464" cy="205" r="4" />
        <circle className="v2-network-beacon" cx="860" cy="181" r="3.8" />
        <circle className="v2-network-beacon" cx="1171" cy="232" r="3" />
      </svg>
    </div>
  );
}
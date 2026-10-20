import React from "react";
import { Image } from "@/components/ui/image";

const ASSETS = "/v2-assets/";

export default function X1Brand({ small = false }) {
  return (
    <div className={"v2-brand" + (small ? " v2-brand-small" : "")}>
      <div className="v2-emblem-stage">
        <Image src={ASSETS + "silver-emblem.png"} alt="Metallic Strategic Minds AI S emblem" width="370" height="360" className="v2-emblem" />
        <span className="v2-emblem-glint" aria-hidden="true" />
      </div>
      <Image src={ASSETS + "chrome-wordmark.png"} alt="Strategic Minds AI" width="1065" height="78" className="v2-wordmark" />
      <span className="v2-tagline"><i aria-hidden="true" />INTELLIGENCE IN MOTION<i aria-hidden="true" /></span>
    </div>
  );
}
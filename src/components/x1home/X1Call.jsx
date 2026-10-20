import React from "react";
import { Phone, Sparkles } from "lucide-react";

const EDEN_PHONE = "tel:+18665711174";
const BUSINESS_PHONE = "tel:+17722090266";

export default function X1Call({ eden = false, small = false }) {
  return (
    <a
      className={"v2-call " + (eden ? "v2-call-eden" : "v2-call-now") + (small ? " v2-call-small" : "")}
      href={eden ? EDEN_PHONE : BUSINESS_PHONE}
      aria-label={eden ? "Call Eden Skye at 866-571-1174" : "Call Strategic Minds AI at 772-209-0266"}
      title={eden ? "866-571-1174" : "772-209-0266"}
    >
      {eden ? <Sparkles size={16} /> : <Phone size={16} />}
      <span>{eden ? "CALL EDEN" : "CALL NOW"}</span>
    </a>
  );
}
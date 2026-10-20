import React from "react";
import { Link } from "react-router-dom";

const EMAIL = "jeremy@strategicmindsai.com";
const BUSINESS_PHONE = "tel:+17722090266";

export default function X1SiteFooter() {
  return (
    <footer className="v2-footer">
      <strong>STRATEGIC MINDS AI</strong>
      <span>INTELLIGENCE IN MOTION</span>
      <Link to="/opportunities">PRICING</Link>
      <Link to="/dashboard">CLIENT PORTAL</Link>
      <p><a href={"mailto:" + EMAIL}>{EMAIL}</a> · <a href={BUSINESS_PHONE}>(772) 209-0266</a></p>
    </footer>
  );
}
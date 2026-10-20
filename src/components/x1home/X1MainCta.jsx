import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function X1MainCta({ label = "START YOUR AI TRANSFORMATION", to = "/onboarding" }) {
  return (
    <Link to={to} className="v2-main-cta">
      <span>{label}</span>
      <span className="v2-cta-arrow"><ArrowRight size={18} /></span>
    </Link>
  );
}
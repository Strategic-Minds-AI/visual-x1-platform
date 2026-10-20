// What the live services answered, read against one infrastructure record.
//
// Every indicator states what a service actually returned, or that the service is
// not wired at all. A filled-in field is never treated as proof that something is
// live: the field says where to look, the answer says what is there.

const text = (value) => String(value ?? "").trim();

function stripUrl(value) {
  return text(value).toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

// owner/repo, from either the shorthand field or the repository's address.
export function repoName(project) {
  return stripUrl(project.github_repo || project.github_url || "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "");
}

// The Vercel project's name, from the name field or its address.
export function vercelName(project) {
  return stripUrl(project.vercel_url || "").replace(/^vercel\.com\//, "").split("/")[0];
}

function shortName(fullName) {
  const parts = stripUrl(fullName).split("/");
  return parts[parts.length - 1] || "";
}

function day(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

// The catalog of the Supabase project a ref points at, as it was read.
export function environmentFor(live, ref) {
  const wanted = text(ref);
  if (!wanted) return null;
  return (live?.supabase?.environments || []).find((e) => e.ref === wanted) || null;
}

// Staging against production: the tables each one actually holds.
export function tableDrift(staging, production) {
  if (!staging || !production || !staging.ok || !production.ok) return null;
  const a = new Set(staging.tables || []);
  const b = new Set(production.tables || []);
  const missing_in_staging = [...b].filter((t) => !a.has(t));
  const missing_in_production = [...a].filter((t) => !b.has(t));
  return {
    missing_in_staging,
    missing_in_production,
    aligned: !missing_in_staging.length && !missing_in_production.length
  };
}

function supabaseIndicator(project, live) {
  const stagingRef = text(project.supabase_staging_ref);
  const productionRef = text(project.supabase_production_ref) || text(project.supabase_ref);

  if (!stagingRef && !productionRef) {
    return { key: "supabase", label: "Supabase", state: "unwired", detail: "no Supabase project on this system" };
  }
  if (!live?.supabase?.connected) {
    return {
      key: "supabase",
      label: "Supabase",
      state: "attention",
      detail: live?.supabase?.error || "Supabase is not connected to this app"
    };
  }

  const staging = environmentFor(live, stagingRef);
  const production = environmentFor(live, productionRef);

  if (stagingRef && productionRef) {
    const drift = tableDrift(staging, production);
    if (!staging?.ok || !production?.ok) {
      return {
        key: "supabase",
        label: "Supabase",
        state: "attention",
        detail: !staging?.ok
          ? `staging (${stagingRef}) could not be read`
          : `production (${productionRef}) could not be read`
      };
    }
    if (drift?.aligned) {
      return {
        key: "supabase",
        label: "Supabase",
        state: "live",
        detail: `staging and production aligned · ${staging.table_count} tables each`
      };
    }
    return {
      key: "supabase",
      label: "Supabase",
      state: "attention",
      detail: `drift · ${drift?.missing_in_staging.length || 0} missing in staging, ${drift?.missing_in_production.length || 0} missing in production`
    };
  }

  const single = staging || production;
  const which = stagingRef ? "staging" : "production";
  return {
    key: "supabase",
    label: "Supabase",
    state: "attention",
    detail: single?.ok
      ? `${which} only · ${single.table_count} tables · no ${stagingRef ? "production" : "staging"} environment pointed at`
      : `${which} (${stagingRef || productionRef}) could not be read`
  };
}

export function indicatorsFor(project, live) {
  const out = [];

  // Drive
  const folder = text(project.drive_folder_url);
  if (folder) {
    out.push({ key: "drive", label: "Drive", state: "live", detail: "folder linked", href: folder });
  } else if (live?.drive?.connected) {
    out.push({ key: "drive", label: "Drive", state: "wired", detail: "Drive connected · no folder on this system" });
  } else {
    out.push({ key: "drive", label: "Drive", state: "unwired", detail: "Drive is not connected to this app yet" });
  }

  // GitHub
  const repo = repoName(project);
  if (!repo) {
    out.push({ key: "github", label: "GitHub", state: "unwired", detail: "no repository on this system" });
  } else if (!live?.github?.connected) {
    out.push({
      key: "github",
      label: "GitHub",
      state: "attention",
      detail: live?.github?.error || "GitHub is not connected to this app"
    });
  } else {
    const found = (live.github.repos || []).find(
      (r) => stripUrl(r.full_name) === repo || shortName(r.full_name) === repo || String(r.name).toLowerCase() === repo
    );
    out.push(
      found
        ? {
            key: "github",
            label: "GitHub",
            state: "live",
            detail: `${found.branch || "no default branch"} · updated ${day(found.updated) || "unknown"}${found.private ? " · private" : ""}`,
            href: found.url
          }
        : {
            key: "github",
            label: "GitHub",
            state: "attention",
            detail: `${repo} is not visible to the connected GitHub account`
          }
    );
  }

  // Vercel
  const vercel = vercelName(project);
  if (!vercel) {
    out.push({ key: "vercel", label: "Vercel", state: "unwired", detail: "no Vercel project on this system" });
  } else if (!live?.vercel?.connected) {
    out.push({
      key: "vercel",
      label: "Vercel",
      state: "attention",
      detail: live?.vercel?.error || "Vercel is not connected to this app"
    });
  } else {
    const found = (live.vercel.projects || []).find(
      (p) => String(p.name).toLowerCase() === vercel || (project.vercel_id && p.id === project.vercel_id)
    );
    out.push(
      found
        ? {
            key: "vercel",
            label: "Vercel",
            state: found.live?.state === "READY" ? "live" : "attention",
            detail: `${found.live?.state || "no deployment yet"}${found.live?.target ? ` · ${found.live.target}` : ""}`,
            href: found.url
          }
        : {
            key: "vercel",
            label: "Vercel",
            state: "attention",
            detail: `${vercel} is not visible to the Vercel token`
          }
    );
  }

  // Railway
  const service = text(project.railway_service_id || project.railway_url);
  if (!live?.railway?.token_present) {
    out.push({
      key: "railway",
      label: "Railway",
      state: "unwired",
      detail: service ? "service recorded · no Railway token stored yet" : "Railway is not wired to this app yet"
    });
  } else {
    out.push({
      key: "railway",
      label: "Railway",
      state: service ? "wired" : "unwired",
      detail: service ? "service recorded · health read runs from the control room" : "no service on this system",
      href: text(project.railway_url) || undefined
    });
  }

  out.push(supabaseIndicator(project, live));
  return out;
}
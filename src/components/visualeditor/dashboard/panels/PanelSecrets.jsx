import React from "react";
import { base44 } from "@/api/base44Client";
import { Badge, Failure, Loading, Note, Row, RowList, Section, useLoad } from "../dashboardUi";

/**
 * Which keys this app has, never what they are. Presence is read on the server, one
 * literal name at a time; no value is ever read, returned or shown here, and setting or
 * rotating one happens on the app dashboard under Secrets.
 */
export default function PanelSecrets() {
  const { data, error, loading, reload } = useLoad(async () => {
    const res = await base44.functions.invoke("projectConsole", { action: "status" });
    const answer = res.data || {};
    if (answer.error) throw new Error(answer.error);
    return answer;
  }, []);

  return (
    <Section
      title="Secrets"
      note="Read-only status for the names this app's functions use. Nothing here can read a value, and nothing here can change one."
      actions={
        <button type="button" className="ve-pop-action" onClick={reload}>
          READ AGAIN
        </button>
      }
    >
      {loading && <Loading what="the secret names" />}
      {error && <Failure error={error} />}

      {data && (
        <RowList>
          {data.secrets.map((s) => (
            <Row key={s.name} name={s.name} detail={`used by ${s.used_by}`}>
              <Badge tone={s.present ? "" : "off"}>{s.present ? "SET" : "NOT SET"}</Badge>
            </Row>
          ))}
        </RowList>
      )}

      <Note>
        {data?.method || "Presence is read on the server; values are never read."} A name that is not set is exactly why a
        function answers that it has no credentials — the Vercel menu says so in the same words. Add or rotate values on the
        app dashboard, under Secrets; the change reaches the functions on their next call.
      </Note>
    </Section>
  );
}
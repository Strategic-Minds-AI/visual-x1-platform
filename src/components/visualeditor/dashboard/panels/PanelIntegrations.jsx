import React from "react";
import { base44 } from "@/api/base44Client";
import { Badge, Failure, Loading, Note, Row, RowList, Section, useLoad } from "../dashboardUi";

/**
 * Which connections this app actually holds, as the app's own connection store reports
 * them for the operator who asked. A connection that is not there reads as not connected
 * rather than being assumed: connecting one happens on the app dashboard, under
 * Integrations, and needs the account owner's consent.
 */
export default function PanelIntegrations() {
  const { data, error, loading, reload } = useLoad(async () => {
    const res = await base44.functions.invoke("projectConsole", { action: "status" });
    const answer = res.data || {};
    if (answer.error) throw new Error(answer.error);
    return answer;
  }, []);

  return (
    <Section
      title="Integrations"
      note="Read from this app's own connection store. Some integrations connect once for everyone; others connect per end user, and show as not connected here when this operator has not authorized them."
      actions={
        <button type="button" className="ve-pop-action" onClick={reload}>
          READ AGAIN
        </button>
      }
    >
      {loading && <Loading what="the app's connections" />}
      {error && <Failure error={error} />}

      {data && (
        <RowList>
          {data.connectors.map((c) => (
            <Row key={c.type} name={c.type} detail={`powers ${c.powers}`}>
              <Badge tone={c.connected ? "" : "off"}>{c.connected ? "CONNECTED" : "NOT CONNECTED"}</Badge>
            </Row>
          ))}
        </RowList>
      )}

      <Note>
        {data?.method || "Connections are read from the app's own store."} Connecting or disconnecting an account is done
        on the app dashboard under Integrations, where the account owner consents to the scopes being granted.
      </Note>
    </Section>
  );
}
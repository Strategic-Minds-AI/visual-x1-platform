import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Action, Failure, Loading, Note, Row, RowList, Section, useAction, useLoad } from "../dashboardUi";

// The app's own mail, as the platform sends it. Their wording is the app dashboard's
// business; this panel says what each one is for, and sends a project message itself.
const SYSTEM_EMAILS = [
  { name: "Password reset", detail: "Sent when someone asks for a reset link, with the action button that completes it." },
  { name: "Address verification", detail: "Sent when someone registers, carrying the one-time code that proves the address." },
  { name: "Invitation", detail: "Sent when an admin invites a person to the app, with the link that accepts it." },
  { name: "Access approved", detail: "Sent when a request to join the app is approved." },
];

/**
 * One project message, to someone who actually has an account on this app — the recipient
 * is resolved against the app's own users on the server before anything is sent, so this
 * cannot be used to mail an address the app does not hold.
 */
export default function PanelEmails({ ctx }) {
  const { projectName } = ctx;
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const send = useAction();

  const { data, loading } = useLoad(async () => {
    const page = await base44.entities.User.list({ sort: "-created_date", limit: 60 });
    return page.items || (Array.isArray(page) ? page : []);
  }, []);

  const go = () =>
    send.run(async () => {
      const res = await base44.functions.invoke("projectConsole", {
        action: "send_email",
        to_email: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        project: projectName,
      });
      const answer = res.data || {};
      if (answer.error) throw new Error(answer.error);
      setSubject("");
      setBody("");
      return `Sent to ${answer.sent_to}. ${answer.method || ""}`;
    });

  return (
    <Section title="Emails" note={`${projectName} · one message to an app user, and the app's own system mail.`}>
      <div className="ve-fields">
        <label className="ve-field">
          <span>Recipient</span>
          <input
            list="ve-recipients"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={loading ? "reading the app's users…" : "an app user's address"}
            autoComplete="off"
          />
          <datalist id="ve-recipients">
            {(data || []).map((u) => (
              <option key={u.id} value={u.email}>
                {u.full_name || u.email}
              </option>
            ))}
          </datalist>
        </label>
        <label className="ve-field">
          <span>Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What this is about" />
        </label>
        <label className="ve-field">
          <span>Message</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What the person needs to know" />
        </label>
        <Action label="SEND" onClick={go} disabled={!to.trim() || !subject.trim() || !body.trim()} busy={send.running} />
      </div>

      {send.error && <Failure error={send.error} />}
      {send.result && <Note>{send.result}</Note>}

      <RowList>
        {SYSTEM_EMAILS.map((m) => (
          <Row key={m.name} name={m.name} detail={m.detail} meta="sent by the platform" />
        ))}
      </RowList>

      <Note>
        This app can only email addresses that have an account on it; anything else is refused with the reason. The wording
        and layout of the four system emails above are edited on the app dashboard, under Emails.
      </Note>
    </Section>
  );
}
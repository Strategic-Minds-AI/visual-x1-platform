import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Action, Failure, Loading, Note, Row, RowList, Section, useAction, useLoad, when } from "../dashboardUi";

const ROLES = [
  { id: "user", label: "User — can sign in and use the app" },
  { id: "admin", label: "Admin — can also see and change all data" },
];

/**
 * Who has an account on the app this project belongs to. Reading the whole list and
 * sending an invitation are admin actions: when the signed-in operator is not an admin
 * the read or the invite comes back with the reason, and the panel shows that rather
 * than an empty list.
 */
export default function PanelUsers({ ctx }) {
  const { data, error, loading, reload } = useLoad(async () => {
    const page = await base44.entities.User.list({ sort: "-created_date", limit: 60 });
    return page.items || (Array.isArray(page) ? page : []);
  }, []);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const invite = useAction();

  const send = () =>
    invite.run(async () => {
      const address = email.trim();
      if (!address) throw new Error("An email address is required.");
      await base44.users.inviteUser(address, role);
      setEmail("");
      reload();
      return `An invitation was sent to ${address} as ${role}. They join once they accept it.`;
    });

  return (
    <Section
      title="App Users"
      note="Accounts on the app this project belongs to. An invitation is sent by the app itself, and the person joins with the role they were invited as."
      actions={<Action label="REFRESH" onClick={reload} />}
    >
      <div className="ve-fields">
        <label className="ve-field">
          <span>Email address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            autoComplete="email"
          />
        </label>
        <label className="ve-field">
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <Action label="SEND INVITATION" onClick={send} disabled={!email.trim()} busy={invite.running} />
      </div>

      {invite.error && <Failure error={invite.error} />}
      {invite.result && <Note>{invite.result}</Note>}

      {loading && <Loading what="the app's users" />}
      {error && <Failure error={error} />}

      {data && (
        <RowList>
          {data.map((u) => (
            <Row
              key={u.id}
              name={u.full_name || u.email}
              detail={u.full_name ? u.email : "no name on the account"}
              meta={`${u.role || "user"} · joined ${when(u.created_date)}`}
            />
          ))}
          {data.length === 0 && <Row name="No accounts yet" detail="Invite the first person above." />}
        </RowList>
      )}

      <Note>
        Only an admin of this app can read every account or hand out the admin role; anyone else sees the reason above.
        Admins can see and change all of the app's data, so invite the admin role deliberately.
      </Note>
    </Section>
  );
}
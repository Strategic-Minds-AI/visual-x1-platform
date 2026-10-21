import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import ProjectIndicators from "@/components/projects/ProjectIndicators";
import ProjectDelivery from "@/components/projects/ProjectDelivery";
import ProjectRouting from "@/components/projects/ProjectRouting";
import { indicatorsFor } from "@/lib/projectIndicators";

export default function ProjectCard({ project, live, onEdit, onDelete }) {
  const indicators = indicatorsFor(project, live);
  const url = project.deployment_url || project.vercel_url || "";

  return (
    <div className="x1-glass rounded-2xl p-4 space-y-3 electric-hover">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0">
          <p className="font-heading font-semibold truncate">{project.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {String(project.stack_type || "static_site").replace(/_/g, " ")}
            {project.domain ? ` · ${project.domain}` : ""}
            {` · ${String(project.provision_status || "pending").replace(/_/g, " ")}`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {project.domain_status ? (
            <Badge variant="outline" className="text-[10px]">
              domain {project.domain_status}
            </Badge>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => onEdit(project)} title="Edit this system">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(project)} title="Delete this system">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {project.description ? <p className="text-xs text-muted-foreground">{project.description}</p> : null}

      <ProjectIndicators indicators={indicators} />

      <div className="flex flex-wrap items-start gap-3">
        <ProjectDelivery key={project.id} project={project} />
        <ProjectRouting key={`${project.id}-routing`} project={project} />
      </div>

      {url ? (
        <a
          href={url.startsWith("http") ? url : `https://${url}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open the live system
        </a>
      ) : null}
    </div>
  );
}
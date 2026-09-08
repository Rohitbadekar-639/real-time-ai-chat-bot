export function roomKind(project) {
  if (project?.pairKey || String(project?.name || "").startsWith("dm-")) {
    return "direct";
  }
  const count = project?.users?.length || 0;
  if (count <= 1) return "solo";
  return "group";
}

export function roomTitle(project, myEmail) {
  const kind = roomKind(project);
  if (kind === "direct") {
    const other = (project.users || []).find((entry) => {
      const email = entry?.email || entry;
      return email && email !== myEmail;
    });
    return other?.email || "Direct chat";
  }
  return project?.name || "Room";
}

export function roomSubtitle(kind, count) {
  if (kind === "direct") return "One-to-one chat + shared code";
  if (kind === "solo") return "Just you · invite anyone later";
  return `${count} people · group workspace`;
}

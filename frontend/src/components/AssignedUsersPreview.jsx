const MAX_VISIBLE_USERS = 5;

export default function AssignedUsersPreview({ members }) {
  const remaining = members.slice(MAX_VISIBLE_USERS);
  return (
    <span className="avatars assigned-users-preview">
      {members.slice(0, MAX_VISIBLE_USERS).map((member) => (
        <span
          key={member.id}
          className="avatar avatar--sm"
          style={{ background: "var(--color-green)" }}
          title={member.name}
          aria-label={member.name}
        >
          {member.initials}
        </span>
      ))}
      {remaining.length > 0 && (
        <span
          className="avatar avatar--sm avatar--more"
          title={remaining.map((member) => member.name).join(", ")}
          aria-label={`${remaining.length} personas asignadas adicionales`}
        >
          +{remaining.length}
        </span>
      )}
    </span>
  );
}

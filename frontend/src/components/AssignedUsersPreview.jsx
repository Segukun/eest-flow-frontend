import UserAvatar from "./layout/UserAvatar";

const MAX_VISIBLE_USERS = 3;

export default function AssignedUsersPreview({ members }) {
  const remaining = members.slice(MAX_VISIBLE_USERS);

  return (
    <span className="avatars assigned-users-preview">
      {members.slice(0, MAX_VISIBLE_USERS).map((member) => (
        <UserAvatar
          key={member.id}
          user={member}
          className="avatar avatar--sm"
          title={member.name}
        />
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
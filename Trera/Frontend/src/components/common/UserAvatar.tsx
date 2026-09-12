import React from "react";

interface UserAvatarProps {
  name?: string;
  avatar?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const COLORS = [
  "bg-indigo-600 text-white",
  "bg-violet-600 text-white",
  "bg-blue-600 text-white",
  "bg-emerald-600 text-white",
  "bg-amber-600 text-white",
  "bg-rose-600 text-white",
  "bg-teal-600 text-white",
  "bg-cyan-600 text-white",
];

export const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarColor = (name?: string): string => {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatar,
  size = "md",
  className = "",
}) => {
  const [imgError, setImgError] = React.useState(false);
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  const sizeClasses = {
    xs: "size-5 text-[9px]",
    sm: "size-7 text-[11px]",
    md: "size-9 text-xs font-semibold",
    lg: "size-11 text-sm font-bold",
  };

  if (avatar && !imgError) {
    return (
      <img
        src={avatar}
        alt={name || "Avatar"}
        title={name}
        onError={() => setImgError(true)}
        className={`rounded-full shrink-0 select-none object-cover shadow-sm ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      title={name}
      className={`rounded-full flex items-center justify-center shrink-0 select-none shadow-sm ${sizeClasses[size]} ${colorClass} ${className}`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;

import { UserRound } from "lucide-react";

type UserAvatarProps = {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const iconSizes = {
  sm: 17,
  md: 20,
  lg: 30,
  xl: 42,
};

export default function UserAvatar({ src, name, size = "md", className = "" }: UserAvatarProps) {
  const classes = `${sizes[size]} shrink-0 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-blue-600 to-violet-600 object-cover ${className}`;

  if (src) {
    return <img src={src} alt={name ? `Profilbild von ${name}` : "Profilbild"} className={classes} />;
  }

  return (
    <div className={`${classes} flex items-center justify-center text-white`} title={name}>
      <UserRound size={iconSizes[size]} />
    </div>
  );
}

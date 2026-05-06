import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  /** Đường dẫn ảnh avatar (ví dụ: avatar.png). Nếu không có thì hiển thị chữ cái đầu tên. */
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-xl",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function UserAvatar({ name, src, size = "md", className }: UserAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Avatar"}
        className={cn("rounded-full object-cover shrink-0", sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold select-none",
        sizeMap[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

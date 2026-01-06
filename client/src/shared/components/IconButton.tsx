interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  count?: number;
  disabled?: boolean;
  variant?: 'like' | 'dislike' | 'default';
}

const variantColors = {
  default: {
    active: 'text-primary-500',
    inactive: 'text-text-muted hover:text-text-primary',
  },
  like: {
    active: 'text-green-500',
    inactive: 'text-text-muted hover:text-green-400',
  },
  dislike: {
    active: 'text-red-500',
    inactive: 'text-text-muted hover:text-red-400',
  },
};

export function IconButton({
  icon,
  onClick,
  active = false,
  count,
  disabled = false,
  variant = 'default',
}: IconButtonProps) {
  const colors = variantColors[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${active ? colors.active : colors.inactive}
      `}
    >
      {icon}
      {count !== undefined && (
        <span className="text-sm font-medium">{count}</span>
      )}
    </button>
  );
}

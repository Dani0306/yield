type AvatarProps = {
  imageUrl?: string | null;
  initials: string;
  size?: number;
};

const Avatar = ({ imageUrl, initials, size = 32 }: AvatarProps) => {
  const style = { width: size, height: size };

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny avatar, any host
      <img
        src={imageUrl}
        alt=""
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-medium tracking-wide text-white"
    >
      {initials}
    </span>
  );
};

export default Avatar;

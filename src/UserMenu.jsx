import { useEffect, useRef, useState } from "react";
import { useTranslation } from "./hooks/useTranslation";
import "./user-menu.css";

function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => Array.from(p)[0]).join("").toUpperCase();
}

export default function UserMenu({ user, onSignOut }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const ref = useRef(null);

  const meta = user.user_metadata ?? {};
  const name = meta.full_name || meta.name || user.email || "";
  const avatar = meta.avatar_url || meta.picture;

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatarEl =
    avatar && !imgFailed ? (
      <img
        className="user-avatar"
        src={avatar}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
      />
    ) : (
      <span className="user-avatar user-avatar-initials" aria-hidden="true">
        {initialsOf(name)}
      </span>
    );

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("auth.account")}
        title={name}
      >
        {avatarEl}
      </button>

      {open && (
        <div className="user-menu-pop" role="menu">
          <div className="user-menu-info">
            {avatarEl}
            <div className="user-menu-text">
              <strong dir="auto">{name}</strong>
              {user.email && name !== user.email && <span dir="ltr">{user.email}</span>}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            className="user-menu-signout"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            {t("auth.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

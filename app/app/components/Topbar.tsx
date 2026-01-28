import LogoutButton from "./LogoutButton";

export default function Topbar({ name, role }: { name: string; role: string }) {
  return (
    <header className="topbar">
      <div className="topbarLeft">
        <div className="pageTitle"> </div>
      </div>

      <div className="topbarRight">
        <div className="userBox">
          <div className="userName">{name}</div>
          <div className="userRole">{role}</div>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}

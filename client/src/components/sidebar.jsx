const sidebar = () => {
  return (
    <div className="w-64 h-screen bg-white border-r fixed left-0 top-0 flex flex-col justify-between">
      {/*TOP + Menu*/}
      <div>
        {/* Logo */}
        <div>className="h-16</div>

        {/* Menu */}
        <ul className="space-y-2 px-4">
          <li className="fles items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            📊 <span>Dashboard</span>
          </li>
          <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            📝 <span>My Complaints</span>
          </li>

          <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            📢 <span>Notices</span>
          </li>

          {/* Active Item */}
          <li className="flex items-center gap-3 p-2 rounded-lg bg-teal-500 text-white cursor-pointer">
            👤 <span>Profile</span>
          </li>
        </ul>
      </div>

      {/* Logout */}
      <div className="p-4">
        <button className="flex items-center gap-2 text-red-500 hover:text-red-600">
          🚪 <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default sidebar;

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">
          Campus Skill Exchange
        </h1>

        <div className="hidden md:flex gap-6 font-medium">
          <a href="#" className="hover:text-blue-600 transition">Home</a>
          <a href="#" className="hover:text-blue-600 transition">Skills</a>
          <a href="#" className="hover:text-blue-600 transition">Dashboard</a>
          <a href="#" className="hover:text-blue-600 transition">Login</a>
        </div>
      </div>
    </nav>
  );
}
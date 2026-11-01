export default function SkillCard({ title, level, student }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>

      <p className="text-gray-500 mb-1">
        Offered by: {student}
      </p>

      <p className="text-sm text-blue-600 mb-4">
        {level}
      </p>

      <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
        Request Skill
      </button>
    </div>
  );
}
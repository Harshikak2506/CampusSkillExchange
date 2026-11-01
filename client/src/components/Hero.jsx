export default function Hero() {
  return (
    <section className="bg-blue-50 py-20">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-5xl font-bold text-gray-800 mb-6">
          Find a Skill. Share a Skill.
        </h2>

        <p className="text-xl text-gray-600 mb-8">
          Learn together with students across campus.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Find Skills
          </button>

          <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition">
            Offer Your Skill
          </button>
        </div>
      </div>
    </section>
  );
}
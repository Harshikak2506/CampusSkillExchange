export default function FeatureSection() {
  const features = [
    "Peer-to-peer learning",
    "Verified student profiles",
    "Real-time skill requests",
    "Free knowledge sharing",
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-10">
          Why Campus Skill Exchange?
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature}
              className="bg-gray-50 p-6 rounded-xl text-center shadow-sm"
            >
              <p className="font-medium">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
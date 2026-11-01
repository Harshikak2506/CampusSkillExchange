import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeatureSection from "../components/FeatureSection";
import SkillCard from "../components/SkillCard";
import Footer from "../components/Footer";

export default function Home() {
  const skills = [
    { title: "Java", level: "Intermediate", student: "Harshika" },
    { title: "Canva", level: "Beginner", student: "Student B" },
    { title: "Excel", level: "Advanced", student: "Student C" },
  ];

  return (
    <>
      <Navbar />
      <Hero />
      <FeatureSection />

      <section className="py-16 bg-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10">
            Popular Skills
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <SkillCard key={skill.title} {...skill} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
import MiddenCard from "@shared/ui/components/MiddenCard";
import mtImg from "../assets/mt.jpg";
import sqsImg from "../assets/sqs.jpg";

const Showcase = () => {
  return (
    <MiddenCard>
      <div className="space-y-12">
        <section className="pb-4">
          <h2 className="mb-6 font-gothic text-4xl font-bold text-white md:text-6xl text-shadow-hard-grey">
            Professional Showcase
          </h2>
          <p className="font-mono text-lg text-lightestGrey leading-relaxed">
            I&apos;ve been a professional developer since 2017. Since then, I&apos;ve worked on
            projects big and small, from enterprise data migrations to accessible and responsive
            redesigns to small-scale apps built to help students learn the fundamentals of
            JavaScript. Below are a couple of my favorites. All were designed and implemented as
            <strong> part of a team</strong>. If you&apos;d like to learn more, you can find my
            resume on my{" "}
            <a
              className="text-lightestGrey underline hover:text-white transition-colors"
              href="https://reedgaines.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              website
            </a>
            .
          </p>
        </section>

        <section className="space-y-10 font-mono">
          <div className="border-accent flex flex-col border-2 border-dashed p-6 md:p-8 bg-white/5 lg:flex-row lg:gap-8">
            <div className="mb-6 lg:mb-0 lg:w-1/3 shrink-0">
              <img src={sqsImg} alt="Squarespace Help Center" className="w-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="mb-4 flex flex-col md:flex-row md:items-baseline md:justify-between border-b-2 border-dashed border-white/10 pb-4">
                <h3 className="text-2xl font-bold text-white md:text-3xl">
                  Squarespace Help Center
                </h3>
                <span className="text-sm text-lightestGrey mt-2 md:mt-0">2021 – 2024</span>
              </div>

              <ul className="space-y-3 text-lightestGrey ml-4 list-disc marker:text-accent">
                <li>
                  <strong>Article & Home Page Redesign:</strong> Implemented a comprehensive
                  redesign, adding content placeholders to minimize layout shift and significantly
                  improving Core Web Vitals.
                </li>
                <li>
                  <strong>AI-Powered Support Chatbot:</strong> Architected and implemented a new
                  chatbot with complex live-support handoff flows, directly supporting initiatives
                  to leverage AI for user productivity.
                </li>
              </ul>
            </div>
          </div>

          <div className="border-accent flex flex-col border-2 border-dashed p-6 md:p-8 bg-white/5 lg:flex-row lg:gap-8">
            <div className="mb-6 lg:mb-0 lg:w-1/3 shrink-0">
              <img src={mtImg} alt="MotorTrend" className="w-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="mb-4 flex flex-col md:flex-row md:items-baseline md:justify-between border-b-2 border-dashed border-white/10 pb-4">
                <h3 className="text-2xl font-bold text-white md:text-3xl">MotorTrend</h3>
                <span className="text-sm text-lightestGrey mt-2 md:mt-0">2019 - 2020</span>
              </div>
              <ul className="space-y-3 text-lightestGrey ml-4 list-disc marker:text-accent">
                <li>
                  <strong>Article Page & Buyer&apos;s Guide:</strong> Rewrote and implemented
                  comprehensive redesigns on the frontend.
                </li>
                <li>
                  <strong>Performance Improvements: </strong>Optimized critical rendering paths to
                  increase page performance by a factor of 10 and achieve top-tier rankings on
                  contemporary web performance benchmarks.
                </li>
                <li>
                  <strong>Ad Viewability: </strong>Streamlined third-party ad implementations,
                  increasing viewability by 400% and directly driving revenue.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </MiddenCard>
  );
};

export default Showcase;

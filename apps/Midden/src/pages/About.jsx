import MiddenCard from "@shared/ui/components/MiddenCard";

const About = () => {
  return (
    <MiddenCard>
      <div className="space-y-8">
        <section className="pb-8 mb-6 border-b-2 border-dashed">
          <h2 className="mb-1 font-gothic text-4xl font-bold text-white">
            Midden
          </h2>
          <p className="mb-4 text-sm text-gray-400">(noun) /ˈmɪdən/</p>
          
          <ul className="mb-4 text-sm list-inside list-disc space-y-2 pl-2">
            <li>A dung heap.</li>
            <li>A refuse heap usually near a dwelling.</li>
            <li>
              (archaeology) An accumulation, deposit, or soil derived from occupation
              debris, rubbish, or other by-products of human activity, such as bone,
              shell, ash, or decayed organic materials; or a pile or mound of such
              materials, often prehistoric.
            </li>
          </ul>
          
          <p className="text-xs italic text-gray-500">
            Excerpt from the Wiktionary entry for “midden”
          </p>
        </section>

        <section className="space-y-4 leading-relaxed">
          <p>
            In my life so far, one thing has become clear: If you intend to accomplish something, don&apos;t make a big deal out of it. Midden is my attempt to reframe my programming a/vocation as an archaeological trashheap—something that, at the time, doesn&apos;t really matter, but in the future, could be worth something. I write code to please myself, to make useful things, and as a showcase for potential employment, in that order.
          </p>
          <p>
            The site is broken down into two main groups: full-fledged apps and experiments, which are little one-off sketches. Midden is the hub, the locus, the pile, the directory, the place where it&apos;s all posted for your perusal. For your convenience, I&apos;ve set up single sign on for my entire suite of apps—if you register for one, you&apos;ve got an account on them all.
          </p>
          <p>
            Please don&apos;t hesitate to <a href="https://reedgaines.com/contact/" target="_blank" rel="noopener noreferrer" className="text-lightestGrey underline hover:text-white transition-colors">drop a line</a> if you&apos;re curious about me, have something for me to work on, or have a question about this project.
          </p>
        </section>
      </div>
    </MiddenCard>
  );
};

export default About;
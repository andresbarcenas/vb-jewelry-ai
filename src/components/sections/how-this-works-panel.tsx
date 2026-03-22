import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";

interface HelpCardProps {
  title: string;
  children: React.ReactNode;
}

const linkClasses =
  "inline-flex items-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent";

function HelpCard({ title, children }: HelpCardProps) {
  return (
    <div className="rounded-[24px] border border-border/80 bg-white/78 p-5 shadow-[0_12px_32px_rgba(68,52,35,0.06)]">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export function HowThisWorksPanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-border/80 bg-accent-soft/40 px-5 py-5">
        <p className="text-sm font-semibold text-foreground">Welcome</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
          This studio is here to help you plan social content faster without losing
          control of your brand. You do not need to be technical to use it. Each
          section is designed to guide you with simple labels and local mock data
          while the workflow is still being shaped.
        </p>
      </div>

      <SectionCard
        title="What This App Does"
        description="In simple terms, this app helps turn your jewelry products and brand direction into organized content ideas, review steps, and posting plans."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <HelpCard title="It keeps your brand organized">
            <p>
              You can store your brand voice, preferred style, product details, and
              approved personas in one place so future content stays more consistent.
            </p>
          </HelpCard>
          <HelpCard title="It helps plan content faster">
            <p>
              Instead of starting from scratch every time, the app helps you combine
              a persona, a product, and a content direction to produce ready-to-review ideas.
            </p>
          </HelpCard>
          <HelpCard title="It supports review before posting">
            <p>
              The workflow is meant to slow down only where it matters, such as final
              approval and publishing, so you can move quickly without posting the wrong thing.
            </p>
          </HelpCard>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Key Terms"
          description="These are the main ideas used throughout the studio."
        >
          <div className="space-y-4">
            <HelpCard title="What a persona is">
              <p>
                A persona is a fictional model profile we use to present jewelry in
                different styles while staying consistent with the brand.
              </p>
              <p>
                Think of a persona as a simple content character. One persona might
                feel polished and luxury-focused, while another might feel more warm,
                casual, or gift-oriented.
              </p>
            </HelpCard>

            <HelpCard title="What product assets are">
              <p>
                Product assets are the materials the content system uses to talk about
                or show a piece of jewelry.
              </p>
              <p>
                This can include product photos, product names, materials, colors,
                style tags, and notes about how the piece should be presented.
              </p>
            </HelpCard>

            <HelpCard title="What approval means">
              <p>
                Approval means a person on the business side has reviewed the content
                and is comfortable with how the product, message, and brand are being shown.
              </p>
              <p>
                It is the step where you confirm, &quot;Yes, this feels right for the brand.&quot;
              </p>
            </HelpCard>

            <HelpCard title="What publishing means">
              <p>
                Publishing is the final step where approved content is prepared to go
                live on a platform such as Instagram Reels.
              </p>
              <p>
                In this version of the app, publishing is still a mock workflow. That
                means you can organize captions, dates, and statuses without actually posting anything.
              </p>
            </HelpCard>
          </div>
        </SectionCard>

        <SectionCard
          title="Why Revisions Happen"
          description="Revisions are normal and helpful. They are not a sign that something failed."
        >
          <div className="space-y-4">
            <HelpCard title="A product may not be shown clearly enough">
              <p>
                Sometimes the jewelry detail, material, or shape is not easy to see,
                so the content needs a clearer visual direction.
              </p>
            </HelpCard>

            <HelpCard title="The tone may not feel right">
              <p>
                A caption or concept might sound too salesy, too trendy, or simply not
                aligned with the way you want the brand to feel.
              </p>
            </HelpCard>

            <HelpCard title="The content may need stronger focus">
              <p>
                Some ideas become too busy. Revisions help narrow the message so one
                product, one story, or one styling point is easier to understand.
              </p>
            </HelpCard>

            <HelpCard title="Approval protects the brand">
              <p>
                It is better to revise before posting than to publish something that
                feels off-brand, confusing, or rushed.
              </p>
            </HelpCard>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="How This Saves Time While Keeping Brand Control"
        description="The goal is not to replace your judgment. The goal is to help your team move faster with better structure."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <HelpCard title="How it saves time">
            <p>
              The app keeps your core brand information, personas, and product details
              in one place, so you do not have to repeat the same instructions every time content is created.
            </p>
            <p>
              It also helps turn those approved ingredients into content ideas more quickly,
              which makes planning easier and reduces back-and-forth.
            </p>
          </HelpCard>

          <HelpCard title="How it keeps brand control">
            <p>
              You still decide what is approved, what needs changes, and what is ready
              to publish. The system supports your decisions instead of making them for you.
            </p>
            <p>
              That means you can use AI-assisted planning without giving up the brand
              standards that make the business feel personal and trustworthy.
            </p>
          </HelpCard>
        </div>
      </SectionCard>

      <SectionCard
        title="Simple Workflow"
        description="If you are ever unsure where to start, this is the easiest path through the app."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HelpCard title="1. Set the brand rules">
            <p>
              Start with Brand Profile so the app understands your voice, style, and guardrails.
            </p>
          </HelpCard>
          <HelpCard title="2. Add personas and products">
            <p>
              Save the fictional personas you want to use and the jewelry pieces you want to feature.
            </p>
          </HelpCard>
          <HelpCard title="3. Generate and review ideas">
            <p>
              Use Content Ideas to explore concepts, then review them before moving anything forward.
            </p>
          </HelpCard>
          <HelpCard title="4. Approve before publishing">
            <p>
              Only move content into the publishing workflow after it feels correct for the business.
            </p>
          </HelpCard>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={linkClasses} href="/brand-profile">
            Open Brand Profile
          </Link>
          <Link className={linkClasses} href="/personas">
            Open Personas
          </Link>
          <Link className={linkClasses} href="/content-ideas">
            Open Content Ideas
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}

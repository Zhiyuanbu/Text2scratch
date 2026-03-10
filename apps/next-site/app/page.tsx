const featureCards = [
  {
    title: "GitHub Pages friendly",
    description: "This app uses `output: \"export\"`, trailing slashes, and an automatic repo base path."
  },
  {
    title: "Isolated from Vite",
    description: "The current multi-page Vite site keeps shipping as-is while you experiment with Next.js separately."
  },
  {
    title: "Ready for migration",
    description: "Use this app when you want to port landing pages or docs into the App Router gradually."
  }
];

const migrationTracks = [
  "Keep the existing Vite build as the live GitHub Pages site.",
  "Prototype future UI in `apps/next-site/app`.",
  "Run `npm run next:build` when you want a static export from Next.js.",
  "Publish the generated `apps/next-site/out` folder as a standalone Pages site when needed."
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Next.js starter</p>
        <h1>Structured alongside the Vite app, without giving up static hosting.</h1>
        <p className="lede">
          The main site already uses React through Vite. This Next.js app is a separate static-export workspace so you can migrate page-by-page instead of replacing the current build in one step.
        </p>

        <div className="cta-row">
          <a className="primary-link" href="https://nextjs.org/docs/app/building-your-application/deploying/static-exports">
            Static export docs
          </a>
          <span className="secondary-copy">Output folder: `apps/next-site/out`</span>
        </div>
      </section>

      <section className="card-grid" aria-label="Key features">
        {featureCards.map((card) => (
          <article key={card.title} className="feature-card">
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="migration-panel">
        <div>
          <p className="eyebrow">Recommended flow</p>
          <h2>Use Next.js as a clean migration lane.</h2>
        </div>
        <ol>
          {migrationTracks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}

export default function CollectorTool() {
  const steps = [
    { title: "Invite", text: "Share a link to invite contributors" },
    { title: "Collect", text: "Guests add their favorite recipes in minutes" },
    { title: "Approve", text: "You approve and we format them beautifully" },
  ];

  return (
    <section aria-labelledby="collector-title" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-16">
        <h2 id="collector-title" className="text-2xl md:text-3xl font-semibold text-gray-900">
          Recipe Collector Tool
        </h2>
        <p className="mt-3 text-gray-700 max-w-prose">
          Easily gather recipes from friends and family with a simple link.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-gray-200 p-6 bg-white"
              aria-label={`${s.title} card`}
            >
              <div className="h-10 w-10 rounded-xl bg-gray-100 mb-4" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-gray-700">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

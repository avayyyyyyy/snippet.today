import { Metadata } from "next";
import Link from "next/link";
import { getChangelogData } from "./utils";
import "./styles.css";

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getChangelogData();
  const { latestVersion, latestDate, latestChanges, totalVersions } = metadata;

  // Format the date nicely
  const formattedDate = new Date(latestDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Create a summary of latest changes
  const changesSummary =
    latestChanges.slice(0, 3).join(", ") +
    (latestChanges.length > 3 ? "..." : "");

  return {
    title: `Changelog v${latestVersion} | Snippet Today`,
    description: `Latest updates (${formattedDate}): ${changesSummary}. View all ${totalVersions} versions.`,
    openGraph: {
      title: `Snippet Today Changelog - Version ${latestVersion}`,
      description: `Check out our latest updates from ${formattedDate}. ${changesSummary}`,
      type: "website",
      url: "https://snippet.today/changelog",
      siteName: "Snippet Today",
      images: [
        {
          url: "https://utfs.io/f/ZeS8ew97fvPDshopijOmPHwZq7h1UsrEOVjDJF4BgKdaSfLp",
          width: 1200,
          height: 630,
          alt: "Snippet Today Changelog",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Snippet Today - v${latestVersion} Changelog`,
      description: `Latest updates (${formattedDate}): ${changesSummary}`,
      site: "@shubhcodes",
      creator: "@shubhcodes",
      images: [
        "https://utfs.io/f/ZeS8ew97fvPDshopijOmPHwZq7h1UsrEOVjDJF4BgKdaSfLp",
      ],
    },
  };
}

export default async function ChangelogPage() {
  const { metadata, htmlContent } = await getChangelogData();
  const { latestVersion, latestDate, latestChanges } = metadata;

  const formattedDate = new Date(latestDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#eaeaea] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-[#111111] hover:text-[#666666] transition-colors group"
            >
              <div className="p-2 bg-[#fafafa] rounded-lg group-hover:bg-[#f5f5f5] transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </div>
              <span className="font-medium">Back to Editor</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-[#fafafa] text-[#666666] text-xs font-medium rounded-full border border-[#eaeaea] shadow-sm">
                v{latestVersion} • {formattedDate}
              </span>
              <h1 className="text-xl font-semibold text-[#111111]">
                Changelog
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-white border-b border-[#eaeaea]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-4xl font-bold text-[#111111] mb-4">
            Latest Updates
          </h2>
          <p className="text-lg text-[#666666] max-w-2xl">
            Stay up to date with the latest improvements and features added to
            Snippet Today. We&apos;re constantly working to make your experience
            better.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestChanges.slice(0, 3).map((change, index) => (
              <div
                key={index}
                className="p-4 bg-[#fafafa] rounded-xl border border-[#eaeaea] hover:border-[#666666] transition-all hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#111111]"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    {change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#eaeaea] overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-8">
              <div className="changelog-container">
                <article
                  className="prose max-w-none changelog-content"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="https://github.com/shubhank-saxena/snippet-today"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-white rounded-xl border border-[#eaeaea] hover:border-[#666666] hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#fafafa] rounded-lg group-hover:bg-[#f5f5f5] transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#666666] group-hover:text-[#111111] transition-colors"
                  >
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-[#111111] group-hover:text-[#666666] transition-colors">
                    GitHub
                  </h3>
                  <p className="text-sm text-[#666666]">View Repository</p>
                </div>
              </div>
            </a>

            <a
              href="https://x.com/shubhcodes"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-white rounded-xl border border-[#eaeaea] hover:border-[#666666] hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#fafafa] rounded-lg group-hover:bg-[#f5f5f5] transition-colors">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="text-[#666666] group-hover:text-[#111111] transition-colors"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-[#111111] group-hover:text-[#666666] transition-colors">
                    Twitter
                  </h3>
                  <p className="text-sm text-[#666666]">Follow Updates</p>
                </div>
              </div>
            </a>

            <div className="p-4 bg-white rounded-xl border border-[#eaeaea] hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#fafafa] rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#666666]"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-[#111111]">Last Updated</h3>
                  <p className="text-sm text-[#666666]">{formattedDate}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#fafafa] rounded-xl border border-[#eaeaea] hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/50 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#111111]"
                  >
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-[#111111]">New Release</h3>
                  <p className="text-sm text-[#666666]">
                    Version {latestVersion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

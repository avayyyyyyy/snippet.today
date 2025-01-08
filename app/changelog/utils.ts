import fs from "fs";
import path from "path";
import { marked } from "marked";

interface ChangelogMetadata {
  latestVersion: string;
  latestDate: string;
  latestChanges: string[];
  totalVersions: number;
}

interface ChangelogData {
  metadata: ChangelogMetadata;
  htmlContent: string;
}

function extractChangelogMetadata(content: string): ChangelogMetadata {
  const lines = content.split("\n");
  let latestVersion = "1.0.0";
  let latestDate = new Date().toISOString().split("T")[0];
  const latestChanges: string[] = [];
  let totalVersions = 0;
  let isCollectingChanges = false;

  for (const line of lines) {
    // Match version and date pattern: ## [1.0.0] - 2024-02-14
    const versionMatch = line.match(/^## \[([\d.]+)\] - (\d{4}-\d{2}-\d{2})/);
    if (versionMatch) {
      totalVersions++;
      if (totalVersions === 1) {
        [, latestVersion, latestDate] = versionMatch;
        isCollectingChanges = true;
        continue;
      }
      break; // Stop after first version block
    }

    // Collect changes from the latest version
    if (isCollectingChanges && line.trim().startsWith("- ")) {
      latestChanges.push(line.trim().substring(2));
    }

    // Stop collecting when we hit the next section
    if (isCollectingChanges && line.startsWith("## ")) {
      break;
    }
  }

  return {
    latestVersion,
    latestDate,
    latestChanges,
    totalVersions,
  };
}

export async function getChangelogData(): Promise<ChangelogData> {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  const content = fs.readFileSync(changelogPath, "utf-8");

  const metadata = extractChangelogMetadata(content);
  const htmlContent = marked.parse(content, { async: false }) as string;

  return {
    metadata,
    htmlContent,
  };
}

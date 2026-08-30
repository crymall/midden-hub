import { execFileSync } from "node:child_process";

const PACKAGES_BROKEN_BY_A_SECOND_COPY = [
  "react",
  "react-dom",
  "react-router-dom",
  "@tanstack/react-query",
];

const installedCopiesOf = (packageName) =>
  JSON.parse(execFileSync("npm", ["query", `#${packageName}`], { encoding: "utf8" })).map(
    ({ version, location }) => ({ version, location }),
  );

const duplicated = PACKAGES_BROKEN_BY_A_SECOND_COPY.map((packageName) => ({
  packageName,
  copies: installedCopiesOf(packageName),
})).filter(({ copies }) => copies.length > 1);

if (duplicated.length === 0) {
  console.log(`Single copy of each: ${PACKAGES_BROKEN_BY_A_SECOND_COPY.join(", ")}.`);
  process.exit(0);
}

for (const { packageName, copies } of duplicated) {
  console.error(`${packageName} is installed ${copies.length} times:`);
  for (const { version, location } of copies) {
    console.error(`  ${version.padEnd(12)} ${location}`);
  }
}

console.error(
  "\nEach of these holds module-level state, so a second copy breaks at runtime rather than\n" +
    "at install time: hooks throw, and context reads return null. npm nests a second copy\n" +
    "whenever one workspace's range excludes what the others resolved, so align the ranges in\n" +
    "apps/*/package.json and shared/package.json, then reinstall.",
);
process.exit(1);

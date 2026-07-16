export function reviewLaterResourceFixture(overrides = {}) {
  return {
    title: "Useful GitHub repository",
    resource_type: "github_repository",
    url_or_location: "https://github.com/example/repo",
    why_it_matters: "Potential reference for local-first architecture choices",
    status: "new",
    possible_use: "Compare implementation patterns",
    tags: "github,local-first",
    ...overrides,
  };
}

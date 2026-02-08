module.exports = {
  projects: [
    {
      displayName: "backend",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/**/*.test.js"]
    },
    {
      displayName: "frontend",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/tests-frontend/**/*.test.js"]
    }
  ],

  collectCoverage: true,
  collectCoverageFrom: [
    "server.js",
    "utils/PostCreationUtil.js",
    "public/js/Cheng.js"
  ],
  coverageReporters: ["text", "html", "lcov"],

  coverageThreshold: {
    global: {
      statements: 35,
      branches: 10,
      functions: 25,
      lines: 35
    }
  }
};

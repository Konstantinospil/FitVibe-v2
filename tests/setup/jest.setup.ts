import "dotenv/config";

beforeAll(() => {
  process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
});

afterEach(() => {
  jest.clearAllMocks();
});

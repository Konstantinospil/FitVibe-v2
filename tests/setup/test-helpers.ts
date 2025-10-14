export function createTestId(prefix: string = "test"): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createJobId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function waitFor(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

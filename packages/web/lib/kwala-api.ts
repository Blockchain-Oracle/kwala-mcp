const BASE = "https://kwala-test.kalp.network";
 
export async function getTotalWorkflows(): Promise<number> {
  try {
    const res = await fetch(`${BASE}/explorer/workflows/deployed/count`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return data?.count ?? 7176;
  } catch {
    return 7176;
  }
}
 
export async function getTotalActions(): Promise<number> {
  try {
    const res = await fetch(`${BASE}/explorer/actions/count`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return data?.count ?? 1032250;
  } catch {
    return 1032250;
  }
}

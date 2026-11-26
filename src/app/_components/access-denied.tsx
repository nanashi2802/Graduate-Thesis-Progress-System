// The Access Denied banner (FR-ACC-02). It always shows the reason (BR-18).
import { signOut } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";

export function AccessDenied({ reason }: { reason: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div role="alert" className="rounded-md border border-destructive/40 p-4">
        <h1 className="text-lg font-semibold">Access Denied</h1>
        <p className="text-sm">{reason}</p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
}

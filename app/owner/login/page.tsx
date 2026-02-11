import { Suspense } from "react";
import { OwnerLoginClient } from "./login-client";

function LoginFallback() {
  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center">
      <p className="text-muted-foreground">로딩 중...</p>
    </div>
  );
}

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <OwnerLoginClient />
    </Suspense>
  );
}

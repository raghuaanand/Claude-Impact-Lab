import { Suspense } from "react";
import SignInContent from "./SignInContent";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="text-khummela-muted">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}

import { Suspense } from "react";
import StudentReviewForm from "./form";

export default function StudentReviewPage() {
  return (
    <Suspense fallback={<div className="container-page py-16">Loading…</div>}>
      <StudentReviewForm />
    </Suspense>
  );
}

// `/adviser/availability` (A4): consultation slots, requests and defense availability (FR-SCH-01, FR-SCH-02, FR-SCH-07).
import { AvailabilityPage } from "@/app/_components/availability-page";

export default function Page() {
  return <AvailabilityPage portal="adviser" withConsultations />;
}

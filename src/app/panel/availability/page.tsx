// `/panel/availability` (P3): defense availability of a Panel Member (FR-SCH-07).
import { AvailabilityPage } from "@/app/_components/availability-page";

export default function Page() {
  return <AvailabilityPage portal="panel_member" withConsultations={false} />;
}

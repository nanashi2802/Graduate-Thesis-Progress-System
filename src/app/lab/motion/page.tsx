// /lab/motion (Task R2.6, D-10): timing options for state changes, overlays, the drawer and the toast.
import { LabHeader } from "../_mock/panels";
import { MotionLab } from "../_mock/motion-lab";

export default function Page() {
  return (
    <>
      <LabHeader title="Motion options (R2.6, D-10)" round="R2 · UX-P-02" states={["options A, B, C", "state change", "dialog or side sheet", "drawer", "toast", "reduce motion"]} />
      <MotionLab />
    </>
  );
}

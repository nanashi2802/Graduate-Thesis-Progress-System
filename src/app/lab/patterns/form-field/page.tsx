// /lab/patterns/form-field (Task R3.7, UX-012, UX-013): one control class set, the label above, the hint and the error
// in one fixed slot under the field, linked with aria-describedby. Then the one form-feedback contract (UX-011).
import { control, FormField } from "@/components/patterns/form-field";
import { Demo, LabHeader, ThemePanels } from "../../_mock/panels";
import { FormContractDemo } from "../../_mock/r3-demos";

export default function Page() {
  return (
    <>
      <LabHeader
        title="Form field (R3.7)"
        round="R3 · UX-P-03"
        states={["input, select, textarea", "hint", "server error under the field", "fixed slot (UX-D-16)", "44 px below 1024 px", "small action: toast", "workflow action: on the screen"]}
      />
      <ThemePanels>
        <Demo title="Controls: input, select, textarea (44 px below 1024 px, 36 px at laptop)">
          <div className="flex w-[300px] flex-col gap-2">
            <FormField label="Full name" id="ff-name">
              <input defaultValue="Ella Bautista" className={control.input} />
            </FormField>
            <FormField label="Degree level" id="ff-degree">
              <select defaultValue="m" className={control.select}>
                <option value="m">Master&apos;s</option>
                <option value="d">Doctoral</option>
              </select>
            </FormField>
            <FormField label="Working thesis title" id="ff-title">
              <textarea rows={3} placeholder="Example: Edge inference of crop disease" className={control.textarea} />
            </FormField>
          </div>
        </Demo>
        <Demo title="Hint, then the server error in the same slot (the hint stays for screen readers)">
          <div className="flex w-[300px] flex-col gap-2">
            <FormField label="Email" id="ff-email-hint" hint="The Student signs in with this email." lines={2}>
              <input type="email" defaultValue="ella.bautista@example.test" className={control.input} />
            </FormField>
            <FormField label="Email" id="ff-email-error" hint="The Student signs in with this email." error="This email already has an account. Use another email." lines={2}>
              <input type="email" defaultValue="dino.aquino@example.test" className={control.input} />
            </FormField>
          </div>
        </Demo>
      </ThemePanels>
      <div className="mt-8">
        <Demo title="The one form-feedback contract (UX-011), live, in the lab theme">
          <FormContractDemo />
        </Demo>
      </div>
    </>
  );
}

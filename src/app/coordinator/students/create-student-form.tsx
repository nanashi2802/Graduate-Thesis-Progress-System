"use client";
import { ActionForm, Field, fieldClass } from "../_lib/form-parts";
import { createStudentAction } from "./actions";

export function CreateStudentForm({ advisers }: { advisers: { id: string; fullName: string }[] }) {
  return (
    <ActionForm action={createStudentAction} submit="Make the account">
      <Field label="Full name" htmlFor="fullName">
        <input id="fullName" name="fullName" required className={fieldClass} />
      </Field>
      <Field label="Email address" htmlFor="email" hint="The system sends the sign-in email to this address.">
        <input id="email" name="email" type="email" required className={fieldClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Degree level" htmlFor="degreeLevel">
          <select id="degreeLevel" name="degreeLevel" className={fieldClass} defaultValue="masters">
            <option value="masters">Master&apos;s</option>
            <option value="doctoral">Doctoral</option>
          </select>
        </Field>
        <Field label="Writing 1 enrollment" htmlFor="writing1Course">
          <select id="writing1Course" name="writing1Course" className={fieldClass} defaultValue="RSH_641">
            <option value="RSH_641">RSH 641</option>
            <option value="RSH_741">RSH 741</option>
          </select>
        </Field>
        <Field label="Program start term" htmlFor="programStartTerm" hint="For example 2025-1.">
          <input id="programStartTerm" name="programStartTerm" required className={fieldClass} />
        </Field>
        <Field label="Comprehensive exam date" htmlFor="comprehensiveExamDate">
          <input id="comprehensiveExamDate" name="comprehensiveExamDate" type="date" className={fieldClass} />
        </Field>
      </div>
      <Field label="Adviser" htmlFor="adviserUserId" hint="Each Student has exactly one Adviser (FR-ACC-07).">
        <select id="adviserUserId" name="adviserUserId" required className={fieldClass} defaultValue="">
          <option value="" disabled>
            Pick an Adviser
          </option>
          {advisers.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fullName}
            </option>
          ))}
        </select>
      </Field>
    </ActionForm>
  );
}

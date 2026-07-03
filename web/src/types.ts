import { z } from 'zod';

export const diplomaSchema = z.object({
  dateOfSubmission: z.string(),
  description: z.string(),
  fileId: z.string().nullable(),
  member1: z.string(),
  member2: z.string(),
  mentor: z.string(),
  status: z.string(),
  student: z.string(),
  title: z.string(),
});

export const diplomasResponseSchema = z.array(diplomaSchema);

export const masterThesisSchema = z.object({
  dateOfPresentation: z.string(),
  description: z.string(),
  member: z.string(),
  mentor: z.string(),
  president: z.string(),
  status: z.string(),
  student: z.string(),
  title: z.string(),
});

export const mastersResponseSchema = z.array(masterThesisSchema);

export type Diploma = z.infer<typeof diplomaSchema>;

export type MentorSummary = {
  diplomas: Diploma[];
  mentor: string;
  totalDiplomas: number;
};

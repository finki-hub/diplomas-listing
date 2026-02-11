import { z } from 'zod';

export const diplomaSchema = z.object({
  dateOfSubmission: z.string(),
  description: z.string(),
  fileUrl: z.string().nullable(),
  member1: z.string(),
  member2: z.string(),
  mentor: z.string(),
  status: z.string(),
  student: z.string(),
  title: z.string(),
});

export const diplomasResponseSchema = z.array(diplomaSchema);

export type Diploma = z.infer<typeof diplomaSchema>;

export type MentorSummary = {
  diplomas: Diploma[];
  mentor: string;
  totalDiplomas: number;
};

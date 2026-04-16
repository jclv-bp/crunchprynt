import Papa from "papaparse";
import { rowSchemas, type EsmaFileType } from "./schemas";
import { ZodError } from "zod";

export type ParseResult =
  | { ok: true; rows: unknown[] }
  | { ok: false; errors: { row: number; message: string }[] };

export function parseEsmaCsv(csv: string, fileType: EsmaFileType): ParseResult {
  const schema = rowSchemas[fileType];
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    return {
      ok: false,
      errors: parsed.errors.map((e) => ({
        row: e.row ?? -1,
        message: e.message,
      })),
    };
  }
  const errors: { row: number; message: string }[] = [];
  const rows: unknown[] = [];
  (parsed.data as unknown[]).forEach((raw, i) => {
    const res = schema.safeParse(raw);
    if (!res.success) {
      errors.push({
        row: i + 2,
        message: (res.error as ZodError).issues
          .map((x) => `${x.path.join(".")}: ${x.message}`)
          .join("; "),
      });
    } else {
      rows.push(res.data);
    }
  });
  if (errors.length) return { ok: false, errors };
  return { ok: true, rows };
}

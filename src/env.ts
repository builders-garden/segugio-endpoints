import * as dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .trim()
    .default("8080")
    .transform((v) => parseInt(v)),
  BRIAN_API_KEY: z.string().min(1),
  PRIVATE_KEY: z.string().min(1),
  TURSO_DATABASE_URL: z.string().url().trim().min(1),
  TURSO_AUTH_TOKEN: z.string().trim().min(1),
  QUICKNODE_API_KEY: z.string().trim().min(1),
  QUICKNODE_NOTIFICATION_ID: z.string().trim().min(1),
  ONEINCH_API_KEY: z.string().trim().min(1),
});

const { data, success, error } = envSchema.safeParse(process.env);

if (!success) {
  console.error(
    `An error has occurred while parsing environment variables:${error.errors.map(
      (e) => ` ${e.path.join(".")} is ${e.message}`
    )}`
  );
  process.exit(1);
}

export type EnvSchemaType = z.infer<typeof envSchema>;
export const env = data;

import * as schema from "../db/schema.js";
import { db } from "../db/client.js";

export async function getPlatforms() {
  return db
    .select()
    .from(schema.platforms)
    .execute()
    .then((platforms) => {
      return platforms.reduce(
        (map, platform) => {
          map[platform.name] = platform.id;
          return map;
        },
        {} as Record<string, number>,
      );
    });
}
